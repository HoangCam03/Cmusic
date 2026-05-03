import mongoose, { Schema, Document } from 'mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IPlanFeature extends Document {
  /** snake_case unique identifier, e.g. "audio_quality" */
  id: string;
  /** Human-readable Vietnamese label */
  label: string;
  /** Logical grouping shown in the frontend table, e.g. "Streaming" */
  category: string;
  /** Per-plan values. Prefix with "✅ " or "❌ " for boolean-style display */
  limits: {
    free: string;
    student: string;
    premium: string;
    family: string;
  };
  /** Display order within the category */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const PlanFeatureSchema: Schema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    label: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    limits: {
      free:    { type: String, default: '' },
      student: { type: String, default: '' },
      premium: { type: String, default: '' },
      family:  { type: String, default: '' },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const PlanFeature = mongoose.model<IPlanFeature>('PlanFeature', PlanFeatureSchema);
