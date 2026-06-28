import { NextFunction, Request, Response } from 'express';
import { User } from '@spotify/libs/database/schemas/user.schema';
import { Artist } from '@spotify/libs/database/schemas/artist.schema';
import { ArtistRequest } from '@spotify/libs/database/schemas/artist-request.schema';
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
        displayName, dateOfBirth, gender, 
        country, preferences, plan, isEmailVerified 
      } = req.body;
      
      let avatarUrl = req.body.avatarUrl;
      // Nếu có file upload lên, dùng url của file đó
      if (req.file) {
        avatarUrl = req.file.path;
      }

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
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Vui lòng sử dụng tính năng Đổi Mật Khẩu chuyên dụng để thực hiện.',
          });
        }
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

  /**
   * POST /users/artist-request — Gửi yêu cầu đăng ký nghệ sĩ
   */
  public async submitArtistRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { stageName, bio, socialLinks, reason } = req.body;
      const userId = req.user?.userId;

      // Check if user already has a pending request
      const existingRequest = await ArtistRequest.findOne({ userId, status: 'pending' });
      if (existingRequest) {
        return res.status(400).json({ success: false, message: 'Bạn đã có một yêu cầu đang chờ duyệt' });
      }

      // Check if user is already an artist
      const user = await User.findById(userId);
      if (user?.role === 'artist') {
        return res.status(400).json({ success: false, message: 'Bạn đã là nghệ sĩ' });
      }

      const request = new ArtistRequest({
        userId,
        stageName,
        bio,
        socialLinks,
        reason
      });

      await request.save();

      return res.status(201).json(new SuccessResponse('Gửi yêu cầu đăng ký nghệ sĩ thành công', { request }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/artist-request/me — Lấy thông tin yêu cầu hiện tại của user
   */
  public async getMyArtistRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await ArtistRequest.findOne({ userId: req.user?.userId }).sort({ createdAt: -1 });
      
      return res.json(new SuccessResponse('Lấy yêu cầu thành công', { request }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /users/artist-requests — Lấy danh sách yêu cầu đăng ký nghệ sĩ (Admin only)
   */
  public async getArtistRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const filter: any = {};
      if (status) filter.status = status;

      const requests = await ArtistRequest.find(filter)
        .populate('userId', 'email displayName avatarUrl')
        .sort({ createdAt: -1 });

      return res.json(new SuccessResponse('Lấy danh sách yêu cầu thành công', { requests }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /users/artist-requests/:id — Duyệt hoặc từ chối yêu cầu (Admin only)
   */
  public async updateArtistRequestStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'approved' | 'rejected'

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }

      const request = await ArtistRequest.findById(id).populate('userId');
      if (!request) {
        throw new AuthError('Không tìm thấy yêu cầu');
      }

      request.status = status;
      await request.save();

      if (status === 'approved') {
        const user = await User.findById(request.userId);
        if (user && user.role !== 'artist') {
          user.role = 'artist';
          await user.save();

          // Create artist profile
          const existingArtist = await Artist.findOne({ userId: user._id });
          if (!existingArtist) {
            await Artist.create({
              name: request.stageName || user.displayName,
              avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
              bio: request.bio,
              socials: request.socialLinks,
              userId: user._id,
              isVerified: false
            });
          }
        }
      }

      return res.json(new SuccessResponse(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu`, { request }));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
