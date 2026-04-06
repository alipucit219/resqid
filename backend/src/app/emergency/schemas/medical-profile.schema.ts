import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({
  collection: "medical_profiles",
  timestamps: true,
  versionKey: false,
})
export class MedicalProfile {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: null })
  bloodGroup?: string | null;

  @Prop({ default: null })
  cnic?: string | null;

  @Prop({ default: null })
  age?: number | null;

  @Prop({ default: null })
  address?: string | null;

  @Prop({ type: [String], default: [] })
  allergies: string[];

  @Prop({ type: [String], default: [] })
  chronicConditions: string[];

  @Prop({ type: [String], default: [] })
  medications: string[];

  @Prop({ type: [String], default: [] })
  pastSurgeries: string[];

  @Prop({ default: null })
  emergencyNotes?: string | null;

  @Prop({ default: null })
  dateOfBirth?: Date | null;

  @Prop({ default: null })
  gender?: string | null;
}

export type MedicalProfileDocument = HydratedDocument<MedicalProfile> & {
  id: string;
};
export const MedicalProfileSchema = SchemaFactory.createForClass(MedicalProfile);

MedicalProfileSchema.virtual("id").get(function () {
  return this._id.toString();
});

MedicalProfileSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});

