import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { SeedDefaultAccountService } from "./database/seeder/services/seed-default-account.service";

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly seedDefaultAccountService: SeedDefaultAccountService) {}

  async onModuleInit() {
    try {
      await this.seedDefaultAccountService.seed();
    } catch (error) {
      this.logger.error("Failed to seed default account on startup.", error);
    }
  }

  getHello() {
    return "RESQID Server is up and running perfectly fine";
  }
}
