import express from "express";
import chalk from "chalk";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";

export class App {
    constructor(port) {
        this.app = express();
        this.port = port || process.env.PORT || 3000;

        this.settings();
        this.middlewares();
        this.routes();
    }

    settings() {
        this.app.set("port", this.port);
    }

    middlewares() {
        this.app.use(morgan("dev"));
        this.app.use(express.json());
        this.app.use(cors());
    }

    routes() {
        this.app.use("/auth", authRoutes);
        this.app.use("/users", userRoutes);
        this.app.use("/carts", cartRoutes);
    }

    async listen() {
        await this.app.listen(this.app.get("port"));
        const port = this.app.get("port");
        console.log(
        chalk.blue.bold(`
                    ******************************************
                    *                                        *
                    *      Bienvenido a Busch-Burier API     *
                    *                                        *
                    * `) +
            chalk.green.bold(`    🚀 Servidor en puerto: ${port} 🚀     `) +
            chalk.blue.bold(`*
                    *                                        *
                    ******************************************`)
        );
    }
}
