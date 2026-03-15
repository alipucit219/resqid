import { ENTITIES } from "./entities";
import databaseConfig from "./database.config";
import {
  TypeOrmModule,
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from "@nestjs/typeorm";

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  useFactory: async (): Promise<TypeOrmModuleOptions> => {
    return databaseConfig;
  },
};

export const DatabaseProvider = [
  TypeOrmModule.forRootAsync(typeOrmAsyncConfig),
  TypeOrmModule.forFeature(ENTITIES),
];
