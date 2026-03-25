import { Request, Response, NextFunction } from 'express';
import { User } from '@libs/database/schemas/user.schema.js';
import { AuthError, ConflictError } from '@libs/errors.js';
import { SuccessResponse } from '@libs/response.js';
import { generateTokens, verifyRefreshToken } from '@libs/utils/jwt.helper.js';

class AuthController {
  // 1. Đăng ký tài khoản mới
  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName, avatarUrl, role } = req.body;

      // Kiểm tra người dùng đã tồn tại chưa
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ConflictError('Email này đã được sử dụng');
      }

      // Tạo người dùng mới
      const user = new User({ email, password, displayName, avatarUrl, role });
      await user.save();

      // Tạo tokens
      const { accessToken, refreshToken } = generateTokens({
        userId: user._id.toString(),
        role: user.role,
      });

      // Trả về response thành công
      return res.status(201).json(new SuccessResponse('Đăng ký tài khoản thành công', {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        accessToken,
        refreshToken,
      }, 201));
    } catch (error) {
      next(error);
    }
  }

  // 2. Đăng nhập
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Tìm người dùng
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthError('Email hoặc mật khẩu không chính xác');
      }

      // Kiểm tra mật khẩu
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AuthError('Email hoặc mật khẩu không chính xác');
      }

      // Tạo tokens
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

  // 3. Làm mới Access Token (Token Refresh)
  public async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken: oldRefreshToken } = req.body;
      if (!oldRefreshToken) {
        throw new AuthError('Refresh Token không hợp lệ');
      }

      // Xác thực token cũ
      let payload;
      try {
        payload = verifyRefreshToken(oldRefreshToken);
      } catch (err) {
        throw new AuthError('Refresh Token đã hết hạn hoặc không hợp lệ');
      }

      // Kiểm tra người dùng còn tồn tại không
      const user = await User.findById(payload.userId);
      if (!user) {
        throw new AuthError('Người dùng không còn tồn tại');
      }

      // Tạo cặp tokens mới (Rotation)
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

  // 4. Đăng xuất (Có thể mở rộng để blacklist token trong Redis)
  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Ở đây ta đơn giản là trả về success, client sẽ xóa token khỏi localStorage/cookie
      return res.json(new SuccessResponse('Đăng xuất thành công', null));
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
