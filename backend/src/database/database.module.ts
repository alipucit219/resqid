import { Global, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "src/config";
import { DatabaseService } from "./database.service";
import * as dns from "node:dns";

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dnsServers = configService.getMongoDnsServers();

        if (typeof dns.setDefaultResultOrder === "function") {
          dns.setDefaultResultOrder("ipv4first");
        }

        if (dnsServers.length > 0) {
          dns.setServers(dnsServers);
        }

        return {
          uri: configService.getMongoUri(),
          family: 4,
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService],
})
export class DatabaseModule {}
