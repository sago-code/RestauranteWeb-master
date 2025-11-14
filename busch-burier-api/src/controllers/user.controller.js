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
            address: req.body?.address,
            phone: req.body?.phone
        });

        return res.status(201).json({
            message: "Usuario creado/actualizado correctamente",
            user,
        });
        } catch (error) {
            console.error("❌ Error en createUser:", error);
            const status = error?.code === "PHONE_DUPLICATE" ? 409 : 500;
            return res.status(status).json({
                error: error.message,
            });
        }
    }

    // Nuevo: GET /users/:uid
    static async getOne(req, res) {
        try {
            const { uid } = req.params;
            const user = await UserService.getUser(uid);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json({ user });
        } catch (error) {
            console.error("❌ Error obteniendo usuario:", error);
            return res.status(400).json({ error: error.message });
        }
    }

    // Nuevo: PUT /users/:uid
    static async update(req, res) {
        try {
            const { uid } = req.params;
            const { firstName, lastName, address, phone, photo } = req.body || {};
            const user = await UserService.updateUser(uid, { firstName, lastName, address, phone, photo });
            return res.status(200).json({ message: "Usuario actualizado", user });
        } catch (error) {
            console.error("❌ Error actualizando usuario:", error);
            const status = error?.code === "PHONE_DUPLICATE" ? 409 : 400;
            return res.status(status).json({ error: error.message });
        }
    }
}




