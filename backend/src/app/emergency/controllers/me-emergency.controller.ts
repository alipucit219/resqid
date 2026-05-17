import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  StreamableFile,
  Put,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { createReadStream } from "fs";
import { Response } from "express";
import { AuthenticatedRequestPayload } from "src/shared/decorators";
import { IAuthenticatedRequest } from "src/shared/interfaces";
import { isProvidedFileAValidPdf } from "src/utils/is-valid-pdf.util";
import {
  CreateEmergencyContactDto,
  CreatePanicAlertDto,
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
@ApiTags("Emergency - Me")
@Controller("me")
export class MeEmergencyController {
  constructor(
    private readonly medicalProfileService: MedicalProfileService,
    private readonly medicalSummaryService: MedicalSummaryService,
    private readonly emergencyContactService: EmergencyContactService,
    private readonly emergencyAccessService: EmergencyAccessService,
    private readonly panicAlertService: PanicAlertService,
  ) {}

  @ApiOperation({ summary: "Get requesting user's medical profile" })
  @Get("medical-profile")
  async getMedicalProfile(@AuthenticatedRequestPayload() req: IAuthenticatedRequest) {
    return await this.medicalProfileService.getByUserId(req.user.id);
  }

  @ApiOperation({ summary: "Create/Update requesting user's medical profile" })
  @Put("medical-profile")
  async upsertMedicalProfile(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @Body() payload: UpsertMedicalProfileDto,
  ) {
    return await this.medicalProfileService.upsertByUserId(req.user.id, payload);
  }

  @ApiOperation({ summary: "Get requesting user's medical summary" })
  @Get("medical-summary")
  async getMedicalSummary(@AuthenticatedRequestPayload() req: IAuthenticatedRequest) {
    return await this.medicalSummaryService.getByUserId(req.user.id);
  }

  @ApiOperation({ summary: "Create/Update requesting user's medical summary" })
  @Put("medical-summary")
  async upsertMedicalSummary(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @Body() payload: UpsertMedicalSummaryDto,
  ) {
    return await this.medicalSummaryService.upsertByUserId(req.user.id, payload);
  }

  @ApiOperation({ summary: "Upload a PDF checkup file for requesting user's medical summary" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Post("medical-summary/checkup-files")
  @Post("medical-summary/checkup-files")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      fileFilter: isProvidedFileAValidPdf,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadMedicalSummaryCheckupFile(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.medicalSummaryService.uploadCheckupFile(req.user.id, file);
  }

  @ApiOperation({ summary: "Download a PDF checkup file for requesting user's medical summary" })
  @Get("medical-summary/checkup-files/:fileName/download")
  @Get("medical-summary/checkup-files/:fileName/download")
  async downloadMedicalSummaryCheckupFile(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @Param("fileName") fileName: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const download = await this.medicalSummaryService.getOwnedCheckupFileDownload(
      req.user.id,
      fileName,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${download.fileName}"`,
    );

    return new StreamableFile(createReadStream(download.absolutePath));
  }

  @ApiOperation({ summary: "List requesting user's emergency contacts" })
  @Get("emergency-contacts")
  async listEmergencyContacts(@AuthenticatedRequestPayload() req: IAuthenticatedRequest) {
    return await this.emergencyContactService.listByUserId(req.user.id);
  }

  @ApiOperation({ summary: "Create emergency contact for requesting user" })
  @Post("emergency-contacts")
  async createEmergencyContact(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @Body() payload: CreateEmergencyContactDto,
  ) {
    return await this.emergencyContactService.createByUserId(req.user.id, payload);
  }

  @ApiOperation({ summary: "Update emergency contact for requesting user" })
  @Put("emergency-contacts/:id")
  async updateEmergencyContact(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @Param("id") id: string,
    @Body() payload: UpdateEmergencyContactDto,
  ) {
    return await this.emergencyContactService.updateByUserId(req.user.id, id, payload);
  }

  @ApiOperation({ summary: "Delete emergency contact for requesting user" })
  @Delete("emergency-contacts/:id")
  async deleteEmergencyContact(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return await this.emergencyContactService.deleteByUserId(req.user.id, id);
  }

  @ApiOperation({ summary: "Generate current QR access payload for requesting user" })
  @Get("qr")
  async getQr(@AuthenticatedRequestPayload() req: IAuthenticatedRequest) {
    return await this.emergencyAccessService.getQrForUser(req.user.id);
  }

  @ApiOperation({ summary: "Regenerate emergency access QR for requesting user" })
  @Post("qr/regenerate")
  async regenerateQr(@AuthenticatedRequestPayload() req: IAuthenticatedRequest) {
    return await this.emergencyAccessService.regenerateForUser(req.user.id);
  }

  @ApiOperation({ summary: "Trigger panic alert for requesting user" })
  @Post("panic-alerts")
  async createPanicAlert(
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
    @Body() payload: CreatePanicAlertDto,
  ) {
    return await this.panicAlertService.createForUser(req.user.id, payload);
  }
}

