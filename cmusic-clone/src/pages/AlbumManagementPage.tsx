import React, { useEffect, useState } from "react";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faTimes,
  faCompactDisc
} from "@fortawesome/free-solid-svg-icons";

interface Album {
  _id: string;
  title: string;
  genre: string[];
  description?: string;
  coverUrl: string;
  releaseDate: string;
  trackIds: any[];
  artistId?: { _id: string, displayName: string };
  createdAt: string;
}

const GENRES = ["V-POP", "K-POP", "US-UK", "Rock", "R&B", "Indie", "Rap", "Lofi"];

const AlbumManagementPage: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // States cho form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("V-POP");
  const [description, setDescription] = useState("");
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear().toString());
  const [cover, setCover] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // State tìm kiếm nhạc trong Modal
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [albumRes, trackRes] = await Promise.all([
        api.get("/catalog/albums"),
        api.get("/catalog/tracks?limit=100")
      ]);
      setAlbums(albumRes.data.data || []);
      setTracks(trackRes.data.data?.tracks || []);
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (album?: Album) => {
    if (album) {
      setEditingId(album._id);
      setTitle(album.title);
      setGenre(album.genre?.[0] || "V-POP");
      setDescription(album.description || "");
      setReleaseYear(new Date(album.releaseDate).getFullYear().toString());
      setCurrentCoverUrl(album.coverUrl);
      setSelectedTrackIds(album.trackIds.map(t => t._id || t));
    } else {
      setEditingId(null);
      setTitle("");
      setGenre("V-POP");
      setDescription("");
      setReleaseYear(new Date().getFullYear().toString());
      setCover(null);
      setCurrentCoverUrl(null);
      setSelectedTrackIds([]);
    }
    setModalSearchTerm("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("genre", genre);
    formData.append("description", description);
    formData.append("releaseDate", `${releaseYear}-01-01`);
    if (cover) formData.append("cover", cover);
    formData.append("trackIds", JSON.stringify(selectedTrackIds));

    // Gán artist mặc định nếu không có trong session (demo)
    formData.append("artistId", "65f1a2b3c4d5e6f7a8b9c0d1");

    try {
      // Đảm bảo gửi dạng Multipart/form-data chuẩn
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingId) {
        await api.put(`/catalog/albums/${editingId}`, formData, config);
      } else {
        await api.post("/catalog/albums", formData, config);
      }
      
      setIsModalOpen(false);
      await fetchData(); 
    } catch (error) {
      alert("Đã xảy ra lỗi khi lưu album. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, albumTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa album "${albumTitle}"?`)) return;
    try {
      await api.delete(`/catalog/albums/${id}`);
      fetchData();
    } catch (error) {
      alert("Không thể xóa album");
    }
  };

  const toggleTrackSelection = (id: string) => {
    setSelectedTrackIds(prev =>
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const filteredAlbums = albums.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTracksForModal = tracks.filter(t =>
    t.title.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
    t.artist.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] font-inter antialiased">

      {/* Header */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
          <div>
            <h1 className="text-white text-[18px] font-black tracking-tight leading-none uppercase">Album Studio</h1>
            <p className="text-zinc-500 text-[10px] mt-1.5 font-bold uppercase tracking-widest opacity-70 italic">Thiết kế không gian âm nhạc chuyên nghiệp</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#ff2d55] hover:bg-[#ff4b6d] text-white text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-lg shadow-[#ff2d55]/20 flex items-center gap-3 active:scale-95"
        >
          <FontAwesomeIcon icon={faPlus} />
          Khởi tạo Album
        </button>
      </div>

      {/* Global Search */}
      <div className="px-10 py-6">
        <div className="relative group">
          <FontAwesomeIcon icon={faSearch} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#ff2d55] transition-colors text-sm" />
          <input
            type="text"
            placeholder="Tìm kiếm tác phẩm của bạn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-white/[0.05] rounded-2xl py-4.5 pl-16 pr-8 text-white text-[13px] outline-none focus:border-[#ff2d55]/30 transition-all placeholder:text-zinc-700 font-medium"
          />
        </div>
      </div>

      {/* Content Table */}
      <div className="px-10 pb-10">
        <div className="bg-[#0c0c0c]/50 border border-white/[0.05] rounded-[32px] overflow-hidden shadow-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-600 text-[9px] uppercase tracking-[0.3em] font-black">
                <th className="px-10 py-6 w-[80px]">Thứ tự</th>
                <th className="px-10 py-6">Bộ sưu tập</th>
                <th className="px-10 py-6">Thể loại</th>
                <th className="px-10 py-6">Quy mô</th>
                <th className="px-10 py-6 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-white/[0.03]">
                    <td colSpan={5} className="px-10 py-10 h-12 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : filteredAlbums.length > 0 ? (
                filteredAlbums.map((album, i) => (
                  <tr key={album._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all group">
                    <td className="px-10 py-6 text-zinc-800 text-[12px] font-black">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-[#111] overflow-hidden border border-white/10 shadow-xl group-hover:border-[#ff2d55]/40 transition-all duration-500">
                          <img src={album.coverUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-white text-[14px] font-black tracking-tight group-hover:text-[#ff2d55] transition-colors">{album.title}</p>
                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{new Date(album.releaseDate).getFullYear()} • {album.artistId?.displayName || "Official Artist"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest italic">{album.genre?.[0] || "General"}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg">
                          <FontAwesomeIcon icon={faCompactDisc} className="text-[#ff2d55] text-[10px]" />
                        </div>
                        <span className="text-zinc-400 text-[11px] font-black">{album.trackIds.length} Tác phẩm</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleOpenModal(album)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] text-zinc-600 hover:text-white hover:bg-[#ff2d55]/10 transition-all active:scale-90">
                          <FontAwesomeIcon icon={faEdit} className="text-[12px]" />
                        </button>
                        <button onClick={() => handleDelete(album._id, album.title)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90">
                          <FontAwesomeIcon icon={faTrash} className="text-[12px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-10 py-32 text-center text-zinc-800 font-black uppercase tracking-[0.2em] italic text-xs">Phòng Lap hiện đang trống...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL MODAL UPGRADE - ĐỒNG BỘ VỚI TRACK MANAGEMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
               <h2 className="text-white font-bold text-lg">{editingId ? "Chỉnh sửa Album" : "Thêm Album mới"}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <FontAwesomeIcon icon={faTimes} />
               </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* Visual Section */}
                <div className="flex items-center gap-8 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                  <div className="w-32 h-32 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-white/10 group relative">
                    <img 
                      src={cover ? URL.createObjectURL(cover) : (currentCoverUrl || "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?w=300&h=300&fit=crop")} 
                      className="w-full h-full object-cover" 
                      alt="Cover Preview" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <FontAwesomeIcon icon={faEdit} className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-white font-bold text-sm">Ảnh bìa Album</h3>
                    <p className="text-zinc-500 text-[11px] font-medium leading-relaxed">Định dạng JPG hoặc PNG. Tối đa 2MB.</p>
                    <label className="inline-block bg-white/[0.05] hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg cursor-pointer transition-all border border-white/5">
                       Thay đổi ảnh
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Tiêu đề Album</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Thể loại chính</label>
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium"
                    >
                      {GENRES.map(g => <option key={g} value={g} className="bg-[#0c0c0c]">{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Năm phát hành</label>
                    <input 
                      type="number" 
                      value={releaseYear} 
                      onChange={(e) => setReleaseYear(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Mô tả album</label>
                  <textarea 
                    rows={4} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium resize-none leading-relaxed" 
                  />
                </div>

                {/* Select Tracks Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Bài hát trong Album ({selectedTrackIds.length})</label>
                    <div className="relative w-48 group">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#ff2d55] text-[10px]" />
                      <input 
                        type="text" 
                        placeholder="Tìm bài hát..." 
                        value={modalSearchTerm}
                        onChange={(e) => setModalSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-white text-[11px] outline-none focus:border-[#ff2d55]/30 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                      {filteredTracksForModal.map(t => {
                        const isSelected = selectedTrackIds.includes(t._id);
                        return (
                          <div 
                            key={t._id}
                            onClick={() => toggleTrackSelection(t._id)}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.02] last:border-0 cursor-pointer transition-all ${isSelected ? "bg-[#ff2d55]/5" : "hover:bg-white/[0.03]"}`}
                          >
                             <div className="w-8 h-8 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                                <img src={t.coverUrl} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className={`text-[12px] font-bold truncate ${isSelected ? "text-[#ff2d55]" : "text-white"}`}>{t.title}</p>
                                <p className="text-zinc-500 text-[10px] truncate">{t.artist}</p>
                             </div>
                             <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${isSelected ? "bg-[#ff2d55] border-[#ff2d55]" : "border-white/20"}`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-white/10 bg-white/[0.02] flex justify-end gap-4">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-zinc-400 font-bold hover:text-white transition-all">Hủy</button>
                 <button type="submit" disabled={saving} className="bg-[#ff2d55] hover:bg-[#ff4b6d] text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#ff2d55]/20">
                    {saving ? "Đang lưu..." : (editingId ? "Cập nhật Album" : "Tạo Album ngay")}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumManagementPage;
