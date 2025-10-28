import { db, auth } from "../../firebase.js";
import { UserModel } from "../models/user.model.js";
import axios from "axios";

export class AuthService {

    static async loginWithEmailAndPassword(email, password) {
        const API_KEY = process.env.FIREBASE_API_KEY;
        if (!API_KEY) {
            throw new Error("FIREBASE_API_KEY no está configurada en el entorno");
        }

        try {
            const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
            const { data } = await axios.post(url, {
                email,
                password,
                returnSecureToken: true,
            });

            return {
                email: data.email,
                idToken: data.idToken,
                refreshToken: data.refreshToken,
                uid: data.localId,
            };
        } catch (error) {
            throw new Error(
                console.error("🔥 ERROR FIREBASE:", error.response?.data || error.message),
                error.response?.data?.error?.message || "Error al iniciar sesión"
            );
        }
    }

    static async loginWithGoogle(idToken) {
        if (!idToken) throw new Error("Token de Google no proporcionado");

        let decoded;
        try {
            decoded = await auth.verifyIdToken(idToken);
        } catch (e) {
            throw new Error(
                `No se pudo verificar el idToken de Firebase: ${e.message}. ` +
                `Verifica que frontend y backend usen el MISMO proyecto Firebase.`
            );
        }

        const uid = decoded.uid;
        const email = decoded.email;

        if (!email) throw new Error("El token no contiene email");

        const userRef = db.collection("users").doc(uid);
        const docSnap = await userRef.get();

        if (!docSnap.exists) {
            const session = {
                uid,
                email,
                name: decoded.name || "",
                photo: decoded.picture || "",
            };

            return { exists: false, session };
        } else {
            const existingUser = UserModel.fromFirestore(docSnap);
            return { exists: true, session: existingUser };
        }
    }

}
