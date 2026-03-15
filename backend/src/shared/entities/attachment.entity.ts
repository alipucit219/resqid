import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export abstract class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  key: string;
}
