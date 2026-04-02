import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEnvelope, 
  faLock, 
  faEye, 
  faEyeSlash, 
  faMusic 
} from "@fortawesome/free-solid-svg-icons";
import { 
  faGoogle, 
  faFacebookF, 
  faApple, 
  faXTwitter 
} from "@fortawesome/free-brands-svg-icons";
import axios from "axios";

// Logo CMusic Premium
const CMusicLogo = () => (
  <div className="flex items-center gap-4 mb-12 group cursor-pointer">
    <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.4)] relative overflow-hidden transform group-hover:rotate-6 transition-transform duration-500">
      <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
      <FontAwesomeIcon icon={faMusic} className="text-white text-2xl relative z-10" />
      <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-purple-600" />
    </div>
    <div className="flex flex-col">
      <span className="text-white font-bold text-2xl tracking-tighter font-outfit uppercase">CMusic</span>
      <span className="text-[10px] font-bold text-pink-500 tracking-[0.3em] uppercase">Premium</span>
    </div>
  </div>
);

// Floating Musical Notes
const MusicalNotes = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
            <div 
                key={i}
                className="absolute animate-float"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${10 + Math.random() * 10}s`
                }}
            >
                <FontAwesomeIcon 
                    icon={faMusic} 
                    className={`text-purple-500/40 text-${['xl', '2xl', '3xl'][Math.floor(Math.random() * 3)]}`} 
                    style={{ transform: `rotate(${Math.random() * 360}deg)` }}
                />
            </div>
        ))}
    </div>
);

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });

      if (response.data && response.data.success) {
        const { accessToken, refreshToken, user } = response.data.data || {};
        
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        
        if (user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setError(response.data?.message || "Đăng nhập không thành công.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-inter selection:bg-purple-500/30">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>
      
      <MusicalNotes />
      
      {/* Subtle Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-900/10 rounded-full blur-[150px]" />

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-20 items-center z-10">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col items-start px-10">
          <CMusicLogo />
          <h2 className="text-white text-[64px] font-semibold leading-[1.1] font-outfit tracking-tighter mb-6 uppercase">
            CHÀO MỪNG <br /> TRỞ LẠI
          </h2>
          <p className="text-zinc-500 text-lg font-light tracking-wide max-w-md">
            Đăng nhập để tiếp tục thưởng thức âm nhạc đỉnh cao cùng CMusic.
          </p>
          
          <div className="mt-20 flex gap-12 opacity-40">
             <div className="flex flex-col gap-1">
                <span className="text-white text-3xl font-semibold font-outfit">10M+</span>
                <span className="text-zinc-600 text-xs uppercase tracking-widest font-bold">Người dùng</span>
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-white text-3xl font-semibold font-outfit">50M+</span>
                <span className="text-zinc-600 text-xs uppercase tracking-widest font-bold">Bài hát</span>
             </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[420px]">
            {/* Top Glow added here */}
            <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[70%] h-[2px] z-0 rounded-full"
              style={{ background: "linear-gradient(90deg, transparent, #FF0080, transparent)", boxShadow: "0 0 25px 8px rgba(255,0,128,0.4)" }} />

            <div className="w-full rounded-[24px] p-6 sm:p-8 relative group z-10 overflow-hidden"
              style={{ background: "#030002", border: "1px solid rgba(255,0,128,0.2)", backdropFilter: "blur(10px)" }}>
              {/* Corner sparkle decoration */}
              <div className="absolute -top-1 -right-1 w-24 h-24 bg-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <h1 className="text-white text-[32px] font-semibold text-center mb-10 font-outfit tracking-tight">Đăng nhập</h1>
              
              {/* Social Logins */}
              <div className="grid grid-cols-4 gap-4 mb-10">
                {[
                  { icon: faGoogle, hoverClass: "hover:text-[#ea4335] hover:bg-[#ea4335]/10 hover:border-[#ea4335]/20" },
                  { icon: faFacebookF, hoverClass: "hover:text-[#1877f2] hover:bg-[#1877f2]/10 hover:border-[#1877f2]/20" },
                  { icon: faXTwitter, hoverClass: "hover:text-white hover:bg-white/10 hover:border-white/20" },
                  { icon: faApple, hoverClass: "hover:text-white hover:bg-white/10 hover:border-white/20" }
                ].map((btn, idx) => (
                  <button key={idx} className={`h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-400 transition-all duration-300 ${btn.hoverClass}`}>
                    <FontAwesomeIcon icon={btn.icon as any} className="text-lg transition-transform hover:scale-110" />
                  </button>
                ))}
              </div>

              <div className="relative flex items-center justify-center mb-10">
                <div className="w-full h-px bg-white/5" />
                <span className="absolute bg-[#121214] px-4 text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em]">HOẶC</span>
              </div>

              <form onSubmit={handleLogin} className="space-y-7">
                {/* Email */}
                <div className="space-y-3">
                  <label className="text-[11px] font-semibold text-[#FF0080] ml-1 uppercase tracking-widest">ĐỊA CHỈ EMAIL</label>
                  <div className="relative group">
                    <FontAwesomeIcon icon={faEnvelope} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#FF0080] transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 text-white pl-14 pr-5 py-4.5 rounded-2xl outline-none focus:border-[#FF0080]/30 focus:bg-white/[0.04] transition-all duration-300 placeholder:text-zinc-700 text-[14px]"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-semibold text-[#FF0080] uppercase tracking-widest">MẬT KHẨU</label>
                    <a href="#" className="text-[11px] font-medium text-zinc-600 hover:text-[#FF0080] transition-colors">Quên mật khẩu?</a>
                  </div>
                  <div className="relative group">
                    <FontAwesomeIcon icon={faLock} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#FF0080] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 text-white pl-14 pr-14 py-4.5 rounded-2xl outline-none focus:border-[#FF0080]/30 focus:bg-white/[0.04] transition-all duration-300 placeholder:text-zinc-700 text-[14px]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-5 flex items-center text-zinc-600 hover:text-white transition-colors"
                    >
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="text-red-400 text-[12px] font-medium px-1 flex items-center gap-2 animate-shake">
                    <div className="w-1 h-1 bg-red-400 rounded-full" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  disabled={loading}
                  className="w-full h-16 text-white rounded-2xl font-[900] tracking-[0.1em] uppercase text-sm hover:shadow-[0_15px_30px_rgba(255,0,128,0.3)] active:scale-[0.98] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-10"
                  style={{ background: "linear-gradient(90deg, #FF0080 0%, #B200FF 100%)" }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "ĐĂNG NHẬP NGAY"
                  )}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-10 text-center text-zinc-500 text-[14px] font-medium tracking-tight">
            Chưa có tài khoản?{" "}
            <Link to="/signup" className="text-[#FF0080] hover:text-white transition-colors font-bold ml-1">
              Tạo tài khoản miễn phí
            </Link>
          </p>
        </div>

      </div>

      {/* Decorative sparkle in corner */}
      <div className="absolute bottom-10 right-10 opacity-20">
         <svg className="w-12 h-12 text-zinc-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
         </svg>
      </div>

      <div className="absolute bottom-6 w-full text-center">
          <p className="text-[10px] text-zinc-700 font-semibold uppercase tracking-[0.3em]">
             © 2026 CMUSIC PLATFORM • BUILT WITH PASSION
          </p>
      </div>
    </div>
  );
};
