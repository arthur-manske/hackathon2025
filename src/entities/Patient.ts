import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('patients')
export class Patient {
	@PrimaryGeneratedColumn()
	public id?: number;

	@Column({ length: 255 })
	public name!: string;

	@Column({ length: 12 })
	public uuid!: string;

	@Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	public created_at!: Date;

	@Column({ length: 3 })
	public password!: string;

	@Column()
	public phone_number!: string;

	@Column({ length: 255 })
	public partner_name!: string;

	@Column()
	public partner_phone_number!: string;

	@Column({
		type: 'enum',
		enum: ['waiting', 'registering', 'attending'] as const,
		default: 'waiting'
	})
	public status!: 'waiting' | 'attending';

	@Column()
	public description!: string;

	@Column({
		type: 'enum',
		enum: ['immediate', 'very-urgent', 'urgent', 'standard', 'non-urgent', 'undefined'] as const,
		default: 'undefined'
	})
	public manchester_priority!: 'immediate' | 'very-urgent' | 'urgent' | 'standard' | 'non-urgent';

	@Column()
	public priority!: number;

	@Column({ nullable: true })
	public state!: string | null;

	@Column({ nullable: true })
	public location!: string | null;
};