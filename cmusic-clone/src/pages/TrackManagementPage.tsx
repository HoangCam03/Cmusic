import { useEffect, useState } from "react";
import api from "../services/api"; // Added comment
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faTrash,
  faEdit,
  faTimes
} from "@fortawesome/free-solid-svg-icons";

interface Track {
  _id: string;
  title: string;
  artist: string;
  artistId: any;
  coverUrl: string;
  playCount: number;
  duration: number;
  createdAt: string;
  lyrics?: string;
  genre?: string[];
}

export default function TrackManagementPage() {
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [officialArtists, setOfficialArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [allAlbums, setAllAlbums] = useState<any[]>([]);
  const [editFormData, setEditFormData] = useState({
    title: "",
    artist: "",
    genre: "",
    lyrics: "",
    artistId: "",
    albumId: "",
    coverUrl: ""
  });
  const [selectedArtists, setSelectedArtists] = useState<any[]>([]);
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingTrack, setDeletingTrack] = useState<Track | null>(null);

  const fetchTracks = async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isArtist = user.role === "artist";
    const trackQuery = isArtist ? `/catalog/tracks?mine=true&limit=100` : `/catalog/tracks?limit=100`;

    const [tracksRes, officialRes, albumsRes] = await Promise.allSettled([
      api.get(trackQuery),
      api.get(`/catalog/artists?limit=1000`),
      api.get(`/catalog/albums`)
    ]);

    // Tracks
    if (tracksRes.status === "fulfilled" && tracksRes.value.data.success) {
      setTracks(tracksRes.value.data.data.tracks || tracksRes.value.data.data || []);
    }


    // Official Artist Profiles - response: { data: [...] }
    if (officialRes.status === "fulfilled" && officialRes.value.data.success) {
      setOfficialArtists(officialRes.value.data.data || []);
    }

    // Albums - response: { data: [...] } array trực tiếp
    if (albumsRes.status === "fulfilled" && albumsRes.value.data.success) {
      const albumData = albumsRes.value.data.data;
      setAllAlbums(Array.isArray(albumData) ? albumData : (albumData?.albums || []));
    } else {
      console.warn("Không tải được albums:", albumsRes.status === "rejected" ? albumsRes.reason?.message : "API error");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  const handleEditClick = async (track: Track) => {
    setEditingTrack(track);
    setCoverFile(null);
    try {
      const res = await api.get(`/catalog/tracks/${track._id}`);
      if (res.data.success) {
        const fullTrack = res.data.data;

        // Lấy toàn bộ danh sách nghệ sĩ
        const artistsList = Array.isArray(fullTrack.officialArtistId)
          ? fullTrack.officialArtistId
          : (fullTrack.officialArtistId ? [fullTrack.officialArtistId] : []);

        setSelectedArtists(artistsList);

        setEditFormData({
          title: fullTrack.title,
          artist: fullTrack.artist || "",
          genre: (fullTrack.genre || []).join(", "),
          lyrics: fullTrack.lyrics || "",
          artistId: fullTrack.artistId?._id || "",
          albumId: fullTrack.albumId?._id || fullTrack.albumId || "",
          coverUrl: fullTrack.coverUrl || ""
        });
      }
    } catch (error) {
      console.error("Fetch detail error:", error);
      const artistsList = Array.isArray((track as any).officialArtistId)
        ? (track as any).officialArtistId
        : ((track as any).officialArtistId ? [(track as any).officialArtistId] : []);

      setSelectedArtists(artistsList);

      setEditFormData({
        title: track.title,
        artist: (track as any).artist || "",
        genre: (track.genre || []).join(", "),
        lyrics: track.lyrics || "",
        artistId: track.artistId?._id || "",
        albumId: (track as any).albumId?._id || (track as any).albumId || "",
        coverUrl: track.coverUrl || ""
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTrack) return;
    setSaving(true);
    try {
      let res;
      const officialArtistIds = selectedArtists.map(a => a._id);

      if (coverFile) {
        const formData = new FormData();
        formData.append("title", editFormData.title);
        formData.append("artist", editFormData.artist);
        formData.append("genre", editFormData.genre);
        formData.append("lyrics", editFormData.lyrics);
        formData.append("artistId", editFormData.artistId);
        formData.append("albumId", editFormData.albumId);

        // Gửi mảng officialArtistId
        officialArtistIds.forEach(id => {
          formData.append("officialArtistId[]", id);
        });

        formData.append("cover", coverFile);

        res = await api.put(`/catalog/tracks/${editingTrack._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        res = await api.patch(`/catalog/tracks/${editingTrack._id}`, {
          title: editFormData.title,
          artist: editFormData.artist,
          genre: editFormData.genre.split(",").map(g => g.trim()),
          lyrics: editFormData.lyrics,
          artistId: editFormData.artistId,
          officialArtistId: officialArtistIds.length > 0 ? officialArtistIds : null
        });
      }

      if (res.data.success) {
        fetchTracks();
        setEditingTrack(null);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Cập nhật thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA');
  };

  const handleDeleteClick = (track: Track) => {
    setDeletingTrack(track);
  };

  const confirmDelete = async () => {
    if (!deletingTrack) return;
    try {
      await api.delete(`/catalog/tracks/${deletingTrack._id}`);
      setTracks(tracks.filter(t => t._id !== deletingTrack._id));
      setDeletingTrack(null);
    } catch (error) {
      alert("Xóa thất bại!");
    }
  };

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.artist?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] font-inter antialiased">

      {/* Header Section */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
          <div>
            <h1 className="text-white text-[18px] font-bold tracking-tight leading-none">Quản lý bài hát</h1>
            <p className="text-zinc-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-70">Quản lý và điều chỉnh danh mục âm nhạc hệ thống</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/upload")}
          className="bg-[#ff2d55] hover:bg-[#ff4b6d] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#ff2d55]/10 flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
          Thêm nhạc mới
        </button>
      </div>

      <div className="px-10 py-6 flex gap-4">
        <div className="relative flex-1 group">
          <FontAwesomeIcon icon={faSearch} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#ff2d55] transition-colors text-sm" />
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-white/[0.05] rounded-xl py-3.5 pl-14 pr-6 text-white text-[13px] outline-none focus:border-[#ff2d55]/30 transition-all placeholder:text-zinc-600"
          />
        </div>
      </div>

      <div className="px-10 pb-10">
        <div className="bg-[#0c0c0c]/50 border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-5 w-[80px]">#</th>
                <th className="px-8 py-5">Bài hát</th>
                <th className="px-8 py-5">Thời lượng</th>
                <th className="px-8 py-5">Lượt phát</th>
                <th className="px-8 py-5">Ngày đăng</th>
                <th className="px-8 py-5 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-white/[0.03]">
                    <td colSpan={6} className="px-8 py-6 h-14 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : filteredTracks.length > 0 ? (
                filteredTracks.map((track, i) => (
                  <tr key={track._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all group">
                    <td className="px-8 py-5 text-zinc-600 text-[12px] font-medium">{i + 1}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#111] overflow-hidden border border-white/[0.05] shadow-lg group-hover:border-[#ff2d55]/30 transition-all">
                          <img src={track.coverUrl || ""} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-white text-[13.5px] font-bold group-hover:text-[#ff2d55] transition-colors">{track.title}</p>
                          <p className="text-zinc-500 text-[11px] font-medium tracking-wide">{track.artist || "Nghệ sĩ ẩn danh"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-zinc-400 text-[12px] font-medium">{formatDuration(track.duration || 0)}</td>
                    <td className="px-8 py-5 text-zinc-400 text-[12px] font-bold tracking-tight">{(track.playCount / 1000).toLocaleString()}K</td>
                    <td className="px-8 py-5 text-zinc-500 text-[12px] font-medium">{formatDate(track.createdAt)}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 outline-none">
                        <button onClick={() => handleEditClick(track)} className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
                          <FontAwesomeIcon icon={faEdit} className="text-[11px]" />
                        </button>
                        <button onClick={() => handleDeleteClick(track)} className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer">
                          <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-zinc-700 italic text-sm">Không tìm thấy nội dung.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTrack && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-white font-bold text-lg">Chỉnh sửa bài hát</h2>
              <button onClick={() => setEditingTrack(null)} className="text-zinc-500 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-8 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                <div className="w-32 h-32 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-white/10 group relative">
                  <img src={coverFile ? URL.createObjectURL(coverFile) : editFormData.coverUrl} className="w-full h-full object-cover" alt="Cover Preview" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FontAwesomeIcon icon={faEdit} className="text-white text-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm">Ảnh bìa bài hát</h3>
                  <p className="text-zinc-500 text-[11px] font-medium leading-relaxed">Khuyên dùng ảnh 500x500px, định dạng JPG hoặc PNG. Tối đa 2MB.</p>
                  <label className="inline-block bg-white/[0.05] hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg cursor-pointer transition-all border border-white/5">
                    Thay đổi ảnh
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setCoverFile(e.target.files[0])} />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Tiêu đề bài hát</label>
                <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Tên Nghệ sĩ hiển thị (Dạng văn bản)</label>
                <input type="text" value={editFormData.artist} onChange={(e) => setEditFormData({ ...editFormData, artist: e.target.value })} placeholder="Ví dụ: Grey D, Mono..." className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest leading-none">Thuộc Album</label>
                  <select value={editFormData.albumId} onChange={(e) => setEditFormData({ ...editFormData, albumId: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium min-h-[50px]">
                    <option value="" className="bg-[#0c0c0c]">--- Không thuộc album nào ---</option>
                    {allAlbums.map(album => (
                      <option key={album._id} value={album._id} className="bg-[#0c0c0c]">{album.title} ({new Date(album.releaseDate).getFullYear()})</option>
                    ))}
                  </select>
                </div>

                {/* Multi-Artist Selection UI */}
                <div className="space-y-3">
                  <label className="text-[#a855f7] text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#a855f7] rounded-full shadow-[0_0_5px_#a855f7]"></span>
                    Hồ sơ PRO (Nhiều Nghệ sĩ Kết Hợp)
                  </label>

                  <div className="relative">
                    <div className="relative group">
                      <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#a855f7] transition-colors text-xs" />
                      <input
                        type="text"
                        placeholder="Tìm nghệ sĩ (Rosé, Bruno Mars...)"
                        value={artistSearchTerm}
                        onChange={(e) => {
                          setArtistSearchTerm(e.target.value);
                          setIsSearching(true);
                        }}
                        onFocus={() => setIsSearching(true)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm outline-none focus:border-[#a855f7]/40 transition-all placeholder:text-zinc-700"
                      />
                    </div>

                    {isSearching && artistSearchTerm.trim() !== "" && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          {officialArtists
                            .filter(a => a.name.toLowerCase().includes(artistSearchTerm.toLowerCase()))
                            .map(a => (
                              <div
                                key={a._id}
                                onClick={() => {
                                  if (!selectedArtists.find(sa => sa._id === a._id)) {
                                    setSelectedArtists([...selectedArtists, a]);
                                  }
                                  setArtistSearchTerm("");
                                  setIsSearching(false);
                                }}
                                className="px-5 py-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/[0.02] last:border-0"
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/5">
                                  <img src={a.avatarUrl || ""} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white text-sm font-bold">{a.name}</p>
                                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Official Profile</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Artists Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedArtists.map(a => (
                      <div key={a._id} className="flex items-center gap-2 bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#a855f7] px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:bg-[#a855f7]/20 group">
                        <img src={a.avatarUrl || ""} className="w-4 h-4 rounded-full object-cover grayscale-[0.5] group-hover:grayscale-0" alt="" />
                        <span>{a.name}</span>
                        <button
                          onClick={() => setSelectedArtists(selectedArtists.filter(sa => sa._id !== a._id))}
                          className="ml-1 hover:text-white transition-colors"
                        >
                          <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                        </button>
                      </div>
                    ))}
                    {selectedArtists.length === 0 && (
                      <p className="text-zinc-600 text-[11px] font-medium italic">Chưa chọn profile nghệ sĩ chính thức nào.</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Thể loại (Phân cách bằng dấu phẩy)</label>
                <input type="text" value={editFormData.genre} onChange={(e) => setEditFormData({ ...editFormData, genre: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">Lời bài hát</label>
                <textarea rows={8} value={editFormData.lyrics} onChange={(e) => setEditFormData({ ...editFormData, lyrics: e.target.value })} className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-[#ff2d55]/50 transition-all font-medium resize-none leading-relaxed" />
              </div>
            </div>
            <div className="px-8 py-6 border-t border-white/10 bg-white/[0.02] flex justify-end gap-4">
              <button onClick={() => setEditingTrack(null)} className="px-6 py-2.5 rounded-xl text-zinc-400 font-bold hover:text-white transition-all">Hủy</button>
              <button disabled={saving} onClick={handleSaveEdit} className="bg-[#ff2d55] hover:bg-[#ff4b6d] text-white px-8 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#ff2d55]/20">
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTrack && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faTrash} className="text-red-500 text-2xl" />
              </div>
              <div className="space-y-2">
                <h2 className="text-white font-bold text-xl">Xác nhận xóa bài hát?</h2>
                <p className="text-zinc-500 text-sm leading-relaxed px-4">
                  Bạn đang yêu cầu xóa bài hát <span className="text-white font-bold">"{deletingTrack.title}"</span>. Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button onClick={confirmDelete} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-red-600/20 active:scale-95">Xác nhận xóa ngay</button>
                <button onClick={() => setDeletingTrack(null)} className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all border border-white/5 active:scale-95">Hủy bỏ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
