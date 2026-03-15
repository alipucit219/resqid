import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export abstract class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  key: string;

  @Column()
  value: string;
}
