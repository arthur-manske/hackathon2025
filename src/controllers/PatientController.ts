import { Request, Response } from "express";

import { PatientRepository } from "../repository/PatientRepository";

import { WhatsappProviderService } from "../services/WhatsappProviderService";

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
                priority,
                state: null,
                location: null
            });

            delete patient.id;
            return res.status(201).json(patient);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async listAll(req: Request, res: Response): Promise<Response> {
        try {
            const patients = (await PatientController.patientRepository.findAll()).map(
                p => { delete p.id; delete p.state; delete p.location; return p; }
            );

            return res.status(200).json(patients);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async findByUUID(req: Request, res: Response): Promise<Response> {
        try {
            const { uuid } = req.params;
            const patient = await PatientController.patientRepository.findByUUID(uuid);
            if (!patient) return res.status(404).json({ message: "Paciente não encontrado!" });
            delete patient.id; delete patient.state; delete patient.location;
            return res.status(200).json(patient);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async update(req: Request, res: Response): Promise<Response> {
        try {
            const { uuid } = req.params;
            const patient = await PatientController.patientRepository.findByUUID(uuid);
            if (!patient) return res.status(404).json({ message: "Paciente não encontrado!" });

            const { phone_number, partner_name, partner_phone_number, status, description, manchester_priority, priority, state, location } = req.body;

            if (phone_number) patient.phone_number = phone_number;
            if (partner_name) patient.partner_name = partner_name;
            if (partner_phone_number) patient.partner_phone_number = partner_phone_number;

            /*** Básico */
            if (status && patient.status !== status) {
                patient.status = status;
                let msg = '';
                switch (status) {
                    case 'waiting':
                        msg = `Olá ${patient.name}, você está aguardando atendimento.`;
                        break;
                    case 'called':
                        msg = `Olá ${patient.name}, é a sua vez de ser atendido!`;
                        break;
                    case 'attended':
                        msg = `Olá ${patient.name}, seu atendimento foi concluído.`;
                        break;
                    default:
                        msg = `Atualização de status: ${status}`;
                }

                if (patient.phone_number) {
                    WhatsappProviderService.send(msg, patient.phone_number)
                        .then(r => console.log('Aviso enviado:', r))
                        .catch(err => console.error('Erro ao enviar aviso:', err));
                }
                
                if (patient.partner_phone_number) {
                    WhatsappProviderService.send(msg, patient.phone_number)
                        .then(r => console.log('Aviso enviado:', r))
                        .catch(err => console.error('Erro ao enviar aviso:', err));
                }
            }

            if (description) patient.description = description;
            if (manchester_priority) patient.manchester_priority = manchester_priority;
            if (priority !== undefined) patient.priority = priority;
            if (state) patient.state = state;
            if (location) patient.location = location;

            const updated = await PatientController.patientRepository.save(patient);
            return res.status(204).send();
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async delete(req: Request, res: Response): Promise<Response> {
        try {
            const { uuid } = req.params;
            const patient = await PatientController.patientRepository.findByUUID(uuid);
            if (!patient) return res.status(404).json({ message: "Paciente não encontrado!" });

            await PatientController.patientRepository.remove(patient);
            return res.status(204).send();
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }

    static async nextPatient(req: Request, res: Response): Promise<Response> {
        try {
            const patients = await PatientController.patientRepository.findAll();
            const waitingPatients = patients.filter(p => p.status === 'waiting');

            if (waitingPatients.length === 0)
                return res.status(404).json({ message: "Não há pacientes esperando atendimento." });

            waitingPatients.sort((a, b) => {
                const manchesterOrder = ['immediate', 'very-urgent', 'urgent', 'standard', 'non-urgent'];

                const manchesterDiff =
                    manchesterOrder.indexOf(a.manchester_priority) -
                    manchesterOrder.indexOf(b.manchester_priority);

                /*
                 *** Considerar tempo máximo de cada um dos Manchester
                 * 1. Imediato: até 5 minutos.
                 * 2. Muito urgente: até 10 minutos
                 * 3. Urgente: até 30 minutos.
                 * 4. Padrão: até 75 minutos.
                 * 5. Não-urgente: 150 minutos.
                */

                if (manchesterDiff !== 0) return manchesterDiff;

                const priorityA = Number(a.priority) || 0;
                const priorityB = Number(b.priority) || 0;

                const priorityDiff = priorityB - priorityA;
                if (priorityDiff !== 0) return priorityDiff;

                return (a.id ?? 0) - (b.id ?? 0);
            });

            const nextPatient = { ...waitingPatients[0] };
            delete nextPatient.id; delete nextPatient.state; delete nextPatient.location;

            return res.status(200).json(nextPatient);
        } catch (e) {
            console.error(`ERROR: ${e}`);
            return res.status(500).json({ message: "Erro interno no servidor." });
        }
    }
}
