
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from './config';

const apps = getApps();

const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  : undefined;

if (!apps.length) {
  initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    projectId: firebaseConfig.projectId,
  });
}

const adminApp = getApp();
const firestore = getFirestore(adminApp);

export { firestore };
