import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

export class UserRepository {
    private repository: Repository<User>;

    constructor() {
        this.repository = AppDataSource.getRepository(User);
    }

    public async createAndSave(data: Partial<User>): Promise<User> {
        const user = this.repository.create(data);
        return await this.repository.save(user);
    }

    public async findByUUID(uuid: string): Promise<User | null> {
        return await this.repository.findOne({ where: { uuid } });
    }

    public async findByUsername(username: string): Promise<User | null> {
        return await this.repository.findOne({ where: { username } });
    }

    public async findAll(filters?: Record<string, any>): Promise<User[]> {
        return await this.repository.find({ where: filters || {} });
    }

    public async save(user: User): Promise<User> {
        return await this.repository.save(user);
    }

    public async remove(user: User): Promise<void> {
        await this.repository.remove(user);
    }
}