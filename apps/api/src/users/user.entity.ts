import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.enum.js";

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



@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: "enum", enum: Role, default: Role.STUDENT })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;
}