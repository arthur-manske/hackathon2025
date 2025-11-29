// src/controllers/patient.controller.ts
import { Request, Response } from "express";
import { Patient } from "../entities/Patient";
import { PatientRepository } from "../repository/PatientRepository";

export class PatientController {
    private static patientRepository = new PatientRepository();

    private static generatePatientUUID(
        manchester_priority: 'immediate' | 'very-urgent' | 'urgent' | 'standard' | 'non-urgent',
        priority: number
    ): string {

        const manchesterMap: Record<string, string> = {
            'immediate': 'I',
            'very-urgent': 'V',
            'urgent': 'U',
            'standard': 'S',
            'non-urgent': 'N'
        };

        const mp = manchesterMap[manchester_priority];

        // 4 caracteres aleatórios (A-Z, 0-9)
        const random = Array.from({ length: 4 })
            .map(() => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                .charAt(Math.floor(Math.random() * 36)))
            .join("");

        return `${random}${mp}${priority}`;
    }

    static async create(req: Request, res: Response): Promise<Response> {
        try {
            const { name, phone_number, partner_name, partner_phone_number, description, manchester_priority, priority } = req.body;

            if (!name || !phone_number || !description || !manchester_priority || priority === undefined)
                return res.status(400).json({ message: "Campos obrigatórios não fornecidos!" });

            const patient = await PatientController.patientRepository.createAndSave({
                name,
                uuid: PatientController.generatePatientUUID(manchester_priority, priority),
                phone_number,
                partner_name,
                partner_phone_number,
                status: 'waiting',
                description,
                manchester_priority,
                priority
            });

            return res.status(201).json(patient);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    // Listar todos pacientes
    static async listAll(req: Request, res: Response): Promise<Response> {
        try {
            const patients = await PatientController.patientRepository.findAll();
            return res.status(200).json(patients);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    // Buscar paciente por ID
    static async findById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const patient = await PatientController.patientRepository.findById(Number(id));
            if (!patient) return res.status(404).json({ message: "Paciente não encontrado!" });
            return res.status(200).json(patient);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    // Atualizar paciente
    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const patient = await PatientController.patientRepository.findById(Number(id));
            if (!patient) return res.status(404).json({ message: "Paciente não encontrado!" });

            const { name, phone_number, partner_name, partner_phone_number, status, description, manchester_priority, priority } = req.body;

            if (name) patient.name = name;
            if (phone_number) patient.phone_number = phone_number;
            if (partner_name) patient.partner_name = partner_name;
            if (partner_phone_number) patient.partner_phone_number = partner_phone_number;
            if (status) patient.status = status;
            if (description) patient.description = description;
            if (manchester_priority) patient.manchester_priority = manchester_priority;
            if (priority !== undefined) patient.priority = priority;

            const updated = await PatientController.patientRepository.save(patient);
            return res.status(200).json(updated);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    // Remover paciente
    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const patient = await PatientController.patientRepository.findById(Number(id));
            if (!patient) return res.status(404).json({ message: "Paciente não encontrado!" });

            await PatientController.patientRepository.remove(patient);
            return res.status(204).send();
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    // Próximo paciente a ser atendido
    static async nextPatient(req: Request, res: Response): Promise<Response> {
        try {
            const patients = await PatientController.patientRepository.findAll();
            const waitingPatients = patients.filter(p => p.status === 'waiting');
            
            if (!waitingPatients?.length)
                return res.status(404).json({ message: "Não há pacientes esperando atendimento." });
            
            if (waitingPatients.length === 0)
                return res.status(200).json(waitingPatients[0]);

            waitingPatients.sort((a, b) => {
                const manchesterOrder = ['immediate', 'very-urgent', 'urgent', 'standard', 'non-urgent'];

                const manchesterDiff =
                    manchesterOrder.indexOf(a.manchester_priority) -
                    manchesterOrder.indexOf(b.manchester_priority);

                if (manchesterDiff !== 0) return manchesterDiff;

                const priorityA = typeof a.priority === "number" ? a.priority : -999;
                const priorityB = typeof b.priority === "number" ? b.priority : -999;

                const priorityDiff = priorityB - priorityA;
                if (priorityDiff !== 0) return priorityDiff;

                return (a.id ?? 0) - (b.id ?? 0);
            });

            const nextPatient = waitingPatients[0];
            return res.status(200).json(nextPatient);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }
}