import { Module } from "@nestjs/common";
import { ConfigModule } from "src/config";
import { EmailService, HashService } from "./services";

@Module({
  imports: [ConfigModule],
  providers: [HashService, EmailService],
  exports: [HashService, EmailService],
})
export class SharedModule {}
