import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as AppRootPath from "app-root-path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { basename, extname, join, parse } from "path";
import { User, UserDocument } from "src/app/user/user.entity";
import { EmergencyAdminListQueryDto, UpsertMedicalSummaryDto } from "../dtos";
import {
  MedicalSummary,
  MedicalSummaryDocument,
} from "../schemas/medical-summary.schema";

const CHECKUP_FILES_DIRECTORY = join(
  AppRootPath.path,
  "storage",
  "medical-summary",
  "checkup-files",
);
const LEGACY_CHECKUP_FILES_DIRECTORY = join(
  AppRootPath.path,
  "uploads",
  "checkups",
);

type AdminListResponse = {
  data: Array<Record<string, unknown>>;
  total: number;
};

@Injectable()
export class MedicalSummaryService {
  constructor(
    @InjectModel(MedicalSummary.name)
    private readonly medicalSummaryModel: Model<MedicalSummaryDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid user id.");
    }

    return new Types.ObjectId(id);
  }

  private async ensureCheckupFilesDirectoryExists() {
    await fs.mkdir(CHECKUP_FILES_DIRECTORY, { recursive: true });
  }

  private buildStoredCheckupFileName(originalFileName?: string) {
    const parsedFileName = parse(originalFileName || "checkup-file.pdf");
    const sanitizedBaseName = (parsedFileName.name || "checkup-file")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    const baseName = sanitizedBaseName || "checkup-file";
    const extension = extname(parsedFileName.base || "").toLowerCase() || ".pdf";
    const uniqueSuffix = randomUUID().split("-")[0];

    return `${baseName}-${uniqueSuffix}${extension}`;
  }

  private normalizeRequestedCheckupFileName(fileName: string) {
    const normalizedFileName = String(fileName || "").trim();

    if (!normalizedFileName) {
      throw new BadRequestException("Checkup file name is required.");
    }

    if (basename(normalizedFileName) !== normalizedFileName) {
      throw new BadRequestException("Invalid checkup file name.");
    }

    if (extname(normalizedFileName).toLowerCase() !== ".pdf") {
      throw new BadRequestException("Only .pdf checkup files are supported.");
    }

    return normalizedFileName;
  }

  private getCheckupFileNameFromValue(value?: string | null) {
    return basename(String(value || "").trim());
  }

  private async resolveExistingCheckupFilePath(fileName: string) {
    const candidatePaths = [
      join(CHECKUP_FILES_DIRECTORY, fileName),
      join(LEGACY_CHECKUP_FILES_DIRECTORY, fileName),
    ];

    for (const absolutePath of candidatePaths) {
      try {
        await fs.access(absolutePath);
        return absolutePath;
      } catch {
        continue;
      }
    }

    throw new NotFoundException("Checkup file not found.");
  }

  private normalizeEntry(entry: any, fallbackId?: string) {
    return {
      id: String(entry?.id || fallbackId || "").trim() || null,
      hospitalName: entry?.hospitalName || null,
      doctorName: entry?.doctorName || null,
      diseaseStartingYear:
        entry?.diseaseStartingYear !== undefined && entry?.diseaseStartingYear !== null
          ? Number(entry.diseaseStartingYear)
          : null,
      treatmentDuration: entry?.treatmentDuration || null,
      treatmentStatus: entry?.treatmentStatus || null,
      checkupFiles: Array.isArray(entry?.checkupFiles) ? entry.checkupFiles : [],
      currentMedications: Array.isArray(entry?.currentMedications)
        ? entry.currentMedications
        : [],
      notes: entry?.notes || null,
    };
  }

  private buildEntries(summary: any) {
    const rawEntries = Array.isArray(summary?.entries) ? summary.entries : [];
    if (rawEntries.length > 0) {
      return rawEntries.map((entry: any, index: number) =>
        this.normalizeEntry(entry, `summary-${index + 1}`),
      );
    }

    const hasLegacySummary = Boolean(
      summary?.hospitalName ||
        summary?.doctorName ||
        summary?.diseaseStartingYear ||
        summary?.treatmentDuration ||
        summary?.treatmentStatus ||
        summary?.notes ||
        (Array.isArray(summary?.checkupFiles) && summary.checkupFiles.length > 0) ||
        (Array.isArray(summary?.currentMedications) &&
          summary.currentMedications.length > 0),
    );

    return hasLegacySummary ? [this.normalizeEntry(summary, "summary-1")] : [];
  }

  private normalizeSummary(summary: any) {
    if (!summary) return summary;
    const entries = this.buildEntries(summary);
    const primary = entries[0] || null;

    return {
      ...summary,
      entries,
      hospitalName: primary?.hospitalName || null,
      doctorName: primary?.doctorName || null,
      diseaseStartingYear: primary?.diseaseStartingYear ?? null,
      treatmentDuration: primary?.treatmentDuration || null,
      treatmentStatus: primary?.treatmentStatus || null,
      checkupFiles: primary?.checkupFiles || [],
      currentMedications: primary?.currentMedications || [],
      notes: primary?.notes || null,
    };
  }

  private async ensureUserExists(userId: string) {
    const user = await this.userModel.findOne({
      _id: this.toObjectId(userId),
      deletedAt: null,
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  async getByUserId(userId: string) {
    await this.ensureUserExists(userId);
    const summary = await this.medicalSummaryModel.findOne({
      userId: this.toObjectId(userId),
    });
    return this.normalizeSummary(summary?.toJSON?.() || summary);
  }

  async upsertByUserId(userId: string, payload: UpsertMedicalSummaryDto) {
    await this.ensureUserExists(userId);

    const normalizedEntries = Array.isArray(payload.entries)
      ? payload.entries.map((entry, index) =>
          this.normalizeEntry(entry, entry?.id || `summary-${index + 1}`),
        )
      : [];
    const primary = normalizedEntries[0] || this.normalizeEntry(payload, "summary-1");

    const summary = await this.medicalSummaryModel.findOneAndUpdate(
      { userId: this.toObjectId(userId) },
      {
        ...payload,
        entries: normalizedEntries,
        hospitalName: primary.hospitalName,
        doctorName: primary.doctorName,
        diseaseStartingYear: primary.diseaseStartingYear,
        treatmentDuration: primary.treatmentDuration,
        treatmentStatus: primary.treatmentStatus,
        checkupFiles: primary.checkupFiles,
        currentMedications: primary.currentMedications,
        notes: primary.notes,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return this.normalizeSummary(summary?.toJSON?.() || summary);
  }

  async uploadCheckupFile(userId: string, file: Express.Multer.File) {
    await this.ensureUserExists(userId);

    if (!file?.buffer?.length) {
      throw new BadRequestException("A PDF file is required.");
    }

    await this.ensureCheckupFilesDirectoryExists();

    const storedFileName = this.buildStoredCheckupFileName(file.originalname);
    const absolutePath = join(CHECKUP_FILES_DIRECTORY, storedFileName);

    await fs.writeFile(absolutePath, file.buffer);

    return {
      checkupFile: storedFileName,
      fileName: storedFileName,
      originalFileName: file.originalname,
    };
  }

  async getOwnedCheckupFileDownload(userId: string, fileName: string) {
    await this.ensureUserExists(userId);

    const normalizedFileName = this.normalizeRequestedCheckupFileName(fileName);
    const summary = await this.medicalSummaryModel
      .findOne({ userId: this.toObjectId(userId) })
      .lean();

    if (!summary) {
      throw new NotFoundException("Medical summary not found.");
    }

    const hasAccessToFile = (summary.checkupFiles || []).some(
      (value) => this.getCheckupFileNameFromValue(value) === normalizedFileName,
    );

    if (!hasAccessToFile) {
      throw new NotFoundException("Checkup file not found.");
    }

    const absolutePath = await this.resolveExistingCheckupFilePath(
      normalizedFileName,
    );

    return {
      absolutePath,
      fileName: normalizedFileName,
    };
  }

  async adminList(query: EmergencyAdminListQueryDto): Promise<AdminListResponse> {
    const page = Number(query.page ?? 0);
    const limit = Number(query.limit ?? 10);
    const skip = page * limit;

    const summaryFilter: any = {};

    if (query.userId) {
      summaryFilter.userId = this.toObjectId(query.userId);
    }

    if (query.search) {
      const users = await this.userModel
        .find({
          deletedAt: null,
          $or: [
            { fullName: { $regex: query.search, $options: "i" } },
            { email: { $regex: query.search, $options: "i" } },
          ],
        })
        .select("_id")
        .lean();

      summaryFilter.userId = {
        $in: users.map((user) => user._id),
      };
    }

    const [data, total] = await Promise.all([
      this.medicalSummaryModel
        .find(summaryFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email role isActive")
        .lean(),
      this.medicalSummaryModel.countDocuments(summaryFilter),
    ]);

    return {
      data: data.map((item) => ({
        id: item._id.toString(),
        ...item,
        user: item.userId
          ? {
              id: (item.userId as any)._id?.toString?.() || (item.userId as any).id,
              fullName: (item.userId as any).fullName,
              email: (item.userId as any).email,
              role: (item.userId as any).role,
              isActive: (item.userId as any).isActive,
            }
          : null,
      })),
      total,
    };
  }
}
