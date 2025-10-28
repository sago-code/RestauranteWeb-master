import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

const serviceAccountPath = path.resolve("serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(
        JSON.parse(readFileSync(serviceAccountPath, "utf-8"))
    ),
});

export const db = admin.firestore();
export const auth = admin.auth();
