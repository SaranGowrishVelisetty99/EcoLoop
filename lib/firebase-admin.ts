import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const projectId = process.env.FIREBASE_PROJECT_ID || 'ecoloop-4391d';

function getAdminApp() {
  const apps = getApps();
  if (apps.length) return apps[0];

  const serviceAccountEnv = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (serviceAccountEnv) {
    try {
      let serviceAccount: any;

      const trimmed = serviceAccountEnv.trim();
      if (trimmed.startsWith('{')) {
        serviceAccount = JSON.parse(trimmed);
      } else {
        const resolvedPath = path.resolve(trimmed);
        serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
      }

      return initializeApp({
        credential: cert(serviceAccount),
        projectId,
      });
    } catch (e) {
      console.warn('Failed to load service account, falling back to applicationDefault:', e);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('Firebase Admin: No service account found. Admin features will be unavailable in development.');
    return null;
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

export const adminApp = getAdminApp();
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminFieldValue = FieldValue;