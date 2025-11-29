import { BeforeInsert, BeforeUpdate, AfterLoad, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

import { randomUUID } from "crypto";
import * as bcrypt from 'bcryptjs';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    public id?: number;

    @Column({ type: "char", length: 36, unique: true})
    public uuid: string = randomUUID();

    @Column({ length: 255, unique: true })
    public username!: string;

    @Column({ length: 255 })
    public password!: string;

    @Column()
    public role: 'regular' | 'root';

    private previous_password!: string;

    @BeforeInsert()
    @BeforeUpdate()
private setUUID(): void {
    if (!this.uuid) this.uuid = randomUUID();
}

    @BeforeInsert()
    @BeforeUpdate()
    private async hashPassword(): Promise<void>
    {
        if (this.password !== this.previous_password) {
            const salt = await bcrypt.genSalt(12);
            this.password = await bcrypt.hash(this.password, salt);
        }
    }

    @AfterLoad()
    private loadPreviousPassword(): void
    {
        this.previous_password = this.password;
    }
}