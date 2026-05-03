import { NextFunction, Request, Response } from 'express';
import { User } from '@spotify/libs/database/schemas/user.schema';
import { Artist } from '@spotify/libs/database/schemas/artist.schema';
import { AuthError } from '@spotify/libs/errors';
import { SuccessResponse } from '@spotify/libs/response';

// Helper type để access req.user sau khi authenticate middleware đã gắn vào
type AuthRequest = Request & { user?: { userId: string; role: string } };

class UserController {
  /**
   * GET /users — Lấy danh sách tất cả người dùng (Admin only)
   */
  public async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, role, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = {};
      if (role) filter.role = role;
      if (search) {
        filter.$or = [
          { displayName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-password -verificationToken -verificationTokenExpires')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        User.countDocuments(filter),
      ]);

      return res.json(new SuccessResponse('Lấy danh sách người dùng thành công', {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/stats — Thống kê người dùng (Admin only)
   */
  public async getUserStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [total, artists, admins, users] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'artist' }),
        User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'user' }),
      ]);

      return res.json(new SuccessResponse('Thống kê người dùng', {
        total,
        artists,
        admins,
        regularUsers: users,
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/:userId — Lấy thông tin một người dùng (Admin only)
   */
  public async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId)
        .select('-password -verificationToken -verificationTokenExpires');
      if (!user) throw new AuthError('Không tìm thấy người dùng');

      return res.json(new SuccessResponse('Lấy thông tin người dùng thành công', { user }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /users/:userId/role — Cập nhật vai trò (Admin only)
   * Body: { role: 'user' | 'artist' | 'admin' }
   */
  public async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const validRoles = ['user', 'artist', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Vai trò không hợp lệ. Chọn một trong: ${validRoles.join(', ')}`,
        });
      }

      // Bảo vệ: Admin không tự hạ quyền mình
      if (req.user?.userId === userId && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Bạn không thể tự giảm quyền Admin của chính mình',
        });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).select('-password');

      if (!user) throw new AuthError('Không tìm thấy người dùng');

      return res.json(new SuccessResponse('Cập nhật vai trò thành công', {
        user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role }
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /users/:userId — Cập nhật thông tin người dùng
   * User tự sửa profile mình OR Admin sửa bất kỳ ai
   */
  public async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { 
        displayName, avatarUrl, dateOfBirth, gender, 
        country, preferences, plan, isEmailVerified 
      } = req.body;

      const isAdmin = req.user?.role === 'admin';
      const isSelf = req.user?.userId === userId;
      if (!isAdmin && !isSelf) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chỉnh sửa người dùng này',
        });
      }

      const user = await User.findById(userId);
      if (!user) throw new AuthError('Không tìm thấy người dùng');

      if (displayName !== undefined) user.displayName = displayName;
      if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (gender !== undefined) user.gender = gender;
      if (country !== undefined) user.country = country;
      if (preferences !== undefined) user.preferences = preferences;
      
      // Update Password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      // Chỉ Admin được đổi gói cước và trạng thái xác thực
      if (plan !== undefined && isAdmin) user.plan = plan;
      if (isEmailVerified !== undefined && isAdmin) user.isEmailVerified = isEmailVerified;

      await user.save();

      // Nếu role là artist, đảm bảo có Artist Profile tương ứng
      if (user.role === 'artist') {
        const existingArtist = await Artist.findOne({ userId: user._id });
        if (!existingArtist) {
          await Artist.create({
            name: user.displayName,
            avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            userId: user._id,
            isVerified: false
          });
        }
      }

      return res.json(new SuccessResponse('Cập nhật thông tin thành công', { 
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          plan: user.plan,
          country: user.country,
          gender: user.gender,
          avatarUrl: user.avatarUrl
        }
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /users/:userId — Xóa người dùng (Admin only)
   */
  public async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (req.user?.userId === userId) {
        return res.status(400).json({
          success: false,
          message: 'Bạn không thể tự xóa tài khoản của mình tại đây',
        });
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) throw new AuthError('Không tìm thấy người dùng');

      return res.json(new SuccessResponse('Xóa người dùng thành công', { deletedId: userId }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST / — Tạo người dùng mới (Admin only)
   */
  public async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, displayName, role } = req.body;

      // 1. Kiểm tra sự tồn tại
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });

      // 2. Tạo User mới (Mật khẩu tự động hash qua Schema pre-save)
      const user = new User({
        email,
        password,
        displayName,
        role: role || 'user',
        isEmailVerified: true // Admin tạo nên mặc định đã xác thực
      });

      await user.save();

      // Tạo Artist Profile nếu role là artist
      if (user.role === 'artist') {
        await Artist.create({
          name: user.displayName,
          avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          userId: user._id,
          isVerified: false
        });
      }

      return res.status(201).json(new SuccessResponse('Tạo người dùng mới thành công', {
        user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role }
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/me — Lấy thông tin bản thân
   */
  public async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.user?.userId)
        .select('-password -verificationToken -verificationTokenExpires');
      if (!user) throw new AuthError('Không tìm thấy người dùng');

      return res.json(new SuccessResponse('Lấy thông tin cá nhân thành công', { user }));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
