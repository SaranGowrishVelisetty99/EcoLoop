import { initializeApp, getApps, applicationDefault, cert, App } from 'firebase-admin/app';
import { getFirestore, FieldValue, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

export interface AdminConfig {
  projectId: string;
  serviceAccount?: string;
  useApplicationDefault?: boolean;
}

let adminAppInstance: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;
let initialized = false;

export function initializeAdmin(config: AdminConfig): { app: App; db: Firestore; auth: Auth } {
  if (adminAppInstance) {
    return { app: adminAppInstance, db: adminDbInstance!, auth: adminAuthInstance! };
  }

  const apps = getApps();
  if (apps.length) {
    adminAppInstance = apps[0];
  } else {
    let credential: any;
    const { serviceAccount, useApplicationDefault } = config;

    if (serviceAccount) {
      try {
        let serviceAccountData: any;
        const trimmed = serviceAccount.trim();
        if (trimmed.startsWith('{')) {
          serviceAccountData = JSON.parse(trimmed);
        } else {
          const resolvedPath = path.resolve(trimmed);
          serviceAccountData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        }
        credential = cert(serviceAccountData);
      } catch (e) {
        console.warn('Failed to load service account:', e);
      }
    }

    if (!credential && useApplicationDefault) {
      credential = applicationDefault();
    }

    adminAppInstance = initializeApp({
      credential,
      projectId: config.projectId,
    });
  }

  adminDbInstance = getFirestore(adminAppInstance);
  adminAuthInstance = getAuth(adminAppInstance);

  return { app: adminAppInstance, db: adminDbInstance, auth: adminAuthInstance };
}

export function getAdminApp(): App | null {
  return adminAppInstance;
}

export function getAdminDb(): Firestore | null {
  return adminDbInstance;
}

export function getAdminAuth(): Auth | null {
  return adminAuthInstance;
}

export function resetAdminForTesting(): void {
  adminAppInstance = null;
  adminDbInstance = null;
  adminAuthInstance = null;
  initialized = false;
}

export const adminFieldValue = FieldValue;

export function getDefaultAdmin() {
  if (initialized) {
    return { 
      app: adminAppInstance!, 
      db: adminDbInstance!, 
      auth: adminAuthInstance! 
    };
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID || 'ecoloop-4391d';
  const result = initializeAdmin({
    projectId,
    serviceAccount: process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT,
    useApplicationDefault: process.env.NODE_ENV === 'production',
  });
  initialized = true;
  return result;
}

export const adminApp = { get: () => getDefaultAdmin().app } as any;
export const adminDb = { get: () => getDefaultAdmin().db } as any;
export const adminAuth = { get: () => getDefaultAdmin().auth } as any;