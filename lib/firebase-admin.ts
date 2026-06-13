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

// Ensure we have an absolute path for the service account
function resolveServiceAccountPath(serviceAccountPath: string): string {
  if (serviceAccountPath.startsWith('{')) {
    return serviceAccountPath; // It's a JSON string
  }
  // If relative, resolve from project root (process.cwd())
  if (!path.isAbsolute(serviceAccountPath)) {
    return path.resolve(process.cwd(), serviceAccountPath);
  }
  return serviceAccountPath;
}

export function initializeAdmin(config: AdminConfig): { app: App; db: Firestore; auth: Auth } {
  if (adminAppInstance) {
    console.log('[firebase-admin] Returning existing admin app instance');
    return { app: adminAppInstance, db: adminDbInstance!, auth: adminAuthInstance! };
  }

  const apps = getApps();
  if (apps.length) {
    console.log('[firebase-admin] Using existing Firebase app');
    adminAppInstance = apps[0];
  } else {
    console.log('[firebase-admin] Creating new Firebase admin app');
    let credential: any;
    const { serviceAccount, useApplicationDefault } = config;

    if (serviceAccount) {
      try {
        let serviceAccountData: any;
        const trimmed = serviceAccount.trim();
        console.log('[firebase-admin] Loading service account from:', trimmed);
        if (trimmed.startsWith('{')) {
          console.log('[firebase-admin] Service account is JSON string');
          serviceAccountData = JSON.parse(trimmed);
        } else {
          console.log('[firebase-admin] Service account is file path');
          const resolvedPath = resolveServiceAccountPath(trimmed);
          console.log('[firebase-admin] Resolved path:', resolvedPath);
          console.log('[firebase-admin] File exists:', fs.existsSync(resolvedPath));
          if (fs.existsSync(resolvedPath)) {
            serviceAccountData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
            credential = cert(serviceAccountData);
            console.log('[firebase-admin] Service account credential created');
          } else {
            console.warn('[firebase-admin] Service account file not found, will try application default');
          }
        }
      } catch (e) {
        console.error('[firebase-admin] Failed to load service account:', e);
      }
    }

    if (!credential) {
      console.log('[firebase-admin] Using application default credentials');
      credential = applicationDefault();
    }

    console.log('[firebase-admin] Initializing app with projectId:', config.projectId);
    adminAppInstance = initializeApp({
      credential,
      projectId: config.projectId,
    });
    console.log('[firebase-admin] App initialized');
  }

  adminDbInstance = getFirestore(adminAppInstance);
  adminAuthInstance = getAuth(adminAppInstance);
  console.log('[firebase-admin] Firestore and Auth instances created');

  return { app: adminAppInstance, db: adminDbInstance, auth: adminAuthInstance };
}

export function getAdminApp(): App | null {
  if (!adminAppInstance) {
    console.log('[firebase-admin] getAdminApp called before initialization, initializing now...');
    getDefaultAdmin();
  }
  return adminAppInstance;
}

export function getAdminDb(): Firestore | null {
  if (!adminDbInstance) {
    console.log('[firebase-admin] getAdminDb called before initialization, initializing now...');
    getDefaultAdmin();
  }
  return adminDbInstance;
}

export function getAdminAuth(): Auth | null {
  if (!adminAuthInstance) {
    console.log('[firebase-admin] getAdminAuth called before initialization, initializing now...');
    getDefaultAdmin();
  }
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
    console.log('[firebase-admin] Returning cached admin instance');
    return { 
      app: adminAppInstance!, 
      db: adminDbInstance!, 
      auth: adminAuthInstance! 
    };
  }
  
  console.log('[firebase-admin] Initializing admin SDK...');
  console.log('[firebase-admin] FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('[firebase-admin] FIREBASE_ADMIN_SERVICE_ACCOUNT:', process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT);
  console.log('[firebase-admin] NODE_ENV:', process.env.NODE_ENV);
  
  const projectId = process.env.FIREBASE_PROJECT_ID || 'ecoloop-4391d';
  const result = initializeAdmin({
    projectId,
    serviceAccount: process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT,
    useApplicationDefault: true,
  });
  initialized = true;
  console.log('[firebase-admin] Admin SDK initialized successfully');
  return result;
}

export const adminApp = { get: () => getDefaultAdmin().app } as any;
export const adminDb = { get: () => getDefaultAdmin().db } as any;
export const adminAuth = { get: () => getDefaultAdmin().auth } as any;
