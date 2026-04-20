import { forwardRef, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthService } from "./services/auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { AuthController } from "./controllers/auth.controller";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "../../config/config.service";
import { ConfigModule } from "../../config/config.module";
import { AuthTokenService } from "./services/auth-token.service";
import { LoginSessionService } from "./services/login-session.service";
import { UserModule } from "../user/user.module";
import { SharedModule } from "src/shared/shared.module";
import { LoginSession, LoginSessionSchema } from "./entities/login-session.entity";
import { PushService } from "./services/push.service";

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getJWTSecretKey(),
        signOptions: {
          expiresIn: configService.getJWTTokenExpiration(),
        },
      }),
    }),
    SharedModule,
    MongooseModule.forFeature([
      { name: LoginSession.name, schema: LoginSessionSchema },
    ]),
  ],
  providers: [
    JwtStrategy,
    AuthService,
    AuthTokenService,
    ConfigService,
    LoginSessionService,
    PushService,
  ],
  exports: [AuthService, LoginSessionService, PushService],
  controllers: [AuthController],
})
export class AuthModule {}
