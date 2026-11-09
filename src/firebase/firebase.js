import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFirebase = () => {
  // Prevent duplicate initialization
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  let serviceAccount;

  // Railway / Production
  if (projectId && clientEmail && privateKey) {
    console.log("Initializing Firebase using Railway variables...");

    serviceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  } else {
    const isProduction =
      process.env.NODE_ENV === "production" ||
      Boolean(process.env.RAILWAY_ENVIRONMENT_NAME);

    if (isProduction) {
      console.error("Firebase environment variable check:", {
        projectId: Boolean(projectId),
        clientEmail: Boolean(clientEmail),
        privateKey: Boolean(privateKey),
      });

      throw new Error(
        "Firebase credentials missing in Railway. " +
        "Configure FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY."
      );
    }

    // Local development only
    console.log("Loading local Firebase service account...");

    const keyPath = resolve(
      __dirname,
      "../../serviceAccountKey.json"
    );

    try {
      serviceAccount = JSON.parse(
        readFileSync(keyPath, "utf8")
      );
    } catch (error) {
      console.error("Local Firebase credentials error:", error.message);
      throw new Error("Cannot load local Firebase serviceAccountKey.json");
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Firebase Admin SDK initialized successfully");

  return admin.apps[0];
};

// Initialize Firebase
initFirebase();

// Exports
export const auth = admin.auth();
export default admin;