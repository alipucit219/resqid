import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "src/config";
import { DatabaseModule } from "../database.module";
import { SeedDefaultAccountService } from "./services/seed-default-account.service";
import { SharedModule } from "src/shared/shared.module";
import { User, UserSchema } from "src/app/user/user.entity";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    SharedModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  exports: [
    SeedDefaultAccountService,
  ],
  providers: [
    SeedDefaultAccountService,
  ],
})
export class SeederModule { }
