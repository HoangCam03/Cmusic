import { Request, Response, NextFunction } from 'express';
import { Like, Track } from '@spotify/libs/database';
import { SuccessResponse } from '@spotify/libs/response';

class LikesController {
  // 1. Thích bài hát
  public async likeTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const userId = req.headers['x-user-id'];

      if (!userId) throw new Error('User not authenticated');

      const existingLike = await Like.findOne({ userId, trackId });
      if (existingLike) {
        return res.json(new SuccessResponse('Bạn đã thích bài hát này rồi', existingLike));
      }

      const like = new Like({ userId, trackId });
      await like.save();

      return res.status(201).json(new SuccessResponse('Đã thêm vào danh sách yêu thích', like, 201));
    } catch (error) {
      next(error);
    }
  }

  // 2. Bỏ thích bài hát
  public async unlikeTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const userId = req.headers['x-user-id'];

      await Like.findOneAndDelete({ userId, trackId });

      return res.json(new SuccessResponse('Đã xóa khỏi danh sách yêu thích', null));
    } catch (error) {
      next(error);
    }
  }

  // 3. Lấy danh sách bài hát đã thích
  public async getLikedTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'];
      
      const likes = await Like.find({ userId })
        .populate({
          path: 'trackId',
          populate: [
            { path: 'artistId', select: 'displayName avatarUrl' },
            { path: 'officialArtistId', select: 'name avatarUrl' }
          ]
        })
        .sort({ createdAt: -1 });

      const tracks = likes.map(l => l.trackId).filter(t => t != null);

      return res.json(new SuccessResponse('Lấy danh sách bài hát đã thích thành công', tracks));
    } catch (error) {
      next(error);
    }
  }

  // 4. Kiểm tra xem bài hát có được thích chưa
  public async checkLiked(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const userId = req.headers['x-user-id'];

      if (!userId) return res.json(new SuccessResponse('Chưa đăng nhập', { liked: false }));

      const like = await Like.findOne({ userId, trackId });
      return res.json(new SuccessResponse('Kiểm tra trạng thái thích', { liked: !!like }));
    } catch (error) {
      next(error);
    }
  }
}

export const likesController = new LikesController();
