import { Controller, Get, Param, Redirect } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "src/shared/decorators/is-public.decorator";
import { ConfigService } from "src/config";
import { EmergencyAccessService } from "../services/emergency-access.service";

@ApiTags("Emergency Access")
@Controller("emergency-access")
export class PublicEmergencyController {
  constructor(
    private readonly emergencyAccessService: EmergencyAccessService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @ApiOperation({ summary: "Resolve emergency profile JSON from public token" })
  @Get(":token/data")
  async getEmergencyProfileFromTokenData(@Param("token") token: string) {
    return await this.emergencyAccessService.resolvePublicToken(token);
  }

  @Public()
  @Redirect()
  @ApiOperation({ summary: "Redirect QR scans to frontend home page" })
  @Get(":token")
  getEmergencyProfileFromToken(@Param("token") token: string) {
    const frontendUrl = this.configService.getFrontendUrl().replace(/\/$/, "");
    return {
      url: `${frontendUrl}/?emergencyToken=${encodeURIComponent(token)}`,
    };
  }
}
