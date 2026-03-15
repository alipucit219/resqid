import {
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

export class BaseEntity {
  @Index()
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", select: false })
  updatedAt: Date;

  @DeleteDateColumn({ type: "timestamptz", nullable: true })
  deletedAt: Date;

  @Column({ type: "text", default: "System", select: false })
  createdBy: string;

  @Column({ type: "text", default: "System", select: false })
  updatedBy: string;

  @Column({ type: "text", default: "System", select: false })
  deletedBy: string;
}
