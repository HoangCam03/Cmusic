import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  email: string;
  password?: string;
  displayName: string;
  avatarUrl?: string;
  role: 'user' | 'artist' | 'admin';
  bio?: string;
  followerCount?: number;
  monthlyListeners?: number;
  
  // Authentication Nâng cao
  authProvider: 'local' | 'google' | 'facebook' | 'apple';
  providerId?: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  lastLogin?: Date;
  
  // Thông tin Cá nhân hóa
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  country?: string;
  
  // Gói cước (Monetization)
  plan: 'free' | 'student' | 'premium' | 'family';
  premiumExpiresAt?: Date;
  
  // Cấu hình (Preferences)
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String }, // Không bắt buộc nữa để hỗ trợ Đăng nhập Google/Apple
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ['user', 'artist', 'admin'], default: 'user' },
    bio: { type: String },
    followerCount: { type: Number, default: 0 },
    monthlyListeners: { type: Number, default: 0 },
    
    // Authentication Nâng cao
    authProvider: { type: String, enum: ['local', 'google', 'facebook', 'apple'], default: 'local' },
    providerId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    lastLogin: { type: Date },
    
    // Thông tin Cá nhân hóa
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    country: { type: String, default: 'VN' }, // Mặc định là Việt Nam
    
    // Gói cước (Monetization)
    plan: { type: String, enum: ['free', 'student', 'premium', 'family'], default: 'free' },
    premiumExpiresAt: { type: Date },
    
    // Cấu hình (Preferences)
    preferences: {
      language: { type: String, default: 'vi' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
      emailNotifications: { type: Boolean, default: true }
    }
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
