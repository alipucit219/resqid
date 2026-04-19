import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from "../dtos";
import { AuthService } from "../services/auth.service";
import { ApiBearerAuth } from "@nestjs/swagger";

import { IAuthenticatedRequest } from "src/shared/interfaces/authenticated-request.interface";
import { AuthenticatedRequestPayload } from "src/shared/decorators/authenticated-request.decorator";
import { SuccessApiResponseDto } from "src/shared/DTOs";
import { Public } from "src/shared/decorators/is-public.decorator";
import { Cron, CronExpression } from "@nestjs/schedule";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({
    description: "Get authenticated to be able to access system",
  })
  @Post("login")
  async login(@Req() req, @Body() body: LoginDto) {
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    return this.authService.login(body, ipAddress, userAgent);
  }

  @Public()
  @ApiOperation({
    description: "Create a new mobile user account",
  })
  @Post("register")
  async register(@Req() req, @Body() body: RegisterDto) {
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];
    return await this.authService.register(body, ipAddress, userAgent);
  }

  @Public()
  @ApiOperation({ description: "Request a password reset code" })
  @HttpCode(HttpStatus.OK)
  @Post("forgot-password")
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return await this.authService.forgotPassword(body.email);
  }

  @Public()
  @ApiOperation({ description: "Verify password reset code" })
  @HttpCode(HttpStatus.OK)
  @Post("verify-reset-code")
  async verifyResetCode(@Body() body: VerifyResetCodeDto) {
    return await this.authService.verifyResetCode(body.email, body.code);
  }

  @Public()
  @ApiOperation({ description: "Reset password using a valid reset code" })
  @HttpCode(HttpStatus.OK)
  @Post("reset-password")
  async resetPassword(@Body() body: ResetPasswordDto) {
    return await this.authService.resetPassword(body);
  }

  @ApiOperation({ description: "Logout from currently logged-in device " })
  @ApiBearerAuth()
  @Post("logout")
  async logout(@AuthenticatedRequestPayload() req: IAuthenticatedRequest) {
    return await this.authService.logout(req.user.session.id);
  }

  @ApiOkResponse({ type: SuccessApiResponseDto })
  @ApiOperation({ description: "Logout from all the logged-in devices " })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post("logout-from-all-devices")
  async logoutOfAllDevices(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
  ) {
    const { session, id } = req.user;
    return await this.authService.logoutFromAllDevices(id, session.id);
  }

  @ApiOkResponse({ type: SuccessApiResponseDto })
  @ApiOperation({ description: "Change password " })
  @ApiBearerAuth()
  @Post("change-password")
  async changePassword(
    @Body() body: ChangePasswordDto,
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
  ) {
    const { id } = req.user;
    return await this.authService.changePassword(id, body);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async deleteExpiredSessions() {
    return await this.authService.deleteExpiredSessions();
  }
}
