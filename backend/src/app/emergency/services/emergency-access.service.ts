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
    return `resqid://emergency-access/${token}`;
  }

  private toText(value: unknown, fallback: string | null = null) {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  private toList(items: unknown) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
  }

  private formatDate(value: Date | string | null | undefined) {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private mapMedicalProfile(profile: MedicalProfileDocument | null) {
    if (!profile) {
      return null;
    }

    return {
      bloodGroup: this.toText(profile.bloodGroup),
      cnic: this.toText(profile.cnic),
      age: profile.age ?? null,
      address: this.toText(profile.address),
      allergies: this.toList(profile.allergies),
      chronicConditions: this.toList(profile.chronicConditions),
      medications: this.toList(profile.medications),
      pastSurgeries: this.toList(profile.pastSurgeries),
      emergencyNotes: this.toText(profile.emergencyNotes),
      dateOfBirth: this.formatDate(profile.dateOfBirth),
      gender: this.toText(profile.gender),
      updatedAt: this.formatDate((profile as any).updatedAt),
    };
  }

  private mapMedicalSummary(summary: MedicalSummaryDocument | null) {
    if (!summary) {
      return null;
    }

    return {
      hospitalName: this.toText(summary.hospitalName),
      doctorName: this.toText(summary.doctorName),
      diseaseStartingYear: summary.diseaseStartingYear ?? null,
      treatmentDuration: this.toText(summary.treatmentDuration),
      treatmentStatus: this.toText(summary.treatmentStatus),
      checkupFiles: this.toList(summary.checkupFiles),
      currentMedications: this.toList(summary.currentMedications),
      notes: this.toText(summary.notes),
      entries: Array.isArray(summary.entries) ? summary.entries : [],
      updatedAt: this.formatDate((summary as any).updatedAt),
    };
  }

  private mapEmergencyContacts(contacts: EmergencyContactDocument[]) {
    return contacts.map((contact) => ({
      name: this.toText(contact.name, "Unknown contact"),
      phoneNumber: this.toText(contact.phoneNumber),
      email: this.toText(contact.email),
      relationship: this.toText(contact.relationship),
      isPrimary: Boolean(contact.isPrimary),
    }));
  }

  private buildIdentityDetails(
    user: UserDocument,
    medicalProfile: ReturnType<EmergencyAccessService["mapMedicalProfile"]>,
  ) {
    return {
      fullName: this.toText(user.fullName, "Unknown User"),
      email: this.toText(user.email),
      phoneNumber: this.toText(user.phoneNumber),
      cnic: this.toText(medicalProfile?.cnic ?? user.cnic),
      address: this.toText(medicalProfile?.address ?? user.address),
      dateOfBirth: this.formatDate(medicalProfile?.dateOfBirth ?? user.dateOfBirth),
      age: medicalProfile?.age ?? null,
      gender: this.toText(medicalProfile?.gender ?? user.gender),
    };
  }

  private buildProfileHighlights(
    medicalProfile: ReturnType<EmergencyAccessService["mapMedicalProfile"]>,
    medicalSummary: ReturnType<EmergencyAccessService["mapMedicalSummary"]>,
    emergencyContacts: ReturnType<EmergencyAccessService["mapEmergencyContacts"]>,
  ) {
    const primaryEmergencyContact =
      emergencyContacts.find((contact) => contact.isPrimary) || emergencyContacts[0] || null;

    return {
      bloodGroup: this.toText(medicalProfile?.bloodGroup),
      allergies: medicalProfile?.allergies || [],
      chronicConditions: medicalProfile?.chronicConditions || [],
      medications:
        medicalSummary?.currentMedications?.length
          ? medicalSummary.currentMedications
          : medicalProfile?.medications || [],
      emergencyNotes: this.toText(medicalProfile?.emergencyNotes),
      treatmentStatus: this.toText(medicalSummary?.treatmentStatus),
      primaryEmergencyContact,
    };
  }

  private buildQrProfile(
    identityDetails: ReturnType<EmergencyAccessService["buildIdentityDetails"]>,
    medicalProfile: ReturnType<EmergencyAccessService["mapMedicalProfile"]>,
    profileHighlights: ReturnType<EmergencyAccessService["buildProfileHighlights"]>,
  ) {
    return {
      modalTitle: `${identityDetails.fullName || "User"} Emergency Profile`,
      modalSubtitle:
        "Identity details, emergency profile, and profile highlights for emergency responders.",
      sections: [
        {
          key: "identity-details",
          title: "Identity Details",
          items: [
            { label: "Full Name", value: identityDetails.fullName, type: "text" },
            { label: "Email", value: identityDetails.email, type: "text" },
            { label: "Phone Number", value: identityDetails.phoneNumber, type: "text" },
            { label: "CNIC", value: identityDetails.cnic, type: "text" },
            { label: "Address", value: identityDetails.address, type: "text" },
            { label: "Date of Birth", value: identityDetails.dateOfBirth, type: "text" },
            { label: "Age", value: identityDetails.age, type: "number" },
            { label: "Gender", value: identityDetails.gender, type: "text" },
          ],
        },
        {
          key: "emergency-profile",
          title: "Emergency Profile",
          items: [
            { label: "Blood Group", value: medicalProfile?.bloodGroup, type: "text" },
            { label: "Allergies", value: medicalProfile?.allergies || [], type: "list" },
            {
              label: "Chronic Conditions",
              value: medicalProfile?.chronicConditions || [],
              type: "list",
            },
            { label: "Medications", value: medicalProfile?.medications || [], type: "list" },
            {
              label: "Past Surgeries",
              value: medicalProfile?.pastSurgeries || [],
              type: "list",
            },
            {
              label: "Emergency Notes",
              value: medicalProfile?.emergencyNotes,
              type: "text",
            },
          ],
        },
        {
          key: "profile-highlights",
          title: "Profile Highlights",
          items: [
            { label: "Blood Group", value: profileHighlights.bloodGroup, type: "text" },
            { label: "Allergies", value: profileHighlights.allergies, type: "list" },
            {
              label: "Active Medications",
              value: profileHighlights.medications,
              type: "list",
            },
            {
              label: "Treatment Status",
              value: profileHighlights.treatmentStatus,
              type: "text",
            },
            {
              label: "Primary Emergency Contact",
              value: profileHighlights.primaryEmergencyContact
                ? `${profileHighlights.primaryEmergencyContact.name} (${profileHighlights.primaryEmergencyContact.phoneNumber})`
                : null,
              type: "text",
            },
            {
              label: "Emergency Notes",
              value: profileHighlights.emergencyNotes,
              type: "text",
            },
          ],
        },
      ],
    };
  }

  private buildLockScreenPayload(
    user: UserDocument,
    medicalProfile: ReturnType<EmergencyAccessService["mapMedicalProfile"]>,
    emergencyContacts: ReturnType<EmergencyAccessService["mapEmergencyContacts"]>,
  ) {
    return {
      user: {
        id: user._id.toString(),
        fullName: this.toText(user.fullName, "Unknown User"),
      },
      notificationPanel: {
        title: `${this.toText(user.fullName, "User")} Emergency Card`,
        subtitle: "Triple tap to send SOS",
        fields: [
          {
            label: "Address",
            value: this.toText(medicalProfile?.address ?? user.address, "Not set"),
          },
          {
            label: "Blood Group",
            value: this.toText(medicalProfile?.bloodGroup, "Not set"),
          },
          {
            label: "Allergies",
            value:
              medicalProfile?.allergies && medicalProfile.allergies.length > 0
                ? medicalProfile.allergies
                : ["None"],
          },
        ],
      },
      sos: {
        gesture: "triple_tap",
        action: "send_sos",
        method: "POST",
        endpoint: "/me/panic-alerts",
        hasEmergencyContacts: emergencyContacts.length > 0,
        message:
          "Triple tap on the lock-screen emergency card to send an SOS alert to saved emergency contacts.",
      },
      profileUpdatedAt: medicalProfile?.updatedAt || null,
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

  async getLockScreenCardForUser(userId: string) {
    const user = await this.ensureUserExists(userId);
    const [profile, contacts] = await Promise.all([
      this.profileModel.findOne({ userId: this.toObjectId(userId) }).lean(),
      this.contactModel
        .find({ userId: this.toObjectId(userId) })
        .sort({ isPrimary: -1, createdAt: -1 })
        .lean(),
    ]);

    return this.buildLockScreenPayload(
      user,
      this.mapMedicalProfile(profile as MedicalProfileDocument | null),
      this.mapEmergencyContacts(contacts as EmergencyContactDocument[]),
    );
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

    const medicalProfile = this.mapMedicalProfile(
      profile as MedicalProfileDocument | null,
    );
    const medicalSummary = this.mapMedicalSummary(
      summary as MedicalSummaryDocument | null,
    );
    const emergencyContacts = this.mapEmergencyContacts(
      contacts as EmergencyContactDocument[],
    );
    const identityDetails = this.buildIdentityDetails(
      user as UserDocument,
      medicalProfile,
    );
    const profileHighlights = this.buildProfileHighlights(
      medicalProfile,
      medicalSummary,
      emergencyContacts,
    );

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
      },
      identityDetails,
      medicalProfile,
      medicalSummary,
      emergencyContacts,
      profileHighlights,
      qrProfile: this.buildQrProfile(
        identityDetails,
        medicalProfile,
        profileHighlights,
      ),
      generatedAt: tokenRecord.lastGeneratedAt,
    };
  }
}
