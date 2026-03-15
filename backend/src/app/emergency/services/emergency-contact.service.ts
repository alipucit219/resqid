import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "src/app/user/user.entity";
import {
  CreateEmergencyContactDto,
  EmergencyAdminListQueryDto,
  UpdateEmergencyContactDto,
} from "../dtos";
import {
  EmergencyContact,
  EmergencyContactDocument,
} from "../schemas/emergency-contact.schema";

@Injectable()
export class EmergencyContactService {
  constructor(
    @InjectModel(EmergencyContact.name)
    private readonly emergencyContactModel: Model<EmergencyContactDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid id.");
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
  }

  async listByUserId(userId: string) {
    await this.ensureUserExists(userId);
    return await this.emergencyContactModel
      .find({
        userId: this.toObjectId(userId),
      })
      .sort({ isPrimary: -1, createdAt: -1 });
  }

  async createByUserId(userId: string, payload: CreateEmergencyContactDto) {
    await this.ensureUserExists(userId);

    if (payload.isPrimary) {
      await this.emergencyContactModel.updateMany(
        { userId: this.toObjectId(userId) },
        { isPrimary: false },
      );
    }

    return await this.emergencyContactModel.create({
      userId: this.toObjectId(userId),
      ...payload,
    });
  }

  async updateByUserId(
    userId: string,
    contactId: string,
    payload: UpdateEmergencyContactDto,
  ) {
    await this.ensureUserExists(userId);

    if (payload.isPrimary) {
      await this.emergencyContactModel.updateMany(
        { userId: this.toObjectId(userId) },
        { isPrimary: false },
      );
    }

    const updated = await this.emergencyContactModel.findOneAndUpdate(
      {
        _id: this.toObjectId(contactId),
        userId: this.toObjectId(userId),
      },
      payload,
      {
        new: true,
      },
    );

    if (!updated) {
      throw new NotFoundException("Emergency contact not found.");
    }

    return updated;
  }

  async deleteByUserId(userId: string, contactId: string) {
    await this.ensureUserExists(userId);

    const deleted = await this.emergencyContactModel.findOneAndDelete({
      _id: this.toObjectId(contactId),
      userId: this.toObjectId(userId),
    });

    if (!deleted) {
      throw new NotFoundException("Emergency contact not found.");
    }

    return { message: "Emergency contact deleted successfully." };
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

      filter.$or = [
        {
          userId: { $in: users.map((user) => user._id) },
        },
        { name: { $regex: query.search, $options: "i" } },
        { phoneNumber: { $regex: query.search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.emergencyContactModel
        .find(filter)
        .sort({ isPrimary: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email role isActive")
        .lean(),
      this.emergencyContactModel.countDocuments(filter),
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
