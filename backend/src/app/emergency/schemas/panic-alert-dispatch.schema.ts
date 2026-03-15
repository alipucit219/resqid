import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export enum PanicAlertDispatchStatus {
  SENT = "sent",
  FAILED = "failed",
  LOGGED_FALLBACK = "logged_fallback",
}

@Schema({
  collection: "panic_alert_dispatches",
  timestamps: true,
  versionKey: false,
})
export class PanicAlertDispatch {
  @Prop({ type: Types.ObjectId, ref: "PanicAlert", required: true, index: true })
  panicAlertId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  contactName: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({
    type: String,
    enum: Object.values(PanicAlertDispatchStatus),
    required: true,
  })
  status: PanicAlertDispatchStatus;

  @Prop({ default: null })
  providerResponse?: string | null;

  @Prop({ default: null })
  errorMessage?: string | null;
}

export type PanicAlertDispatchDocument = HydratedDocument<PanicAlertDispatch> & {
  id: string;
};
export const PanicAlertDispatchSchema =
  SchemaFactory.createForClass(PanicAlertDispatch);

PanicAlertDispatchSchema.virtual("id").get(function () {
  return this._id.toString();
});

PanicAlertDispatchSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});

