import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { ScanDoc } from '@/types';

export interface ScanInput {
  userId: string;
  imageUrl?: string;
  imageDataUrl?: string;
  detectedObject?: string;
  materialType?: string;
  conditionAssessment?: string;
  confidenceScore?: number;
  suggestions?: ScanDoc['suggestions'];
}

export interface CreateScanResult {
  scanId: string;
  result: ScanDoc;
}

export interface ScanService {
  createScan(input: ScanInput): Promise<CreateScanResult>;
  updateScan(scanId: string, data: Partial<ScanDoc>): Promise<void>;
  getScan(scanId: string): Promise<ScanDoc | null>;
  deleteScan(scanId: string): Promise<void>;
}

export function createScanService(db = adminDb, fieldValue = adminFieldValue): ScanService {
  return {
    async createScan(input: ScanInput): Promise<CreateScanResult> {
      const scansCollection = db.collection('scans');
      const scanDocRef = await scansCollection.add({
        userId: input.userId,
        imageUrl: input.imageUrl || null,
        detectedObject: input.detectedObject,
        materialType: input.materialType,
        conditionAssessment: input.conditionAssessment,
        confidenceScore: input.confidenceScore,
        suggestions: input.suggestions,
        createdAt: fieldValue.serverTimestamp(),
        updatedAt: fieldValue.serverTimestamp(),
      });

      const scanId = scanDocRef.id;
      const result = {
        id: scanId,
        ...input,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        updatedAt: { seconds: Math.floor(Date.now() / 1000) },
      } as ScanDoc;

      return { scanId, result };
    },

    async updateScan(scanId: string, data: Partial<ScanDoc>): Promise<void> {
      await db.collection('scans').doc(scanId).update({
        ...data,
        updatedAt: fieldValue.serverTimestamp(),
      });
    },

    async getScan(scanId: string): Promise<ScanDoc | null> {
      const doc = await db.collection('scans').doc(scanId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as ScanDoc;
    },

    async deleteScan(scanId: string): Promise<void> {
      const batch = db.batch();
      const scanRef = db.collection('scans').doc(scanId);
      batch.delete(scanRef);

      const projectsQuery = db.collection('userProjects').where('scanId', '==', scanId);
      const projectsSnapshot = await projectsQuery.get();
      projectsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    },
  };
}