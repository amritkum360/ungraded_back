import admin from "firebase-admin";

let initialized = false;

function hasFirebaseAdminConfig() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  );
}

export function isFirebaseAdminConfigured() {
  return hasFirebaseAdminConfig();
}

function initFirebaseAdmin() {
  if (initialized || !hasFirebaseAdminConfig()) return;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  initialized = true;
}

export async function verifyFirebaseIdToken(idToken) {
  if (!hasFirebaseAdminConfig()) {
    throw new Error("Firebase Admin is not configured on the server");
  }
  initFirebaseAdmin();
  return admin.auth().verifyIdToken(idToken);
}
