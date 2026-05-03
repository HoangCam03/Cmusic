

import dotenv from 'dotenv';
import { Permission, mongoose } from '../../../../libs/database/schemas/permission.schema';
import { PlanFeature } from '../../../../libs/database/schemas/plan-feature.schema';

dotenv.config();

const PERMISSIONS = [
  // ── Nghe nhạc & Tương tác ──────────────────────────────────────────────────
  { id: 'stream_music',    label: 'Nghe nhạc (Streaming)',         description: 'Phát nhạc trực tuyến từ catalog',              category: 'listening', guard: 'public',                    roles: { admin: true, artist: true,  user: true  }, order: 1 },
  { id: 'create_playlist', label: 'Tạo Playlist cá nhân',          description: 'Tạo và quản lý danh sách phát riêng',          category: 'listening', guard: 'authenticate',              roles: { admin: true, artist: true,  user: true  }, order: 2 },
  { id: 'like_song',       label: 'Like bài hát',                  description: 'Thêm bài hát vào danh sách yêu thích',         category: 'listening', guard: 'authenticate',              roles: { admin: true, artist: true,  user: true  }, order: 3 },
  { id: 'view_history',    label: 'Xem lịch sử nghe',              description: 'Xem lại lịch sử bài hát đã nghe',              category: 'listening', guard: 'authenticate',              roles: { admin: true, artist: true,  user: true  }, order: 4 },
  { id: 'search',          label: 'Tìm kiếm nhạc',                 description: 'Tìm kiếm bài hát, nghệ sĩ, album',             category: 'listening', guard: 'public',                    roles: { admin: true, artist: true,  user: true  }, order: 5 },
  // ── Quản lý Nội dung ─────────────────────────────────────────────────────
  { id: 'upload_track',     label: 'Tải nhạc lên hệ thống',       description: 'Upload file âm thanh lên catalog',             category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true, artist: true,  user: false }, order: 1 },
  { id: 'edit_own_track',   label: 'Sửa bài hát của mình',        description: 'Chỉnh sửa metadata bài hát đã đăng',           category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true, artist: true,  user: false }, order: 2 },
  { id: 'delete_own_track', label: 'Xóa bài hát của mình',        description: 'Xóa track do mình sở hữu',                    category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true, artist: true,  user: false }, order: 3 },
  { id: 'delete_any_track', label: 'Xóa bất kỳ bài hát',          description: 'Xóa bài hát của bất kỳ nghệ sĩ nào',          category: 'content',   guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 4 },
  { id: 'manage_album',     label: 'Quản lý Album',                description: 'Tạo, sửa, xóa album',                         category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true, artist: true,  user: false }, order: 5 },
  { id: 'manage_comments',  label: 'Quản lý bình luận',            description: 'Xóa bình luận không phù hợp',                 category: 'content',   guard: 'requireRole(artist,admin)', roles: { admin: true, artist: true,  user: false }, order: 6 },
  // ── Quản lý Tài khoản ────────────────────────────────────────────────────
  { id: 'view_own_profile', label: 'Xem hồ sơ cá nhân',           description: 'Xem và cập nhật thông tin của mình',           category: 'users',     guard: 'authenticate',              roles: { admin: true, artist: true,  user: true  }, order: 1 },
  { id: 'list_all_users',   label: 'Xem danh sách User',           description: 'Xem tất cả tài khoản trong hệ thống',         category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 2 },
  { id: 'create_user',      label: 'Tạo tài khoản mới',           description: 'Admin tạo tài khoản cho người khác',           category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 3 },
  { id: 'edit_any_user',    label: 'Sửa thông tin User bất kỳ',   description: 'Chỉnh sửa hồ sơ của tài khoản khác',          category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 4 },
  { id: 'delete_user',      label: 'Xóa tài khoản',               description: 'Xóa tài khoản người dùng khỏi hệ thống',      category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 5 },
  { id: 'change_role',      label: 'Thay đổi vai trò (Role)',      description: 'Nâng/hạ cấp vai trò của người dùng',          category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 6 },
  { id: 'change_plan',      label: 'Thay đổi gói cước (Plan)',     description: 'Nâng/hạ cấp gói đăng ký của người dùng',     category: 'users',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 7 },
  // ── Admin Dashboard ───────────────────────────────────────────────────────
  { id: 'view_dashboard',     label: 'Truy cập Admin Dashboard',  description: 'Xem bảng tổng quan quản trị',                 category: 'admin',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 1 },
  { id: 'view_stats',         label: 'Xem thống kê hệ thống',     description: 'Thống kê người dùng, doanh thu, lượt nghe',   category: 'admin',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 2 },
  { id: 'manage_permissions', label: 'Quản lý phân quyền',        description: 'Xem và điều chỉnh trang phân quyền',          category: 'admin',     guard: 'requireRole(admin)',        roles: { admin: true, artist: false, user: false }, order: 3 },
  { id: 'artist_stats',       label: 'Thống kê bài hát cá nhân',  description: 'Nghệ sĩ xem lượt nghe bài hát của mình',     category: 'admin',     guard: 'requireRole(artist,admin)', roles: { admin: true, artist: true,  user: false }, order: 4 },
];

const PLAN_FEATURES = [
  // Streaming
  { id: 'audio_quality',  label: 'Chất lượng âm thanh',             category: 'Streaming',           limits: { free: '128 kbps',        student: '256 kbps',       premium: '320 kbps',       family: '320 kbps'         }, order: 1 },
  { id: 'offline',        label: 'Nghe offline (tải về)',            category: 'Streaming',           limits: { free: ' Không',        student: ' 50 bài',      premium: ' 10.000 bài',  family: ' 10.000 bài'    }, order: 2 },
  { id: 'ads',            label: 'Quảng cáo giữa bài',              category: 'Streaming',           limits: { free: ' Có quảng cáo', student: ' Không có',    premium: ' Không có',    family: ' Không có'      }, order: 3 },
  { id: 'simultaneous',   label: 'Phát đồng thời nhiều thiết bị',   category: 'Streaming',           limits: { free: '1 thiết bị',      student: '1 thiết bị',     premium: '1 thiết bị',     family: '6 tài khoản'      }, order: 4 },
  { id: 'shuffle_only',   label: 'Phát theo thứ tự tùy chọn',       category: 'Streaming',           limits: { free: ' Shuffle only', student: ' Có',          premium: ' Có',          family: ' Có'            }, order: 5 },
  { id: 'skip_limit',     label: 'Giới hạn bỏ qua bài',             category: 'Streaming',           limits: { free: '6 lần/giờ',       student: 'Không giới hạn', premium: 'Không giới hạn', family: 'Không giới hạn'   }, order: 6 },
  // Playlist & Thư viện
  { id: 'playlist_limit', label: 'Số lượng Playlist tạo được',      category: 'Playlist & Thư viện', limits: { free: '3 playlist',      student: 'Không giới hạn', premium: 'Không giới hạn', family: 'Không giới hạn'   }, order: 1 },
  { id: 'library_size',   label: 'Bài hát trong thư viện',          category: 'Playlist & Thư viện', limits: { free: '100 bài',         student: '5.000 bài',      premium: 'Không giới hạn', family: 'Không giới hạn'   }, order: 2 },
  // Nội dung
  { id: 'lyrics',            label: 'Xem lời bài hát',              category: 'Nội dung',            limits: { free: ' Không',        student: ' Có',          premium: ' Có',          family: ' Có'            }, order: 1 },
  { id: 'history_length',    label: 'Lịch sử nghe nhạc lưu trữ',   category: 'Nội dung',            limits: { free: '30 ngày',         student: '90 ngày',        premium: 'Không giới hạn', family: 'Không giới hạn'   }, order: 2 },
  { id: 'recommendations',   label: 'Gợi ý nhạc cá nhân hoá (AI)', category: 'Nội dung',            limits: { free: ' Cơ bản',       student: ' Nâng cao',    premium: ' Đầy đủ',     family: ' Đầy đủ'       }, order: 3 },
  // Nghệ sĩ
  { id: 'upload_limit',      label: 'Upload nhạc (Nghệ sĩ)',        category: 'Nghệ sĩ',             limits: { free: '10 bài/tháng',    student: '50 bài/tháng',   premium: 'Không giới hạn', family: 'Không giới hạn'   }, order: 1 },
  // Dịch vụ
  { id: 'support',           label: 'Hỗ trợ khách hàng',            category: 'Dịch vụ',             limits: { free: 'Cộng đồng',       student: 'Email',          premium: 'Chat 24/7',      family: 'Ưu tiên Chat'     }, order: 1 },
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://admin:admin123@127.0.0.1:27017/cmusic?authSource=admin';
  mongoose.set('debug', true);
  await mongoose.connect(uri);
  console.log(' MongoDB connected');

  for (const p of PERMISSIONS) {
    await Permission.findOneAndUpdate({ id: p.id }, p, { upsert: true, new: true });
  }
  console.log(` Seeded ${PERMISSIONS.length} permissions`);

  for (const f of PLAN_FEATURES) {
    await PlanFeature.findOneAndUpdate({ id: f.id }, f, { upsert: true, new: true });
  }
  console.log(` Seeded ${PLAN_FEATURES.length} plan features`);

  await mongoose.disconnect();
  console.log(' Seed hoàn tất!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(' Seed thất bại:', err);
  process.exit(1);
});
