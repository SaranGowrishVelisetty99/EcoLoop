import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { ProjectDoc } from '@/types';

export interface ProjectInput {
  userId: string;
  scanId: string;
  suggestionId: string;
  status?: 'saved' | 'in_progress' | 'completed';
}

export interface UpdateProjectInput {
  status?: 'saved' | 'in_progress' | 'completed';
  startedAt?: { seconds: number } | null;
  completedAt?: { seconds: number } | null;
  pointsAwarded?: boolean;
}

export interface ProjectService {
  createProject(input: ProjectInput): Promise<string>;
  updateProject(projectId: string, data: UpdateProjectInput): Promise<void>;
  getProject(projectId: string): Promise<ProjectDoc | null>;
  deleteProject(projectId: string): Promise<void>;
  getProjectsByScan(scanId: string): Promise<ProjectDoc[]>;
  getProjectsByUser(userId: string): Promise<ProjectDoc[]>;
}

export function createProjectService(db = adminDb, fieldValue = adminFieldValue): ProjectService {
  const projectsCollection = db.collection('userProjects');

  return {
    async createProject(input: ProjectInput): Promise<string> {
      const docRef = await projectsCollection.add({
        ...input,
        status: input.status || 'saved',
        startedAt: fieldValue.serverTimestamp(),
        completedAt: null,
        updatedAt: fieldValue.serverTimestamp(),
        pointsAwarded: false,
      });
      return docRef.id;
    },

    async updateProject(projectId: string, data: UpdateProjectInput): Promise<void> {
      await projectsCollection.doc(projectId).update({
        ...data,
        updatedAt: fieldValue.serverTimestamp(),
      });
    },

    async getProject(projectId: string): Promise<ProjectDoc | null> {
      const doc = await projectsCollection.doc(projectId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() } as ProjectDoc;
    },

    async deleteProject(projectId: string): Promise<void> {
      await projectsCollection.doc(projectId).delete();
    },

    async getProjectsByScan(scanId: string): Promise<ProjectDoc[]> {
      const query = projectsCollection.where('scanId', '==', scanId);
      const snapshot = await query.get();
      return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as ProjectDoc));
    },

    async getProjectsByUser(userId: string): Promise<ProjectDoc[]> {
      const query = projectsCollection.where('userId', '==', userId);
      const snapshot = await query.get();
      return snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as ProjectDoc));
    },
  };
}