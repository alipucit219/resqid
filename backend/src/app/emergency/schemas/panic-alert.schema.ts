import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum PanicAlertStatus {
  PENDING = "pending",
  SENT = "sent",
  PARTIAL = "partial",
  FAILED = "failed",
  LOGGED_FALLBACK = "logged_fallback",
}

@Schema({
  collection: "panic_alerts",
  timestamps: true,
  versionKey: false,
})
export class PanicAlert {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ default: null })
  message?: string | null;

  @Prop({
    type: String,
    enum: Object.values(PanicAlertStatus),
    default: PanicAlertStatus.PENDING,
    index: true,
  })
  status: PanicAlertStatus;

  @Prop({ default: false })
  fallbackUsed: boolean;
}

export type PanicAlertDocument = HydratedDocument<PanicAlert> & { id: string };
export const PanicAlertSchema = SchemaFactory.createForClass(PanicAlert);

PanicAlertSchema.virtual("id").get(function () {
  return this._id.toString();
});

PanicAlertSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});

