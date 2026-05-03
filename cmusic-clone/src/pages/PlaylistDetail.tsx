import { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlaylistDetail, addTrackToPlaylist } from "../services/PlaylistServices/ListPlaylists";
import { PlayerContext } from "../context/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, faPause, faClock, faMusic, faTrashAlt, 
  faSearch, faHeart, faArrowCircleDown, 
  faUserPlus, faEllipsisH, faTimes, faLock, faGlobe,
  faPencilAlt
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAppDispatch } from "../store/store";
import { fetchPlaylists } from "../store/slices/playlistSlice";

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const ctx = useContext(PlayerContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      const data = await getPlaylistDetail(id);
      if (data.success) {
        setPlaylist(data.data);
        setEditName(data.data.name);
        setEditDesc(data.data.description || "");
        setEditIsPublic(data.data.isPublic);
        setPreviewUrl(null);
        setSelectedFile(null);
      }
    } catch (err) {
      toast.error("Không thể tải thông tin playlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (playlist && searchQuery === "") {
      fetchDefaultRecommended();
    }
  }, [playlist]);

  // Cập nhật queue nếu bài hát đang phát thuộc playlist này
  useEffect(() => {
    if (playlist?.tracks && ctx?.track) {
      const isCurrentTrackInPlaylist = playlist.tracks.some((t: any) => t._id === ctx.track._id);
      if (isCurrentTrackInPlaylist) {
        ctx.updateQueue(playlist.tracks);
      }
    }
  }, [playlist?.tracks]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updating) return;

    setUpdating(true);
    const toastId = toast.loading("Đang cập nhật playlist...");
    
    try {
      const formData = new FormData();
      formData.append("name", editName);
      formData.append("description", editDesc);
      formData.append("isPublic", String(editIsPublic));
      
      if (selectedFile) {
        formData.append("thumbnail", selectedFile);
      }

      const res = await api.put(`/playlists/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        toast.success("Đã cập nhật playlist", { id: toastId });
        fetchDetail();
        setShowEditModal(false);
        dispatch(fetchPlaylists());
      }
    } catch (err) {
      toast.error("Lỗi khi cập nhật playlist", { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  const fetchDefaultRecommended = async () => {
    try {
      const res = await api.get(`/catalog/tracks`);
      if (res.data.success) {
        const tracksArray = Array.isArray(res.data.data) ? res.data.data : res.data.data.tracks || [];
        const existingIds = playlist?.tracks.map((t: any) => t._id) || [];
        const filtered = tracksArray.filter((t: any) => !existingIds.includes(t._id));
        setSearchResults(filtered.slice(0, 5));
      }
    } catch (err) {
      console.error("Fetch default tracks error:", err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchDefaultRecommended();
      return;
    }

    try {
      const res = await api.get(`/catalog/tracks?search=${query}`);
      if (res.data.success) {
        const tracksArray = Array.isArray(res.data.data) ? res.data.data : res.data.data.tracks || [];
        const existingIds = playlist?.tracks.map((t: any) => t._id) || [];
        const filtered = tracksArray.filter((t: any) => !existingIds.includes(t._id));
        setSearchResults(filtered.slice(0, 5));
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  const handleAddTrack = async (trackId: string) => {
    if (!id) return;
    try {
      const res = await addTrackToPlaylist(id, trackId);
      if (res.success) {
        toast.success("Đã thêm bài hát vào danh sách phát");
        fetchDetail();
        setSearchResults(prev => prev.filter(t => t._id !== trackId));
        dispatch(fetchPlaylists());
      }
    } catch (err) {
      toast.error("Lỗi khi thêm bài hát");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa playlist này không?")) return;
    try {
      const res = await api.delete(`/playlists/${id}`);
      if (res.data.success) {
        toast.success("Đã xóa playlist");
        dispatch(fetchPlaylists());
        navigate("/");
      }
    } catch (err) {
      toast.error("Lỗi khi xóa playlist");
    }
  };

  if (loading) return <div className="p-8 text-white opacity-50">Đang tải playlist...</div>;
  if (!playlist) return <div className="p-8 text-white opacity-50">Không tìm thấy playlist</div>;

  const isPlaying = ctx?.track && playlist.tracks.some((t: any) => t._id === ctx.track?._id) && ctx.playStatus;

  // Tính tổng thời lượng
  const totalSeconds = playlist.tracks.reduce((acc: number, track: any) => acc + (track.duration || 0), 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const remainingSeconds = totalSeconds % 60;

  const durationString = totalHours > 0 
    ? `${totalHours} giờ ${remainingMinutes} phút`
    : `${totalMinutes} phút ${remainingSeconds} giây`;

  return (
    <div className="flex flex-col min-h-full pb-20 bg-[#121212]">
      {/* Header Section */}
      <div className="relative h-[340px] px-8 flex items-end pb-8">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-purple-900/40 to-purple-800/60" />
        
        <div className="relative z-10 flex items-end gap-6 w-full">
          {/* Cover Image */}
          <div 
            onClick={() => setShowEditModal(true)}
            className="w-48 h-48 lg:w-60 lg:h-60 shrink-0 shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-md bg-[#282828] flex items-center justify-center overflow-hidden cursor-pointer group relative border border-white/5"
          >
            {playlist.thumbnail ? (
              <img src={playlist.thumbnail} className="w-full h-full object-cover opacity-70 group-hover:opacity-40 transition-all duration-300" alt="" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 opacity-70 group-hover:opacity-40 transition-all duration-300">
                <FontAwesomeIcon icon={faMusic} className="text-zinc-500 text-6xl mb-2" />
              </div>
            )}
            
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10 group-hover:bg-black/20 transition-all duration-300">
               <FontAwesomeIcon icon={faPencilAlt} className="text-white text-3xl lg:text-5xl drop-shadow-lg" />
               <span className="text-white text-sm font-bold drop-shadow-md">Chọn ảnh</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 lg:gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white">
              {playlist.isPublic ? "Danh sách phát công khai" : "Danh sách phát riêng tư"}
            </p>
            <h1 
              onClick={() => setShowEditModal(true)}
              className="text-4xl lg:text-7xl font-black text-white tracking-tighter mb-2 leading-tight cursor-pointer hover:opacity-80 transition-opacity"
            >
              {playlist.name}
            </h1>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <div className="flex items-center gap-1.5 hover:underline cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center overflow-hidden border border-white/10">
                   {playlist.userId?.avatarUrl ? (
                     <img src={playlist.userId.avatarUrl} className="w-full h-full object-cover" alt="" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-[10px] bg-purple-600">
                        {playlist.userId?.displayName?.[0] || "U"}
                     </div>
                   )}
                </div>
                <span>{playlist.userId?.displayName || "Người dùng"}</span>
              </div>
              <span className="opacity-70">•</span>
              <span className="opacity-70 font-medium">{playlist.tracks.length} bài hát, {durationString}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 py-6 flex items-center gap-8">
        <button
          onClick={() => playlist.tracks.length > 0 && ctx?.playWithId(playlist.tracks[0]._id, playlist.tracks)}
          className="w-14 h-14 bg-[#1ed760] hover:bg-[#1fdf64] text-black rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95"
          title={isPlaying ? "Tạm dừng" : "Phát"}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} className="text-xl ml-0.5" />
        </button>
        
        <div className="flex items-center gap-6 text-zinc-400">
          <button className="text-2xl hover:text-white transition-colors" title="Lưu vào Thư viện"><FontAwesomeIcon icon={faHeart} /></button>
          <button className="text-2xl hover:text-white transition-colors" title="Tải xuống"><FontAwesomeIcon icon={faArrowCircleDown} /></button>
          <button className="text-2xl hover:text-white transition-colors" title="Mời cộng tác viên"><FontAwesomeIcon icon={faUserPlus} /></button>
          <button className="text-2xl hover:text-white transition-colors" title="Khác"><FontAwesomeIcon icon={faEllipsisH} /></button>
        </div>

        <button
          onClick={handleDeletePlaylist}
          className="ml-auto text-zinc-500 hover:text-red-500 transition-colors text-lg"
          title="Xóa playlist"
        >
          <FontAwesomeIcon icon={faTrashAlt} />
        </button>
      </div>

      {/* Tracks List */}
      <div className="px-8">
        <div className="grid grid-cols-[16px_4fr_3fr_2fr_minmax(120px,1fr)] gap-4 px-4 py-2 border-b border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">
          <span>#</span>
          <span>Tiêu đề</span>
          <span>Album</span>
          <span>Ngày thêm</span>
          <div className="flex justify-end"><FontAwesomeIcon icon={faClock} /></div>
        </div>

        <div className="space-y-0.5 mb-10">
          {playlist.tracks.map((track: any, index: number) => (
            <div
              key={track._id}
              onClick={() => ctx?.playWithId(track._id, playlist.tracks)}
              className="grid grid-cols-[16px_4fr_3fr_2fr_minmax(120px,1fr)] items-center gap-4 px-4 py-2 rounded-md hover:bg-white/10 group transition-colors cursor-pointer"
            >
              <span className={`text-sm ${ctx?.track?._id === track._id ? "text-[#1ed760]" : "text-zinc-400"}`}>
                {index + 1}
              </span>
              <div className="flex items-center gap-3 min-w-0">
                <img src={track.coverUrl} className="w-10 h-10 rounded shadow-lg" alt="" />
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${ctx?.track?._id === track._id ? "text-[#1ed760]" : "text-white"}`}>
                    {track.title}
                  </p>
                  <p 
                    className="text-zinc-400 text-xs truncate font-medium hover:text-white hover:underline transition-colors cursor-pointer inline-block"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (track.officialArtistId && track.officialArtistId.length > 0) {
                        const artistIdStr = typeof track.officialArtistId[0] === 'object' ? track.officialArtistId[0]._id : track.officialArtistId[0];
                        navigate(`/artist/${artistIdStr}`);
                      }
                    }}
                  >
                    {track.artist || "Nghệ sĩ"}
                  </p>
                </div>
              </div>
              <span 
                className="text-zinc-400 text-sm truncate hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (track.albumId && track.albumId._id) {
                    navigate(`/album/${track.albumId._id}`);
                  }
                }}
              >
                {track.albumId?.name || "Đơn ca"}
              </span>
              <span className="text-zinc-400 text-sm truncate">
                {new Date(playlist.createdAt).toLocaleDateString('vi-VN')}
              </span>
              <div className="flex justify-end text-zinc-400 text-xs font-medium">
                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>

        {/* Search Section */}
        <div className="border-t border-white/10 pt-12 pb-20">
          <div className="flex flex-col gap-2 mb-8">
            <h2 className="text-2xl font-black text-white">Hãy cùng tìm nội dung cho danh sách phát của bạn</h2>
          </div>

          <div className="relative mb-8 max-w-xl">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <input
              type="text"
              value={searchQuery}
              placeholder="Tìm bài hát..."
              className="w-full bg-[#2a2a2a] hover:bg-[#333] focus:bg-[#333] border-none rounded-full py-3 pl-12 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-colors shadow-lg"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            {searchResults.map((track: any) => (
              <div key={track._id} className="flex items-center justify-between px-4 py-2 rounded-md hover:bg-white/10 group transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={track.coverUrl} className="w-10 h-10 rounded shadow-sm" alt="" />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">{track.title}</p>
                    <p 
                      className="text-zinc-400 text-xs truncate hover:text-white hover:underline cursor-pointer inline-block"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (track.officialArtistId && track.officialArtistId.length > 0) {
                          const artistIdStr = typeof track.officialArtistId[0] === 'object' ? track.officialArtistId[0]._id : track.officialArtistId[0];
                          navigate(`/artist/${artistIdStr}`);
                        }
                      }}
                    >
                      {track.artist || "Nghệ sĩ"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddTrack(track._id)}
                  className="px-6 py-1.5 border border-zinc-500 rounded-full text-white text-xs font-bold hover:border-white hover:scale-105 transition-all"
                >
                  Thêm
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => !updating && setShowEditModal(false)}
          />
          
          <div className="relative z-10 w-full max-w-[524px] bg-[#282828] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4">
               <h3 className="text-white font-black text-xl tracking-tighter">Sửa thông tin chi tiết</h3>
               <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                 <FontAwesomeIcon icon={faTimes} className="text-xl" />
               </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 pt-2">
               <div className="flex gap-4">
                  {/* Image Preview / Upload Button */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[180px] h-[180px] shrink-0 bg-[#333] shadow-2xl rounded-md flex items-center justify-center overflow-hidden group relative cursor-pointer border border-white/5"
                  >
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover group-hover:opacity-40 transition-all" alt="" />
                    ) : playlist.thumbnail ? (
                      <img src={playlist.thumbnail} className="w-full h-full object-cover group-hover:opacity-40 transition-all" alt="" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 group-hover:opacity-40 transition-all">
                        <FontAwesomeIcon icon={faMusic} className="text-zinc-600 text-6xl" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 transition-opacity">
                       <FontAwesomeIcon icon={faPencilAlt} className="text-white text-3xl drop-shadow-lg" />
                       <span className="text-white text-xs font-bold drop-shadow-md">Chọn ảnh</span>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>

                  <div className="flex-1 flex flex-col gap-3 font-medium">
                     <div className="flex flex-col gap-1">
                        <input 
                          type="text" 
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Thêm tên"
                          className="w-full bg-[#3e3e3e] border-none rounded-md py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none focus:bg-[#4a4a4a] transition-all"
                        />
                     </div>
                     <div className="flex-1">
                        <textarea 
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Thêm phần mô tả không bắt buộc"
                          className="w-full h-full bg-[#3e3e3e] border-none rounded-md py-3 px-4 text-sm text-white placeholder-zinc-500 outline-none focus:bg-[#4a4a4a] transition-all resize-none min-h-[100px]"
                        />
                     </div>
                  </div>
               </div>

               <div className="mt-6 flex items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => setEditIsPublic(!editIsPublic)}
                    className="flex items-center gap-2 border border-zinc-500 rounded-full px-4 py-2 text-white text-xs font-bold hover:border-white transition-all"
                  >
                    <FontAwesomeIcon icon={editIsPublic ? faGlobe : faLock} />
                    <span>Đặt thành {editIsPublic ? "riêng tư" : "công khai"}</span>
                  </button>
                  <button 
                    type="submit"
                    disabled={updating}
                    className="bg-white text-black px-8 py-3 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {updating ? "Đang lưu..." : "Lưu"}
                  </button>
               </div>
               
               <p className="mt-4 text-[10px] text-zinc-400 font-bold leading-tight">
                  Bằng cách tiếp tục, bạn đồng ý cho phép CMusic truy cập vào hình ảnh bạn đã chọn để tải lên. Vui lòng đảm bảo bạn có quyền tải lên hình ảnh.
               </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
