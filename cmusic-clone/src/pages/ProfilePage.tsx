import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faMusic,
  faClock,
  faCamera,
  faEye,
  faEyeSlash,
  faMagic,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import { fetchPlaylists } from "../store/slices/playlistSlice";
import { AppDispatch, RootState } from "../store/store";
import toast from "react-hot-toast";

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "{}"));
  const isPremium = user.plan && user.plan !== "free";

  // Data from Redux
  const playlists = useSelector((state: RootState) => state.playlists.items.data);

  // Local state for other stats
  const [likedSongsCount, setLikedSongsCount] = useState(0);
  const [listeningStats, setListeningStats] = useState({ totalHours: 0, topGenre: "Đang tải...", recentActivity: [] });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Artist Request states
  const [artistRequest, setArtistRequest] = useState<any>(null);
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistFormData, setArtistFormData] = useState({
    stageName: "",
    bio: "",
    socialFacebook: "",
    socialInstagram: "",
    socialSoundcloud: "",
    socialYoutube: "",
    reason: ""
  });

  // Map invalid localstorage gender values to valid MongoDB enum
  const mapGenderToEnum = (g: string) => {
    if (g === 'Nam' || g === 'male') return 'male';
    if (g === 'Nữ' || g === 'female') return 'female';
    if (g === 'Khác' || g === 'other') return 'other';
    return 'prefer_not_to_say';
  };

  const [formData, setFormData] = useState({
    displayName: user.displayName || "",
    bio: user.bio || "",
    gender: mapGenderToEnum(user.gender),
    country: user.country || "VN",
    oldPassword: "",
    password: ""
  });

  useEffect(() => {
    dispatch(fetchPlaylists());

    const fetchAllData = async () => {
      try {
        const [userRes, likesRes, historyRes, artistReqRes] = await Promise.all([
          api.get("/users/me"),
          api.get("/likes/tracks"),
          api.get("/history/stats").catch(() => ({ data: { success: true, data: { topTracks: [] } } })),
          api.get("/users/artist-request/me").catch(() => ({ data: { success: true, data: { request: null } } }))
        ]);

        if (userRes.data.success) {
          const updatedUser = userRes.data.data.user;
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        if (likesRes.data.success) {
          setLikedSongsCount(likesRes.data.data.length);
        }

        if (historyRes.data.success) {
          const topTracks = historyRes.data.data.topTracks || [];
          setListeningStats({
            totalHours: Math.floor(topTracks.length * 0.5),
            topGenre: "V-Pop",
            recentActivity: topTracks.slice(0, 3).map((t: any) => ({
              icon: faMusic,
              title: `Nghe ${t.trackDetails.title}`,
              time: "Gần đây"
            }))
          });
        }

        if (artistReqRes.data.success) {
          setArtistRequest(artistReqRes.data.data.request);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchAllData();
  }, [dispatch]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      if (formData.password) {
        if (!formData.oldPassword) {
          toast.error("Vui lòng nhập mật khẩu cũ để đổi mật khẩu mới");
          setEditLoading(false);
          return;
        }

        const pwdRes = await api.post("/auth/change-password", {
          oldPassword: formData.oldPassword,
          newPassword: formData.password
        });

        if (!pwdRes.data.success) {
          toast.error(pwdRes.data.message || "Đổi mật khẩu thất bại");
          setEditLoading(false);
          return;
        }
      }

      const submitData = new FormData();
      submitData.append("displayName", formData.displayName);
      submitData.append("bio", formData.bio);
      submitData.append("gender", formData.gender);
      submitData.append("country", formData.country);
      if (avatarFile) submitData.append("avatar", avatarFile);

      const res = await api.put(`/users/${user._id || user.id}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        toast.success(formData.password ? "Cập nhật thông tin và mật khẩu thành công!" : "Cập nhật thông tin thành công!");
        const updatedUser = res.data.data.user || res.data.data;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setShowEditModal(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        setFormData({ ...formData, oldPassword: "", password: "" });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại!");
    } finally {
      setEditLoading(false);
    }
  };

  const handleArtistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setArtistLoading(true);
    try {
      const payload = {
        stageName: artistFormData.stageName,
        bio: artistFormData.bio,
        reason: artistFormData.reason,
        socialLinks: {
          facebook: artistFormData.socialFacebook,
          instagram: artistFormData.socialInstagram,
          soundcloud: artistFormData.socialSoundcloud,
          youtube: artistFormData.socialYoutube,
        }
      };
      const res = await api.post("/users/artist-request", payload);
      if (res.data.success) {
        toast.success("Gửi yêu cầu đăng ký nghệ sĩ thành công!");
        setArtistRequest(res.data.data.request);
        setShowArtistModal(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gửi yêu cầu thất bại!");
    } finally {
      setArtistLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, password: pass });
    toast.success("Đã tạo mật khẩu ngẫu nhiên!");
  };

  const stats = [
    { label: "Bài hát đã thích", value: likedSongsCount.toString(), color: "text-white" },
    { label: "Playlist", value: playlists.length.toString(), color: "text-white" },
    { label: "Theo dõi", value: "0", color: "text-white" },
    { label: "Người theo dõi", value: "0", color: "text-white" },
  ];

  return (
    <div className="h-full w-full bg-[#000000] p-0 overflow-y-auto text-left custom-scrollbar-hidden">
      <div className="w-full min-h-full bg-[#000000] rounded-t-[32px] md:rounded-t-[48px] p-6 md:p-10 border-t border-white/5 pb-32">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Header Info Card */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-8 transition-all hover:bg-zinc-900/60">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-full flex items-center justify-center text-6xl font-bold shadow-[0_0_40px_rgba(79,70,229,0.2)] shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  user.displayName?.charAt(0).toUpperCase() || "A"
                )}
              </div>

              <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start pt-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-black text-white tracking-tight">{user.displayName || "Người dùng"}</h1>
                  {isPremium && (
                    <div className="flex flex-col items-center md:items-start gap-2">
                      <span className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <FontAwesomeIcon icon={faCrown} />
                        {user.plan === 'premium' ? 'Premium Cá nhân' : user.plan}
                      </span>
                      {user.premiumExpiresAt && (
                        <p className="text-[11px] text-zinc-500 font-medium">
                          Hết hạn: {new Date(user.premiumExpiresAt).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-zinc-400 text-sm mb-6 font-medium">{user.email || "Chưa cập nhật email"}</p>

                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setFormData({
                        displayName: user.displayName || "",
                        bio: user.bio || "",
                        gender: mapGenderToEnum(user.gender),
                        country: user.country || "VN",
                        oldPassword: "",
                        password: ""
                      });
                      setShowEditModal(true);
                    }}
                    className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:scale-105 transition-all active:scale-95 shadow-lg cursor-pointer"
                  >
                    Chỉnh sửa hồ sơ
                  </button>
                  {user.role !== 'artist' && !artistRequest && (
                    <button
                      onClick={() => setShowArtistModal(true)}
                      className="bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      Trở thành Nghệ sĩ
                    </button>
                  )}
                  {user.role !== 'artist' && artistRequest?.status === 'pending' && (
                    <button
                      disabled
                      className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-6 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed"
                    >
                      Đang chờ duyệt
                    </button>
                  )}
                  {user.role !== 'artist' && artistRequest?.status === 'rejected' && (
                    <button
                      onClick={() => setShowArtistModal(true)}
                      className="bg-red-500/20 text-red-500 border border-red-500/30 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                    >
                      Bị từ chối - Gửi lại
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 rounded-[24px] p-6 text-center transition-all hover:bg-zinc-900/60 hover:border-white/10 group">
                <p className="text-3xl font-black text-white tracking-tight group-hover:scale-110 transition-transform">{stat.value}</p>
                <p className="text-zinc-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Activity & Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-8 transition-all hover:bg-zinc-900/60">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Hoạt động gần đây
              </h3>
              <div className="space-y-6">
                {(listeningStats.recentActivity.length > 0 ? listeningStats.recentActivity : [
                  { icon: faMusic, title: "Chưa có hoạt động", time: "Bắt đầu nghe ngay" }
                ]).map((act: any, i: number) => (
                  <div key={i} className="flex items-center gap-5 group cursor-pointer">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center text-xl transition-all group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                      <FontAwesomeIcon icon={act.icon} />
                    </div>
                    <div>
                      <p className="text-zinc-100 font-bold text-[16px] group-hover:text-white transition-colors">{act.title}</p>
                      <p className="text-zinc-500 text-[13px] mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-[32px] p-8 transition-all hover:bg-zinc-900/60">
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                Thống kê nghe nhạc
              </h3>
              <div className="space-y-10">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-zinc-100 font-bold text-[16px]">Thời gian nghe</span>
                    <span className="text-indigo-400 font-black text-[16px]">{listeningStats.totalHours} giờ</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]" style={{ width: `${Math.min(listeningStats.totalHours * 10, 100)}%` }}></div>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-5">
                    <span className="text-zinc-100 font-bold text-[16px]">Thể loại yêu thích</span>
                    <span className="text-indigo-400 font-black text-[16px]">{listeningStats.topGenre}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {["V-Pop", "US-UK", "Lofi"].map((tag, i) => (
                      <span key={i} className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${tag === "V-Pop" ? "bg-indigo-500 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            <div className="bg-zinc-900/40 rounded-[32px] p-8 shadow-sm border border-white/5 transition-all hover:bg-zinc-900/60 group">
              <div className="flex items-center gap-2 text-indigo-400 mb-5">
                <FontAwesomeIcon icon={faCrown} className="text-lg" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">{isPremium ? "Đặc quyền VIP" : "Featured"}</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors">{isPremium ? "Thành viên Premium" : "Music Premium"}</h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">{isPremium ? "Bạn đang tận hưởng âm nhạc chất lượng cao nhất (320kbps) và hoàn toàn không có quảng cáo. Cảm ơn bạn đã đồng hành cùng CMusic!" : "Nâng cấp gói Premium để tận hưởng âm nhạc chất lượng cao nhất và không quảng cáo."}</p>
            </div>
            <div className="bg-zinc-900/40 rounded-[32px] p-8 shadow-sm border border-white/5 transition-all hover:bg-zinc-900/60 group">
              <div className="flex items-center gap-2 text-blue-400 mb-5">
                <FontAwesomeIcon icon={faClock} className="text-lg" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Khám phá</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 group-hover:text-blue-400 transition-colors">Dành riêng cho bạn</h3>
              <p className="text-zinc-500 text-sm font-medium leading-relaxed">{isPremium ? "Dựa trên gu âm nhạc Premium của bạn, chúng tôi đã chuẩn bị những danh sách phát độc quyền. Hãy khám phá ngay!" : "Luôn cập nhật những bản hit mới nhất được đề xuất riêng cho gu âm nhạc của bạn."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {/* (Mã của Modal EditProfile đã có ở trên) */}
      {/* ... keeping the rest the same until bottom */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowEditModal(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-[#0c0c0c] rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">

            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-white font-bold text-lg">Chỉnh sửa hồ sơ</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-zinc-900 flex items-center justify-center">
                    {avatarPreview || user.avatarUrl ? (
                      <img src={avatarPreview || user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <span className="text-3xl font-black text-white">{user.displayName?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-zinc-800 border border-white/10 hover:bg-zinc-700 rounded-full flex items-center justify-center text-white cursor-pointer transition-all">
                    <FontAwesomeIcon icon={faCamera} className="text-xs" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-5">

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold ml-1">Tên hiển thị</label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="Nhập tên của bạn..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-xs font-bold ml-1">Giới tính</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                      <option value="prefer_not_to_say">Không tiết lộ</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-xs font-bold ml-1">Quốc gia</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="VD: Vietnam"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-zinc-400 text-xs font-bold ml-1">Gói cước</label>
                    <div className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 text-white text-sm capitalize">
                      {user.plan || "Free"}
                    </div>
                  </div>
                  <div className="space-y-1.5 opacity-60">
                    <label className="text-zinc-400 text-xs font-bold ml-1">Email</label>
                    <div className="w-full bg-[#121212] border border-white/5 rounded-xl py-3 px-4 text-zinc-500 text-sm truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400 text-xs font-bold ml-1">Mật khẩu cũ (nếu muốn đổi mật khẩu)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.oldPassword || ''}
                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                        className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="Nhập mật khẩu hiện tại..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-zinc-400 text-xs font-bold ml-1">Mật khẩu mới</label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <FontAwesomeIcon icon={faMagic} />
                        Tạo mã tự động
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 pr-10 text-white text-sm outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="Để trống nếu không muốn đổi..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-300 font-bold text-sm hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-[1.5] py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {editLoading ? "Đang xử lý..." : "Lưu thông tin"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* Artist Application Modal */}
      {showArtistModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowArtistModal(false)}
          />

          <div className="relative z-10 w-full max-w-md bg-[#0c0c0c] rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">

            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-white font-bold text-lg">Đăng ký trở thành Nghệ sĩ</h3>
              <button onClick={() => setShowArtistModal(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

              <form onSubmit={handleArtistSubmit} className="space-y-4">

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold ml-1">Nghệ danh <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={artistFormData.stageName}
                    onChange={(e) => setArtistFormData({ ...artistFormData, stageName: e.target.value })}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-indigo-500/50 transition-all"
                    placeholder="VD: Sơn Tùng M-TP"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold ml-1">Giới thiệu ngắn</label>
                  <textarea
                    value={artistFormData.bio}
                    onChange={(e) => setArtistFormData({ ...artistFormData, bio: e.target.value })}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-indigo-500/50 transition-all min-h-[80px]"
                    placeholder="Mô tả về phong cách âm nhạc của bạn..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold ml-1">Lý do đăng ký</label>
                  <textarea
                    value={artistFormData.reason}
                    onChange={(e) => setArtistFormData({ ...artistFormData, reason: e.target.value })}
                    className="w-full bg-[#121212] border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-indigo-500/50 transition-all min-h-[80px]"
                    placeholder="Bạn muốn chia sẻ điều gì với cộng đồng?"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 text-xs font-bold ml-1">Mạng xã hội (không bắt buộc)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={artistFormData.socialFacebook}
                      onChange={(e) => setArtistFormData({ ...artistFormData, socialFacebook: e.target.value })}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs outline-none focus:border-indigo-500/50"
                      placeholder="Link Facebook"
                    />
                    <input
                      type="text"
                      value={artistFormData.socialInstagram}
                      onChange={(e) => setArtistFormData({ ...artistFormData, socialInstagram: e.target.value })}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs outline-none focus:border-indigo-500/50"
                      placeholder="Link Instagram"
                    />
                    <input
                      type="text"
                      value={artistFormData.socialSoundcloud}
                      onChange={(e) => setArtistFormData({ ...artistFormData, socialSoundcloud: e.target.value })}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs outline-none focus:border-indigo-500/50"
                      placeholder="Link Soundcloud"
                    />
                    <input
                      type="text"
                      value={artistFormData.socialYoutube}
                      onChange={(e) => setArtistFormData({ ...artistFormData, socialYoutube: e.target.value })}
                      className="w-full bg-[#121212] border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs outline-none focus:border-indigo-500/50"
                      placeholder="Link Youtube"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowArtistModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-300 font-bold text-sm hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={artistLoading}
                    className="flex-[1.5] py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {artistLoading ? "Đang xử lý..." : "Gửi yêu cầu"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
