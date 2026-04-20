import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "src/app/user/user.entity";
import { UpsertMedicalProfileDto } from "../dtos";
import {
  MedicalProfile,
  MedicalProfileDocument,
} from "../schemas/medical-profile.schema";
import { EmergencyAdminListQueryDto } from "../dtos/emergency-admin-list-query.dto";

@Injectable()
export class MedicalProfileService {
  constructor(
    @InjectModel(MedicalProfile.name)
    private readonly medicalProfileModel: Model<MedicalProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid user id.");
    }

    return new Types.ObjectId(id);
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
    return await this.medicalProfileModel.findOne({
      userId: this.toObjectId(userId),
    });
  }

  async upsertByUserId(userId: string, payload: UpsertMedicalProfileDto) {
    await this.ensureUserExists(userId);

    return await this.medicalProfileModel.findOneAndUpdate(
      { userId: this.toObjectId(userId) },
      {
        ...payload,
        ...(payload.dateOfBirth !== undefined && {
          dateOfBirth: new Date(payload.dateOfBirth),
        }),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  async adminList(query: EmergencyAdminListQueryDto) {
    const page = Number(query.page ?? 0);
    const limit = Number(query.limit ?? 10);
    const skip = page * limit;

    const profileFilter: any = {};

    if (query.userId) {
      profileFilter.userId = this.toObjectId(query.userId);
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

      profileFilter.userId = {
        $in: users.map((user) => user._id),
      };
    }

    const [data, total] = await Promise.all([
      this.medicalProfileModel
        .find(profileFilter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email role isActive")
        .lean(),
      this.medicalProfileModel.countDocuments(profileFilter),
    ]);

    return {
      data: data.map((item) => ({
        id: item._id.toString(),
        ...item,
        user: item.userId
          ? {
              id:
                (item.userId as any)._id?.toString?.() ||
                (item.userId as any).id,
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

  async adminGetByUserId(userId: string) {
    await this.ensureUserExists(userId);
    const profile = await this.medicalProfileModel
      .findOne({ userId: this.toObjectId(userId) })
      .populate("userId", "fullName email role isActive")
      .lean();

    return {
      id: profile?._id?.toString?.(),
      ...profile,
      user: profile?.userId
        ? {
            id: (profile.userId as any)._id?.toString?.() || (profile.userId as any).id,
            fullName: (profile.userId as any).fullName,
            email: (profile.userId as any).email,
            role: (profile.userId as any).role,
            isActive: (profile.userId as any).isActive,
          }
        : null,
    };
  }
}
