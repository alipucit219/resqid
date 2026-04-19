import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "src/app/user/user.entity";
import { EmailService } from "src/shared/services";
import {
  CreatePanicAlertDto,
  EmergencyAdminListQueryDto,
} from "../dtos";
import { SmsGatewayService } from "./sms-gateway.service";
import {
  PanicAlert,
  PanicAlertDocument,
  PanicAlertStatus,
} from "../schemas/panic-alert.schema";
import {
  PanicAlertDispatch,
  PanicAlertDispatchDocument,
  PanicAlertDispatchStatus,
} from "../schemas/panic-alert-dispatch.schema";
import {
  EmergencyContact,
  EmergencyContactDocument,
} from "../schemas/emergency-contact.schema";

@Injectable()
export class PanicAlertService {
  constructor(
    @InjectModel(PanicAlert.name)
    private readonly panicAlertModel: Model<PanicAlertDocument>,
    @InjectModel(PanicAlertDispatch.name)
    private readonly panicAlertDispatchModel: Model<PanicAlertDispatchDocument>,
    @InjectModel(EmergencyContact.name)
    private readonly emergencyContactModel: Model<EmergencyContactDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly smsGatewayService: SmsGatewayService,
    private readonly emailService: EmailService,
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
    return user;
  }

  private getFinalAlertStatus(statuses: PanicAlertDispatchStatus[]) {
    if (statuses.length === 0) {
      return PanicAlertStatus.LOGGED_FALLBACK;
    }

    if (statuses.every((status) => status === PanicAlertDispatchStatus.SENT)) {
      return PanicAlertStatus.SENT;
    }

    if (
      statuses.every(
        (status) => status === PanicAlertDispatchStatus.LOGGED_FALLBACK,
      )
    ) {
      return PanicAlertStatus.LOGGED_FALLBACK;
    }

    if (statuses.includes(PanicAlertDispatchStatus.SENT)) {
      return PanicAlertStatus.PARTIAL;
    }

    return PanicAlertStatus.FAILED;
  }

  private async sendEmailAlert(contact: EmergencyContactDocument, message: string) {
    if (!contact.email) return null;

    try {
      const result = await this.emailService.sendMail({
        to: contact.email,
        subject: "Emergency Alert - ResQID",
        text: message,
      });

      if (result.delivered) {
        return {
          status: PanicAlertDispatchStatus.SENT,
          providerResponse: "Email sent",
          errorMessage: null,
        };
      }

      return {
        status: PanicAlertDispatchStatus.LOGGED_FALLBACK,
        providerResponse: "Email fallback logged",
        errorMessage: null,
      };
    } catch (error) {
      return {
        status: PanicAlertDispatchStatus.FAILED,
        providerResponse: null,
        errorMessage: error instanceof Error ? error.message : "Email dispatch failed.",
      };
    }
  }

  async createForUser(userId: string, payload: CreatePanicAlertDto) {
    const user = await this.ensureUserExists(userId);
    const contacts = await this.emergencyContactModel
      .find({
        userId: this.toObjectId(userId),
      })
      .sort({ isPrimary: -1, createdAt: -1 });

    const panicAlert = await this.panicAlertModel.create({
      userId: this.toObjectId(userId),
      latitude: payload.latitude,
      longitude: payload.longitude,
      message: payload.message || null,
      status: PanicAlertStatus.PENDING,
      fallbackUsed: false,
    });

    if (contacts.length === 0) {
      panicAlert.status = PanicAlertStatus.LOGGED_FALLBACK;
      panicAlert.fallbackUsed = true;
      await panicAlert.save();

      return {
        data: panicAlert,
        warning:
          "No emergency contacts were found. Alert was saved with fallback status.",
      };
    }

    const composedMessage =
      payload.message ||
      `Emergency alert from ${user.fullName}. Location: https://maps.google.com/?q=${payload.latitude},${payload.longitude}`;

    const dispatchesPayload: Partial<PanicAlertDispatch>[] = [];
    const statuses: PanicAlertDispatchStatus[] = [];

    for (const contact of contacts) {
      const result = await this.smsGatewayService.sendSms({
        to: contact.phoneNumber,
        message: composedMessage,
      });

      statuses.push(result.status);
      dispatchesPayload.push({
        panicAlertId: this.toObjectId(panicAlert.id),
        contactName: contact.name,
        phoneNumber: contact.phoneNumber,
        status: result.status,
        providerResponse: result.providerResponse || null,
        errorMessage: result.errorMessage || null,
      });

      const emailResult = await this.sendEmailAlert(contact, composedMessage);
      if (emailResult) {
        statuses.push(emailResult.status);
        dispatchesPayload.push({
          panicAlertId: this.toObjectId(panicAlert.id),
          contactName: `${contact.name} (email)`,
          phoneNumber: contact.email!,
          status: emailResult.status,
          providerResponse: emailResult.providerResponse,
          errorMessage: emailResult.errorMessage,
        });
      }
    }

    if (dispatchesPayload.length > 0) {
      await this.panicAlertDispatchModel.insertMany(dispatchesPayload);
    }

    const finalStatus = this.getFinalAlertStatus(statuses);
    panicAlert.status = finalStatus;
    panicAlert.fallbackUsed = statuses.every(
      (status) => status === PanicAlertDispatchStatus.LOGGED_FALLBACK,
    );
    await panicAlert.save();

    return {
      data: panicAlert,
      warning:
        panicAlert.fallbackUsed === true
          ? "SMS provider fallback was used."
          : undefined,
    };
  }

  async adminList(query: EmergencyAdminListQueryDto): Promise<any> {
    const page = Number(query.page ?? 0);
    const limit = Number(query.limit ?? 10);
    const skip = page * limit;

    const filter: any = {};

    if (query.userId) {
      filter.userId = this.toObjectId(query.userId);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      const createdAt: Record<string, Date> = {};

      if (query.fromDate) {
        createdAt.$gte = new Date(query.fromDate);
      }

      if (query.toDate) {
        const toDate = new Date(query.toDate);

        // If the caller passes YYYY-MM-DD, include the full day.
        if (!query.toDate.includes("T")) {
          toDate.setHours(23, 59, 59, 999);
        }

        createdAt.$lte = toDate;
      }

      filter.createdAt = createdAt;
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
      filter.userId = { $in: users.map((user) => user._id) };
    }

    const [data, total] = await Promise.all([
      this.panicAlertModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email role isActive")
        .lean(),
      this.panicAlertModel.countDocuments(filter),
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

  async adminDetail(alertId: string): Promise<any> {
    const alert = await this.panicAlertModel
      .findOne({
        _id: this.toObjectId(alertId),
      })
      .populate("userId", "fullName email role isActive")
      .lean();

    if (!alert) {
      throw new NotFoundException("Panic alert not found.");
    }

    const dispatches = await this.panicAlertDispatchModel
      .find({
        panicAlertId: this.toObjectId(alertId),
      })
      .sort({ createdAt: -1 })
      .lean();

    return {
      ...alert,
      user: alert.userId
        ? {
            id: (alert.userId as any)._id?.toString?.() || (alert.userId as any).id,
            fullName: (alert.userId as any).fullName,
            email: (alert.userId as any).email,
            role: (alert.userId as any).role,
            isActive: (alert.userId as any).isActive,
          }
        : null,
      dispatches: dispatches.map((dispatch) => ({
        ...dispatch,
        id: dispatch._id.toString(),
      })),
    };
  }
}
