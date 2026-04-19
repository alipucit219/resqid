import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MILLISECONDS_IN_A_DAY } from "src/constants/milliseconds-in-a-day.constant";
import { LoginSession, LoginSessionDocument } from "../entities/login-session.entity";

type CreateLoginSessionPayload = {
  userId: string;
  isAuthenticated?: boolean;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class LoginSessionService {
  constructor(
    @InjectModel(LoginSession.name)
    private readonly sessionModel: Model<LoginSessionDocument>,
  ) {}

  private toObjectId(id: string) {
    return new Types.ObjectId(id);
  }

  async create(payload: CreateLoginSessionPayload) {
    return await this.sessionModel.create({
      userId: this.toObjectId(payload.userId),
      isAuthenticated: payload.isAuthenticated ?? true,
      ipAddress: payload.ipAddress || null,
      userAgent: payload.userAgent || null,
    });
  }

  async findByIdAndUser(sessionId: string, userId: string) {
    return await this.sessionModel.findOne({
      _id: this.toObjectId(sessionId),
      userId: this.toObjectId(userId),
    });
  }

  async deleteSession(id: string): Promise<{ acknowledged: boolean; deletedCount: number }> {
    return await this.sessionModel.deleteOne({ _id: this.toObjectId(id) });
  }

  async deleteOtherSessions(userId: string, currentSessionId: string) {
    const response = await this.sessionModel.deleteMany({
      userId: this.toObjectId(userId),
      _id: { $ne: this.toObjectId(currentSessionId) },
    });

    return response.deletedCount ?? 0;
  }

  async deleteExpiredSessions() {
    const today = new Date();
    const MILLISECONDS_IN_A_THIRTY_DAYS = MILLISECONDS_IN_A_DAY * 30;
    const tokensExpectedTimeToLive = new Date(
      today.getTime() - MILLISECONDS_IN_A_THIRTY_DAYS,
    );

    const response = await this.sessionModel.deleteMany({
      createdAt: { $lt: tokensExpectedTimeToLive },
    });

    return response.deletedCount ?? 0;
  }
}
