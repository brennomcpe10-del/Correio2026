/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, collection, getDocs, limit, query } from 'firebase/firestore';

// Use production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASxuwHcBg5NM5eJIYam9GTChuYiNKuoWA",
  authDomain: "correioelegante2026-7ca58.firebaseapp.com",
  projectId: "correioelegante2026-7ca58",
  storageBucket: "correioelegante2026-7ca58.firebasestorage.app",
  messagingSenderId: "1089858279760",
  appId: "1:1089858279760:web:63fbc7596cab271785b455",
  measurementId: "G-DBGW4PG4EF"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Check connection and log configured Firebase Project ID
export async function checkConnection(): Promise<void> {
  console.log("Checking Firestore Connection...");
  console.log("Configured Project ID (exact value):", firebaseConfig.projectId);
  try {
    const snap = await getDocs(query(collection(db, 'teste_debug'), limit(1)));
    console.log("Firestore Connection Check Successful! Query to 'teste_debug' completed. Records found:", snap.size);
  } catch (error: any) {
    console.warn("Firestore Connection Check Warning (expected if security rules deny or collection empty):", error.message || error);
  }
}

// CRITICAL CONSTRAINT: Test the Firestore connection on initial boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore base connection test complete.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
    } else {
      // Ignore permissible normal connection errors (e.g., missing document or permission denied)
      console.log("Firestore connection test complete.");
    }
  }
  // Run the new debug check
  await checkConnection();
}

testConnection();
