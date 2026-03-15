import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "src/app/user/user.entity";
import { EmergencyAdminListQueryDto, UpsertMedicalSummaryDto } from "../dtos";
import {
  MedicalSummary,
  MedicalSummaryDocument,
} from "../schemas/medical-summary.schema";

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
    return await this.medicalSummaryModel.findOne({
      userId: this.toObjectId(userId),
    });
  }

  async upsertByUserId(userId: string, payload: UpsertMedicalSummaryDto) {
    await this.ensureUserExists(userId);

    return await this.medicalSummaryModel.findOneAndUpdate(
      { userId: this.toObjectId(userId) },
      payload,
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
