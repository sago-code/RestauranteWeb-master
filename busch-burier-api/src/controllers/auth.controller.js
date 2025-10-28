import { AuthService } from "../services/auth.service.js";
import admin from "firebase-admin";


export class AuthController {

    static async loginWithEmailAndPassword(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email y contraseña son requeridos" });
        }

        try {
            const user = await AuthService.loginWithEmailAndPassword(email, password);
            return res.status(200).json({ message: "Login exitoso", user });
        } catch (error) {
            return res.status(401).json({ message: error.message });
        }
    }
    
    static async loginGoogle(req, res) {
        try {
            const { idToken } = req.body;
            if (!idToken) {
                return res.status(400).json({ error: "idToken es requerido" });
            }

            const userData = await AuthService.loginWithGoogle(idToken);

            return res.json({
                exists: userData.exists,
                session: userData.session,
                token: idToken
            });

        } catch (error) {
            console.error("Error en loginWithGoogle:", error);
            const msg = error?.message || "Error en login con Google";
            const isAuthError =
                /token|auth|audience|issuer|project|credential|verifyIdToken/i.test(msg);
            res.status(isAuthError ? 401 : 500).json({ error: msg });
        }
    }
}
