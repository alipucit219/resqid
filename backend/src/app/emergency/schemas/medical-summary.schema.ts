import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ _id: false, versionKey: false })
export class MedicalSummaryEntry {
  @Prop({ default: null })
  id?: string | null;

  @Prop({ default: null })
  hospitalName?: string | null;

  @Prop({ default: null })
  doctorName?: string | null;

  @Prop({ default: null })
  diseaseStartingYear?: number | null;

  @Prop({ default: null })
  treatmentDuration?: string | null;

  @Prop({ default: null })
  treatmentStatus?: string | null;

  @Prop({ type: [String], default: [] })
  currentMedications: string[];

  @Prop({ type: [String], default: [] })
  checkupFiles: string[];

  @Prop({ default: null })
  notes?: string | null;
}

@Schema({
  collection: "medical_summaries",
  timestamps: true,
  versionKey: false,
})
export class MedicalSummary {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: null })
  hospitalName?: string | null;

  @Prop({ default: null })
  doctorName?: string | null;

  @Prop({ default: null })
  diseaseStartingYear?: number | null;

  @Prop({ default: null })
  treatmentDuration?: string | null;

  @Prop({ default: null })
  treatmentStatus?: string | null;

  @Prop({ type: [String], default: [] })
  currentMedications: string[];

  @Prop({ type: [String], default: [] })
  checkupFiles: string[];

  @Prop({ default: null })
  notes?: string | null;

  @Prop({ type: [SchemaFactory.createForClass(MedicalSummaryEntry)], default: [] })
  entries: MedicalSummaryEntry[];
}

export type MedicalSummaryDocument = HydratedDocument<MedicalSummary> & {
  id: string;
};
export const MedicalSummarySchema = SchemaFactory.createForClass(MedicalSummary);

MedicalSummarySchema.virtual("id").get(function () {
  return this._id.toString();
});

MedicalSummarySchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});
