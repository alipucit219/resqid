import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "src/shared/decorators/is-public.decorator";
import { EmergencyAccessService } from "../services/emergency-access.service";

@ApiTags("Emergency Access")
@Controller("emergency-access")
export class PublicEmergencyController {
  constructor(private readonly emergencyAccessService: EmergencyAccessService) {}

  @Public()
  @ApiOperation({ summary: "Resolve emergency profile from public token" })
  @Get(":token")
  async getEmergencyProfileFromToken(@Param("token") token: string) {
    return await this.emergencyAccessService.resolvePublicToken(token);
  }
}

