import { Repository } from "typeorm";

import { AppDataSource } from "../config/data-source";

import { Patient } from "../entities/Patient"

export class PatientRepository {
    private repository: Repository<Patient>;

    public constructor()
    {
        this.repository = AppDataSource.getRepository('patients');
    }

    public async createAndSave(data: Partial<Patient>): Promise<Patient>
    {
        const patient = this.repository.create(data);
        return this.repository.save(patient);
    }

    public async findAll(): Promise<Patient[]>
    {
        return this.repository.find();
    }

    public async findById(id: number): Promise<Patient | null>
    {
        return this.repository.findOneBy({ id });
    }

    public async findByUUID(uuid: string): Promise<Patient | null>
    {
        return this.repository.findOneBy({ uuid });
    }

    public async findByPhoneNumber(phone_number: string): Promise<Patient | null>
    {
        return this.repository.findOneBy({ phone_number });
    }

    public async findByStatus(status: 'waiting' | 'registering' | 'attending'): Promise<Patient[]>
    {
        return this.repository.find({ where: { status } });
    }

    public async save(patient: Patient): Promise<Patient> 
    {
        return this.repository.save(patient);
    }

    public async remove(patient: Patient): Promise<Patient>
    {
        return this.repository.remove(patient);
    }
}