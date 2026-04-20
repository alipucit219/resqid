import { Module } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "./config/config.module";
import { SharedModule } from "./shared/shared.module";
import { ConfigService } from "./config";
import { LoggingInterceptor } from "./shared/interceptors/logging-interceptor";
import { WinstonModule } from "nest-winston";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./app/auth/auth.module";
import { UserModule } from "./app/user/user.module";
import { DatabaseModule } from "./database/database.module";
import { AuthenticationGuard } from "./app/auth/guards/authentication.guard";
import { ScheduleModule } from "@nestjs/schedule";
import { AuthorizationGuard } from "./app/auth/guards/authorization.guard";
import { SeederModule } from "./database/seeder/seeder.module";
import { EmergencyModule } from "./app/emergency/emergency.module";
import { PushService } from "./app/auth/services/push.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    SharedModule,
    DatabaseModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.getWinstonOptions(),
    }),
    AuthModule,
    UserModule,
    EmergencyModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
    PushService,
  ],

  exports: [PushService], // 🔥 THIS IS REQUIRED
})
export class AppModule { }
