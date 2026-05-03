import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faImage, 
  faCheckCircle,
  faCircleNotch,
  faArrowUp,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";




const GENRES = [
  "V-POP", "K-POP", "J-POP", "US-UK", 
  "Pop", "Ballad", "Rock", "R&B", "Hip-Hop", "Rap",
  "Indie", "EDM", "Dance", "Vinahouse", "Lo-fi", 
  "Acoustic", "Jazz", "Bolero", "Nhạc Trịnh", "Classical",
  "Country", "Funk", "Soul", "Disco"
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState(""); // Tên hiển thị tự do (nếu cần)
  const [selectedArtists, setSelectedArtists] = useState<any[]>([]); // Danh sách Profile chính thức
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [genre, setGenre] = useState("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [albumsRes, myArtistRes] = await Promise.all([
          api.get("/catalog/albums"),
          api.get("/catalog/artists?mine=true")
        ]);

        if (albumsRes.data.success) {
          setAlbums(albumsRes.data.data);
        }

        // Tự động chọn Artist profile của chính mình nếu là Artist
        if (myArtistRes.data.success && myArtistRes.data.data.length > 0) {
          setSelectedArtists([myArtistRes.data.data[0]]);
        }
      } catch (error) {
        console.error("Fetch initial data error:", error);
      }
    };
    fetchInitialData();
  }, []);
  
  const searchArtists = async (query: string) => {
    setArtist(query);
    if (query.length > 1) {
      try {
        const res = await api.get(`/catalog/artists?search=${query}&limit=5`);
        if (res.data.success) {
          setSuggestions(res.data.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Search artists error:", error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectArtist = (a: any) => {
    // Không cho phép chọn trùng
    if (!selectedArtists.find(item => item._id === a._id)) {
      setSelectedArtists([...selectedArtists, a]);
    }
    setArtist(""); // Xóa text đang gõ để nhập người tiếp theo
    setShowSuggestions(false);
  };

  const removeArtist = (id: string) => {
    setSelectedArtists(selectedArtists.filter(a => a._id !== id));
  };

  const [duration, setDuration] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return alert("Vui lòng chọn tệp nhạc!");

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    
    // Nếu có chọn profile chính thức, dùng tên của họ làm artist display name
    const displayArtist = selectedArtists.length > 0 
      ? selectedArtists.map(a => a.name).join(", ") 
      : artist;
    
    formData.append("artist", displayArtist); 
    formData.append("genre", genre);
    formData.append("duration", duration || "0");
    formData.append("audio", audioFile);
    
    // Gửi mảng các ID nghệ sĩ
    selectedArtists.forEach(a => {
      formData.append("officialArtistId[]", a._id);
    });

    if (coverFile) formData.append("cover", coverFile);
    if (selectedAlbumId) formData.append("albumId", selectedAlbumId);

    try {
      await api.post(`/catalog/tracks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setSuccess(true);
      setLoading(false);
    } catch (error: any) {
      console.error("Upload error details:", error.response?.data || error.message);
      alert("Đã có lỗi xảy ra khi tải bài hát lên! Vui lòng kiểm tra dung lượng file.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] px-6 text-center animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-[#ff2d55]/10 border border-[#ff2d55]/20 rounded-full flex items-center justify-center mb-8">
          <FontAwesomeIcon icon={faCheckCircle} className="text-[#ff2d55] text-2xl" />
        </div>
        <h2 className="text-white text-[24px] font-bold mb-4 tracking-tighter">Đã xuất bản nhạc!</h2>
        <p className="text-zinc-500 text-[13px] mb-12 max-w-sm">Tác phẩm mang phong cách riêng của bạn đã sẵn sàng lan tỏa trên CMusic.</p>
        <div className="flex flex-col gap-3 w-full max-w-[200px]">
          <button 
             onClick={() => {
                setSuccess(false);
                setTitle("");
                setGenre("");
                setDuration("");
                setAudioFile(null);
                setCoverFile(null);
                setCoverPreview(null);
              }}
            className="w-full py-4 bg-[#ff2d55] text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-[#ff4b6d] transition-all"
          >
            Tiếp tục tải lên
          </button>
          <button 
            onClick={() => navigate("/admin")}
            className="w-full py-4 bg-transparent border border-white/[0.08] text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-white/[0.03] transition-all"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col font-inter antialiased bg-[#050505] min-h-screen">
      
      {/* 1. Header Section */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
          <div>
            <h1 className="text-white text-[18px] font-bold tracking-tight leading-none">Tải nhạc lên</h1>
            <p className="text-zinc-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-70">Phát hành tác phẩm mới của bạn lên hệ thống</p>

          </div>
        </div>
        <button 
          onClick={() => navigate("/admin")}
          className="text-zinc-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2 outline-none"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Hủy bỏ
        </button>
      </div>

      {/* 2. Main Stacked Content Form */}
      <div className="flex-1 flex flex-col items-center py-12 px-6 custom-scrollbar overflow-y-auto w-full">
        <form onSubmit={handleSubmit} className="w-full max-w-[600px] space-y-6">
          
          {/* Card 1: Audio Upload Area */}
          <div className="bg-[#0c0c0c] border border-white/[0.04] rounded-2xl p-6">
            <div 
              onClick={() => audioInputRef.current?.click()}
              className="w-full min-h-[160px] border border-dashed border-white/[0.08] hover:border-[#ff2d55]/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-[#080808]/50 group px-10 text-center"
            >
                <input 
                  type="file" 
                  ref={audioInputRef} 
                  className="hidden" 
                  accept="audio/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAudioFile(file);
                    
                    if (file) {
                      // Tự động tính thời lượng nhạc
                      const audio = new Audio();
                      audio.src = URL.createObjectURL(file);
                      audio.onloadedmetadata = () => {
                        setDuration(Math.round(audio.duration).toString());
                      };
                    }
                  }} 
                />
                <div className="w-10 h-10 bg-[#ff2d55]/5 border border-[#ff2d55]/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#ff2d55]/10 transition-all">
                  <FontAwesomeIcon icon={faArrowUp} className={`text-sm ${audioFile ? 'text-[#ff2d55]' : 'text-zinc-600'}`} />
                </div>
                <h3 className="text-white text-[13px] font-bold mb-1">
                  {audioFile ? audioFile.name : "Kéo tệp chính vào đây để tải lên"}
                </h3>
                <p className="text-zinc-700 text-[10px] font-medium uppercase tracking-[0.1em]">
                  {audioFile ? "Sẵn sàng đăng tải" : "Hỗ trợ định dạng MP3, WAV, FLAC (Tối đa 50MB)"}
                </p>
            </div>
          </div>

          {/* Card 2: Track Information Information */}
          <div className="bg-[#0c0c0c] border border-white/[0.04] rounded-2xl p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
              <h2 className="text-white text-[12px] font-bold uppercase tracking-widest opacity-90">Thông tin bài hát</h2>
            </div>

            <div className="space-y-6">
                {/* Title Field */}
                <div className="space-y-2.5">
                  <label className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest ml-0.5">Tiêu đề bài hát *</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề tác phẩm"
                    className="w-full bg-[#080808] border border-white/[0.05] rounded-xl px-5 py-4 text-white text-[13px] outline-none focus:border-[#ff2d55]/30 transition-all placeholder:text-zinc-800"
                  />
                </div>

                {/* Artist Field with Multi-select Chips */}
                <div className="space-y-2.5 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest ml-0.5">Nghệ sĩ tham gia *</label>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#ff2d55]">
                      {selectedArtists.length} người tham gia
                    </span>
                  </div>

                  {/* Selected Artists Chips */}
                  {selectedArtists.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedArtists.map(a => (
                        <div key={a._id} className="flex items-center gap-2 bg-[#ff2d55]/10 border border-[#ff2d55]/20 px-3 py-1.5 rounded-full group transition-all">
                          <img src={a.avatarUrl} className="w-4 h-4 rounded-full object-cover" alt="" />
                          <span className="text-white text-[11px] font-bold">{a.name}</span>
                          <button 
                            type="button"
                            onClick={() => removeArtist(a._id)}
                            className="text-zinc-500 hover:text-white transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <input 
                    type="text" 
                    value={artist}
                    onFocus={() => artist.length > 1 && setShowSuggestions(true)}
                    onChange={(e) => searchArtists(e.target.value)}
                    placeholder={selectedArtists.length > 0 ? "Thêm nghệ sĩ kết hợp khác..." : "Gõ để chọn nghệ sĩ chính thức"}
                    className="w-full bg-[#080808] border border-white/[0.05] focus:border-[#ff2d55]/30 rounded-xl px-5 py-4 text-white text-[13px] outline-none transition-all placeholder:text-zinc-800"
                  />

                  {/* Suggestions List */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0c0c0c] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-[50] animate-in slide-in-from-top-2 duration-300">
                      {suggestions.map((a) => (
                        <div 
                          key={a._id}
                          onClick={() => selectArtist(a)}
                          className="px-5 py-4 hover:bg-white/[0.03] flex items-center gap-4 cursor-pointer border-b border-white/[0.05] last:border-0 group"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex-shrink-0">
                            <img src={a.avatarUrl} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white text-[13px] font-bold group-hover:text-[#ff2d55] transition-colors">{a.name}</div>
                            <div className="text-zinc-600 text-[10px] font-medium uppercase tracking-widest">Profile chính thức</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Backdrop to close suggestions */}
                  {showSuggestions && (
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowSuggestions(false)}></div>
                  )}
                </div>

                {/* Genre Selector */}
                <div className="space-y-3">
                  <label className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest ml-0.5">Thể loại</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                      {GENRES.map(g => (
                          <button 
                            key={g}
                            type="button"
                            onClick={() => setGenre(g)}
                            className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                              genre === g 
                              ? "bg-[#ff2d55] text-white shadow-[0_0_15px_rgba(255,45,85,0.3)]" 
                              : "bg-white/[0.03] text-zinc-600 border border-white/[0.05] hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {g}
                          </button>
                      ))}
                  </div>
                </div>

                {/* Duration Field */}
                <div className="space-y-2.5">
                  <label className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest ml-0.5">Thời lượng (Giây)</label>
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ví dụ: 180"
                    className="w-full bg-[#080808] border border-white/[0.05] rounded-xl px-5 py-4 text-white text-[13px] outline-none focus:border-[#ff2d55]/30 transition-all placeholder:text-zinc-800"
                  />
                </div>
            </div>
          </div>

          {/* Card 3: Album Selection */}
          <div className="bg-[#0c0c0c] border border-white/[0.04] rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
              <h2 className="text-white text-[12px] font-bold uppercase tracking-widest opacity-90">Phân loại album (Tùy chọn)</h2>
            </div>
            <div className="space-y-2.5">
               <select 
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className="w-full bg-[#080808] border border-white/[0.05] rounded-xl px-5 py-4 text-white text-[13px] outline-none focus:border-[#ff2d55]/30 transition-all font-medium italic"
               >
                  <option value="" className="bg-[#0c0c0c]">--- Không thuộc album nào / Đĩa đơn ---</option>
                  {albums.map(a => (
                    <option key={a._id} value={a._id} className="bg-[#0c0c0c]">{a.title} ({new Date(a.releaseDate).getFullYear()})</option>
                  ))}
               </select>
               <p className="text-zinc-600 text-[10px] mt-2 leading-relaxed">Gán bài hát vào một bộ sưu tập đã tạo để người nghe dễ dàng theo dõi toàn bộ đĩa nhạc.</p>
            </div>
          </div>

          {/* Card 4: Album Cover Section */}
          <div className="bg-[#0c0c0c] border border-white/[0.04] rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-4 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
              <h2 className="text-white text-[12px] font-bold uppercase tracking-widest opacity-90">Ảnh đại diện</h2>
            </div>

            <div 
              onClick={() => coverInputRef.current?.click()}
              className={`w-full min-h-[140px] border border-dashed border-white/[0.08] hover:border-[#ff2d55]/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-[#080808]/50 overflow-hidden relative group text-center px-4`}
            >
                <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverChange} />
                {coverPreview ? (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                      <img src={coverPreview} className="w-full h-full object-cover opacity-60" alt="Cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest bg-[#ff2d55] px-4 py-2 rounded-full">Thay ảnh</span>
                      </div>
                  </div>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faImage} className="text-zinc-700 text-lg mb-3 group-hover:text-[#ff2d55] transition-colors" />
                    <h3 className="text-white text-[13px] font-bold">Chọn ảnh bìa bài hát</h3>
                    <p className="text-zinc-700 text-[10px] font-medium uppercase tracking-widest mt-1">Định dạng JPG, PNG</p>
                  </>
                )}
            </div>
          </div>

          {/* Final Submit Button */}
          <div className="pt-4 pb-12 w-full">
              <button 
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.3em] text-[12px] transition-all duration-500 flex items-center justify-center gap-4 ${
                  loading 
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                  : "bg-[#ff2d55] text-white hover:bg-[#ff4b6d] shadow-[0_4px_30px_rgba(255,45,85,0.2)] active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-white/50" />
                    Đang chuẩn bị...
                  </>
                ) : (
                  "Đăng nhạc ngay"
                )}
              </button>
              <p className="text-zinc-800 text-[8px] text-center mt-6 uppercase tracking-widest font-bold">
                Bằng việc đăng tải, bạn đồng ý với các quy định tác giả của CMusic
              </p>
          </div>
        </form>
      </div>
    </div>
  );
}
