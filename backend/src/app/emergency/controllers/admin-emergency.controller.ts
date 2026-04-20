import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/shared/decorators";
import { Role } from "src/app/auth/enums/role.enum";
import {
  EmergencyAdminListQueryDto,
  CreateEmergencyContactDto,
  UpdateEmergencyContactDto,
  UpsertMedicalProfileDto,
  UpsertMedicalSummaryDto,
} from "../dtos";
import { MedicalProfileService } from "../services/medical-profile.service";
import { MedicalSummaryService } from "../services/medical-summary.service";
import { EmergencyContactService } from "../services/emergency-contact.service";
import { EmergencyAccessService } from "../services/emergency-access.service";
import { PanicAlertService } from "../services/panic-alert.service";

@ApiBearerAuth()
@ApiTags("Emergency - Admin")
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminEmergencyController {
  constructor(
    private readonly medicalProfileService: MedicalProfileService,
    private readonly medicalSummaryService: MedicalSummaryService,
    private readonly emergencyContactService: EmergencyContactService,
    private readonly emergencyAccessService: EmergencyAccessService,
    private readonly panicAlertService: PanicAlertService,
  ) {}

  @ApiOperation({ summary: "List medical profiles" })
  @Get("medical-profiles")
  async listMedicalProfiles(@Query() query: EmergencyAdminListQueryDto) {
    return await this.medicalProfileService.adminList(query);
  }

  @ApiOperation({ summary: "Get medical profile by user id" })
  @Get("medical-profiles/:userId")
  async getMedicalProfileByUserId(@Param("userId") userId: string) {
    return await this.medicalProfileService.adminGetByUserId(userId);
  }

  @ApiOperation({ summary: "Upsert medical profile by user id" })
  @Put("medical-profiles/:userId")
  async upsertMedicalProfileByUserId(
    @Param("userId") userId: string,
    @Body() payload: UpsertMedicalProfileDto,
  ) {
    return await this.medicalProfileService.upsertByUserId(userId, payload);
  }

  @ApiOperation({ summary: "List medical summaries" })
  @Get("medical-summaries")
  async listMedicalSummaries(@Query() query: EmergencyAdminListQueryDto) {
    return await this.medicalSummaryService.adminList(query);
  }

  @ApiOperation({ summary: "Upsert medical summary by user id" })
  @Put("medical-summaries/:userId")
  async upsertMedicalSummaryByUserId(
    @Param("userId") userId: string,
    @Body() payload: UpsertMedicalSummaryDto,
  ) {
    return await this.medicalSummaryService.upsertByUserId(userId, payload);
  }

  @ApiOperation({ summary: "List emergency contacts" })
  @Get("emergency-contacts")
  async listEmergencyContacts(@Query() query: EmergencyAdminListQueryDto) {
    return await this.emergencyContactService.adminList(query);
  }

  @ApiOperation({ summary: "Create emergency contact for a user" })
  @Post("emergency-contacts/:userId")
  async createEmergencyContactForUser(
    @Param("userId") userId: string,
    @Body() payload: CreateEmergencyContactDto,
  ) {
    return await this.emergencyContactService.createByUserId(userId, payload);
  }

  @ApiOperation({ summary: "Update emergency contact for a user" })
  @Put("emergency-contacts/:userId/:contactId")
  async updateEmergencyContactForUser(
    @Param("userId") userId: string,
    @Param("contactId") contactId: string,
    @Body() payload: UpdateEmergencyContactDto,
  ) {
    return await this.emergencyContactService.updateByUserId(
      userId,
      contactId,
      payload,
    );
  }

  @ApiOperation({ summary: "Delete emergency contact for a user" })
  @Delete("emergency-contacts/:userId/:contactId")
  async deleteEmergencyContactForUser(
    @Param("userId") userId: string,
    @Param("contactId") contactId: string,
  ) {
    return await this.emergencyContactService.deleteByUserId(userId, contactId);
  }

  @ApiOperation({ summary: "List qr-access metadata" })
  @Get("qr-access")
  async listQrAccess(@Query() query: EmergencyAdminListQueryDto) {
    return await this.emergencyAccessService.adminList(query);
  }

  @ApiOperation({ summary: "Regenerate emergency QR for a user" })
  @Post("qr-access/:userId/regenerate")
  async regenerateQrByUserId(@Param("userId") userId: string) {
    return await this.emergencyAccessService.regenerateForUser(userId);
  }

  @ApiOperation({ summary: "List panic alerts" })
  @Get("panic-alerts")
  async listPanicAlerts(@Query() query: EmergencyAdminListQueryDto) {
    return await this.panicAlertService.adminList(query);
  }

  @ApiOperation({ summary: "Get panic alert details" })
  @Get("panic-alerts/:id")
  async getPanicAlertDetail(@Param("id") id: string) {
    return await this.panicAlertService.adminDetail(id);
  }
}
