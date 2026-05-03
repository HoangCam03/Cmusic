import { Request, Response, NextFunction } from 'express';
import { Track, User, Artist, Album, Comment, History, Follow } from '@spotify/libs/database';
import { SuccessResponse } from '@spotify/libs/response';
import mongoose from 'mongoose';
import { NotificationService } from '../services/notification.service';


import { NotFoundError } from '@spotify/libs/errors';

class CatalogController {
  // 1. Lấy danh sách bài hát (Phân trang)
  public async getTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      let query: any = { isDeleted: false };
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      // Filter bài hát của tôi (Dành cho Artist Studio)
      const userId = req.headers['x-user-id'];
      if (req.query.mine === 'true') {
        if (!userId) {
          return res.json(new SuccessResponse('Yêu cầu xác thực để xem nội dung này', {
            tracks: [],
            total: 0
          }));
        }

        // Tìm các hồ sơ nghệ sĩ chính thức mà User này sở hữu
        const myArtistProfiles = await Artist.find({ 
          userId: new mongoose.Types.ObjectId(userId as string) 
        }).select('_id');
        const artistProfileIds = myArtistProfiles.map(p => p._id);

        query.$or = [
          { artistId: new mongoose.Types.ObjectId(userId as string) },
          { officialArtistId: { $in: artistProfileIds } }
        ];
      }

      const tracks = await Track.find(query)
        .populate('artistId', 'displayName avatarUrl')
        .populate('officialArtistId')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      const total = await Track.countDocuments(query);

      // Nếu có search, trả về mảng trực tiếp cho tiện frontend xử lý
      if (search) {
        return res.json(new SuccessResponse('Tìm kiếm bài hát thành công', tracks));
      }

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
      const track = await Track.findById(trackId)
        .populate('artistId', 'displayName avatarUrl')
        .populate({
          path: 'officialArtistId',
          populate: { path: 'userId', select: '_id displayName avatarUrl' }
        })
        .populate('albumId');

      if (!track || track.isDeleted) {
        throw new NotFoundError('Không tìm thấy bài hát');
      }

      return res.json(new SuccessResponse('Lấy thông tin bài hát thành công', track));
    } catch (error) {
      next(error);
    }
  }



  // 2c. Gợi ý bài hát liên quan (Recommended)
  public async getRecommendedTracks(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const currentTrack = await Track.findById(trackId);
      if (!currentTrack) throw new NotFoundError('Không tìm thấy bài hát gốc');

      // 1. Tìm theo thể loại trước
      let tracks = await Track.find({ 
        genre: { $in: currentTrack.genre || [] }, 
        _id: { $ne: trackId },
        isDeleted: false 
      }).limit(5).populate('artistId', 'displayName').populate('officialArtistId');

      // 2. Nếu không thấy bài cùng thể loại, lấy bài mới nhất làm dự phòng
      if (tracks.length === 0) {
        tracks = await Track.find({ 
          _id: { $ne: trackId },
          isDeleted: false 
        }).sort({ createdAt: -1 }).limit(5).populate('artistId', 'displayName').populate('officialArtistId');
      }

      return res.json(new SuccessResponse('Lấy gợi ý thành công', tracks));
    } catch (error) {
      next(error);
    }
  }

  // 3. Tạo bài hát mới (Dành cho Artist - Có upload file)
  public async createTrack(req: any, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id']; // Lấy ID đã được Gateway xác thực và truyền qua Header
      const { title, artist, genre, duration, officialArtistId, albumId } = req.body;
      const files = req.files as { [fieldname: string]: any[] };

      // Lấy link từ Cloudinary đã được multer upload xong
      const audioUrl = files?.['audio']?.[0]?.path; 
      const coverUrl = files?.['cover']?.[0]?.path;

      if (!audioUrl) {
        return res.status(400).json({ success: false, message: "Vui lòng tải lên file bài hát" });
      }

      let linkedArtistIds: any[] = [];
      
      // 1. Lấy ID từ các hồ sơ đã chọn thủ công ở UI (Hỗ trợ cả officialArtistId và officialArtistId[])
      const rawArtistId = req.body.officialArtistId || req.body['officialArtistId[]'];
      if (rawArtistId) {
        linkedArtistIds = (Array.isArray(rawArtistId) ? rawArtistId : [rawArtistId]).map(id => id.toString());
      }

      // 2. SMART LINKER: Bóc tách nghệ sĩ từ tên hiển thị (artist)
      if (artist && artist !== "Unknown Artist") {
        // Tách tên bằng regex hỗ trợ: ft, feat, &, featuring, và dấu phẩy
        const artistNames = artist.split(/\b(?:ft\.?|feat\.?|&|featuring|,)\b/i)
                                  .map((name: string) => name.trim())
                                  .filter((name: string) => name.length > 0);

        for (const name of artistNames) {
           // Tìm nghệ sĩ theo tên (không phân biệt hoa thường)
           let foundArtist = await Artist.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
           
           if (!foundArtist) {
             // Nếu chưa có thì tự tạo mới hồ sơ "Chưa xác minh"
             foundArtist = await Artist.create({ 
               name: name,
               bio: `Hồ sơ tự động cho nghệ sĩ ${name}.`,
               avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
               isVerified: false
             });
           }

           // Nếu ID này chưa có trong danh sách thì thêm vào
           const artistIdStr = foundArtist._id.toString();
           if (!linkedArtistIds.includes(artistIdStr)) {
             linkedArtistIds.push(artistIdStr);
           }
        }
      }

      const track = new Track({
        title,
        artist: artist || "Unknown Artist", 
        genre: Array.isArray(genre) ? genre : [genre],
        duration: parseInt(duration) || 0,
        audioUrl,
        coverUrl,
        artistId: userId,
        albumId: albumId || null,
        officialArtistId: linkedArtistIds
      });

      await track.save();

      return res.status(201).json(new SuccessResponse('Đã tải bài hát lên CMusic thành công!', track, 201));
    } catch (error) {
      next(error);
    }
  }

  // 4. Tăng lượt nghe
  public async incrementPlayCount(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      await Track.findByIdAndUpdate(trackId, { $inc: { playCount: 1 } });
      return res.json(new SuccessResponse('Đã cập nhật lượt nghe', null));
    } catch (error) {
      next(error);
    }
  }

  // 4b. Lấy danh sách bài hát theo Nghệ sĩ (Universal Search: ID Nghệ sĩ hoặc ID User)
  public async getTracksByArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      
      // Kiểm tra định dạng ID hợp lệ trước khi query DB để tránh lỗi CastError
      if (!mongoose.Types.ObjectId.isValid(artistId)) {
         return res.status(400).json({ success: false, message: 'ID Nghệ sĩ không hợp lệ' });
      }

      // 1. Kiểm tra xem artistId này là của Hồ sơ nghệ sĩ chuyên nghiệp hay là của một User
      const artistProfile = await Artist.findById(artistId);
      
      let query: any = {};

      if (artistProfile) {
        // Nếu là ID hồ sơ nghệ sĩ: Tìm theo ID chính thức HOẶC theo tên (fallback cho bài cũ)
        query = {
          $or: [
            { officialArtistId: artistId },
            { artist: new RegExp(`^${artistProfile.name}$`, 'i') }
          ],
          isDeleted: false
        };
      } else {
        // Nếu không phải hồ sơ nghệ sĩ, coi như đó là User ID (Người upload nhạc tự do)
        query = { artistId: artistId, isDeleted: false };
      }

      const tracks = await Track.find(query)
        .populate('artistId', 'displayName avatarUrl')
        .populate('officialArtistId')
        .sort({ playCount: -1 });

      return res.json(new SuccessResponse('Lấy danh sách nhạc thành công', tracks));
    } catch (error) {
      next(error);
    }
  }

  // 5. Cập nhật bài hát (Admin/Artist)

  public async updateTrack(req: any, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const { title, artist, genre, lyrics, artistId, officialArtistId, albumId } = req.body;
      const files = req.files as { [fieldname: string]: any[] };

      let linkedArtistIds: any[] = [];
      
      const rawArtistId = req.body.officialArtistId || req.body['officialArtistId[]'];
      if (rawArtistId) {
        linkedArtistIds = (Array.isArray(rawArtistId) ? rawArtistId : [rawArtistId]).map(id => id.toString());
      }

      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      // Kiểm tra quyền sở hữu bài hát
      const existingTrack = await Track.findById(trackId);
      if (!existingTrack) throw new NotFoundError('Không tìm thấy bài hát để cập nhật');

      if (userRole !== 'admin' && existingTrack.artistId.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa bài hát này' });
      }

      // SMART LINKER cho Update
      if (artist && artist !== "Unknown Artist") {
        const artistNames = artist.split(/\b(?:ft\.?|feat\.?|&|featuring|,)\b/i)
                                  .map((name: string) => name.trim())
                                  .filter((name: string) => name.length > 0);

        for (const name of artistNames) {
           let foundArtist = await Artist.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
           if (!foundArtist) {
             foundArtist = await Artist.create({ 
               name: name,
               bio: `Hồ sơ tự động cho nghệ sĩ ${name}.`,
               avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
               isVerified: false
             });
           }
           const artistIdStr = foundArtist._id.toString();
           if (!linkedArtistIds.includes(artistIdStr)) {
             linkedArtistIds.push(artistIdStr);
           }
        }
      }

      const updateData: any = { 
        title, 
        artist, 
        genre, 
        lyrics, 
        artistId, 
        albumId: albumId || null,
        officialArtistId: linkedArtistIds
      };
      
      // Nếu có upload ảnh bìa mới
      if (files?.['cover']?.[0]?.path) {
        updateData.coverUrl = files['cover'][0].path;
      }

      const track = await Track.findByIdAndUpdate(trackId, updateData, { new: true });
      
      if (!track) throw new NotFoundError('Không tìm thấy bài hát để cập nhật');

      return res.json(new SuccessResponse('Cập nhật bài hát thành công', track));
    } catch (error) {
      next(error);
    }
  }

  // 6. Xóa bài hát (Soft Delete)
  public async deleteTrack(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      // Kiểm tra quyền sở hữu
      const trackToDelete = await Track.findById(trackId);
      if (!trackToDelete) throw new NotFoundError('Không tìm thấy bài hát để xóa');

      if (userRole !== 'admin' && trackToDelete.artistId.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa bài hát này' });
      }

      const track = await Track.findByIdAndUpdate(trackId, { isDeleted: true }, { new: true });
      
      if (!track) throw new NotFoundError('Không tìm thấy bài hát để xóa');

      return res.json(new SuccessResponse('Xóa bài hát thành công (Soft Delete)', null));
    } catch (error) {
      next(error);
    }
  }
  // ─── ARTIST MANAGEMENT ──────────────────────────────────────────────────
  
  // 7. Lấy danh sách nghệ sĩ
  public async getArtists(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const query: any = {};
      
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      // Filter hồ sơ của tôi (Dành cho Artist)
      const userId = req.headers['x-user-id'];
      if (req.query.mine === 'true' && userId) {
        query.userId = userId;
      }
      
      const artists = await Artist.find(query).sort({ name: 1 }).limit(limit);
      return res.json(new SuccessResponse('Lấy danh sách nghệ sĩ thành công', artists));
    } catch (error) {
      next(error);
    }
  }

  // 8. Lấy chi tiết nghệ sĩ
  public async getArtistById(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId).lean();
      if (!artist) throw new NotFoundError('Không tìm thấy nghệ sĩ');

      // Tính tổng lượt nghe thực tế từ tất cả bài hát của nghệ sĩ này
      const tracks = await Track.find({ officialArtistId: artistId, isDeleted: false });
      const totalPlays = tracks.reduce((sum, track) => sum + (track.playCount || 0), 0);
      const totalTracks = tracks.length;

      // Tính toán người nghe hàng tháng (Monthly Listeners - số user duy nhất trong 30 ngày qua)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const trackIds = tracks.map(t => t._id);
      const monthlyListeners = await History.distinct('userId', {
        trackId: { $in: trackIds },
        playedAt: { $gte: thirtyDaysAgo }
      });

      return res.json(new SuccessResponse('Lấy chi tiết nghệ sĩ thành công', {
        ...artist,
        stats: {
          ...artist.stats,
          monthlyListeners: monthlyListeners.length,
          totalPlays,
          totalTracks
        }
      }));
    } catch (error) {
      next(error);
    }
  }

  // 9. Tạo nghệ sĩ mới
  public async createArtist(req: any, res: Response, next: NextFunction) {
    try {
      const { name, bio, facebook, instagram, twitter, youtube, isVerified, userId } = req.body;
      const files = req.files as { [fieldname: string]: any[] };
      
      const artist = new Artist({
        name,
        bio,
        avatarUrl: files?.['avatar']?.[0]?.path || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        bannerUrl: files?.['banner']?.[0]?.path,
        socials: { facebook, instagram, twitter, youtube },
        isVerified: isVerified === 'true',
        userId: userId || null
      });

      await artist.save();
      return res.status(201).json(new SuccessResponse('Thêm nghệ sĩ mới thành công', artist, 201));
    } catch (error) {
      next(error);
    }
  }

  // 10. Cập nhật nghệ sĩ
  public async updateArtist(req: any, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const { name, bio, facebook, instagram, twitter, youtube, isVerified, userId } = req.body;
      const files = req.files as { [fieldname: string]: any[] };

      const updateData: any = { 
        name, 
        bio, 
        isVerified: isVerified === 'true',
        userId: userId || null,
        socials: { facebook, instagram, twitter, youtube }
      };

      if (files?.['avatar']?.[0]?.path) updateData.avatarUrl = files['avatar'][0].path;
      if (files?.['banner']?.[0]?.path) updateData.bannerUrl = files['banner'][0].path;
      
      // Xử lý gallery nếu có upload thêm ảnh
      if (files?.['gallery']) {
        updateData.$push = { gallery: { $each: files['gallery'].map(f => f.path) } };
      }

      const userIdHeader = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      const existingArtist = await Artist.findById(artistId);
      if (!existingArtist) throw new NotFoundError('Không tìm thấy nghệ sĩ để cập nhật');

      // Kiểm tra quyền sở hữu hồ sơ
      if (userRole !== 'admin' && existingArtist.userId?.toString() !== userIdHeader) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa hồ sơ này' });
      }

      const artist = await Artist.findByIdAndUpdate(artistId, updateData, { new: true });
      if (!artist) throw new NotFoundError('Không tìm thấy nghệ sĩ để cập nhật');

      return res.json(new SuccessResponse('Cập nhật nghệ sĩ thành công', artist));
    } catch (error) {
      next(error);
    }
  }

  // 11. Xóa nghệ sĩ
  public async deleteArtist(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const userIdHeader = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      const existingArtist = await Artist.findById(artistId);
      if (!existingArtist) throw new NotFoundError('Không tìm thấy nghệ sĩ để xóa');

      if (userRole !== 'admin' && existingArtist.userId?.toString() !== userIdHeader) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa hồ sơ này' });
      }

      const artist = await Artist.findByIdAndDelete(artistId);
      if (!artist) throw new NotFoundError('Không tìm thấy nghệ sĩ để xóa');
      return res.json(new SuccessResponse('Đã xóa nghệ sĩ khỏi hệ thống', null));
    } catch (error) {
      next(error);
    }
  }

  // ─── ALBUM MANAGEMENT ──────────────────────────────────────────────────
  
  // 12. Lấy danh sách Album
  public async getAlbums(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const albums = await Album.find()
        .populate('artistId', 'displayName')
        .sort({ createdAt: -1 })
        .limit(limit);
      return res.json(new SuccessResponse('Lấy danh sách album thành công', albums));
    } catch (error) {
      next(error);
    }
  }

  // 13. Chi tiết Album (+ Danh sách bài hát)
  public async getAlbumById(req: Request, res: Response, next: NextFunction) {
    try {
      const { albumId } = req.params;
      const album = await Album.findById(albumId)
        .populate('artistId', 'displayName bio avatarUrl')
        .populate({
          path: 'trackIds',
          populate: [
            { path: 'artistId', select: 'displayName' },
            { path: 'officialArtistId' }
          ]
        });

      if (!album) throw new NotFoundError('Không tìm thấy album');

      return res.json(new SuccessResponse('Lấy chi tiết album thành công', album));
    } catch (error) {
      next(error);
    }
  }

  // 14. Tạo Album mới
  public async createAlbum(req: any, res: Response, next: NextFunction) {
    try {
      const { title, artistId, genre, releaseDate, trackIds, description } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      // Lấy path từ file hoặc fallback
      let coverUrl = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500';
      if (files && files['cover'] && files['cover'][0]) {
        coverUrl = files['cover'][0].path;
      }

      const album = new Album({
        title,
        artistId, // UserID của người tạo
        genre: genre ? (Array.isArray(genre) ? genre : [genre]) : ["General"],
        description: description || "",
        trackIds: trackIds ? JSON.parse(trackIds) : [],
        coverUrl,
        releaseDate: releaseDate || new Date()
      });

      await album.save();

      // Cập nhật albumId cho các tracks liên quan
      if (album.trackIds && album.trackIds.length > 0) {
        await Track.updateMany(
          { _id: { $in: album.trackIds } },
          { $set: { albumId: album._id } }
        );
      }

      return res.status(201).json(new SuccessResponse('Tạo album thành công', album, 201));
    } catch (error) {
      next(error);
    }
  }

  // 15. Cập nhật Album
  public async updateAlbum(req: any, res: Response, next: NextFunction) {
    try {
      const { albumId } = req.params;
      const { title, genre, releaseDate, trackIds, description } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (releaseDate) updateData.releaseDate = releaseDate;
      if (genre) updateData.genre = Array.isArray(genre) ? genre : [genre];
      if (trackIds) updateData.trackIds = JSON.parse(trackIds);

      // Nếu có file cover mới thì cập nhật coverUrl
      if (files && files['cover'] && files['cover'][0]) {
        updateData.coverUrl = files['cover'][0].path;
      }

      const album = await Album.findByIdAndUpdate(albumId, { $set: updateData }, { new: true });
      if (!album) throw new NotFoundError('Không tìm thấy album để cập nhật');

      // Đồng bộ albumId cho các tracks
      if (trackIds) {
        // Gỡ albumId cũ của các bài không còn trong album này
        await Track.updateMany({ albumId: album._id }, { $unset: { albumId: "" } });
        // Cập nhật albumId cho các bài hiện tại
        await Track.updateMany(
          { _id: { $in: album.trackIds } },
          { $set: { albumId: album._id } }
        );
      }

      return res.json(new SuccessResponse('Cập nhật album thành công', album));
    } catch (error) {
      next(error);
    }
  }

  // 16. Xóa Album
  public async deleteAlbum(req: Request, res: Response, next: NextFunction) {
    try {
      const { albumId } = req.params;
      const album = await Album.findByIdAndDelete(albumId);
      if (!album) throw new NotFoundError('Không tìm thấy album để xóa');
      
      // Xóa liên kết ở các bài hát
      await Track.updateMany({ albumId: albumId }, { $unset: { albumId: "" } });

      return res.json(new SuccessResponse('Đã xóa album khỏi hệ thống', null));
    } catch (error) {
      next(error);
    }
  }

  // 17. Thêm bình luận
  public async addComment(req: any, res: Response, next: NextFunction) {
    try {
      const { trackId, content, parentId } = req.body;
      const userId = req.headers['x-user-id']; // Lấy từ Gateway

      if (!userId) throw new NotFoundError('Vui lòng đăng nhập để bình luận');
      if (!content) throw new Error('Nội dung bình luận không được để trống');

      const comment = new Comment({
        userId,
        trackId,
        parentId: parentId || null,
        content
      });

      await comment.save();
      
      // Populate thông tin user để frontend hiển thị và gửi thông báo
      const populatedComment = await Comment.findById(comment._id).populate('userId', 'displayName avatarUrl');
      const track = await Track.findById(trackId);
      
      if (populatedComment && track) {
        const senderName = (populatedComment.userId as any).displayName;

        // 1. Thông báo cho người được nhắc tên (@DisplayName)
        const mentionRegex = /@([a-zA-Z0-9_\s]+)/g;
        let match;
        const mentionedNames = new Set<string>();
        while ((match = mentionRegex.exec(content)) !== null) {
          mentionedNames.add(match[1].trim());
        }

        for (const name of mentionedNames) {
          const mentionedUser = await User.findOne({ displayName: name });
          if (mentionedUser && String(mentionedUser._id) !== String(userId)) {
            NotificationService.notifyCommentTag(
              mentionedUser._id.toString(), 
              senderName, 
              track.title, 
              trackId
            ).catch(console.error);
          }
        }

        // 2. Thông báo cho chủ sở hữu bình luận cha (nếu là reply)
        if (parentId) {
          const parentComment = await Comment.findById(parentId);
          if (parentComment && String(parentComment.userId) !== String(userId)) {
            NotificationService.notifyReply(
              parentComment.userId.toString(),
              senderName,
              track.title,
              trackId
            ).catch(console.error);
          }
        }
      }

      return res.status(201).json(new SuccessResponse('Đã thêm bình luận', populatedComment, 201));
    } catch (error) {
      next(error);
    }
  }

  // 18. Lấy danh sách bình luận của bài hát
  public async getCommentsByTrackId(req: Request, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const comments = await Comment.find({ trackId })
        .populate('userId', 'displayName avatarUrl')
        .sort({ createdAt: -1 });

      return res.json(new SuccessResponse('Lấy danh sách bình luận thành công', comments));
    } catch (error) {
      next(error);
    }
  }

  // 19. Xóa bình luận
  public async deleteComment(req: any, res: Response, next: NextFunction) {
    try {
      const { commentId } = req.params;
      const userId = req.headers['x-user-id'];

      const comment = await Comment.findById(commentId);
      if (!comment) throw new NotFoundError('Không tìm thấy bình luận');

      // Cho phép chủ sở hữu bình luận xóa HOẶC Admin xóa
      const userPermissions = (req.headers['x-user-permissions'] as string || '').split(',');
      const isOwner = String(comment.userId) === String(userId);
      const canManage = userPermissions.includes('manage_comments');

      console.log(`[CATALOG] Delete Comment Attempt - ID: ${commentId}, Requester: ${userId}, Owner: ${comment.userId}, isOwner: ${isOwner}, Permissions: ${userPermissions}`);

      if (!isOwner && !canManage) {
        throw new Error(`Bạn không có quyền xóa bình luận này (Requester: ${userId}, Owner: ${comment.userId})`);
      }

      await Comment.findByIdAndDelete(commentId);
      return res.json(new SuccessResponse('Đã xóa bình luận thành công', null));
    } catch (error) {
      next(error);
    }
  }

  // 20. Theo dõi nghệ sĩ
  public async followArtist(req: any, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const userId = req.headers['x-user-id'];

      if (!userId) throw new NotFoundError('Vui lòng đăng nhập để thực hiện');

      // Tạo bản ghi follow
      const follow = await Follow.findOneAndUpdate(
        { followerId: userId, followingId: artistId },
        { followerId: userId, followingId: artistId },
        { upsert: true, new: true }
      );

      // Cập nhật số lượng follower trong hồ sơ nghệ sĩ
      const followerCount = await Follow.countDocuments({ followingId: artistId });
      const artist = await Artist.findByIdAndUpdate(artistId, { 'stats.followerCount': followerCount });

      // Gửi thông báo cho nghệ sĩ (người sở hữu hồ sơ)
      if (artist && artist.userId && String(artist.userId) !== String(userId)) {
        const follower = await User.findById(userId);
        if (follower) {
          NotificationService.notifyFollow(
            artist.userId.toString(),
            follower.displayName,
            userId as string
          ).catch(console.error);
        }
      }

      return res.json(new SuccessResponse('Đã theo dõi nghệ sĩ', follow));
    } catch (error) {
      next(error);
    }
  }

  // 21. Bỏ theo dõi nghệ sĩ
  public async unfollowArtist(req: any, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const userId = req.headers['x-user-id'];

      if (!userId) throw new NotFoundError('Vui lòng đăng nhập để thực hiện');

      await Follow.findOneAndDelete({ followerId: userId, followingId: artistId });

      // Cập nhật số lượng follower
      const followerCount = await Follow.countDocuments({ followingId: artistId });
      await Artist.findByIdAndUpdate(artistId, { 'stats.followerCount': followerCount });

      return res.json(new SuccessResponse('Đã bỏ theo dõi nghệ sĩ', null));
    } catch (error) {
      next(error);
    }
  }

  // 22. Kiểm tra trạng thái theo dõi
  public async checkFollowStatus(req: any, res: Response, next: NextFunction) {
    try {
      const { artistId } = req.params;
      const userId = req.headers['x-user-id'];

      if (!userId) return res.json(new SuccessResponse('Chưa đăng nhập', { isFollowing: false }));

      const follow = await Follow.findOne({ followerId: userId, followingId: artistId });
      return res.json(new SuccessResponse('Lấy trạng thái theo dõi thành công', { isFollowing: !!follow }));
    } catch (error) {
      next(error);
    }
  }
}




export const catalogController = new CatalogController();
