import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { UserRepository } from "../repository/UserRepository";
import { AuthService } from "../services/AuthService";

export class UserController {
    private static userRepository = new UserRepository();

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user)
              return res.status(403).json({ message: "Acesso negado." });

            const { username, password, role } = req.body;
            if (!username || !password)
                return res.status(400).json({ message: "Campos obrigatórios não fornecidos!" });

            const existing = await UserController.userRepository.findByUsername(username);
            if (existing)
                return res.status(409).json({ message: "Usuário já existe." });

            const user = await UserController.userRepository.createAndSave({
                username,
                password,
                role: role ?? "regular"
            });

            return res.status(201).location(`/users/${user.uuid}`).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async login(req: Request, res: Response): Promise<Response> {
        try {
            const { username, password } = req.body;
            if (!username || !password)
                return res.status(400).json({ message: "Campos obrigatórios não fornecidos!" });

            const user = await UserController.userRepository.findByUsername(username);
            if (!user) return res.status(401).json({ message: "Credenciais inválidas." });

            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ message: "Credenciais inválidas." });

            const token = AuthService.tokenFrom({
                uuid: user.uuid,
                role: user.role,
                type: "user"
            });

            return res.status(200).json({token});
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async logout(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user)
                return res.status(403).json({ message: "Acesso negado." });
            return res.status(200).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async query(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user) return res.status(403).json({ message: "Acesso negado." });

            const filters: any = { ...req.query };
            delete filters.password;
            delete filters.id;

            return res.status(200).json((await UserController.userRepository.findAll(filters)).map(u => {
                const clean: any = { username: u.username, role: u.role };
                return clean;
            }));
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user)
                return res.status(403).json({ message: "Acesso negado." });

            const { uuid } = req.params;
            const user = await UserController.userRepository.findByUUID(uuid);
            if (!user)
                return res.status(404).json({ message: "Usuário não encontrado!" });

            const { username, role } = req.body;

            if (username) user.username = username;
            if (role) user.role = role;

            await UserController.userRepository.save(user);
            return res.status(204).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user)
                return res.status(403).json({ message: "Acesso negado." });

            const { uuid } = req.params;
            const user = await UserController.userRepository.findByUUID(uuid);
            if (!user)
                return res.status(404).json({ message: "Usuário não encontrado!" });

            await UserController.userRepository.remove(user);
            return res.status(204).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }
}