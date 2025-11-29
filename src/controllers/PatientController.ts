import { Request, Response } from "express";
import { PatientRepository } from "../repository/PatientRepository";
import { AuthService } from "../services/AuthService";

export class PatientController {
    private static patientRepository = new PatientRepository();

    private static generatePatientUUID(
        manchester_priority: 'immediate' | 'very-urgent' | 'urgent' | 'standard' | 'non-urgent',
        priority: number
    ): string {
        const map = { immediate: 'I', 'very-urgent': 'V', urgent: 'U', standard: 'S', 'non-urgent': 'N' };
        const r = Array.from({ length: 4 })
            .map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36)))
            .join("");
        return `${r}${map[manchester_priority]}${priority}`;
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.body.user)
                return res.status(403).json({ message: "Acesso negado." });

            const { name, password, phone_number, partner_name, partner_phone_number, description, manchester_priority, priority } = req.body;
            if (!name || !password || !phone_number || !description || !manchester_priority || priority === undefined)
                return res.status(400).json({ message: "Campos obrigatórios não fornecidos!" });

            const patient = await this.patientRepository.createAndSave({
                name,
                uuid: this.generatePatientUUID(manchester_priority, priority),
                password,
                phone_number,
                partner_name,
                partner_phone_number,
                status: 'waiting',
                description,
                manchester_priority,
                priority,
                state: null,
                location: null
            });

            delete patient.id;
            return res.status(201).json(patient);
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async login(req: Request, res: Response): Promise<Response> {
        try {
            const { uuid, password } = req.body;
            if (!uuid || !password)
                return res.status(400).json({ message: "UUID e senha são obrigatórios." });

            const patient = await this.patientRepository.findByUUID(uuid);
            if (!patient || patient.password !== password)
                return res.status(401).json({ message: "Credenciais inválidas." });

            const token = AuthService.tokenFrom({
                uuid: patient.uuid,
                type: "patient"
            });

            const response = { ...patient, token };
            delete response.password;
            delete response.id;

            return res.status(200).json(response);
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async logout(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.body.patient)
                return res.status(403).json({ message: "Acesso negado." });
            return res.status(200).json({ message: "Logout realizado com sucesso." });
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async query(req: Request, res: Response): Promise<Response> {
        try {
            const filters = req.query;
            delete filters.id;

            if (req.body.patient)
                filters.uuid = req.body.patient.uuid;

            const patients = await this.patientRepository.findAll(filters);
            const sanitized = patients.map(p => {
                const clone = { ...p };
                delete clone.id;
                delete clone.password;
                if (!req.body.user && (!req.body.patient || req.body.patient.uuid !== clone.uuid)) {
                    delete clone.state;
                    delete clone.location;
                }
                return clone;
            });

            return res.status(200).json(sanitized);
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.body.user)
                return res.status(403).json({ message: "Acesso negado." });

            const { uuid } = req.params;
            const patient = await this.patientRepository.findByUUID(uuid);
            if (!patient)
                return res.status(404).json({ message: "Paciente não encontrado!" });

            const { phone_number, partner_name, partner_phone_number, status, description, manchester_priority, priority, state, location } = req.body;

            if (phone_number) patient.phone_number = phone_number;
            if (partner_name) patient.partner_name = partner_name;
            if (partner_phone_number) patient.partner_phone_number = partner_phone_number;
            if (status) patient.status = status;
            if (description) patient.description = description;
            if (manchester_priority) patient.manchester_priority = manchester_priority;
            if (priority !== undefined) patient.priority = priority;
            if (state) patient.state = state;
            if (location) patient.location = location;

            await this.patientRepository.save(patient);
            return res.status(204).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.body.user)
                return res.status(403).json({ message: "Acesso negado." });

            const { uuid } = req.params;
            const patient = await this.patientRepository.findByUUID(uuid);
            if (!patient)
                return res.status(404).json({ message: "Paciente não encontrado!" });

            await this.patientRepository.remove(patient);
            return res.status(204).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async nextPatient(req: Request, res: Response): Promise<Response> {
        try {
            const patients = await this.patientRepository.findAll();
            const waiting = patients.filter(p => p.status === 'waiting');

            if (!waiting?.length || !patients?.length)
                return res.status(404).json({ message: "Não há pacientes esperando atendimento." });

            waiting.sort((a, b) => {
                const order = ['immediate', 'very-urgent', 'urgent', 'standard', 'non-urgent'];
                const diff = order.indexOf(a.manchester_priority) - order.indexOf(b.manchester_priority);
                if (diff !== 0) return diff;
                const prioDiff = (Number(b.priority) || 0) - (Number(a.priority) || 0);
                if (prioDiff !== 0) return prioDiff;
                return (a.id ?? 0) - (b.id ?? 0);
            });

            const patientQueue = waiting.map(p => {
                const clone = { ...p };
                delete clone.id;
                delete clone.password;
                if (!req.body.user && (!req.body.patient || req.body.patient.uuid !== clone.uuid)) {
                    delete clone.state;
                    delete clone.location;
                }
                return clone;
            });

            return res.status(200).json({ patientQueue });
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }
}