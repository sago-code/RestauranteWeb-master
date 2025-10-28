import { UserService } from "../services/user.service.js";

export class UserController {
    static async createUser(req, res) {
        try {
        const { idToken, email, password, firstName, lastName, photo } = req.body;

        // Validación mínima: o idToken (Google) o email/password
        if (!idToken && (!email || !password || !firstName || !lastName)) {
            return res.status(400).json({
            message: "Faltan datos obligatorios o idToken",
            });
        }

        const user = await UserService.createUser({
            idToken,
            email,
            password,
            firstName,
            lastName,
            photo,
        });

        return res.status(201).json({
            message: "Usuario creado/actualizado correctamente",
            user,
        });
        } catch (error) {
            console.error("❌ Error en createUser:", error);
            return res.status(500).json({
                message: "Error interno del servidor",
                error: error.message,
            });
        }
    }
}




