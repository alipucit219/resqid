import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import type { Request } from "express";
import { mkdirSync } from "fs";
import { AuthenticatedRequestPayload } from "src/shared/decorators";
import { IAuthenticatedRequest } from "src/shared/interfaces";
import { ConfigService } from "src/config";
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
    private readonly configService: ConfigService,
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
  @HttpCode(HttpStatus.CREATED)
  @Post("medical-summary/checkup-files")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), "public", "uploads", "checkups");
          mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req: Request, file, cb) => {
          const authenticatedRequest = req as unknown as IAuthenticatedRequest;
          const extension = extname(file.originalname || "").toLowerCase() || ".pdf";
          const safeBaseName = String(file.originalname || "checkup")
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60) || "checkup";
          cb(null, `${authenticatedRequest.user.id}-${Date.now()}-${safeBaseName}${extension}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const isPdf = /\.pdf$/i.test(file.originalname || "") || file.mimetype === "application/pdf";
        cb(isPdf ? null : new Error("Only PDF files are allowed."), isPdf);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadCheckupFile(@UploadedFile() file: Express.Multer.File) {
    const baseUrl = this.configService.getBaseUrl().replace(/\/$/, "");
    const relativePath = `/uploads/checkups/${file.filename}`;

    return {
      fileName: file.originalname,
      storedFileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `${baseUrl}${relativePath}`,
      path: relativePath,
    };
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
