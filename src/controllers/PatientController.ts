import { Request, Response } from "express";
import { PatientRepository } from "../repository/PatientRepository";
import { AuthService } from "../services/AuthService";
import { In } from 'typeorm';

export class PatientController {
    private static patientRepository = new PatientRepository();

    private static generatePatientUUID(
        manchester_priority: 'immediate' | 'very-urgent' | 'urgent' | 'standard' | 'non-urgent',
        priority: number
    ): string {
        const map = { immediate: 'I', 'very-urgent': 'V', urgent: 'U', standard: 'S', 'non-urgent': 'N', 'undefined': '.' };
        const r = Array.from({ length: 4 })
            .map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36)))
            .join("");
        return `${r}${map[manchester_priority]}${priority}`;
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.user)
                return res.status(403).json({ message: "Acesso negado." });

            const { name, password, phone_number, partner_name, partner_phone_number, description, manchester_priority, priority } = req.body;
            if (!name || !password || !phone_number || !description || !manchester_priority || priority === undefined)
                return res.status(400).json({ message: "Campos obrigatórios não fornecidos!" });

            const patient = await PatientController.patientRepository.createAndSave({
                name,
                uuid: PatientController.generatePatientUUID(manchester_priority, priority),
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
            return res.status(201).location("/patients/" + patient.uuid).send();
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

            const patient = await PatientController.patientRepository.findByUUID(uuid);
            if (!patient || patient.password !== password)
                return res.status(401).json({ message: "Credenciais inválidas." });

            const token = AuthService.tokenFrom({
                uuid: patient.uuid,
                type: "patient"
            });

            return res.status(200).json({token});
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async logout(req: Request, res: Response): Promise<Response> {
        try {
            if (!req.patient)
                return res.status(403).json({ message: "Acesso negado." });
            return res.status(200).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async query(req: Request, res: Response): Promise<Response> {
        try {
            const filters: any = { ...req.query };

            delete filters.id;

            // FIX: Se 'status' for um array (enviado via ?status=a&status=b),
            // aplicamos o operador TypeORM 'In' para traduzir para WHERE IN (...)
            if (Array.isArray(filters.status)) {
                filters.status = In(filters.status);
            }

            const patients = await PatientController.patientRepository.findAll({ where: filters });
           
            return res.status(200).json((patients).map((p) => { // Removido o segundo findAll
                const clone: any = { uuid: p.uuid, name: p.name, partner_name: p.partner_name, partner_phone_number: p.partner_phone_number, status: p.status, manchester_prio: p.manchester_priority, specific_prio: p.priority, state: p.state, location: p.location };
                if (!req.user && (!req.patient || req.patient.uuid !== clone.uuid)) {
                    clone.state = clone.location = undefined;
                }
                return clone;
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
            const patient = await PatientController.patientRepository.findByUUID(uuid);
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

            await PatientController.patientRepository.save(patient);
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
            const patient = await PatientController.patientRepository.findByUUID(uuid);
            if (!patient)
                return res.status(404).json({ message: "Paciente não encontrado!" });

            await PatientController.patientRepository.remove(patient);
            return res.status(204).send();
        } catch (e) {
            console.error("ERROR:", e);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async queue(req: Request, res: Response): Promise<Response> {
        try {
            const patients = await PatientController.patientRepository.findAll();
            const waiting = patients.filter(p => p.status === "waiting");

            if (!waiting?.length)
                return res.status(404).json({ message: "Não há pacientes esperando atendimento." });

            const order = ["immediate", "very-urgent", "urgent", "standard", "non-urgent"];
            const maxTimes: Record<string, number> = {
                "immediate": 5 * 60_000,      // 5 minutos
                "very-urgent": 10 * 60_000,   // 10 minutos
                "urgent": 30 * 60_000,        // 30 minutos
                "standard": 75 * 60_000,      // 75 minutos
                "non-urgent": 150 * 60_000    // 150 minutos
            };

            const now = Date.now();

            waiting.sort((a, b) => {
                const idxA = order.indexOf(a.manchester_priority);
                const idxB = order.indexOf(b.manchester_priority);

                const waitA = now - new Date(a.created_at).getTime();
                const waitB = now - new Date(b.created_at).getTime();

                const maxA = maxTimes[a.manchester_priority];
                const maxB = maxTimes[b.manchester_priority];

                const overA = waitA / maxA;
                const overB = waitB / maxB;

                if (overA >= 1 && overB < 1) return -1;
                if (overB >= 1 && overA < 1) return 1;

                if (idxA !== idxB) return idxA - idxB;

                if (overA !== overB) return overB - overA;

                const prioDiff = (Number(b.priority) || 0) - (Number(a.priority) || 0);
                if (prioDiff !== 0) return prioDiff;

                return (a.id ?? 0) - (b.id ?? 0);
            });

            const patientQueue = waiting.map(p => {
                const clone = { ...p };
                delete clone.id;
                delete clone.password;
                if (!req.user && (!req.patient || req.patient.uuid !== clone.uuid)) {
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
