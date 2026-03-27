import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { IAuthenticatedUserPayload } from "../types/auth.types";
import { ConfigService } from "../../../config/config.service";
import { UserService } from "src/app/user/user.service";
import { LoginSessionService } from "../services/login-session.service";
import { Types } from "mongoose";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly loginSessionService: LoginSessionService,
  ) {
    super({
      passReqToCallback: true,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getJWTSecretKey(),
    });
  }

  private ensureValidObjectId(id: string, type: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${type} in token payload.`);
    }
  }

  async validate(req: Request, payload: IAuthenticatedUserPayload) {
    const { userId, sessionId } = payload;
    this.ensureValidObjectId(userId, "userId");
    this.ensureValidObjectId(sessionId, "sessionId");

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        "The provided token belongs to a user that no longer exists in our system.",
      );
    }

    const session = await this.loginSessionService.findByIdAndUser(
      sessionId,
      userId,
    );
    if (!session) {
      throw new UnauthorizedException("Session has been expired. Please login again.");
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      gender: user.gender ?? null,
      role: user.role,
      isActive: user.isActive,
      session: {
        id: session.id,
        userId: session.userId.toString(),
        isAuthenticated: session.isAuthenticated,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: (session as any).createdAt,
      },
    };
  }
}
