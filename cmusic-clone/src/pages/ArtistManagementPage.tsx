import { useEffect, useState } from "react";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlus, 
  faSearch,
  faTrash,
  faEdit,
  faTimes,
  faUserCheck,
  faImages,
  faShareAlt,
  faMicrophone
} from "@fortawesome/free-solid-svg-icons";
import { faFacebook, faInstagram, faYoutube, faTwitter } from "@fortawesome/free-brands-svg-icons";

interface Artist {
  _id: string;
  name: string;
  avatarUrl: string;
  bannerUrl?: string;
  bio?: string;
  isVerified: boolean;
  socials?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  stats?: {
    monthlyListeners: number;
    followerCount: number;
  };
}

function ArtistManagementPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingArtist, setDeletingArtist] = useState<Artist | null>(null);
  
  // User search states for linking
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    isVerified: false,
    userId: ""
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchArtists = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const isArtist = user.role === "artist";
      const query = isArtist ? "/catalog/artists?mine=true&limit=100" : "/catalog/artists?limit=100";
      
      const res = await api.get(query);
      if (res.data.success) {
        setArtists(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleEditClick = (artist: Artist) => {
    setEditingArtist(artist);
    setFormData({
      name: artist.name,
      bio: artist.bio || "",
      facebook: artist.socials?.facebook || "",
      instagram: artist.socials?.instagram || "",
      twitter: artist.socials?.twitter || "",
      youtube: artist.socials?.youtube || "",
      isVerified: artist.isVerified,
      userId: (artist as any).userId || ""
    });
    setAvatarFile(null);
    setBannerFile(null);
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setFormData({
      name: "",
      bio: "",
      facebook: "",
      instagram: "",
      twitter: "",
      youtube: "",
      isVerified: false,
      userId: ""
    });
    setAvatarFile(null);
    setBannerFile(null);
    setUserSearchTerm("");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const multipartData = new FormData();
      multipartData.append("name", formData.name);
      multipartData.append("bio", formData.bio);
      multipartData.append("facebook", formData.facebook);
      multipartData.append("instagram", formData.instagram);
      multipartData.append("twitter", formData.twitter);
      multipartData.append("youtube", formData.youtube);
      multipartData.append("isVerified", String(formData.isVerified));
      multipartData.append("userId", formData.userId);
      
      if (avatarFile) multipartData.append("avatar", avatarFile);
      if (bannerFile) multipartData.append("banner", bannerFile);

      let res;
      if (editingArtist) {
        res = await api.put(`/catalog/artists/${editingArtist._id}`, multipartData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        res = await api.post("/catalog/artists", multipartData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (res.data.success) {
        fetchArtists();
        setEditingArtist(null);
        setIsAdding(false);
      }
    } catch (error) {
      console.error("Save artist error:", error);
      alert("Lỗi khi lưu thông tin nghệ sĩ");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingArtist) return;
    try {
      await api.delete(`/catalog/artists/${deletingArtist._id}`);
      setArtists(artists.filter(a => a._id !== deletingArtist._id));
      setDeletingArtist(null);
    } catch (error) {
      alert("Xóa thất bại!");
    }
  };

  const handleUserSearch = async (val: string) => {
    setUserSearchTerm(val);
    if (val.length < 2) {
      setSuggestedUsers([]);
      return;
    }
    try {
      const res = await api.get(`/users?search=${val}&limit=5`);
      if (res.data.success) {
        setSuggestedUsers(res.data.data.users || []);
      }
    } catch (err) {
      console.error("User search error:", err);
    }
  };

  const filteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] font-inter antialiased">
      {/* Header Section */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-purple-500 rounded-full drop-shadow-[0_0_5px_#a855f7]"></div>
          <div>
            <h1 className="text-white text-[18px] font-bold tracking-tight leading-none">Quản lý Nghệ sĩ</h1>
            <p className="text-zinc-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-70">Xây dựng thương hiệu và quản lý hồ sơ nghệ sĩ</p>
          </div>
        </div>
        {JSON.parse(localStorage.getItem("user") || "{}").role === "admin" && (
          <button 
            onClick={handleAddClick}
            className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-purple-600/10 flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
            Thêm nghệ sĩ mới
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-10 py-6 flex gap-4">
        <div className="relative flex-1 group">
          <FontAwesomeIcon icon={faSearch} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors text-sm" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nghệ sĩ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-white/[0.05] rounded-xl py-3.5 pl-14 pr-6 text-white text-[13px] outline-none focus:border-purple-500/30 transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="px-10 pb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          [...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#0c0c0c] border border-white/[0.05] rounded-[32px] h-[350px] animate-pulse"></div>
          ))
        ) : filteredArtists.map((artist) => (
          <div key={artist._id} className="bg-[#0c0c0c] border border-white/[0.05] rounded-[32px] overflow-hidden group hover:border-purple-500/30 transition-all shadow-2xl relative flex flex-col">
            {/* Banner Preview */}
            <div className="h-32 bg-zinc-900 relative">
               {artist.bannerUrl && (
                 <img src={artist.bannerUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" alt="" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] to-transparent"></div>
            </div>

            {/* Avatar & Content */}
            <div className="px-6 pb-8 flex-1 flex flex-col items-center -mt-16 relative z-10 text-center">
               <div className="w-24 h-24 rounded-full border-4 border-[#0c0c0c] shadow-2xl overflow-hidden mb-4 bg-zinc-800">
                  <img src={artist.avatarUrl} className="w-full h-full object-cover" alt="" />
               </div>
               
               <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold text-lg">{artist.name}</h3>
                  {artist.isVerified && <FontAwesomeIcon icon={faUserCheck} className="text-blue-400 text-xs" />}
               </div>
               
               <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-4">Nghệ sĩ CMusic</p>
               
               <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed mb-6 px-2 min-h-[32px]">
                  {artist.bio || "Chưa có tiểu sử công khai."}
               </p>

               <div className="flex gap-4 mb-8">
                  <div className="text-center">
                     <p className="text-white font-bold text-sm">{(artist.stats?.monthlyListeners || 0).toLocaleString()}</p>
                     <p className="text-zinc-600 text-[9px] uppercase font-black tracking-widest mt-1">Lượt nghe</p>
                  </div>
                  <div className="w-px h-8 bg-white/5"></div>
                  <div className="text-center">
                     <p className="text-white font-bold text-sm">{(artist.stats?.followerCount || 0).toLocaleString()}</p>
                     <p className="text-zinc-600 text-[9px] uppercase font-black tracking-widest mt-1">Followers</p>
                  </div>
               </div>

               <div className="w-full flex gap-3 mt-auto pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleEditClick(artist)}
                    className="flex-1 bg-white/[0.03] hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                     <FontAwesomeIcon icon={faEdit} className="text-zinc-400" />
                     Chỉnh sửa
                  </button>
                  {JSON.parse(localStorage.getItem("user") || "{}").role === "admin" && (
                    <button 
                      onClick={() => setDeletingArtist(artist)}
                      className="w-12 h-12 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {(editingArtist || isAdding) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#0c0c0c] border border-white/10 rounded-[40px] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
              <div className="px-10 py-8 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                 <div>
                    <h2 className="text-white font-bold text-xl">{isAdding ? "Thêm Nghệ sĩ mới" : "Chỉnh sửa Nghệ sĩ"}</h2>
                    <p className="text-zinc-500 text-xs mt-1">Cập nhật thông tin nhận diện thương hiệu</p>
                 </div>
                 <button onClick={() => { setEditingArtist(null); setIsAdding(false); }} className="w-10 h-10 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-colors flex items-center justify-center">
                    <FontAwesomeIcon icon={faTimes} />
                 </button>
              </div>

              <div className="flex h-[65vh]">
                 {/* Left: Previews & Uploads */}
                 <div className="w-1/3 border-r border-white/5 p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    {/* Banner Card */}
                    <div className="space-y-4">
                       <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <FontAwesomeIcon icon={faImages} /> Ảnh bìa (Banner)
                       </label>
                       <div className="h-40 bg-zinc-800 rounded-3xl overflow-hidden relative group cursor-pointer border-2 border-dashed border-white/10 hover:border-purple-500/50 transition-all">
                          {(bannerFile || editingArtist?.bannerUrl) && (
                            <img 
                              src={bannerFile ? URL.createObjectURL(bannerFile) : editingArtist?.bannerUrl} 
                              className="w-full h-full object-cover" 
                              alt="" 
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="bg-white/10 px-4 py-2 rounded-full text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">Thay đổi bìa</div>
                          </div>
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setBannerFile(e.target.files[0])} />
                       </div>
                    </div>

                    {/* Avatar Card */}
                    <div className="space-y-4 text-center">
                       <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest block text-left">Ảnh đại diện (Avatar)</label>
                       <div className="w-32 h-32 rounded-full border-4 border-white/10 shadow-2xl mx-auto overflow-hidden relative group cursor-pointer bg-zinc-800">
                          {(avatarFile || editingArtist?.avatarUrl) && (
                            <img 
                              src={avatarFile ? URL.createObjectURL(avatarFile) : editingArtist?.avatarUrl} 
                              className="w-full h-full object-cover" 
                              alt="" 
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <FontAwesomeIcon icon={faEdit} className="text-white" />
                          </div>
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} />
                       </div>
                    </div>
                 </div>

                 {/* Right: Text Fields */}
                 <div className="flex-1 p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Tên Nghệ sĩ</label>
                          <input 
                            type="text" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-medium"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Tích xanh xác minh</label>
                          <div 
                            onClick={() => setFormData({...formData, isVerified: !formData.isVerified})}
                            className={`w-full h-[54px] border rounded-2xl flex items-center px-6 cursor-pointer transition-all ${formData.isVerified ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-white/[0.03] border-white/10 text-zinc-500'}`}
                          >
                             <FontAwesomeIcon icon={faUserCheck} className="mr-3" />
                             <span className="text-sm font-bold uppercase tracking-widest">{formData.isVerified ? "Đã xác nhận" : "Chưa xác nhận"}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <FontAwesomeIcon icon={faMicrophone} /> Tiểu sử Nghệ sĩ
                       </label>
                       <textarea 
                         rows={6}
                         value={formData.bio}
                         onChange={(e) => setFormData({...formData, bio: e.target.value})}
                         placeholder="Nhập giới thiệu về quá trình hoạt động, thành tựu..."
                         className="w-full bg-white/[0.03] border border-white/10 rounded-3xl py-4 px-6 text-white text-sm outline-none focus:border-purple-500/50 transition-all font-medium resize-none leading-relaxed"
                       />
                    </div>

                    <div className="space-y-4">
                       <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <FontAwesomeIcon icon={faShareAlt} /> Liên kết mạng xã hội
                       </label>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-2xl px-5 group focus-within:border-blue-500/50 transition-all">
                             <FontAwesomeIcon icon={faFacebook as any} className="text-[#1877F2] text-lg mr-4" />
                             <input type="text" placeholder="Facebook URL" value={formData.facebook} onChange={(e) => setFormData({...formData, facebook: e.target.value})} className="bg-transparent flex-1 py-4 text-xs text-white outline-none" />
                          </div>
                          <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-2xl px-5 group focus-within:border-pink-500/50 transition-all">
                             <FontAwesomeIcon icon={faInstagram as any} className="text-[#E4405F] text-lg mr-4" />
                             <input type="text" placeholder="Instagram URL" value={formData.instagram} onChange={(e) => setFormData({...formData, instagram: e.target.value})} className="bg-transparent flex-1 py-4 text-xs text-white outline-none" />
                          </div>
                          <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-2xl px-5 group focus-within:border-red-500/50 transition-all">
                             <FontAwesomeIcon icon={faYoutube as any} className="text-[#FF0000] text-lg mr-4" />
                             <input type="text" placeholder="YouTube URL" value={formData.youtube} onChange={(e) => setFormData({...formData, youtube: e.target.value})} className="bg-transparent flex-1 py-4 text-xs text-white outline-none" />
                          </div>
                          <div className="flex items-center bg-white/[0.03] border border-white/10 rounded-2xl px-5 group focus-within:border-blue-400/50 transition-all">
                             <FontAwesomeIcon icon={faTwitter as any} className="text-[#1DA1F2] text-lg mr-4" />
                             <input type="text" placeholder="Twitter URL" value={formData.twitter} onChange={(e) => setFormData({...formData, twitter: e.target.value})} className="bg-transparent flex-1 py-4 text-xs text-white outline-none" />
                          </div>

                          {/* User Owner ID Field - Smart Linker */}
                          <div className="col-span-2 space-y-3">
                              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                 <FontAwesomeIcon icon={faUserCheck} className="text-purple-500" /> Chủ sở hữu hồ sơ (Tài khoản người dùng)
                              </label>
                              
                              <div className="relative">
                                 <div className="flex items-center bg-purple-500/5 border border-purple-500/20 rounded-2xl px-5 group focus-within:border-purple-500/50 transition-all">
                                    <FontAwesomeIcon icon={faSearch} className="text-zinc-600 mr-4 text-xs" />
                                    <input 
                                       type="text" 
                                       placeholder="Tìm theo tên hoặc email để liên kết..." 
                                       value={userSearchTerm} 
                                       onChange={(e) => handleUserSearch(e.target.value)}
                                       className="bg-transparent flex-1 py-4 text-xs text-white outline-none placeholder:text-zinc-700" 
                                    />
                                    {formData.userId && (
                                       <div className="bg-purple-500 text-white text-[9px] font-black px-2 py-1 rounded-md ml-2">
                                          ID: {formData.userId.substring(0, 8)}...
                                       </div>
                                    )}
                                 </div>

                                 {/* Search Suggestions */}
                                 {userSearchTerm && suggestedUsers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50">
                                       {suggestedUsers.map(u => (
                                          <div 
                                             key={u._id}
                                             onClick={() => {
                                                setFormData({...formData, userId: u._id});
                                                setUserSearchTerm(u.displayName);
                                                setSuggestedUsers([]);
                                             }}
                                             className="px-5 py-3 hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                                          >
                                             <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold border border-white/5">
                                                   {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover rounded-full" /> : u.displayName.charAt(0)}
                                                </div>
                                                <div>
                                                   <p className="text-white text-[12px] font-bold">{u.displayName}</p>
                                                   <p className="text-zinc-500 text-[10px]">{u.email}</p>
                                                </div>
                                             </div>
                                             <span className="text-purple-500 text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Chọn tài khoản</span>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </div>
                              <p className="text-zinc-600 text-[9px] font-medium px-1 italic">
                                 * Khi liên kết, người dùng này có thể đăng nhập vào Artist Studio để quản lý nhạc và xem thống kê của hồ sơ này.
                              </p>
                           </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="px-10 py-8 border-t border-white/10 bg-white/[0.02] flex justify-end gap-4">
                 <button 
                   onClick={() => { setEditingArtist(null); setIsAdding(false); }}
                   className="px-8 py-3 rounded-2xl text-zinc-400 font-bold hover:text-white transition-all uppercase tracking-widest text-[11px]"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                   disabled={saving}
                   onClick={handleSave}
                   className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20"
                 >
                    {saving ? "Đang xử lý..." : isAdding ? "Thêm nghệ sĩ" : "Lưu thay đổi"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingArtist && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="bg-[#0c0c0c] border border-white/10 rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
              <div className="p-10 text-center space-y-6">
                 <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faTrash} className="text-red-500 text-2xl" />
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-white font-bold text-xl">Xóa hồ sơ nghệ sĩ?</h2>
                    <p className="text-zinc-500 text-sm leading-relaxed px-4">
                       Hành động này sẽ xóa vĩnh viễn hồ sơ của <span className="text-white font-bold">"{deletingArtist.name}"</span>. Các bài hát liên kết sẽ không bị xóa nhưng sẽ mất thông tin tác giả chi tiết.
                    </p>
                 </div>
                 <div className="flex flex-col gap-3 pt-4">
                    <button onClick={confirmDelete} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all">Xác nhận xóa ngay</button>
                    <button onClick={() => setDeletingArtist(null)} className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all border border-white/5">Hủy bỏ</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default ArtistManagementPage;
