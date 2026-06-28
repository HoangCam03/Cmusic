import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGem, faTimes, faVolumeHigh } from "@fortawesome/free-solid-svg-icons";

interface AdOverlayProps {
  onClose: () => void;
  onUpgrade: () => void;
}

// Danh sách các "quảng cáo" giả lập — có thể mở rộng sau
const AD_CONTENT = [
  {
    brand: "CMusic Premium",
    tagline: "Nghe nhạc không giới hạn, không quảng cáo.",
    cta: "Dùng thử 1 tháng miễn phí",
    gradient: "from-purple-700 via-purple-600 to-pink-600",
    accent: "bg-pink-500",
  },
  {
    brand: "CMusic Hi-Fi",
    tagline: "Trải nghiệm âm thanh lossless chất lượng studio.",
    cta: "Nâng cấp ngay hôm nay",
    gradient: "from-blue-700 via-indigo-600 to-purple-600",
    accent: "bg-blue-500",
  },
  {
    brand: "CMusic Family",
    tagline: "Chia sẻ âm nhạc cùng gia đình — 6 tài khoản, 1 giá.",
    cta: "Xem gói Gia đình",
    gradient: "from-orange-600 via-rose-600 to-pink-600",
    accent: "bg-orange-500",
  },
];

// URL âm thanh thông báo quảng cáo (dùng file có sẵn trên CDN)
const AD_JINGLE_URL = "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3";

const AD_DURATION = 15; // Giây hiển thị quảng cáo trước khi có thể đóng

export function AdOverlay({ onClose, onUpgrade }: AdOverlayProps) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [canClose, setCanClose] = useState(false);
  const [adIndex] = useState(() => Math.floor(Math.random() * AD_CONTENT.length));
  const adAudioRef = useRef<HTMLAudioElement | null>(null);
  const ad = AD_CONTENT[adIndex];

  // Phát âm thanh thông báo khi quảng cáo xuất hiện
  useEffect(() => {
    adAudioRef.current = new Audio(AD_JINGLE_URL);
    adAudioRef.current.volume = 0.5;
    adAudioRef.current.play().catch(() => {
      // Bỏ qua nếu trình duyệt chặn autoplay
    });

    return () => {
      adAudioRef.current?.pause();
      adAudioRef.current = null;
    };
  }, []);

  // Đếm ngược countdown
  useEffect(() => {
    if (countdown <= 0) {
      setCanClose(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleUpgrade = () => {
    onUpgrade();
    navigate("/premium");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center pb-[100px] pointer-events-none">
      {/* Backdrop mờ phía dưới */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />

      {/* Ad Card */}
      <div className="relative w-full max-w-lg mx-4 pointer-events-auto animate-in slide-in-from-bottom-8 fade-in duration-500">
        {/* Main Card */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${ad.gradient} shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-white/10`}>
          
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/20 rounded-full blur-2xl" />

          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <FontAwesomeIcon icon={faVolumeHigh} className="text-white text-sm" />
                </div>
                <div>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Quảng cáo</p>
                  <p className="text-white font-black text-[15px] tracking-tight">{ad.brand}</p>
                </div>
              </div>

              {/* Close button with countdown */}
              <button
                onClick={canClose ? onClose : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  canClose
                    ? "bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                {canClose ? (
                  <>
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    Đóng
                  </>
                ) : (
                  <span>{countdown}s</span>
                )}
              </button>
            </div>

            {/* Ad Content */}
            <div className="mb-6">
              <p className="text-white text-xl font-black leading-tight tracking-tight mb-1">
                {ad.tagline}
              </p>
              <p className="text-white/60 text-xs font-medium">
                Bỏ qua quảng cáo vĩnh viễn với gói Premium.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-5 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${((AD_DURATION - countdown) / AD_DURATION) * 100}%` }}
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUpgrade}
                className="flex-1 bg-white text-black py-3 rounded-xl text-[12px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faGem} className="text-purple-600 text-xs" />
                {ad.cta}
              </button>
              {canClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold transition-all"
                >
                  Bỏ qua
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Small disclaimer */}
        <p className="text-center text-[10px] text-white/30 mt-2 font-medium">
          Tiếp tục nghe nhạc miễn phí sau khi quảng cáo kết thúc.
        </p>
      </div>
    </div>
  );
}
