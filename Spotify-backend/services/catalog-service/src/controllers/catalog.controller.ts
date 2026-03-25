import { Request, Response, NextFunction } from 'express';
import { Track } from '@libs/database/schemas/track.schema.js';
import { SuccessResponse } from '@libs/response.js';
import { NotFoundError } from '@libs/errors.js';

class CatalogController {
  // 1. Lấy danh sách bài hát (Phân trang)
  public async getTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const tracks = await Track.find({ isDeleted: false })
        .populate('artistId', 'displayName avatarUrl')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await Track.countDocuments({ isDeleted: false });

      return res.json(new SuccessResponse('Lấy danh sách bài hát thành công', {
        tracks,
        total,
        limit,
        offset,
      }));
    } catch (error) {
      next(error);
    }
  }

  // 2. Chi tiết bài hát
  public async getTrackById(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const track = await Track.findById(trackId).populate('artistId', 'displayName avatarUrl');

      if (!track || track.isDeleted) {
        throw new NotFoundError('Không tìm thấy bài hát');
      }

      return res.json(new SuccessResponse('Lấy thông tin bài hát thành công', track));
    } catch (error) {
      next(error);
    }
  }

  // 3. Tạo bài hát mới (Dành cho Artist)
  public async createTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id']; // Lấy từ Gateway sau khi verify token
      const { title, duration, audioUrl, coverUrl, genre } = req.body;

      const track = new Track({
        title,
        duration,
        audioUrl,
        coverUrl,
        genre,
        artistId: userId,
      });

      await track.save();

      return res.status(201).json(new SuccessResponse('Thêm bài hát mới thành công', track, 201));
    } catch (error) {
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
