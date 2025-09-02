import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing Firebase Admin credentials:', {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey
    });
    throw new Error('Firebase Admin credentials are not properly configured. Check your environment variables.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    }),
  });

  return admin;
}

// Create a proxy object that initializes Firebase Admin only when accessed
const firebaseAdmin = new Proxy({} as typeof admin, {
  get(target, prop) {
    const initializedAdmin = initializeFirebaseAdmin();
    return (initializedAdmin as any)[prop];
  }
});

export default firebaseAdmin;