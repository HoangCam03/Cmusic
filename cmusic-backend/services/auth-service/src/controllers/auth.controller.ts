import { Request, Response, NextFunction } from 'express';
import { User } from '@spotify/libs/database/schemas/user.schema';
import { AuthError, ConflictError } from '@spotify/libs/errors';
import { SuccessResponse } from '@spotify/libs/response';
import { generateTokens, verifyRefreshToken } from '@spotify/libs/utils/jwt.helper';
import { sendVerificationEmail } from '../services/email.service';

// ─── Helper: Sinh OTP 6 số ────────────────────────────────────────────────────
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class AuthController {
  // 1. Đăng ký tài khoản mới → Gửi OTP về email
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName, avatarUrl, role } = req.body;

      // Kiểm tra email đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.isEmailVerified) {
        throw new ConflictError('Email này đã được sử dụng');
      }

      // Nếu email đã đăng ký nhưng chưa verify → cập nhật lại OTP (cho phép đăng ký lại)
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP hết hạn sau 5 phút

      if (existingUser && !existingUser.isEmailVerified) {
        existingUser.verificationToken = otp;
        existingUser.verificationTokenExpires = otpExpires;
        await existingUser.save();
        sendVerificationEmail(existingUser.email, otp).catch(console.error);
        return res.status(201).json(new SuccessResponse(
          'Mã OTP đã được gửi lại. Vui lòng kiểm tra email!',
          { email: existingUser.email },
          201
        ));
      }

      // Tạo người dùng mới
      const user = new User({
        email, password, displayName, avatarUrl, role,
        isEmailVerified: false,
        verificationToken: otp,
        verificationTokenExpires: otpExpires,
      });
      await user.save();

      // Gửi OTP qua email (không chặn luồng chính)
      sendVerificationEmail(user.email, otp).catch(console.error);

      return res.status(201).json(new SuccessResponse(
        'Đăng ký thành công! Mã OTP đã được gửi tới email của bạn.',
        { email: user.email },
        201
      ));
    } catch (error) {
      next(error);
    }
  }

  // 1.5. Xác thực tài khoản bằng OTP 6 số
  public async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        throw new AuthError('Email và mã OTP là bắt buộc');
      }

      const user = await User.findOne({
        email,
        verificationToken: otp,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AuthError('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại!');
      }

      // Kích hoạt tài khoản
      user.isEmailVerified = true;
      user.verificationToken = undefined;
      user.verificationTokenExpires = undefined;
      await user.save();

      return res.json(new SuccessResponse(
        'Xác thực tài khoản thành công! Bây giờ bạn có thể đăng nhập.',
        { email: user.email }
      ));
    } catch (error) {
      next(error);
    }
  }

  // 1.6. Gửi lại OTP (Resend OTP)
  public async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) throw new AuthError('Email là bắt buộc');

      const user = await User.findOne({ email });
      if (!user) throw new AuthError('Email này chưa được đăng ký');
      if (user.isEmailVerified) throw new ConflictError('Tài khoản này đã được xác thực rồi');

      // Throttle: chỉ cho phép gửi lại sau 60 giây
      if (
        user.verificationTokenExpires &&
        user.verificationTokenExpires.getTime() - Date.now() > 4 * 60 * 1000 // còn hơn 4 phút = mới gửi chưa đến 1 phút
      ) {
        throw new AuthError('Vui lòng chờ 1 phút trước khi gửi lại mã OTP!');
      }

      const otp = generateOTP();
      user.verificationToken = otp;
      user.verificationTokenExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      sendVerificationEmail(user.email, otp).catch(console.error);

      return res.json(new SuccessResponse('Mã OTP mới đã được gửi tới email của bạn!', { email }));
    } catch (error) {
      next(error);
    }
  }

  // 2. Đăng nhập
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) throw new AuthError('Email hoặc mật khẩu không chính xác');

      const isMatch = await user.comparePassword(password);
      if (!isMatch) throw new AuthError('Email hoặc mật khẩu không chính xác');

      // Kiểm tra đã xác thực email chưa
      if (!user.isEmailVerified) {
        throw new AuthError('Tài khoản chưa được xác thực. Vui lòng kiểm tra email!');
      }

      const { accessToken, refreshToken } = generateTokens({
        userId: user._id.toString(),
        role: user.role,
      });

      return res.json(new SuccessResponse('Đăng nhập thành công', {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      }));
    } catch (error) {
      next(error);
    }
  }

  // 3. Làm mới Access Token
  public async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken: oldRefreshToken } = req.body;
      if (!oldRefreshToken) throw new AuthError('Refresh Token không hợp lệ');

      let payload;
      try {
        payload = verifyRefreshToken(oldRefreshToken);
      } catch (err) {
        throw new AuthError('Refresh Token đã hết hạn hoặc không hợp lệ');
      }

      const user = await User.findById(payload.userId);
      if (!user) throw new AuthError('Người dùng không còn tồn tại');

      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        userId: user._id.toString(),
        role: user.role,
      });

      return res.json(new SuccessResponse('Làm mới token thành công', {
        accessToken,
        refreshToken: newRefreshToken,
      }));
    } catch (error) {
      next(error);
    }
  }

  // 4. Đăng xuất
  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      return res.json(new SuccessResponse('Đăng xuất thành công', null));
    } catch (error) {
      next(error);
    }
  }

  // 5. Đổi mật khẩu
  public async changePassword(req: any, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) throw new AuthError('Người dùng không tồn tại');

      // Kiểm tra mật khẩu cũ
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) throw new AuthError('Mật khẩu cũ không chính xác');

      // Cập nhật mật khẩu mới
      user.password = newPassword;
      await user.save();

      return res.json(new SuccessResponse('Đổi mật khẩu thành công', null));
    } catch (error) {
      next(error);
    }
  }
  // 6. Nâng cấp gói cước (Monetization Simulation)
  public async upgradePlan(req: any, res: Response, next: NextFunction) {
    try {
      const { plan } = req.body;
      const userId = req.headers['x-user-id']; // Lấy từ Gateway
      
      if (!userId) throw new AuthError('Vui lòng đăng nhập để thực hiện');
      if (!['student', 'premium', 'family'].includes(plan)) {
        throw new Error('Gói cước không hợp lệ');
      }

      // Mô phỏng việc gia hạn 30 ngày
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = await User.findByIdAndUpdate(
        userId, 
        { plan, premiumExpiresAt: expiryDate }, 
        { new: true }
      ).select('-password');

      return res.json(new SuccessResponse(`Nâng cấp lên gói ${plan.toUpperCase()} thành công!`, user));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
