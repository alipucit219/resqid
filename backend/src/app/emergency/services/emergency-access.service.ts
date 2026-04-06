import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { randomBytes, createHash } from "crypto";
import * as QRCode from "qrcode";
import { ConfigService } from "src/config";
import { User, UserDocument } from "src/app/user/user.entity";
import {
  EmergencyAccessToken,
  EmergencyAccessTokenDocument,
} from "../schemas/emergency-access-token.schema";
import {
  MedicalProfile,
  MedicalProfileDocument,
} from "../schemas/medical-profile.schema";
import {
  MedicalSummary,
  MedicalSummaryDocument,
} from "../schemas/medical-summary.schema";
import {
  EmergencyContact,
  EmergencyContactDocument,
} from "../schemas/emergency-contact.schema";
import { EmergencyAdminListQueryDto } from "../dtos";

@Injectable()
export class EmergencyAccessService {
  constructor(
    @InjectModel(EmergencyAccessToken.name)
    private readonly tokenModel: Model<EmergencyAccessTokenDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(MedicalProfile.name)
    private readonly profileModel: Model<MedicalProfileDocument>,
    @InjectModel(MedicalSummary.name)
    private readonly summaryModel: Model<MedicalSummaryDocument>,
    @InjectModel(EmergencyContact.name)
    private readonly contactModel: Model<EmergencyContactDocument>,
    private readonly configService: ConfigService,
  ) {}

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid id.");
    }
    return new Types.ObjectId(id);
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private buildEmergencyUrl(token: string) {
    const base = this.configService.getBaseUrl().replace(/\/$/, "");
    const apiPrefix = this.configService.getGlobalAPIPrefix();
    return `${base}/${apiPrefix}/emergency-access/${token}`;
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

  async regenerateForUser(userId: string) {
    await this.ensureUserExists(userId);

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const generatedAt = new Date();

    await this.tokenModel.findOneAndUpdate(
      { userId: this.toObjectId(userId) },
      {
        userId: this.toObjectId(userId),
        tokenHash,
        lastGeneratedAt: generatedAt,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const emergencyUrl = this.buildEmergencyUrl(rawToken);
    const qrCodeDataUrl = await QRCode.toDataURL(emergencyUrl);

    return {
      token: rawToken,
      emergencyUrl,
      qrCodeDataUrl,
      generatedAt,
    };
  }

  async getQrForUser(userId: string) {
    await this.ensureUserExists(userId);

    const existingToken = await this.tokenModel
      .findOne({ userId: this.toObjectId(userId) })
      .lean();

    if (!existingToken) {
      return await this.regenerateForUser(userId);
    }

    // Plain token is never stored in DB and is only returned at generation time.
    return {
      token: null,
      emergencyUrl: null,
      qrCodeDataUrl: null,
      generatedAt: existingToken.lastGeneratedAt,
      hasActiveToken: true,
      message: "QR token already exists. Use regenerate to rotate and fetch a new plain token.",
    };
  }

  async adminList(query: EmergencyAdminListQueryDto) {
    const page = Number(query.page ?? 0);
    const limit = Number(query.limit ?? 10);
    const skip = page * limit;

    const filter: any = {};

    if (query.userId) {
      filter.userId = this.toObjectId(query.userId);
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

      filter.userId = {
        $in: users.map((user) => user._id),
      };
    }

    const [data, total] = await Promise.all([
      this.tokenModel
        .find(filter)
        .sort({ lastGeneratedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email role isActive")
        .lean(),
      this.tokenModel.countDocuments(filter),
    ]);

    return {
      data: data.map((item) => ({
        id: item._id.toString(),
        user: item.userId
          ? {
              id: (item.userId as any)._id?.toString?.() || (item.userId as any).id,
              fullName: (item.userId as any).fullName,
              email: (item.userId as any).email,
              role: (item.userId as any).role,
              isActive: (item.userId as any).isActive,
            }
          : null,
        lastGeneratedAt: item.lastGeneratedAt,
      })),
      total,
    };
  }

  async resolvePublicToken(token: string) {
    const tokenHash = this.hashToken(token);
    const tokenRecord = await this.tokenModel.findOne({ tokenHash }).lean();

    if (!tokenRecord) {
      throw new NotFoundException("Emergency access token is invalid.");
    }

    const user = await this.userModel
      .findOne({
        _id: tokenRecord.userId,
        deletedAt: null,
      })
      .lean();

    if (!user) {
      throw new NotFoundException("User was not found for this emergency token.");
    }

    const [profile, summary, contacts] = await Promise.all([
      this.profileModel.findOne({ userId: tokenRecord.userId }).lean(),
      this.summaryModel.findOne({ userId: tokenRecord.userId }).lean(),
      this.contactModel
        .find({ userId: tokenRecord.userId })
        .sort({ isPrimary: -1, createdAt: -1 })
        .lean(),
    ]);

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
      },
      medicalProfile: profile
        ? {
            bloodGroup: profile.bloodGroup || null,
            cnic: profile.cnic || null,
            age: profile.age ?? null,
            address: profile.address || null,
            allergies: profile.allergies || [],
            chronicConditions: profile.chronicConditions || [],
            medications: profile.medications || [],
            pastSurgeries: profile.pastSurgeries || [],
            emergencyNotes: profile.emergencyNotes || null,
            dateOfBirth: profile.dateOfBirth || null,
            gender: profile.gender || null,
          }
        : null,
      medicalSummary: summary
        ? {
            hospitalName: summary.hospitalName || null,
            doctorName: summary.doctorName || null,
            diseaseStartingYear: summary.diseaseStartingYear ?? null,
            treatmentDuration: summary.treatmentDuration || null,
            treatmentStatus: summary.treatmentStatus || null,
            checkupFiles: summary.checkupFiles || [],
            currentMedications: summary.currentMedications || [],
            notes: summary.notes || null,
          }
        : null,
      emergencyContacts: contacts.map((contact) => ({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email || null,
        relationship: contact.relationship || null,
        isPrimary: Boolean(contact.isPrimary),
      })),
      generatedAt: tokenRecord.lastGeneratedAt,
    };
  }
}
