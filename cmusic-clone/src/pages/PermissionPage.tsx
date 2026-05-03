import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved, faCheck, faTimes, faHeadphones, faMusic, faUsers,
  faChartLine, faGear, faUser, faMicrophone, faCrown, faPlus, faEdit,
  faTrash, faSave, faTags, faToggleOn, faToggleOff,
  faListCheck, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import api from "../services/api";

// ─── DATA MODEL ────────────────────────────────────────────────────────────────

type Role = "admin" | "artist" | "user";
type Plan = "free" | "student" | "premium" | "family";
type PermCategory = "listening" | "content" | "users" | "admin" | "system" | "social";

interface Permission {
  id: string;
  label: string;
  description: string;
  category: PermCategory;
  roles: Record<Role, boolean>;
  plans?: Record<Plan, boolean>;
  guard?: string; // middleware / route guard name
}

interface PlanFeature {
  id: string;
  label: string;
  category: string;
  free: string;
  student: string;
  premium: string;
  family: string;
  isLimit?: boolean;
}

// ─── DEFAULT PERMISSIONS (phản ánh backend thực tế) ─────────────────────────

const DEFAULT_PERMISSIONS: Permission[] = [
  // Listening
  { id: "stream_music", label: "Nghe nhạc (Streaming)", description: "Phát nhạc trực tuyến từ catalog", category: "listening", guard: "public", roles: { admin: true, artist: true, user: true } },
  { id: "create_playlist", label: "Tạo Playlist cá nhân", description: "Tạo và quản lý danh sách phát riêng", category: "listening", guard: "authenticate", roles: { admin: true, artist: true, user: true } },
  { id: "like_song", label: "Like bài hát", description: "Thêm bài hát vào danh sách yêu thích", category: "listening", guard: "authenticate", roles: { admin: true, artist: true, user: true } },
  { id: "view_history", label: "Xem lịch sử nghe", description: "Xem lại lịch sử bài hát đã nghe", category: "listening", guard: "authenticate", roles: { admin: true, artist: true, user: true } },
  { id: "search", label: "Tìm kiếm nhạc", description: "Tìm kiếm bài hát, nghệ sĩ, album", category: "listening", guard: "public", roles: { admin: true, artist: true, user: true } },
  // Content
  { id: "upload_track", label: "Tải nhạc lên hệ thống", description: "Upload file âm thanh lên catalog", category: "content", guard: "requireRole(artist,admin)", roles: { admin: true, artist: true, user: false } },
  { id: "edit_own_track", label: "Sửa bài hát của mình", description: "Chỉnh sửa metadata bài hát đã đăng", category: "content", guard: "requireRole(artist,admin)", roles: { admin: true, artist: true, user: false } },
  { id: "delete_own_track", label: "Xóa bài hát của mình", description: "Xóa track do mình sở hữu", category: "content", guard: "requireRole(artist,admin)", roles: { admin: true, artist: true, user: false } },
  { id: "delete_any_track", label: "Xóa bất kỳ bài hát", description: "Xóa bài hát của bất kỳ nghệ sĩ nào", category: "content", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "manage_album", label: "Quản lý Album", description: "Tạo, sửa, xóa album", category: "content", guard: "requireRole(artist,admin)", roles: { admin: true, artist: true, user: false } },
  // Users
  { id: "view_own_profile", label: "Xem hồ sơ cá nhân", description: "Xem và cập nhật thông tin tài khoản của mình", category: "users", guard: "authenticate", roles: { admin: true, artist: true, user: true } },
  { id: "list_all_users", label: "Xem danh sách User", description: "Xem tất cả tài khoản trong hệ thống", category: "users", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "create_user", label: "Tạo tài khoản mới", description: "Admin tạo tài khoản cho người khác", category: "users", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "edit_any_user", label: "Sửa thông tin User bất kỳ", description: "Chỉnh sửa hồ sơ của tài khoản khác", category: "users", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "delete_user", label: "Xóa tài khoản", description: "Xóa tài khoản người dùng khỏi hệ thống", category: "users", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "change_role", label: "Thay đổi vai trò (Role)", description: "Nâng/hạ cấp vai trò của người dùng", category: "users", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "change_plan", label: "Thay đổi gói cước (Plan)", description: "Nâng/hạ cấp gói đăng ký của người dùng", category: "users", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  // Admin
  { id: "view_dashboard", label: "Truy cập Admin Dashboard", description: "Xem bảng tổng quan quản trị", category: "admin", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "view_stats", label: "Xem thống kê hệ thống", description: "Thống kê người dùng, doanh thu, lượt nghe", category: "admin", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "manage_permissions", label: "Quản lý phân quyền", description: "Xem và điều chỉnh trang phân quyền", category: "admin", guard: "requireRole(admin)", roles: { admin: true, artist: false, user: false } },
  { id: "artist_stats", label: "Thống kê bài hát cá nhân", description: "Nghệ sĩ xem lượt nghe bài hát của mình", category: "admin", guard: "requireRole(artist,admin)", roles: { admin: true, artist: true, user: false } },
];

const DEFAULT_PLAN_FEATURES: PlanFeature[] = [
  { id: "audio_quality", label: "Chất lượng âm thanh", category: "Streaming", free: "128 kbps", student: "256 kbps", premium: "320 kbps", family: "320 kbps" },
  { id: "offline", label: "Nghe offline (tải về)", category: "Streaming", free: "❌ Không", student: "✅ 50 bài", premium: "✅ 10.000 bài", family: "✅ 10.000 bài", isLimit: true },
  { id: "ads", label: "Quảng cáo giữa bài", category: "Streaming", free: "❌ Có quảng cáo", student: "✅ Không có", premium: "✅ Không có", family: "✅ Không có" },
  { id: "simultaneous", label: "Phát đồng thời nhiều thiết bị", category: "Streaming", free: "1 thiết bị", student: "1 thiết bị", premium: "1 thiết bị", family: "6 tài khoản" },
  { id: "shuffle_only", label: "Phát theo thứ tự tùy chọn", category: "Streaming", free: "❌ Shuffle only", student: "✅ Có", premium: "✅ Có", family: "✅ Có" },
  { id: "skip_limit", label: "Giới hạn bỏ qua bài", category: "Streaming", free: "6 lần/giờ", student: "Không giới hạn", premium: "Không giới hạn", family: "Không giới hạn" },
  { id: "playlist_limit", label: "Số lượng Playlist tạo được", category: "Playlist & Thư viện", free: "3 playlist", student: "Không giới hạn", premium: "Không giới hạn", family: "Không giới hạn", isLimit: true },
  { id: "library_size", label: "Bài hát trong thư viện", category: "Playlist & Thư viện", free: "100 bài", student: "5.000 bài", premium: "Không giới hạn", family: "Không giới hạn", isLimit: true },
  { id: "lyrics", label: "Xem lời bài hát", category: "Nội dung", free: "❌ Không", student: "✅ Có", premium: "✅ Có", family: "✅ Có" },
  { id: "history_length", label: "Lịch sử nghe nhạc lưu trữ", category: "Nội dung", free: "30 ngày", student: "90 ngày", premium: "Không giới hạn", family: "Không giới hạn", isLimit: true },
  { id: "recommendations", label: "Gợi ý nhạc cá nhân hoá (AI)", category: "Nội dung", free: "❌ Cơ bản", student: "✅ Nâng cao", premium: "✅ Đầy đủ", family: "✅ Đầy đủ" },
  { id: "upload_limit", label: "Upload nhạc (nếu là Nghệ sĩ)", category: "Nghệ sĩ", free: "10 bài/tháng", student: "50 bài/tháng", premium: "Không giới hạn", family: "Không giới hạn", isLimit: true },
  { id: "support", label: "Hỗ trợ khách hàng", category: "Dịch vụ", free: "Cộng đồng", student: "Email", premium: "Chat 24/7", family: "Ưu tiên Chat" },
];

// ─── UI HELPERS ────────────────────────────────────────────────────────────────
const ROLE_META = {
  admin: { label: "Admin", icon: faCrown, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  artist: { label: "Artist", icon: faMicrophone, color: "text-[#ff2d55]", bg: "bg-[#ff2d55]/10", border: "border-[#ff2d55]/20" },
  user: { label: "User", icon: faUser, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

const PLAN_META = {
  free: { label: "Free", color: "text-zinc-400", bg: "bg-zinc-800", border: "border-zinc-700" },
  student: { label: "Student", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  premium: { label: "Premium", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  family: { label: "Family", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

const CATEGORY_META: Record<PermCategory, { label: string; icon: any }> = {
  listening: { label: "Nghe nhạc & Tương tác", icon: faHeadphones },
  content: { label: "Quản lý Nội dung âm nhạc", icon: faMusic },
  users: { label: "Quản lý Tài khoản", icon: faUsers },
  admin: { label: "Bảng điều khiển Admin", icon: faChartLine },
  system: { label: "Cấu hình Hệ thống", icon: faGear },
  social: { label: "Tính năng Xã hội", icon: faUsers },
};

const TABS = [
  { id: "roles", label: "Phân quyền Vai trò", icon: faShieldHalved },
  { id: "plans", label: "Phân quyền Gói cước", icon: faTags },
  { id: "manage", label: "Quản lý Quyền", icon: faListCheck },
];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function PermissionPage() {
  const [activeTab, setActiveTab] = useState("roles");
  const [permissions, setPermissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [planFeatures, setPlanFeatures] = useState<PlanFeature[]>(DEFAULT_PLAN_FEATURES);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);
  // Tracks which permission ids have been toggled and need to be PATCH-ed on save
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  // ── Fetch from API on mount ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [permRes, planRes] = await Promise.all([
        api.get('/permissions'),
        api.get('/plan-features'),
      ]);
      if (permRes.data.success && permRes.data.data.length > 0) {
        setPermissions(permRes.data.data);
      }
      if (planRes.data.success && planRes.data.data.length > 0) {
        setPlanFeatures(planRes.data.data);
      }
    } catch {
      // API unavailable — keep DEFAULT_PERMISSIONS as fallback (dev mode)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Role Permission Toggles (local only until Save) ──────────────────────
  const toggleRolePerm = (permId: string, role: Role) => {
    setPermissions(prev => prev.map(p =>
      p.id === permId ? { ...p, roles: { ...p.roles, [role]: !p.roles[role] } } : p
    ));
    setPendingUpdates(prev => new Set(prev).add(permId));
    setIsDirty(true);
  };

  // ── Save: PUT all toggled permissions ────────────────────────────────────
  const handleSave = async () => {
    try {
      const toUpdate = permissions.filter(p => pendingUpdates.has(p.id));
      await Promise.all(
        toUpdate.map(p => api.put(`/permissions/${p.id}`, { roles: p.roles }))
      );
      setPendingUpdates(new Set());
      setIsDirty(false);
      toast.success("Đã lưu cấu hình phân quyền thành công!");
    } catch {
      toast.error("Lưu thất bại. Vui lòng thử lại!");
    }
  };

  // ── Delete permission ────────────────────────────────────────────────────
  const handleDeletePerm = async (permId: string) => {
    try {
      await api.delete(`/permissions/${permId}`);
      setPermissions(prev => prev.filter(p => p.id !== permId));
      toast.success("Đã xóa quyền thành công!");
    } catch {
      toast.error("Xóa thất bại. Vui lòng thử lại!");
    }
  };

  // ── Group permissions by category ────────────────────────────────────────
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<PermCategory, Permission[]>);

  // ── Plan features grouped ────────────────────────────────────────────────
  const groupedPlanFeatures = planFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, PlanFeature[]>);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] font-inter antialiased pb-20">

      {/* Header */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]" />
          <div>
            <h1 className="text-white text-[18px] font-bold tracking-tight leading-none">Phân quyền hệ thống</h1>
            <p className="text-zinc-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-70">
              {loading ? "Đang tải dữ liệu..." : "Quản lý RBAC — Vai trò, Gói cước & Quyền hạn chi tiết"}
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          {isDirty && (
            <span className="text-amber-400 text-[11px] font-bold uppercase tracking-widest animate-pulse">
              ● Có thay đổi chưa lưu
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-white bg-[#ff2d55] hover:bg-[#ff4b6d] disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-lg shadow-[#ff2d55]/20 cursor-pointer"
          >
            <FontAwesomeIcon icon={faSave} /> Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-10 pt-6 flex gap-2 border-b border-white/[0.06] pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-t-xl transition-all cursor-pointer border-b-2 -mb-[1px] ${
              activeTab === tab.id
                ? "text-white bg-[#0c0c0c] border-[#ff2d55] shadow-inner"
                : "text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-white/[0.02]"
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="text-[11px]" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-10 py-8">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: ROLE PERMISSIONS                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "roles" && (
          <div className="space-y-3">
            <div className="bg-[#0c0c0c]/60 border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                    <th className="py-4 px-8 text-left w-[45%]">
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none">Quyền hạn</span>
                    </th>
                    <th className="py-4 px-5 text-left w-[15%]">
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] leading-none">Guard</span>
                    </th>
                    {(["admin", "artist", "user"] as Role[]).map(role => (
                      <th key={role} className="py-4 px-6 text-center">
                        <span className={`${ROLE_META[role].color} text-[10px] font-black uppercase tracking-[0.2em] leading-none`}>{ROLE_META[role].label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedPermissions).map(([cat, perms]) => (
                    <>
                      <tr key={`cat-${cat}`} className="bg-white/[0.015] border-t border-b border-white/[0.04]">
                        <td colSpan={6} className="py-3 px-8">
                          <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={CATEGORY_META[cat as PermCategory]?.icon || faGear} className="text-[#ff2d55] text-[12px]" />
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">{CATEGORY_META[cat as PermCategory]?.label || cat}</span>
                          </div>
                        </td>
                      </tr>
                      {perms.map((perm) => (
                        <tr key={perm.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all group">
                          <td className="py-3.5 px-8">
                            <p className="text-zinc-300 text-[12.5px] font-medium">{perm.label}</p>
                            <p className="text-zinc-600 text-[10.5px] mt-0.5">{perm.description}</p>
                          </td>
                          <td className="py-3.5 px-5">
                            {(() => {
                              if (!perm.guard) return null;
                              const guard = perm.guard;
                              let colorClass = "text-amber-500/80 bg-amber-500/10 border-amber-500/20"; // default
                              if (guard === "public") colorClass = "text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20";
                              else if (guard === "authenticate") colorClass = "text-blue-400/80 bg-blue-500/10 border-blue-500/20";
                              else if (guard.startsWith("requireRole")) colorClass = "text-[#ff2d55]/80 bg-[#ff2d55]/10 border-[#ff2d55]/20";
                              
                              let displayGuard = guard;
                              if (guard === "public") displayGuard = "Công khai";
                              else if (guard === "authenticate") displayGuard = "Đăng nhập";
                              else if (guard.startsWith("requireRole")) {
                                displayGuard = guard.replace("requireRole(", "").replace(")", "").split(",").map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ");
                              }
                              
                              return (
                                <code className={`${colorClass} text-[10px] font-mono border px-1.5 py-0.5 rounded whitespace-nowrap uppercase tracking-wider`}>
                                  {displayGuard}
                                </code>
                              );
                            })()}
                          </td>
                          {(["admin", "artist", "user"] as Role[]).map(role => (
                            <td key={role} className="py-3.5 px-6 text-center">
                              <button
                                onClick={() => role !== "admin" && toggleRolePerm(perm.id, role)}
                                className={`relative inline-block cursor-pointer transition-all ${role === "admin" ? "opacity-60 cursor-not-allowed" : "hover:scale-105"}`}
                                title={role === "admin" ? "Admin luôn có toàn quyền" : undefined}
                              >
                                {perm.roles[role] ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/25 shadow-[0_0_8px_rgba(74,222,128,0.15)]">
                                    <FontAwesomeIcon icon={faCheck} className="text-emerald-400 text-[11px]" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.02] border border-white/[0.06]">
                                    <FontAwesomeIcon icon={faTimes} className="text-zinc-700 text-[11px]" />
                                  </span>
                                )}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: PLAN PERMISSIONS                                             */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "plans" && (
          <div className="space-y-6">
            {/* Plan Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {(["free", "student", "premium", "family"] as Plan[]).map(plan => {
                const meta = PLAN_META[plan];
                const prices: Record<Plan, string> = { free: "Miễn phí", student: "29.000đ/tháng", premium: "59.000đ/tháng", family: "89.000đ/tháng" };
                const userCount: Record<Plan, string> = { free: "1", student: "1", premium: "1", family: "Tối đa 6" };
                return (
                  <div key={plan} className={`p-5 rounded-2xl border ${meta.bg} ${meta.border} relative`}>
                    <p className={`${meta.color} text-[10px] font-black uppercase tracking-widest mb-1`}>{meta.label}</p>
                    <p className="text-white text-[18px] font-black">{prices[plan]}</p>
                    <p className="text-zinc-500 text-[10px] mt-2">{userCount[plan]} tài khoản</p>
                  </div>
                );
              })}
            </div>

            {Object.entries(groupedPlanFeatures).map(([cat, features]) => (
              <div key={cat} className="bg-[#0c0c0c]/60 border border-white/[0.05] rounded-2xl overflow-hidden">
                <div className="px-8 py-3.5 bg-white/[0.02] border-b border-white/[0.05]">
                  <span className="text-white text-[11px] font-black uppercase tracking-widest">{cat}</span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="py-3 px-8 text-left text-zinc-600 text-[10px] font-black uppercase tracking-wider w-[40%]">Tính năng</th>
                      {(["free", "student", "premium", "family"] as Plan[]).map(plan => (
                        <th key={plan} className={`py-3 px-6 text-center text-[10px] font-black uppercase tracking-wider ${PLAN_META[plan].color}`}>
                          {PLAN_META[plan].label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, idx) => (
                      <tr key={feature.id} className={`border-b border-white/[0.03] hover:bg-white/[0.015] transition-all ${idx % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                        <td className="py-3.5 px-8 text-zinc-400 text-[12.5px]">{feature.label}</td>
                        {(["free", "student", "premium", "family"] as Plan[]).map(plan => {
                          const val = (feature.limits ? feature.limits[plan] : feature[plan as keyof typeof feature]) as string || "";
                          const isNo = val.includes("Không") || val.includes("❌");
                          const isYes = val.includes("Có") || val.includes("✅") || (!isNo && val.trim() !== "");
                          return (
                            <td key={plan} className="py-3.5 px-6 text-center">
                              <span className={`text-[12px] font-medium ${
                                isNo ? "text-zinc-600" : isYes ? PLAN_META[plan].color : "text-zinc-500"
                              }`}>
                                {val.replace(/❌|✅/g, "").trim()}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {activeTab === "manage" && (
          <div className="space-y-5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-white text-[15px] font-bold">Danh sách Quyền ({permissions.length} quyền)</p>
                <p className="text-zinc-500 text-[12px] mt-1">Thêm, sửa hoặc xóa các quyền trong hệ thống</p>
              </div>
              <button
                onClick={() => { setEditingPerm(null); setIsAddModalOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest text-white bg-[#ff2d55] hover:bg-[#ff4b6d] transition-all active:scale-95 shadow-lg shadow-[#ff2d55]/20 cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} /> Thêm quyền mới
              </button>
            </div>

            <div className="bg-[#0c0c0c]/60 border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                    <th className="py-4 px-8 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Tên quyền</th>
                    <th className="py-4 px-6 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Nhóm</th>
                    <th className="py-4 px-6 text-left text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Guard Middleware</th>
                    <th className="py-4 px-6 text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Admin</th>
                    <th className="py-4 px-6 text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Artist</th>
                    <th className="py-4 px-6 text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">User</th>
                    <th className="py-4 px-6 text-right text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => (
                    <tr key={perm.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all group">
                      <td className="py-3.5 px-8">
                        <p className="text-zinc-200 text-[12.5px] font-semibold">{perm.label}</p>
                        <p className="text-zinc-600 text-[10.5px] mt-0.5 font-mono">{perm.id}</p>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-lg">
                          {CATEGORY_META[perm.category]?.label.split(" ")[0] || perm.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        {(() => {
                          const guard = perm.guard || "public";
                          let colorClass = "text-amber-500/80 bg-amber-500/10 border-amber-500/20"; // default
                          if (guard === "public") colorClass = "text-emerald-400/80 bg-emerald-500/10 border-emerald-500/20";
                          else if (guard === "authenticate") colorClass = "text-blue-400/80 bg-blue-500/10 border-blue-500/20";
                          else if (guard.startsWith("requireRole")) colorClass = "text-[#ff2d55]/80 bg-[#ff2d55]/10 border-[#ff2d55]/20";
                          
                          let displayGuard = guard;
                          if (guard === "public") displayGuard = "Công khai";
                          else if (guard === "authenticate") displayGuard = "Đăng nhập";
                          else if (guard.startsWith("requireRole")) {
                            displayGuard = guard.replace("requireRole(", "").replace(")", "").split(",").map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(", ");
                          }
                          
                          return (
                            <code className={`${colorClass} text-[10px] font-mono border px-1.5 py-0.5 rounded whitespace-nowrap uppercase tracking-wider`}>
                              {displayGuard}
                            </code>
                          );
                        })()}
                      </td>
                      {(["admin", "artist", "user"] as Role[]).map(role => (
                        <td key={role} className="py-3.5 px-6 text-center">
                          {perm.roles[role]
                            ? <FontAwesomeIcon icon={faCheck} className="text-emerald-400 text-[13px]" />
                            : <FontAwesomeIcon icon={faTimes} className="text-zinc-700 text-[13px]" />
                          }
                        </td>
                      ))}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingPerm(perm); setIsAddModalOpen(true); }}
                            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center justify-center cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-[11px]" />
                          </button>
                          <button
                            onClick={() => handleDeletePerm(perm.id)}
                            className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── ADD / EDIT PERMISSION MODAL ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-[500px] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300"
               style={{ background: "#0d0d0d", border: "1px solid rgba(255,45,85,0.2)" }}>
            {/* Top glow */}
            <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full"
                 style={{ background: "linear-gradient(90deg, transparent, #FF2D55, transparent)", boxShadow: "0 0 20px 6px rgba(255,45,85,0.25)" }} />

            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white text-[17px] font-bold">{editingPerm ? "Chỉnh sửa quyền" : "Thêm quyền mới"}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-600 hover:text-white transition-colors cursor-pointer">
                  <FontAwesomeIcon icon={faXmark} className="text-[18px]" />
                </button>
              </div>

              <PermissionForm
                initial={editingPerm}
                onSave={async (perm) => {
                  try {
                    if (editingPerm) {
                      await api.put(`/permissions/${perm.id}`, perm);
                      setPermissions(prev => prev.map(p => p.id === perm.id ? perm : p));
                      toast.success("Đã cập nhật quyền!");
                    } else {
                      const res = await api.post('/permissions', perm);
                      setPermissions(prev => [...prev, res.data.data ?? perm]);
                      toast.success("Đã thêm quyền mới!");
                    }
                    setIsAddModalOpen(false);
                  } catch {
                    toast.error("Thao tác thất bại. Vui lòng thử lại!");
                  }
                }}
                onCancel={() => setIsAddModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PERMISSION FORM COMPONENT ────────────────────────────────────────────────
function PermissionForm({ initial, onSave, onCancel }: { initial: Permission | null; onSave: (p: Permission) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Permission>(
    initial ?? {
      id: "", label: "", description: "", category: "listening", guard: "authenticate",
      roles: { admin: true, artist: false, user: false },
    }
  );

  const inputCls = "w-full px-4 py-3 rounded-[10px] bg-transparent border border-[#282828] text-white text-sm outline-none focus:border-[#FF2D55] transition-all placeholder:text-[#4B5563]";
  const labelCls = "text-[10px] font-bold tracking-wider text-[#FF2D55] ml-1 uppercase block mb-1";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.label) return toast.error("Vui lòng điền đầy đủ thông tin!");
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>ID (snake_case)</label>
          <input className={inputCls} placeholder="vd: view_history" value={form.id}
            onChange={e => setForm({ ...form, id: e.target.value.replace(/\s/g, "_").toLowerCase() })} />
        </div>
        <div>
          <label className={labelCls}>Tên hiển thị</label>
          <input className={inputCls} placeholder="vd: Xem lịch sử nghe" value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Mô tả</label>
        <input className={inputCls} placeholder="Mô tả ngắn về quyền này" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nhóm (Category)</label>
          <select className={`${inputCls} bg-[#050505] cursor-pointer appearance-none`} value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value as PermCategory })}>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Guard Middleware</label>
          <input className={inputCls} placeholder="vd: requireRole(admin)" value={form.guard ?? ""}
            onChange={e => setForm({ ...form, guard: e.target.value })} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Vai trò được phép</label>
        <div className="flex gap-3 mt-2">
          {(["admin", "artist", "user"] as Role[]).map(role => {
            const meta = ROLE_META[role];
            return (
              <button key={role} type="button"
                onClick={() => role !== "admin" && setForm({ ...form, roles: { ...form.roles, [role]: !form.roles[role] } })}
                className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer text-[11px] font-bold ${
                  form.roles[role]
                    ? `${meta.bg} ${meta.border} ${meta.color}`
                    : "bg-white/[0.03] border-white/[0.06] text-zinc-600"
                } ${role === "admin" ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <FontAwesomeIcon icon={form.roles[role] ? faToggleOn : faToggleOff} className="text-[14px]" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer">
          Hủy bỏ
        </button>
        <button type="submit"
          className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-white bg-[#ff2d55] hover:bg-[#ff4b6d] transition-all active:scale-95 shadow-lg shadow-[#ff2d55]/20 cursor-pointer">
          {initial ? "Cập nhật" : "Thêm quyền"}
        </button>
      </div>
    </form>
  );
}
