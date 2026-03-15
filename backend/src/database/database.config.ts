import "dotenv/config";
import { DataSourceOptions } from "typeorm";
import { ENTITIES } from "./entities";

const databaseConfig: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  migrations: ["dist/database/migrations/*.js"],
  migrationsRun: false,
  entities: ENTITIES,
  schema: "public",
  synchronize: true,
  logging: false,
};

export default databaseConfig;
