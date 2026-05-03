import { Request, Response, NextFunction } from 'express';
import { History, Track, User, mongoose } from '@spotify/libs/database';
import { SuccessResponse } from '@spotify/libs/response';

class HistoryController {
  // 1. Ghi lại một lượt nghe
  public async recordPlay(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.body;
      const userId = req.headers['x-user-id'];

      if (!userId || !trackId) {
        return res.status(400).json({ success: false, message: 'Thiếu userId hoặc trackId' });
      }

      // Lưu vào lịch sử
      const history = new History({
        userId,
        trackId,
        playedAt: new Date()
      });

      await history.save();

      // Tăng playCount của bài hát tương ứng trong Catalog
      await Track.findByIdAndUpdate(trackId, { $inc: { playCount: 1 } });

      return res.status(201).json(new SuccessResponse('Đã ghi lại lịch sử nghe nhạc', history, 201));
    } catch (error) {
      next(error);
    }
  }

  // 2. Lấy danh sách bài hát vừa nghe (Recently Played)
  public async getRecentlyPlayed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'];
      const limit = parseInt(req.query.limit as string) || 20;

      const history = await History.find({ userId })
        .sort({ playedAt: -1 })
        .limit(limit)
        .populate({
          path: 'trackId',
          populate: [
            { path: 'artistId', select: 'displayName' },
            { path: 'officialArtistId', select: 'name avatarUrl' }
          ]
        });

      // Lọc bỏ các bài hát bị xóa hoặc không tồn tại, và lấy bản ghi duy nhất (unique tracks) nếu cần
      // Ở đây ta cứ lấy theo thứ tự thời gian, trùng lặp cũng được (như Spotify)
      const tracks = history.map(h => h.trackId).filter(t => t != null);

      return res.json(new SuccessResponse('Lấy lịch sử nghe nhạc thành công', tracks));
    } catch (error) {
      next(error);
    }
  }

  // 3. Thống kê cá nhân (Top Tracks, Top Artists)
  public async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) throw new Error('User not authenticated');

      // Top 5 bài hát nghe nhiều nhất
      const topTracks = await History.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId as string) } },
        { $group: { _id: '$trackId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'tracks',
            localField: '_id',
            foreignField: '_id',
            as: 'trackDetails'
          }
        },
        { $unwind: '$trackDetails' }
      ]);

      return res.json(new SuccessResponse('Lấy thống kê thành công', { topTracks }));
    } catch (error) {
      next(error);
    }
  }

  // 4. Thống kê tổng quan (Dành cho Admin)
  public async getGlobalStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [totalUsers, totalTracks, totalHistory] = await Promise.all([
        User.countDocuments(),
        Track.countDocuments({ isDeleted: false }),
        History.countDocuments()
      ]);

      return res.json(new SuccessResponse('Lấy thống kê tổng quan thành công', {
        totalUsers,
        totalTracks,
        totalPlays: totalHistory,
        growth: "+12.5%" // Placeholder cho growth logic
      }));
    } catch (error) {
      next(error);
    }
  }

  // 5. Thống kê dành cho Nghệ sĩ (Studio)
  public async getArtistStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) throw new Error('User not authenticated');

      // Tìm tất cả các track ID thuộc về artist này (Casting userId to ObjectId)
      const myTracks = await Track.find({ artistId: new mongoose.Types.ObjectId(userId as string) }).select('_id');
      const trackIds = myTracks.map(t => t._id);

      if (trackIds.length === 0) {
        return res.json(new SuccessResponse('Chưa có dữ liệu', {
          performance: [],
          topFans: []
        }));
      }

      // A. Thống kê hiệu suất 7 ngày qua
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const performanceData = await History.aggregate([
        { 
          $match: { 
            trackId: { $in: trackIds },
            playedAt: { $gte: sevenDaysAgo }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$playedAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // B. Top Fans (Người nghe nhiều nhất các bài của tôi)
      const topFans = await History.aggregate([
        { $match: { trackId: { $in: trackIds } } },
        { $group: { _id: '$userId', plays: { $sum: 1 } } },
        { $sort: { plays: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userDetails'
          }
        },
        { $unwind: '$userDetails' },
        {
          $project: {
            name: '$userDetails.displayName',
            avatar: '$userDetails.avatarUrl',
            plays: 1,
            userId: '$_id'
          }
        }
      ]);

      return res.json(new SuccessResponse('Lấy thống kê nghệ sĩ thành công', {
        performance: performanceData,
        topFans
      }));
    } catch (error) {
      next(error);
    }
  }
}

export const historyController = new HistoryController();
