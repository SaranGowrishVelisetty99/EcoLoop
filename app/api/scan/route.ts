import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { getUidFromAuthHeader } from '@/lib/auth-verify';

export const maxDuration = 60;

function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin not initialized. Set FIREBASE_ADMIN_SERVICE_ACCOUNT env var or run gcloud auth application-default login.');
  }
  return adminDb.get();
}

async function awardPoints(uid: string, email: string | undefined, points: number) {
  const db = ensureAdminDb();
  const userRef = db.collection('users').doc(uid);
  await db.runTransaction(async (transaction: any) => {
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists) {
      transaction.update(userRef, {
        points: adminFieldValue.increment(points),
      });
    } else {
      transaction.set(userRef, {
        uid,
        email: email || '',
        username: email || uid,
        points,
        createdAt: adminFieldValue.serverTimestamp(),
      });
    }
  });
}

function extractJson(content: string) {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let uid: string;
    try {
      uid = await getUidFromAuthHeader(request.headers.get('authorization'));
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanId, imageUrl, imageDataUrl } = body as { scanId?: string; imageUrl?: string; imageDataUrl?: string };
    const imageInput = imageDataUrl || imageUrl;

    if (!imageInput) {
      return NextResponse.json({ error: 'Missing image input' }, { status: 400 });
    }

    const result = await analyzeWithNvidiaNim(imageInput);

    let finalScanId = scanId;

    if (scanId) {
      const db = ensureAdminDb();
      const scanDocRef = db.doc(`scans/${scanId}`);
      const scanDoc = await scanDocRef.get();
      if (!scanDoc.exists) {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
      }

      const scanData = scanDoc.data();
      if (scanData?.userId !== uid) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      await scanDocRef.update({
        detectedObject: result.detectedObject,
        materialType: result.materialType,
        conditionAssessment: result.conditionAssessment,
        confidenceScore: result.confidenceScore,
        suggestions: result.suggestions,
        imageUrl: imageUrl || scanDoc.data()?.imageUrl || null,
        updatedAt: adminFieldValue.serverTimestamp(),
      });

      finalScanId = scanId;
    } else {
      const db = ensureAdminDb();
      const scansCollection = db.collection('scans');
      const scanDocRef = await scansCollection.add({
        userId: uid,
        imageUrl: imageUrl || null,
        detectedObject: result.detectedObject,
        materialType: result.materialType,
        conditionAssessment: result.conditionAssessment,
        confidenceScore: result.confidenceScore,
        suggestions: result.suggestions,
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      });

      finalScanId = scanDocRef.id;

      await awardPoints(uid, undefined, 25);
    }

    // Optimized parallel project creation and robust suggestion handling
    if (result.suggestions && Array.isArray(result.suggestions)) {
      const db = ensureAdminDb();
      const projectsCollection = db.collection('userProjects');
      await Promise.all(
        result.suggestions.map((suggestion: { id?: string }, index: number) =>
          projectsCollection.add({
            userId: uid,
            scanId: finalScanId,
            suggestionId: suggestion.id || `sug_${finalScanId}_${index}`,
            status: 'saved',
            startedAt: adminFieldValue.serverTimestamp(),
            completedAt: null,
            updatedAt: adminFieldValue.serverTimestamp(),
          })
        )
      );
    }

    return NextResponse.json({ ok: true, scanId: finalScanId, result });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string } | Error;
    console.error('scan route error:', error);
    console.error('error code:', 'code' in err ? err.code : undefined);
    console.error('error message:', err.message);
    return NextResponse.json({ error: 'Scan processing failed', details: err.message }, { status: 500 });
  }
}

async function analyzeWithNvidiaNim(imageInput: string) {
  const apiKey = process.env.NVIDIA_NIM_API_KEY?.trim().replace(/^["']|["']$/g, '');

  if (!apiKey || apiKey === 'undefined') {
    console.warn('NVIDIA_NIM_API_KEY is missing or undefined. Using mock data.');
    return getMockResult();
  }

  const visionModels = [
    'meta/llama-3.2-90b-vision-instruct',
    'microsoft/phi-3-vision-128k-instruct',
  ];

  let lastError = null;

  for (const modelId of visionModels) {
    try {
      const prompt = {
        model: modelId,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are the EcoLoop Upcycling Engine. Analyze the item in the image for upcycling. 
                Output ONLY a raw JSON object. No markdown fences or conversation. 
                Format: {"detectedObject":"string","materialType":"string","conditionAssessment":"string","confidenceScore":number,"suggestions":[{"id":"string","title":"string","description":"string","difficulty":"string","estimatedTimeMinutes":number,"materialsNeeded":["string"],"steps":["string"],"estimatedCo2SavedKg":number}]}
                User Request: Evaluate this discarded item for upcycling potential and generate three ideas.`,
              },
              { type: 'image_url', image_url: { url: imageInput } },
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0.2,
      };

      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Model ${modelId} failed: ${response.status} - ${errText}`);
        lastError = new Error(`NVIDIA NIM request failed with status ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      
      if (!content) {
        console.warn(`Model ${modelId} returned empty content.`);
        continue;
      }

      const result = extractJson(content);
      if (!result) {
        console.warn(`Model ${modelId} returned invalid JSON.`);
        continue;
      }

      return result;
    } catch (err) {
      console.error(`Error with model ${modelId}:`, err);
      lastError = err;
    }
  }

  console.error('All NVIDIA NIM models failed, falling back to mock data:', lastError);
  return getMockResult();
}

function getMockResult() {
  const baseId = 'sug_mock';
  return {
    detectedObject: 'Wooden crate',
    materialType: 'Wood / Timber',
    conditionAssessment: 'Good structural material; ideal for a planter box or shelf.',
    confidenceScore: 0.88,
    suggestions: [
      {
        id: `${baseId}_1`,
        title: 'Planter Box from Crate Board',
        description: 'Repurpose reclaimed crate boards into a compact planter box with simple cuts and mild sanding.',
        difficulty: 'easy',
        estimatedTimeMinutes: 75,
        materialsNeeded: ['reclaimed boards', 'sandpaper', 'wood screws', 'soil'],
        steps: ['Clean and inspect the boards for splinters.', 'Measure and cut two side panels and a base.', 'Assemble and drill drainage holes.'],
        estimatedCo2SavedKg: 4.2,
      },
      {
        id: `${baseId}_2`,
        title: 'Wall Shelf from Crate Slats',
        description: 'Turn crate slats into a rustic floating wall shelf for small plants or decor.',
        difficulty: 'easy',
        estimatedTimeMinutes: 45,
        materialsNeeded: ['crate slats', 'wood glue', 'screws', 'wall anchors', 'sandpaper'],
        steps: ['Sand all pieces smooth.', 'Arrange slats in desired shelf shape.', 'Glue and screw together.', 'Mount to wall with anchors.'],
        estimatedCo2SavedKg: 2.1,
      },
      {
        id: `${baseId}_3`,
        title: 'Garden Bench from Crate Frame',
        description: 'Build a simple outdoor bench using the crate frame as the base structure.',
        difficulty: 'medium',
        estimatedTimeMinutes: 120,
        materialsNeeded: ['crate frame', 'additional lumber', 'outdoor wood screws', 'weatherproof stain', 'cushions (optional)'],
        steps: ['Reinforce crate frame with additional lumber.', 'Add seat and back slats.', 'Sand and apply weatherproof finish.', 'Add cushions for comfort.'],
        estimatedCo2SavedKg: 8.5,
      },
    ],
  };
}
