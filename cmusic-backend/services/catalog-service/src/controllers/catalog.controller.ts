import { Request, Response, NextFunction } from 'express';
import { Track } from '@spotify/libs/database/schemas/track.schema';
import { SuccessResponse } from '@spotify/libs/response';
import { NotFoundError } from '@spotify/libs/errors';

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

  // 3. Tạo bài hát mới (Dành cho Artist - Có upload file)
  public async createTrack(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id']; // Gateway verify token -> x-user-id
      const { title, genre, duration } = req.body;
      const files = req.files as { [fieldname: string]: any[] };

      // Lấy link từ Cloudinary đã được multer upload xong
      const audioUrl = files?.['audio']?.[0]?.path; 
      const coverUrl = files?.['cover']?.[0]?.path;

      if (!audioUrl) {
        return res.status(400).json({ success: false, message: "Vui lòng tải lên file bài hát" });
      }

      const track = new Track({
        title,
        genre,
        duration: parseInt(duration) || 0,
        audioUrl,
        coverUrl,
        artistId: userId,
      });

      await track.save();

      return res.status(201).json(new SuccessResponse('Đã tải bài hát lên CMusic thành công!', track, 201));
    } catch (error) {
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
