import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'artist' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ['user', 'artist', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

// Mã hóa mật khẩu trước khi lưu
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Phương thức so khớp mật khẩu
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password as string);
};

export const User = mongoose.model<IUser>('User', UserSchema);
