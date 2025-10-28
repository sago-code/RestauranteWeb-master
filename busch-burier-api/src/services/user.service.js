import admin from "firebase-admin";
import { UserModel } from "../models/user.model.js";

export class UserService {
    static async createUser({ 
        idToken, 
        email, 
        password, 
        firstName, 
        lastName, 
        photo, 
        address, 
        phone 
    }) {
        const auth = admin.auth();
        const db = admin.firestore();

        let uid;
        let userRecord;

        // 1️⃣ Si viene idToken (Google)
        if (idToken) {
            const decoded = await auth.verifyIdToken(idToken);
            uid = decoded.uid;
            userRecord = await auth.getUser(uid);
        } else {
            // 2️⃣ Si no hay token, buscar por email
            try {
            userRecord = await auth.getUserByEmail(email);
            uid = userRecord.uid;
            } catch (error) {
            if (error.code === "auth/user-not-found") {
                // Crear en Auth (email/clave)
                userRecord = await auth.createUser({
                email,
                password,
                displayName: `${firstName} ${lastName}`.trim(),
                });
                uid = userRecord.uid;
            } else {
                throw error;
            }
            }
        }

        // 🔹 Normalizar datos: convertir undefined → null
        const normalize = (val) => (val === undefined ? null : val);

        const user = new UserModel({
            uid,
            email,
            firstName: normalize(firstName),
            lastName: normalize(lastName),
            photo: normalize(photo || userRecord.photoURL),
            address: normalize(address),
            phone: normalize(phone),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection("users").doc(uid).set(user.toFirestore(), { merge: true });

    const savedDoc = await db.collection("users").doc(uid).get();
        return UserModel.fromFirestore(savedDoc);
    }
}
