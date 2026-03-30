import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faImage, faArrowLeft, faCloudUploadAlt, faCheckCircle } from "@fortawesome/free-solid-svg-icons";

export function UploadPage() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) return alert("Vui lòng chọn file nhạc!");

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("genre", genre);
    formData.append("audio", audioFile);
    if (coverFile) formData.append("cover", coverFile);

    try {
      // Gọi API Gateway (nối tới Catalog Service)
      await axios.post("http://localhost:3000/api/catalog/tracks", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          // Tạm thời giả định userId là admin, sau này lấy từ Auth
          "x-user-id": "60d0fe4f5311236168a109ca" 
        }
      });
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi upload:", error);
      alert("Tải lên thất bại!");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#09090b] rounded-2xl border border-white/5 p-8">
        <FontAwesomeIcon icon={faCheckCircle} className="text-purple-500 w-20 h-20 mb-6" />
        <h2 className="text-white text-3xl font-black mb-4 tracking-tight">Tải lên thành công!</h2>
        <p className="text-[#a1a1aa] mb-8 font-medium">Bài hát của bạn đã bay lên mây Cloudinary.</p>
        <div className="flex gap-4">
          <button onClick={() => setSuccess(false)} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full transition">
            Tải thêm bài khác
          </button>
          <Link to="/" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full transition shadow-lg">
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-[#18181b] rounded-2xl overflow-y-auto border border-white/5 relative shadow-lg p-10 custom-scrollbar">
      <Link to="/" className="inline-flex items-center gap-2 text-[#a1a1aa] hover:text-white mb-8 transition-colors text-sm font-bold">
        <FontAwesomeIcon icon={faArrowLeft} />
        Quay lại
      </Link>

      <div className="max-w-2xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-white text-4xl font-black tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
            Tải lên bài hát mới
          </h1>
          <p className="text-[#a1a1aa] font-medium italic underline decoration-purple-500/50 underline-offset-4">Chia sẻ âm nhạc của bạn với thế giới qua CMusic</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/5 shadow-inner">
            {/* Tên bài hát */}
            <div>
              <label className="block text-[#a1a1aa] text-[13px] font-bold uppercase tracking-wider mb-2.5 ml-1">Tên bài hát</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Lạc Trôi, Nơi Này Có Anh..."
                className="w-full bg-[#27272a] text-white text-[15px] p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 border border-transparent transition-all placeholder:text-[#71717a]"
              />
            </div>

            {/* Thể loại */}
            <div>
              <label className="block text-[#a1a1aa] text-[13px] font-bold uppercase tracking-wider mb-2.5 ml-1">Thể loại</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Ví dụ: Pop, K-Pop, Indie..."
                className="w-full bg-[#27272a] text-white text-[15px] p-4 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 border border-transparent transition-all placeholder:text-[#71717a]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chọn nhạc */}
              <div className="relative group">
                <label className="block text-[#a1a1aa] text-[13px] font-bold uppercase tracking-wider mb-2.5 ml-1">File nhạc (MP3)</label>
                <div className={`h-32 border-2 border-dashed ${audioFile ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/30'} rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative`}>
                   <input
                    type="file"
                    accept="audio/*"
                    required
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <FontAwesomeIcon icon={faMusic} className={`w-8 h-8 mb-2 ${audioFile ? 'text-purple-400' : 'text-[#71717a]'}`} />
                  <span className="text-xs text-white font-medium px-4 text-center truncate w-full">
                    {audioFile ? audioFile.name : "Chọn file nhạc của bạn"}
                  </span>
                </div>
              </div>

               {/* Chọn ảnh bìa */}
               <div className="relative group">
                <label className="block text-[#a1a1aa] text-[13px] font-bold uppercase tracking-wider mb-2.5 ml-1">Ảnh bìa (Cover)</label>
                <div className={`h-32 border-2 border-dashed ${coverFile ? 'border-pink-500/50 bg-pink-500/5' : 'border-white/10 hover:border-pink-500/30'} rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden relative`}>
                   <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <FontAwesomeIcon icon={faImage} className={`w-8 h-8 mb-2 ${coverFile ? 'text-pink-400' : 'text-[#71717a]'}`} />
                   <span className="text-xs text-white font-medium px-4 text-center truncate w-full">
                    {coverFile ? coverFile.name : "Chọn ảnh của bạn"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5'} bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest text-sm`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <FontAwesomeIcon icon={faCloudUploadAlt} />
                Tải bài hát lên mây Cloudinary
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
