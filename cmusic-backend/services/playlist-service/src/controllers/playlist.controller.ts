import { Request, Response, NextFunction } from 'express';
import { Playlist, SuccessResponse, NotFoundError, ValidationError, mongoose } from '@spotify/libs';

class PlaylistController {
  // 1. Tạo playlist mới (Mặc định)
  public async createPlaylist(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId; // Sửa từ .id thành .userId
      
      if (!userId) throw new ValidationError('Không tìm thấy thông tin người dùng');

      // Đếm số lượng playlist hiện có để đặt tên mặc định
      const count = await Playlist.countDocuments({ userId });
      
      const playlist = new Playlist({
        name: `Playlist của tôi #${count + 1}`,
        userId,
        tracks: []
      });

      await playlist.save();
      return res.status(201).json(new SuccessResponse('Đã tạo playlist thành công', playlist, 201));
    } catch (error) {
      next(error);
    }
  }

  // 2. Lấy danh sách playlist của tôi
  public async getMyPlaylists(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.user.userId; // Sửa từ .id thành .userId
      const playlists = await Playlist.find({ userId }).sort({ createdAt: -1 });
      return res.json(new SuccessResponse('Lấy danh sách playlist thành công', playlists));
    } catch (error) {
      next(error);
    }
  }

  // 3. Lấy chi tiết một playlist (bao gồm bài hát)
  public async getPlaylistById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const playlist = await Playlist.findById(id)
        .populate({
          path: 'tracks',
          populate: [
            { path: 'artistId', select: 'displayName avatarUrl' },
            { path: 'officialArtistId' }
          ]
        })
        .populate('userId', 'displayName avatarUrl'); // Thêm dòng này

      if (!playlist) throw new NotFoundError('Không tìm thấy playlist');
      
      return res.json(new SuccessResponse('Lấy chi tiết playlist thành công', playlist));
    } catch (error) {
      next(error);
    }
  }

  // 4. Thêm bài hát vào playlist
  public async addTrackToPlaylist(req: any, res: Response, next: NextFunction) {
    try {
      const { playlistId, trackId } = req.body;
      const userId = req.user.userId; // Sửa từ .id thành .userId
      
      const playlist = await Playlist.findOne({ _id: playlistId, userId });
      if (!playlist) throw new NotFoundError('Playlist không tồn tại hoặc bạn không có quyền');

      // Kiểm tra xem bài hát đã có trong playlist chưa
      if (playlist.tracks.includes(trackId)) {
        return res.status(400).json({ success: false, message: 'Bài hát đã có trong playlist này' });
      }

      playlist.tracks.push(trackId);
      await playlist.save();

      return res.json(new SuccessResponse('Đã thêm bài hát vào playlist', playlist));
    } catch (error) {
      next(error);
    }
  }

  // 5. Xóa bài hát khỏi playlist
  public async removeTrackFromPlaylist(req: any, res: Response, next: NextFunction) {
    try {
      const { playlistId, trackId } = req.body;
      const userId = req.user.userId; // Sửa từ .id thành .userId
      
      const playlist = await Playlist.findOne({ _id: playlistId, userId });
      if (!playlist) throw new NotFoundError('Playlist không tồn tại hoặc bạn không có quyền');

      playlist.tracks = playlist.tracks.filter(id => id.toString() !== trackId);
      await playlist.save();

      return res.json(new SuccessResponse('Đã xóa bài hát khỏi playlist', playlist));
    } catch (error) {
      next(error);
    }
  }

  // 6. Cập nhật thông tin playlist
  public async updatePlaylist(req: any, res: Response, next: NextFunction) {
    try {
      console.log('--- UPDATE PLAYLIST ---');
      console.log('Content-Type:', req.headers['content-type']);
      console.log('req.body:', req.body);
      console.log('req.file:', req.file);
      
      const { id } = req.params;
      const { name, description, isPublic } = req.body;
      const userId = req.user.userId;
      
      // Lấy link ảnh từ Cloudinary nếu có upload file mới
      let thumbnail = req.file?.path;
      
      // Nếu không có file mới, thử lấy từ body (nếu nó là string hợp lệ)
      if (!thumbnail && typeof req.body.thumbnail === 'string') {
        thumbnail = req.body.thumbnail;
      }

      // Xây dựng object cập nhật an toàn
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (typeof thumbnail === 'string') updateData.thumbnail = thumbnail;

      const playlist = await Playlist.findOneAndUpdate(
        { _id: id, userId },
        { $set: updateData },
        { new: true }
      );

      if (!playlist) throw new NotFoundError('Không tìm thấy playlist hoặc bạn không có quyền chỉnh sửa');

      return res.json(new SuccessResponse('Cập nhật playlist thành công', playlist));
    } catch (error) {
      next(error);
    }
  }

  // 7. Xóa playlist
  public async deletePlaylist(req: any, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      const playlist = await Playlist.findOneAndDelete({ _id: id, userId });
      
      if (!playlist) throw new NotFoundError('Không tìm thấy playlist hoặc bạn không có quyền xóa');

      return res.json(new SuccessResponse('Đã xóa playlist thành công', null));
    } catch (error) {
      next(error);
    }
  }

  // 8. Lấy danh sách playlist công khai (Dành cho trang chủ)
  public async getPublicPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const playlists = await Playlist.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'displayName avatarUrl');
      
      return res.json(new SuccessResponse('Lấy danh sách playlist công khai thành công', playlists));
    } catch (error) {
      next(error);
    }
  }
}

export const playlistController = new PlaylistController();
