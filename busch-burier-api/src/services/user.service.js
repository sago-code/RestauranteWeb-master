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

        const phoneVal = (phone || '').trim();
        if (phoneVal) {
            const snap = await db.collection("users").where("phone", "==", phoneVal).limit(1).get();
            if (!snap.empty) {
                const existing = snap.docs[0];
                if (existing.id !== uid) {
                    const err = new Error("El teléfono ya está registrado");
                    err.code = "PHONE_DUPLICATE";
                    throw err;
                }
            }
        }

        // 🔹 Normalizar datos: convertir undefined → null
        const normalize = (val) => (val === undefined ? null : (typeof val === 'string' ? val.trim() || null : val));

        const user = new UserModel({
            uid,
            email,
            firstName: normalize(firstName),
            lastName: normalize(lastName),
            photo: normalize(photo || userRecord.photoURL),
            address: normalize(address),
            phone: normalize(phoneVal),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await db.collection("users").doc(uid).set(user.toFirestore(), { merge: true });

    const savedDoc = await db.collection("users").doc(uid).get();
        return UserModel.fromFirestore(savedDoc);
    }

    // Nuevo: obtener usuario por uid
    static async getUser(uid) {
        const db = admin.firestore();
        if (!uid) throw new Error("uid es requerido");
        const doc = await db.collection("users").doc(uid).get();
        if (!doc.exists) return null;
        return UserModel.fromFirestore(doc);
    }

    // Nuevo: actualizar perfil de usuario
    static async updateUser(uid, { firstName, lastName, address, phone, photo }) {
        const db = admin.firestore();
        if (!uid) throw new Error("uid es requerido");
        const normalize = (v) => (v === undefined ? null : (typeof v === 'string' ? v.trim() || null : v));

        // 🔹 Validar unicidad del teléfono (si viene un valor no vacío)
        const phoneVal = normalize(phone);
        if (phoneVal) {
            const snap = await db.collection("users").where("phone", "==", phoneVal).limit(1).get();
            if (!snap.empty && snap.docs[0].id !== uid) {
                const err = new Error("El teléfono ya está registrado");
                err.code = "PHONE_DUPLICATE";
                throw err;
            }
        }

        const data = {
            firstName: normalize(firstName),
            lastName: normalize(lastName),
            address: normalize(address),
            phone: phoneVal,
            photo: normalize(photo),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await db.collection("users").doc(uid).set(data, { merge: true });
        const saved = await db.collection("users").doc(uid).get();
        return UserModel.fromFirestore(saved);
    }
}
