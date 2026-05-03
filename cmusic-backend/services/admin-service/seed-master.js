/**
 * seed-master.js - Tạo dữ liệu mẫu cho CMusic bằng MongoDB native driver
 * Chạy: node seed-master.js
 */
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = 'mongodb://admin:admin123@localhost:27017/cmusic?authSource=admin';

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log(' MongoDB connected');
    const db = client.db('cmusic');

    // ── Xóa dữ liệu cũ ──────────────────────────────────────────────
    await db.collection('users').deleteMany({});
    await db.collection('artists').deleteMany({});
    await db.collection('albums').deleteMany({});
    await db.collection('tracks').deleteMany({});
    await db.collection('playlists').deleteMany({});
    await db.collection('permissions').deleteMany({});
    await db.collection('planfeatures').deleteMany({});
    console.log('  Đã xóa dữ liệu cũ.');

    // ── 1. Permissions ───────────────────────────────────────────────
    const permissions = [
      { id: 'stream_music',       label: 'Nghe nhạc (Streaming)',         category: 'listening', guard: 'public',                    roles: { admin: true,  artist: true,  user: true  }, order: 1 },
      { id: 'create_playlist',    label: 'Tạo Playlist cá nhân',          category: 'listening', guard: 'authenticate',              roles: { admin: true,  artist: true,  user: true  }, order: 2 },
      { id: 'like_song',          label: 'Like bài hát',                  category: 'listening', guard: 'authenticate',              roles: { admin: true,  artist: true,  user: true  }, order: 3 },
      { id: 'view_history',       label: 'Xem lịch sử nghe',              category: 'listening', guard: 'authenticate',              roles: { admin: true,  artist: true,  user: true  }, order: 4 },
      { id: 'search',             label: 'Tìm kiếm nhạc',                 category: 'listening', guard: 'public',                    roles: { admin: true,  artist: true,  user: true  }, order: 5 },
      { id: 'upload_track',       label: 'Tải nhạc lên hệ thống',         category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true,  artist: true,  user: false }, order: 1 },
      { id: 'edit_own_track',     label: 'Sửa bài hát của mình',          category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true,  artist: true,  user: false }, order: 2 },
      { id: 'delete_own_track',   label: 'Xóa bài hát của mình',          category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true,  artist: true,  user: false }, order: 3 },
      { id: 'delete_any_track',   label: 'Xóa bất kỳ bài hát',            category: 'content',   guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 4 },
      { id: 'manage_album',       label: 'Quản lý Album',                 category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true,  artist: true,  user: false }, order: 5 },
      { id: 'view_own_profile',   label: 'Xem hồ sơ cá nhân',             category: 'users',     guard: 'authenticate',              roles: { admin: true,  artist: true,  user: true  }, order: 1 },
      { id: 'list_all_users',     label: 'Xem danh sách User',            category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 2 },
      { id: 'create_user',        label: 'Tạo tài khoản mới',             category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 3 },
      { id: 'edit_any_user',      label: 'Sửa thông tin User bất kỳ',     category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 4 },
      { id: 'delete_user',        label: 'Xóa tài khoản',                 category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 5 },
      { id: 'change_role',        label: 'Thay đổi vai trò (Role)',        category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 6 },
      { id: 'change_plan',        label: 'Thay đổi gói cước (Plan)',       category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 7 },
      { id: 'view_dashboard',     label: 'Truy cập Admin Dashboard',       category: 'admin',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 1 },
      { id: 'view_stats',         label: 'Xem thống kê hệ thống',          category: 'admin',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 2 },
      { id: 'manage_permissions', label: 'Quản lý phân quyền',             category: 'admin',     guard: 'requireRole(admin)',        roles: { admin: true,  artist: false, user: false }, order: 3 },
      { id: 'artist_stats',       label: 'Thống kê bài hát cá nhân',       category: 'admin',     guard: 'requireRole(artist,admin)', roles: { admin: true,  artist: true,  user: false }, order: 4 },
    ];
    await db.collection('permissions').insertMany(permissions);
    console.log(` Seeded ${permissions.length} permissions`);

    // ── 2. Plan Features ─────────────────────────────────────────────
    const planFeatures = [
      { id: 'audio_quality',  label: 'Chất lượng âm thanh',             category: 'Streaming',           limits: { free: '128 kbps',        student: '256 kbps',       premium: '320 kbps',       family: '320 kbps'       }, order: 1 },
      { id: 'offline',        label: 'Nghe offline (tải về)',            category: 'Streaming',           limits: { free: ' Không',        student: ' 50 bài',      premium: ' 10.000 bài',  family: ' 10.000 bài'  }, order: 2 },
      { id: 'ads',            label: 'Quảng cáo giữa bài',              category: 'Streaming',           limits: { free: ' Có quảng cáo', student: ' Không có',    premium: ' Không có',    family: ' Không có'    }, order: 3 },
      { id: 'simultaneous',   label: 'Phát đồng thời nhiều thiết bị',   category: 'Streaming',           limits: { free: '1 thiết bị',      student: '1 thiết bị',     premium: '1 thiết bị',     family: '6 tài khoản'    }, order: 4 },
      { id: 'shuffle_only',   label: 'Phát theo thứ tự tùy chọn',       category: 'Streaming',           limits: { free: ' Shuffle only', student: ' Có',          premium: ' Có',          family: ' Có'          }, order: 5 },
      { id: 'skip_limit',     label: 'Giới hạn bỏ qua bài',             category: 'Streaming',           limits: { free: '6 lần/giờ',       student: 'Không giới hạn', premium: 'Không giới hạn', family: 'Không giới hạn' }, order: 6 },
      { id: 'playlist_limit', label: 'Số lượng Playlist tạo được',      category: 'Playlist & Thư viện', limits: { free: '3 playlist',      student: 'Không giới hạn', premium: 'Không giới hạn', family: 'Không giới hạn' }, order: 1 },
      { id: 'library_size',   label: 'Bài hát trong thư viện',          category: 'Playlist & Thư viện', limits: { free: '100 bài',         student: '5.000 bài',      premium: 'Không giới hạn', family: 'Không giới hạn' }, order: 2 },
      { id: 'lyrics',         label: 'Xem lời bài hát',                 category: 'Nội dung',            limits: { free: ' Không',        student: ' Có',          premium: ' Có',          family: ' Có'          }, order: 1 },
      { id: 'history_length', label: 'Lịch sử nghe nhạc lưu trữ',      category: 'Nội dung',            limits: { free: '30 ngày',         student: '90 ngày',        premium: 'Không giới hạn', family: 'Không giới hạn' }, order: 2 },
      { id: 'recommendations',label: 'Gợi ý nhạc cá nhân hoá (AI)',    category: 'Nội dung',            limits: { free: ' Cơ bản',       student: ' Nâng cao',    premium: ' Đầy đủ',     family: ' Đầy đủ'     }, order: 3 },
      { id: 'upload_limit',   label: 'Upload nhạc (Nghệ sĩ)',           category: 'Nghệ sĩ',             limits: { free: '10 bài/tháng',    student: '50 bài/tháng',   premium: 'Không giới hạn', family: 'Không giới hạn' }, order: 1 },
      { id: 'support',        label: 'Hỗ trợ khách hàng',               category: 'Dịch vụ',             limits: { free: 'Cộng đồng',       student: 'Email',          premium: 'Chat 24/7',      family: 'Ưu tiên Chat'   }, order: 1 },
    ];
    await db.collection('planfeatures').insertMany(planFeatures);
    console.log(` Seeded ${planFeatures.length} plan features`);

    // ── 3. Users ─────────────────────────────────────────────────────
    const bcrypt = require('bcrypt');
    const hashed = await bcrypt.hash('password123', 10);

    const adminId  = new ObjectId();
    const artistId = new ObjectId();
    const userId   = new ObjectId();

    await db.collection('users').insertMany([
      {
        _id: adminId,
        email: 'admin@cmusic.com',
        password: hashed,
        displayName: 'CMusic Admin',
        role: 'admin',
        authProvider: 'local',
        isEmailVerified: true,
        plan: 'premium',
        avatarUrl: 'https://i.pravatar.cc/300?img=1',
        bio: 'Quản trị viên hệ thống CMusic',
        followerCount: 0,
        monthlyListeners: 0,
        country: 'VN',
        preferences: { language: 'vi', theme: 'dark', emailNotifications: true },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: artistId,
        email: 'artist@cmusic.com',
        password: hashed,
        displayName: 'Sơn Tùng M-TP',
        role: 'artist',
        authProvider: 'local',
        isEmailVerified: true,
        plan: 'premium',
        avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Son_Tung_M-TP_at_the_MAMA_2017.jpg/220px-Son_Tung_M-TP_at_the_MAMA_2017.jpg',
        bio: 'Nghệ sĩ nhạc Pop hàng đầu Việt Nam',
        followerCount: 2000000,
        monthlyListeners: 5000000,
        country: 'VN',
        preferences: { language: 'vi', theme: 'dark', emailNotifications: true },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: userId,
        email: 'user@cmusic.com',
        password: hashed,
        displayName: 'Khán Giả',
        role: 'user',
        authProvider: 'local',
        isEmailVerified: true,
        plan: 'free',
        avatarUrl: 'https://i.pravatar.cc/300?img=5',
        bio: 'Tôi yêu âm nhạc!',
        followerCount: 0,
        monthlyListeners: 0,
        country: 'VN',
        preferences: { language: 'vi', theme: 'dark', emailNotifications: true },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log(' Seeded 3 users (admin, artist, user)');

    // ── 4. Artist Profile ─────────────────────────────────────────────
    const artistProfileId = new ObjectId();
    const artistProfile2Id = new ObjectId();

    await db.collection('artists').insertMany([
      {
        _id: artistProfileId,
        name: 'Sơn Tùng M-TP',
        avatarUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Son_Tung_M-TP_at_the_MAMA_2017.jpg/220px-Son_Tung_M-TP_at_the_MAMA_2017.jpg',
        bannerUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=1200',
        bio: 'Nghệ sĩ nhạc Pop - Rap hàng đầu Việt Nam. Chủ nhân của nhiều bản hit đình đám.',
        isVerified: true,
        userId: artistId,
        stats: { monthlyListeners: 5000000, followerCount: 2000000, topCities: [{ city: 'Hà Nội', count: 800000 }, { city: 'TP.HCM', count: 600000 }] },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: artistProfile2Id,
        name: 'HIEUTHUHAI',
        avatarUrl: 'https://i.pravatar.cc/300?img=12',
        bannerUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200',
        bio: 'Rapper trẻ tài năng thế hệ mới',
        isVerified: true,
        stats: { monthlyListeners: 1500000, followerCount: 900000, topCities: [{ city: 'TP.HCM', count: 400000 }] },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log(' Seeded 2 artist profiles');

    // ── 5. Albums ─────────────────────────────────────────────────────
    const album1Id = new ObjectId();
    const album2Id = new ObjectId();

    await db.collection('albums').insertMany([
      {
        _id: album1Id,
        title: 'Sky Tour',
        artistId: artistId,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        releaseDate: new Date('2019-07-27'),
        genre: ['Pop', 'R&B'],
        trackIds: [],
        isSingle: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: album2Id,
        title: 'Chúng Ta Của Hiện Tại (Single)',
        artistId: artistId,
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
        releaseDate: new Date('2020-12-20'),
        genre: ['Pop'],
        trackIds: [],
        isSingle: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log(' Seeded 2 albums');

    // ── 6. Tracks ─────────────────────────────────────────────────────
    const track1Id = new ObjectId();
    const track2Id = new ObjectId();
    const track3Id = new ObjectId();
    const track4Id = new ObjectId();
    const track5Id = new ObjectId();

    const tracks = [
      {
        _id: track1Id,
        title: 'Chúng Ta Của Hiện Tại',
        artist: 'Sơn Tùng M-TP',
        artistId: artistId,
        officialArtistId: [artistProfileId],
        albumId: album2Id,
        duration: 301,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
        genre: ['Pop', 'Ballad'],
        playCount: 52000000,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: track2Id,
        title: 'Muộn Rồi Mà Sao Còn',
        artist: 'Sơn Tùng M-TP',
        artistId: artistId,
        officialArtistId: [artistProfileId],
        albumId: album1Id,
        duration: 252,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
        genre: ['Pop'],
        playCount: 38000000,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: track3Id,
        title: 'Có Chắc Yêu Là Đây',
        artist: 'Sơn Tùng M-TP',
        artistId: artistId,
        officialArtistId: [artistProfileId],
        albumId: album1Id,
        duration: 223,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500',
        genre: ['Pop', 'K-Pop'],
        playCount: 45000000,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: track4Id,
        title: 'Nắng Ấm Xa Dần',
        artist: 'Sơn Tùng M-TP',
        artistId: artistId,
        officialArtistId: [artistProfileId],
        albumId: album1Id,
        duration: 272,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
        genre: ['Pop', 'Acoustic'],
        playCount: 20000000,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: track5Id,
        title: 'Đừng Lo',
        artist: 'HIEUTHUHAI',
        artistId: artistId,
        officialArtistId: [artistProfile2Id],
        duration: 198,
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        coverUrl: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=500',
        genre: ['Rap', 'Hip-hop'],
        playCount: 15000000,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await db.collection('tracks').insertMany(tracks);

    // Cập nhật trackIds vào album
    await db.collection('albums').updateOne({ _id: album1Id }, { $set: { trackIds: [track2Id, track3Id, track4Id] } });
    await db.collection('albums').updateOne({ _id: album2Id }, { $set: { trackIds: [track1Id] } });
    console.log(` Seeded ${tracks.length} tracks`);

    // ── 7. Playlist ───────────────────────────────────────────────────
    await db.collection('playlists').insertMany([
      {
        name: 'Nhạc Trẻ Gây Nghiện ',
        description: 'Những bản hit mới nhất của Sơn Tùng M-TP',
        thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500',
        userId: userId,
        tracks: [track1Id, track2Id, track3Id],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Rap Việt Đỉnh Cao 🎤',
        description: 'Tuyển tập rap Việt hay nhất',
        userId: userId,
        tracks: [track5Id, track4Id],
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log(' Seeded 2 playlists');

    console.log('\n Seed hoàn tất! Database đã có dữ liệu mẫu.');
    console.log(' Tài khoản đã tạo:');
    console.log('   Admin   : admin@cmusic.com / password123');
    console.log('   Artist  : artist@cmusic.com / password123');
    console.log('   User    : user@cmusic.com / password123');

  } catch (err) {
    console.error(' Lỗi seed:', err);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
