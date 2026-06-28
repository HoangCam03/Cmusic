import { Request, Response, NextFunction } from 'express';
import { Track, Artist, Album, Playlist } from '@spotify/libs/database';
import { SuccessResponse } from '@spotify/libs/response';

export class SearchController {
  
  /**
   * GET /api/search
   * Tìm kiếm phân trang toàn bộ (Tracks, Artists, Albums, Playlists)
   */
  public async searchAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json(new SuccessResponse('Empty search', {
          tracks: [], artists: [], albums: [], playlists: []
        }));
      }

      const query = q.toString().trim();
      const regex = new RegExp(query, 'i');

      const limit = parseInt(req.query.limit as string) || 10;

      // Chạy 4 query song song
      const [tracks, artists, albums, playlists] = await Promise.all([
        Track.find({ 
          $or: [
            { title: regex },
            { genre: regex }
          ]
        }).populate('artistId', 'name avatarUrl').limit(limit).lean(),
        
        Artist.find({ name: regex }).limit(limit).lean(),
        
        Album.find({ title: regex }).populate('artistId', 'name avatarUrl').limit(limit).lean(),
        
        Playlist.find({ 
          name: regex,
          isPublic: true // Chỉ tìm playlist public
        }).populate('userId', 'displayName').limit(limit).lean()
      ]);

      return res.json(new SuccessResponse('Tìm kiếm thành công', {
        tracks,
        artists,
        albums,
        playlists
      }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/suggest
   * Gợi ý nhanh (Autocomplete) - giới hạn 3 kết quả mỗi loại
   */
  public async suggest(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json(new SuccessResponse('Empty search', {
          tracks: [], artists: [], albums: [], playlists: []
        }));
      }

      const query = q.toString().trim();
      const regex = new RegExp(query, 'i');
      const limit = 3;

      const [tracks, artists, albums, playlists] = await Promise.all([
        Track.find({ title: regex }).populate('artistId', 'name').select('title duration coverUrl artistId').limit(limit).lean(),
        Artist.find({ name: regex }).select('name avatarUrl').limit(limit).lean(),
        Album.find({ title: regex }).populate('artistId', 'name').select('title coverUrl artistId').limit(limit).lean(),
        Playlist.find({ name: regex, isPublic: true }).select('name thumbnail').limit(limit).lean()
      ]);

      return res.json(new SuccessResponse('Gợi ý thành công', {
        tracks,
        artists,
        albums,
        playlists
      }));
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
