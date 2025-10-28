import "dotenv/config";
import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import path from "path";

const fromEnv = (() => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        return {
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, "\n"),
        };
    }
    return null;
})();

let credential;
let credentialSource = null;
let resolvedProjectId = null;

if (fromEnv) {
    credential = admin.credential.cert(fromEnv);
    credentialSource = "env";
    resolvedProjectId = fromEnv.projectId;
} else {
    const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const candidatePath = gacPath ? gacPath : path.resolve("serviceAccountKey.json");

    if (!existsSync(candidatePath)) {
        throw new Error(
            "No hay credenciales en .env y falta archivo de clave. " +
            "Define FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env " +
            "o define GOOGLE_APPLICATION_CREDENTIALS apuntando al JSON, " +
            "o coloca un serviceAccountKey.json local (sin versionarlo)."
        );
    }

    const serviceAccount = JSON.parse(readFileSync(candidatePath, "utf-8"));
    credential = admin.credential.cert(serviceAccount);
    credentialSource = gacPath ? "GOOGLE_APPLICATION_CREDENTIALS" : "serviceAccountKey.json";
    resolvedProjectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || null;
}

const expectedProjectId = process.env.FIREBASE_PROJECT_ID || null;
if (expectedProjectId && resolvedProjectId && expectedProjectId !== resolvedProjectId) {
    throw new Error(
        `Mismatch: credenciales apuntan a '${resolvedProjectId}' pero .env espera '${expectedProjectId}'. ` +
        `Actualiza .env o el JSON al mismo proyecto.`
    );
}

admin.initializeApp({ credential, projectId: resolvedProjectId });
console.log(`[Firebase Admin] Usando projectId=${resolvedProjectId} via ${credentialSource}`);

export const db = admin.firestore();
export const auth = admin.auth();
