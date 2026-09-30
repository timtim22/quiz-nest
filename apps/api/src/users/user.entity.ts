import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  // select: false keeps the hash out of normal queries
  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;
}