import mongoose, { Schema, Document } from 'mongoose';
export { mongoose };

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermCategory =
  | 'listening'
  | 'content'
  | 'users'
  | 'admin'
  | 'system'
  | 'social';

export interface IPermission extends Document {
  /** snake_case unique identifier, e.g. "upload_track" */
  id: string;
  /** Human-readable Vietnamese label */
  label: string;
  /** Short description of what this permission controls */
  description: string;
  /** Logical grouping for the frontend UI */
  category: PermCategory;
  guard: string;
  /** Role-level access flags */
  roles: {
    admin: boolean;
    artist: boolean;
    user: boolean;
  };
  /** Display order within the category */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const PermissionSchema: Schema = new Schema(
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
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['listening', 'content', 'users', 'admin', 'system', 'social'],
      required: true,
    },
    guard: { type: String, default: 'public' },
    roles: {
      admin:  { type: Boolean, default: true },
      artist: { type: Boolean, default: false },
      user:   { type: Boolean, default: false },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
