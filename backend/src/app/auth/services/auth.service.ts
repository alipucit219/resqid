import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { HashService, EmailService } from "../../../shared/services";
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from "../dtos";
import { LoginSessionService } from "./login-session.service";
import { AuthTokenService } from "./auth-token.service";
import { IAuthenticatedUserPayload } from "../types/auth.types";
import { UserService } from "../../user/user.service";
import { ConfigService } from "src/config";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly hashService: HashService,
    private readonly authTokenService: AuthTokenService,
    private readonly loginSessionService: LoginSessionService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async isPasswordValid(plainPassword: string, hashedPassword: string) {
    return await this.hashService.check(plainPassword, hashedPassword);
  }

  async login(body: LoginDto, ipAddress?: string, browser?: string) {
    const { password } = body;

    const user = await this.userService.findByEmail(body.email, true);

    if (!user || !(await this.isPasswordValid(password, user.password))) {
      throw new UnauthorizedException("Either email or password is invalid.");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is inactive.");
    }

    const session = await this.loginSessionService.create({
      userId: user.id,
      isAuthenticated: true,
      ipAddress,
      userAgent: browser,
    });

    const jwtPayload: IAuthenticatedUserPayload = {
      userId: user.id,
      sessionId: session.id,
    };

    const accessToken = this.authTokenService.sign(jwtPayload);

    return {
      message: `${user.fullName} logged in successfully.`,
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber ?? null,
        cnic: user.cnic ?? null,
        address: user.address ?? null,
        dateOfBirth: user.dateOfBirth ?? null,
        gender: user.gender ?? null,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async register(body: RegisterDto, ipAddress?: string, browser?: string) {
    const user = await this.userService.createSelfRegisteredUser({
      email: body.email,
      fullName: body.fullName,
      password: body.password,
      phoneNumber: body.phoneNumber,
      cnic: body.cnic,
      address: body.address,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
    });

    const session = await this.loginSessionService.create({
      userId: user.id,
      isAuthenticated: true,
      ipAddress,
      userAgent: browser,
    });

    const jwtPayload: IAuthenticatedUserPayload = {
      userId: user.id,
      sessionId: session.id,
    };

    const accessToken = this.authTokenService.sign(jwtPayload);

    return {
      message: `${user.fullName} account created successfully.`,
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber ?? null,
        cnic: user.cnic ?? null,
        address: user.address ?? null,
        dateOfBirth: user.dateOfBirth ?? null,
        gender: user.gender ?? null,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email, true);
    if (!user) {
      return {
        message:
          "If an account exists for this email, reset instructions have been sent.",
      };
    }

    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");
    const expiry = new Date(
      Date.now() + this.configService.getResetTokenExpiryMinutes() * 60 * 1000,
    );

    await this.userService.setResetToken(user.id, hashedToken, expiry);

    const resetLink = `${this.configService.getFrontendUrl().replace(/\/$/, "")}/reset-password?token=${rawToken}`;
    const emailPayload = {
      to: user.email,
      subject: "Reset your password",
      text: `Use this link to reset your password: ${resetLink}`,
      html: `<p>Use the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    };

    const result = await this.emailService.sendMail(emailPayload);
    if (result.fallback) {
      this.logger.warn(`Password reset fallback link for ${user.email}: ${resetLink}`);
    }

    return {
      message:
        "If an account exists for this email, reset instructions have been sent.",
    };
  }

  async resetPassword(body: ResetPasswordDto) {
    const hashedToken = createHash("sha256").update(body.token).digest("hex");
    const user = await this.userService.findByResetTokenHash(hashedToken);

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException("Reset token is invalid or expired.");
    }

    user.password = await this.hashService.hashPassword(body.newPassword);
    user.resetTokenHash = null;
    user.resetTokenExpiry = null;
    await this.userService.save(user);

    return {
      message: "Password has been reset.",
    };
  }

  async changePassword(id: string, body: ChangePasswordDto) {
    const { currentPassword, newPassword } = body;
    const user = await this.userService.findById(id, true);

    if (!user) {
      throw new UnauthorizedException("User not found.");
    }

    const isCurrentPasswordValid = await this.isPasswordValid(
      currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException(
        "Current password is invalid. Please try again.",
      );
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        "Current password can not be set as new password.",
      );
    }

    user.password = await this.hashService.hashPassword(newPassword);
    await this.userService.save(user);

    return {
      message: "Password changed successfully.",
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.loginSessionService.deleteSession(sessionId);

    // Check if user has any remaining active sessions
    const remainingSessions =
      await this.loginSessionService.countUserSessions(userId);

    // If no sessions left, clear all push tokens (no device is logged in)
    if (remainingSessions === 0) {
      await this.userService.clearAllExpoPushTokens(userId);
    }

    return {
      message: "Logout successfully",
    };
  }

  async registerPushToken(userId: string, expoPushToken: string) {
    if (!expoPushToken || typeof expoPushToken !== "string") {
      throw new BadRequestException("expoPushToken is required");
    }

    const user = await this.userService.addExpoPushToken(
      userId,
      expoPushToken,
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      success: true,
      message: "Device registered for alerts.",
    };
  }

  async removePushToken(userId: string, expoPushToken: string) {
    if (!expoPushToken || typeof expoPushToken !== "string") {
      throw new BadRequestException("expoPushToken is required");
    }

    await this.userService.removeExpoPushToken(userId, expoPushToken);

    return {
      message: "Push token removed.",
    };
  }

  async logoutFromAllDevices(userId: string, sessionId: string) {
    const deletedSessionsCount =
      await this.loginSessionService.deleteOtherSessions(userId, sessionId);

    if (deletedSessionsCount === 0) {
      throw new BadRequestException(
        "You are currently logged in on a single device",
      );
    }

    // Clear all push tokens — only current device session remains,
    // frontend should re-register its token after this call
    await this.userService.clearAllExpoPushTokens(userId);

    return {
      message: `Successfully logged out from the remaining ${deletedSessionsCount} devices.`,
    };
  }

  async deleteExpiredSessions() {
    const { deletedCount, affectedUserIds } =
      await this.loginSessionService.deleteExpiredSessions();

    // For users whose sessions were just expired, check if they have
    // any remaining active sessions. If not, clear their push tokens.
    if (affectedUserIds.length > 0) {
      const usersWithNoSessions =
        await this.loginSessionService.findUsersWithNoSessions(
          affectedUserIds,
        );

      if (usersWithNoSessions.length > 0) {
        await this.userService.clearExpoPushTokensForUsers(usersWithNoSessions);
      }
    }

    return deletedCount;
  }
}
