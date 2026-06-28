import { Request, Response, NextFunction } from 'express';
import { Track, User, Artist, Album, Comment, History, Follow } from '@spotify/libs/database';
import { SuccessResponse } from '@spotify/libs/response';
import mongoose from 'mongoose';
import { NotificationService } from '../services/notification.service';


import { NotFoundError } from '@spotify/libs/errors';

const interpolateTimestamps = (lyricsArr: any[]) => {
  // BƯỚC 1: Xử lý các dòng có start = -1
  for (let i = 0; i < lyricsArr.length; i++) {
    if (lyricsArr[i].start === -1) {
      // Tìm mốc thời gian hợp lệ gần nhất phía sau
      let nextValidIndex = -1;
      for (let j = i + 1; j < lyricsArr.length; j++) {
        if (lyricsArr[j].start !== -1) {
          nextValidIndex = j;
          break;
        }
      }

      if (nextValidIndex !== -1) {
        // Có mốc phía sau -> Lùi dần về trước (mỗi câu giả định 2.5s)
        const nextTime = lyricsArr[nextValidIndex].start;
        const count = nextValidIndex - i;
        const step = 2.5;
        // Đảm bảo không bị âm
        let startTime = Math.max(0, nextTime - count * step);
        const actualStep = (nextTime - startTime) / count;
        
        for (let k = i; k < nextValidIndex; k++) {
          lyricsArr[k].start = parseFloat((startTime + (k - i) * actualStep).toFixed(2));
          lyricsArr[k].end = parseFloat((startTime + (k - i + 1) * actualStep).toFixed(2));
        }
        i = nextValidIndex - 1; // Bỏ qua các dòng đã xử lý
      } else {
        // Không có mốc phía sau -> Dựa vào mốc phía trước để cộng dồn
        let prevValidTime = 0;
        if (i > 0 && lyricsArr[i - 1].end !== -1) {
          prevValidTime = lyricsArr[i - 1].end;
        }
        lyricsArr[i].start = prevValidTime;
        lyricsArr[i].end = prevValidTime + 2.5;
      }
    }
  }

  // BƯỚC 2: Rải đều các dòng có start trùng nhau (chống lỗi AI gán nhiều dòng cùng 1 mốc tgian)
  let i = 0;
  while (i < lyricsArr.length) {
    let j = i + 1;
    while (j < lyricsArr.length && lyricsArr[j].start === lyricsArr[i].start) j++;
    const count = j - i;
    if (count > 1) {
      const start = lyricsArr[i].start;
      let end = lyricsArr[j - 1].end;
      if (!end || end <= start) end = j < lyricsArr.length ? lyricsArr[j].start : start + count * 2;
      const step = (end - start) / count;
      for (let k = 0; k < count; k++) {
        lyricsArr[i + k].start = parseFloat((start + k * step).toFixed(2));
        lyricsArr[i + k].end = parseFloat((start + (k + 1) * step).toFixed(2));
      }
    }
    i = j;
  }
  return lyricsArr;
};

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

  // 1b.  Smart Playlist Engine — Tự động tạo Playlist từ nhạc hiện có trong hệ thống
  public async getRecommendedPlaylists(req: Request, res: Response, next: NextFunction) {
    try {
      // Bước 1: Lấy tất cả genres đang có nhạc thật (không xóa)
      const allGenres: string[] = await Track.distinct('genre', { isDeleted: false });
      const validGenres = allGenres.filter(g => g && g.trim() !== '' && g !== 'null');

      // Bước 2: Với mỗi genre, tạo Playlist ảo thông minh
      const smartPlaylists = await Promise.all(
        validGenres.slice(0, 8).map(async (genreName) => {
          // Lấy bài hát trong genre này, sắp xếp theo lượt nghe giảm dần (phổ biến nhất lên đầu)
          const tracks = await Track.find({ genre: genreName, isDeleted: false })
            .sort({ playCount: -1, createdAt: -1 })
            .limit(20)
            .select('_id title artist coverUrl playCount');

          if (tracks.length === 0) return null;

          // Chọn ảnh bìa từ bài hát phổ biến nhất hoặc mới nhất
          const coverTrack = tracks[0];

          // Tự động tạo tên & mô tả theo thể loại (kiểu "AI")
          const nameMap: Record<string, { name: string; desc: string }> = {
            'K-Pop': { name: 'K-Pop Daily Mix', desc: 'Năng lượng bùng nổ từ Hàn Quốc' },
            'V-Pop': { name: 'V-Pop Chill Mix', desc: 'Nhạc Việt hay nhất hôm nay' },
            'US-UK': { name: 'Global Hits Mix', desc: 'Top nhạc quốc tế đang hot' },
            'Rap': { name: 'Rap Zone Mix', desc: 'Flow chuẩn, lyric sắc bén' },
            'Lo-Fi': { name: 'Lofi Study Mix', desc: 'Tập trung hơn với lo-fi beats' },
            'R&B': { name: 'R&B Vibes Mix', desc: 'Giai điệu soul, cảm xúc đỉnh cao' },
            'EDM': { name: 'EDM Drop Mix', desc: 'Drop mạnh, năng lượng cực đại' },
            'Ballad': { name: 'Ballad Đêm Khuya', desc: 'Những giai điệu chạm đến trái tim' },
            'Acoustic': { name: 'Acoustic Corner', desc: 'Mộc mạc, giản dị, chân thật' },
            'World Music': { name: 'World Music Mix', desc: 'Âm nhạc từ khắp nơi trên thế giới' },
          };

          const preset = nameMap[genreName];
          const playlistName = preset?.name ?? `${genreName} Mix`;
          const description = preset?.desc ?? `Tuyển chọn ${tracks.length} bài hát ${genreName} dành riêng cho bạn`;

          return {
            _id: `smart-${genreName.toLowerCase().replace(/\s+/g, '-')}`,
            name: playlistName,
            description: description,
            thumbnail: coverTrack.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
            trackCount: tracks.length,
            isPublic: true,
            isSmart: true,
            genre: genreName,
            userId: {
              displayName: 'CMusic',
              avatarUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100'
            }
          };
        })
      );

      // Lọc bỏ genre không có nhạc
      const result = smartPlaylists.filter(Boolean);
      return res.json(new SuccessResponse('Lấy playlist thông minh thành công', result));
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
        const artistNames = artist.split(/ft\.?|feat\.?|&|featuring|,|x/i)
          .map((name: string) => name.trim())
          .filter((name: string) => name.length > 0);

        for (const name of artistNames) {
          // Tìm nghệ sĩ theo tên (Chuẩn hóa để tránh trùng lặp)
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
          // Chỉ thêm nếu ID này chưa tồn tại trong danh sách (Tránh lặp Rosé)
          if (!linkedArtistIds.includes(artistIdStr)) {
            linkedArtistIds.push(artistIdStr);
          }
        }
      }

      // 1. Lấy mảng thể loại (Hỗ trợ cả genre và genre[])
      const rawGenre = req.body.genre || req.body['genre[]'];
      const genreArray = (Array.isArray(rawGenre) ? rawGenre : (rawGenre ? [rawGenre] : []))
        .filter(g => g && g !== 'null' && g !== 'undefined');

      const track = new Track({
        title,
        artist: artist || "Unknown Artist",
        genre: genreArray,
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

      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;

      // Kiểm tra quyền sở hữu bài hát
      const existingTrack = await Track.findById(trackId).populate('officialArtistId');
      if (!existingTrack) throw new NotFoundError('Không tìm thấy bài hát để cập nhật');

      // Lấy ID người đã upload (artistId)
      const ownerId = (existingTrack.artistId as any)?._id?.toString() || existingTrack.artistId?.toString();

      // Kiểm tra xem user hiện tại có phải là nghệ sĩ chính thức của bài không
      // (tức là có hồ sơ Artist được liên kết với userId này)
      const officialArtists = (existingTrack.officialArtistId as any[]) || [];
      const isLinkedArtist = officialArtists.some(
        (a: any) => a?.userId?.toString() === userId
      );

      const userPermissions = (req.headers['x-user-permissions'] as string || '').split(',');
      const isSuperAdmin = userRole === 'admin' || userRole === 'ADMIN';
      const hasCatalogPerm = userPermissions.includes('manage_catalog') || userPermissions.includes('manage_tracks');
      const canEdit = isSuperAdmin || hasCatalogPerm || ownerId === userId || isLinkedArtist;

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền chỉnh sửa bài hát này'
        });
      }

      // SMART LINKER cho Update
      if (artist && artist !== "Unknown Artist") {
        // Tách tên linh hoạt hơn: ft, feat, &, x, dấu phẩy
        const artistNames = artist.split(/ft\.?|feat\.?|&|featuring|,|x/i)
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
          // Chỉ thêm nếu ID này chưa tồn tại trong danh sách (Tránh lặp Rosé)
          if (!linkedArtistIds.includes(artistIdStr)) {
            linkedArtistIds.push(artistIdStr);
          }
        }
      }

      // Lấy mảng thể loại (Hỗ trợ cả genre và genre[])
      const rawGenre = req.body.genre || req.body['genre[]'];
      const genreArray = (Array.isArray(rawGenre) ? rawGenre : (rawGenre ? [rawGenre] : []))
        .filter(g => g && g !== 'null' && g !== 'undefined');

      const updateData: any = {
        title,
        artist,
        genre: genreArray,
        lyrics,
        artistId,
        albumId: albumId || null,
        officialArtistId: linkedArtistIds
      };

      if (req.body.syncedLyrics) {
        updateData.syncedLyrics = req.body.syncedLyrics;
      } else if (req.body.lyrics && req.body.lyrics.includes('[00:')) {
        // Nếu truyền LRC thuần nhưng không có syncedLyrics, tự động parse
        updateData.syncedLyrics = [];
      } else if (
        req.body.lyrics &&
        req.body.lyrics !== existingTrack.lyrics &&
        existingTrack.syncedLyrics &&
        existingTrack.syncedLyrics.length > 0 &&
        !req.body.lyrics.includes('[00:')
      ) {
        console.log(`[AI] Phát hiện thay đổi lời bài hát từ người dùng. Kích hoạt Llama 3 để đồng bộ mốc thời gian...`);
        try {
          const userLines = req.body.lyrics.split('\n').filter((l: string) => l.trim() !== '');
          const fullTemplate = userLines.map((text: string) => ({ start: -1, end: -1, text }));
          const oldSegments = existingTrack.syncedLyrics.map((s: any) => ({ start: s.start, end: s.end, text: s.text }));

          const callGroqUpdate = async (body: object): Promise<any> => {
            let lastError = '';
            for (let attempt = 1; attempt <= 3; attempt++) {
              const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
              });

              if (res.ok) return res.json();

              const errBody = await res.text();
              lastError = `HTTP ${res.status}: ${errBody}`;
              console.error(`[AI] Groq API lỗi lần ${attempt}/3: ${lastError}`);

              if (res.status === 429) {
                const waitMs = attempt * 5000;
                await new Promise(resolve => setTimeout(resolve, waitMs));
              } else {
                break;
              }
            }
            throw new Error(`Groq API thất bại: ${lastError}`);
          };

          const CHUNK_SIZE = 25;
          const chunks: typeof fullTemplate[] = [];
          for (let i = 0; i < fullTemplate.length; i += CHUNK_SIZE) {
            chunks.push(fullTemplate.slice(i, i + CHUNK_SIZE));
          }

          const allAlignedLines: any[] = [];
          for (let ci = 0; ci < chunks.length; ci++) {
            const chunk = chunks[ci];

            const prompt = `You are an expert audio syncing tool.
Your ONLY task is to fill in the "start" and "end" timestamps in the provided JSON array using data from the old synced segments.

CRITICAL RULES:
1. You MUST return the JSON array EXACTLY as provided, with the same "text" fields. DO NOT change, merge, split, or delete any "text".
2. Find the corresponding text in the old segments and fill in the "start" and "end" fields.
3. If the user's line is missing from the old segments (e.g. intro), leave "start" and "end" as -1. We will calculate them mathematically later.
4. If the user added more words to a line, map it to the EARLIEST 'start' time of the old segments that match it.

JSON Template to fill in (DO NOT modify "text"):
${JSON.stringify(chunk, null, 2)}

Old synced segments (use these for timestamps):
${JSON.stringify(oldSegments)}

Return ONLY a JSON object in this format:
{
  "lyrics": [
    { "start": number, "end": number, "text": "exact line from template" }
  ]
}
Do not include markdown or explanations.`;

            const chatData = await callGroqUpdate({
              model: 'llama-3.1-8b-instant',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.1,
              response_format: { type: "json_object" }
            });

            const alignmentData = JSON.parse(chatData.choices[0].message.content);
            if (alignmentData && alignmentData.lyrics && alignmentData.lyrics.length > 0) {
              allAlignedLines.push(...alignmentData.lyrics);
            } else {
              throw new Error(`Chunk ${ci + 1} trả về format không hợp lệ`);
            }

            if (ci < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          updateData.syncedLyrics = interpolateTimestamps(allAlignedLines);
          console.log(`[AI] Đồng bộ Llama 3 thành công sau khi sửa lời!`);
        } catch (e) {
          console.error(`[AI] Lỗi khi re-align Llama 3 lúc sửa lời:`, e);
          updateData.syncedLyrics = [];
        }
      }

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

      const track = await Track.findByIdAndDelete(trackId);

      if (!track) throw new NotFoundError('Không tìm thấy bài hát để xóa');

      return res.json(new SuccessResponse('Xóa bài hát hoàn toàn khỏi database thành công', null));
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

      let query: any = {};

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
        const senderId = (populatedComment.userId as any)._id.toString();

        // 1. Lấy danh sách ID người được Tag (@)
        const mentionRegex = /@([a-zA-Z0-9_\s]+)/g;
        let match;
        const mentionedUserIds = new Set<string>();

        // Tìm tất cả user được tag
        const matches = [...content.matchAll(mentionRegex)];
        for (const m of matches) {
          const name = m[1].trim();
          const mentionedUser = await User.findOne({ displayName: name });
          if (mentionedUser && String(mentionedUser._id) !== senderId) {
            mentionedUserIds.add(mentionedUser._id.toString());

            console.log(`[Catalog] Sending Tag Notification to user: ${mentionedUser._id}`);
            NotificationService.notifyCommentTag(
              mentionedUser._id.toString(),
              senderName,
              track.title,
              trackId,
              senderId
            ).catch(err => console.error('[Notification Error - Tag]:', err));
          }
        }

        // 2. Thông báo cho chủ sở hữu bình luận cha (nếu là reply và CHƯA được báo qua Tag)
        if (parentId) {
          const parentComment = await Comment.findById(parentId);
          if (parentComment &&
            String(parentComment.userId) !== senderId &&
            !mentionedUserIds.has(parentComment.userId.toString())) {

            console.log(`[Catalog] Sending Reply Notification to user: ${parentComment.userId}`);
            NotificationService.notifyReply(
              parentComment.userId.toString(),
              senderName,
              track.title,
              trackId,
              senderId
            ).catch(err => console.error('[Notification Error - Reply]:', err));
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
  // 23. Sinh lời bài hát bằng AI (Hugging Face Whisper)
  public async generateLyrics(req: any, res: Response, next: NextFunction) {
    try {
      const { trackId } = req.params;
      const track = await Track.findById(trackId);

      if (!track) throw new NotFoundError('Không tìm thấy bài hát');
      if (!process.env.GROQ_API_KEY) {
        return res.status(400).json({ success: false, message: 'Vui lòng thêm GROQ_API_KEY vào file .env' });
      }

      console.log(`[AI] Bắt đầu phân tích Lời bài hát cho: ${track.title} - ${track.artist}`);

      let syncedLyrics: { start: number; end: number; text: string }[] = [];

      // ==========================================
      // BƯỚC 1: ƯU TIÊN TÌM LỜI CHUẨN TRÊN THƯ VIỆN TOÀN CẦU (LRCLIB) - CHỈ KHI USER CHƯA NHẬP LỜI
      // ==========================================
      const hasManualLyrics = track.lyrics && track.lyrics.trim() !== '' && !track.lyrics.includes('[00:');
      
      if (!hasManualLyrics) {
        try {
          console.log(`[AI] Đang tra cứu trên thư viện LRCLIB...`);
          // Lọc bỏ các chữ thừa như "adm", "cover" trong tên nghệ sĩ để tìm kiếm dễ hơn
          const cleanArtist = track.artist.replace(/,?\s*adm\s*/i, '').trim();
          const searchUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(track.title)}&artist_name=${encodeURIComponent(cleanArtist)}`;
          const lrcRes = await fetch(searchUrl);

          if (lrcRes.ok) {
            const lrcData: any = await lrcRes.json();
            if (lrcData && lrcData.syncedLyrics) {
              console.log(`[AI] 🎉 TÌM THẤY LỜI CHUẨN TRÊN LRCLIB!`);
              const lines = lrcData.syncedLyrics.split('\n');
              for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(/\[(\d+):(\d+\.?\d*)\](.*)/);
                if (match) {
                  const min = parseInt(match[1]);
                  const sec = parseFloat(match[2]);
                  const text = match[3].trim();
                  if (text) {
                    syncedLyrics.push({
                      start: min * 60 + sec,
                      text: text,
                      end: 0
                    });
                  }
                }
              }
              // Tính end time
              for (let i = 0; i < syncedLyrics.length; i++) {
                syncedLyrics[i].end = i < syncedLyrics.length - 1 ? syncedLyrics[i + 1].start : syncedLyrics[i].start + 5;
              }
            }
          }
        } catch (err) {
          console.error(`[AI] Lỗi khi gọi LRCLIB:`, err);
        }
      } else {
        console.log(`[AI] Phát hiện User tự nhập lời thủ công, bỏ qua LRCLIB để tránh ghi đè lời của User.`);
      }

      // ==========================================
      // BƯỚC 2: NẾU KHÔNG CÓ TRÊN MẠNG -> DÙNG AI GROQ (WHISPER) ĐỂ NGHE VÀ CHÉP
      // ==========================================
      if (syncedLyrics.length === 0) {
        console.log(`[AI] Không tìm thấy trên thư viện. Kích hoạt AI Groq (Whisper) để nghe file audio...`);

        const audioRes = await fetch(track.audioUrl);
        if (!audioRes.ok) throw new Error('Không thể tải file audio từ hệ thống lưu trữ');
        const audioBlob = await audioRes.blob();

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.mp3');
        formData.append('model', 'whisper-large-v3');
        formData.append('response_format', 'verbose_json');
        formData.append('temperature', '0.2'); // Giảm ảo giác của AI
        // Để AI tự động nhận diện ngôn ngữ (auto-detect) thay vì ép tiếng Anh

        try {
          const openAiRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: formData as any
          });

          if (!openAiRes.ok) {
            const errData = await openAiRes.text();
            throw new Error(errData);
          }

          const data: any = await openAiRes.json();
          if (data.segments && data.segments.length > 0) {
            console.log(`[AI] Phân tích AI hoàn tất!`);

            syncedLyrics = data.segments.map((seg: any) => ({
              text: seg.text.trim(),
              start: seg.start,
              end: seg.end
            }));
          }
        } catch (networkErr: any) {
          console.error(`[AI] Lỗi Groq AI:`, networkErr);
          return res.status(503).json({
            success: false,
            message: `Lỗi AI: ${networkErr.message}`
          });
        }
      }

      if (syncedLyrics.length === 0) {
        return res.status(400).json({ success: false, message: 'AI không tìm thấy lời hát nào trong audio này' });
      }

      const originalManualLyrics = track.lyrics;
      if (track.lyrics && track.lyrics.trim() !== '' && !track.lyrics.includes('[00:')) {
        console.log(`[AI] Đang đồng bộ hóa lời bài hát tự chế bằng Llama 3...`);
        try {
          const userLines = track.lyrics.split('\n').filter((l: string) => l.trim() !== '');
          const fullTemplate = userLines.map((text: string) => ({ start: -1, end: -1, text }));
          const aiSegments = syncedLyrics.map((s: any) => ({ start: s.start, end: s.end, text: s.text }));

          // Hàm gọi Groq với retry
          const callGroq = async (body: object): Promise<any> => {
            let lastError = '';
            for (let attempt = 1; attempt <= 3; attempt++) {
              const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
              });

              if (res.ok) return res.json();

              const errBody = await res.text();
              lastError = `HTTP ${res.status}: ${errBody}`;
              console.error(`[AI] Groq API lỗi lần ${attempt}/3: ${lastError}`);

              if (res.status === 429) {
                const waitMs = attempt * 5000;
                console.log(`[AI] Rate limit! Đợi ${waitMs / 1000}s rồi thử lại...`);
                await new Promise(resolve => setTimeout(resolve, waitMs));
              } else {
                break;
              }
            }
            throw new Error(`Groq API thất bại: ${lastError}`);
          };

          // Chia template thành chunks 25 dòng để tránh vượt token limit
          const CHUNK_SIZE = 25;
          const chunks: typeof fullTemplate[] = [];
          for (let i = 0; i < fullTemplate.length; i += CHUNK_SIZE) {
            chunks.push(fullTemplate.slice(i, i + CHUNK_SIZE));
          }

          console.log(`[AI] Chia ${userLines.length} dòng thành ${chunks.length} chunk(s), mỗi chunk tối đa ${CHUNK_SIZE} dòng...`);

          const allAlignedLines: any[] = [];
          for (let ci = 0; ci < chunks.length; ci++) {
            const chunk = chunks[ci];
            console.log(`[AI] Đang xử lý chunk ${ci + 1}/${chunks.length} (${chunk.length} dòng)...`);

            const prompt = `You are an expert audio syncing tool.
Your ONLY task is to fill in the "start" and "end" timestamps in the provided JSON array using data from the AI segments.

CRITICAL RULES:
1. You MUST return the JSON array EXACTLY as provided, with the same "text" fields. DO NOT change, merge, split, or delete any "text".
2. Find the corresponding text in the AI segments and fill in the "start" and "end" fields.
3. If the user's line is missing from the AI segments (e.g. intro), leave "start" and "end" as -1.
4. If the user's line contains more words than the AI segment, map it to the EARLIEST 'start' time of the corresponding segments.

JSON Template to fill in (DO NOT modify "text"):
${JSON.stringify(chunk, null, 2)}

AI segments (use these for timestamps):
${JSON.stringify(aiSegments)}

Return ONLY a JSON object in this format:
{
  "lyrics": [
    { "start": number, "end": number, "text": "exact line from template" }
  ]
}
Do not include markdown or explanations.`;

            const chatData = await callGroq({
              model: 'llama-3.1-8b-instant',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.1,
              response_format: { type: "json_object" }
            });

            const alignmentData = JSON.parse(chatData.choices[0].message.content);
            if (alignmentData && alignmentData.lyrics && alignmentData.lyrics.length > 0) {
              allAlignedLines.push(...alignmentData.lyrics);
            } else {
              throw new Error(`Chunk ${ci + 1} trả về format không hợp lệ`);
            }

            // Chờ 1 giây giữa các chunk để tránh rate limit
            if (ci < chunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }

          syncedLyrics = allAlignedLines;
          console.log(`[AI] Đồng bộ Llama 3 thành công! Tổng ${syncedLyrics.length} dòng.`);
        } catch (e) {
          console.error(`[AI] Lỗi Llama 3 Sync, dùng lyrics mặc định làm fallback:`, e);
        }
      }

      // Đảm bảo timestamps luôn mượt mà (chống lỗi AI gán nhiều dòng cùng 1 mốc tgian)
      syncedLyrics = interpolateTimestamps(syncedLyrics);

      // Cập nhật Database
      track.syncedLyrics = syncedLyrics;

      // Nối các câu lại để lưu vào trường lyrics dạng thô (CHỈ KHI User chưa có lời thủ công)
      if (!originalManualLyrics || originalManualLyrics.trim() === '') {
        track.lyrics = syncedLyrics.map((s: any) => s.text).join('\n');
      }

      await track.save();

      console.log(`[AI] Success! Saved ${syncedLyrics.length} lyrics lines.`);
      return res.json(new SuccessResponse('Phân tích lời bài hát thành công!', track));
    } catch (error) {
      next(error);
    }
  }
}




export const catalogController = new CatalogController();
