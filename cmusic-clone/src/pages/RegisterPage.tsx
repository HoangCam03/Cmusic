import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope as faEnvelopeRegular,
  faUser as faUserRegular,
} from "@fortawesome/free-regular-svg-icons";
import {
  faLock,
  faEye,
  faEyeSlash,
  faMusic,
  faStar,
  faDownload,
  faShieldHalved,
  faRotateRight,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import {
  faGoogle,
  faFacebookF,
  faApple,
  faXTwitter
} from "@fortawesome/free-brands-svg-icons";
import { userSignUp, verifyEmail, resendOtp } from "../services/UserSignUp/UserSignUp";



// ── Input Field Component ──────────────────────────────────────────────────────
const InputField: React.FC<{
  icon: any; type: string; value: string; placeholder: string;
  onChange: (v: string) => void; rightSlot?: React.ReactNode; disabled?: boolean;
}> = ({ icon, type, value, placeholder, onChange, rightSlot, disabled }) => {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const active = focused || hovered;

  return (
    <div className="relative group/input"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none"
        style={{ color: active ? "#FF0080" : "#4B5563", transition: "color 0.3s" }}>
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <input
        type={type} required value={value} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full pl-11 pr-11 py-[12px] rounded-[10px] text-sm text-white outline-none transition-all duration-300 placeholder:text-[#6B7280] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "transparent",
          border: active ? "1px solid #FF0080" : "1px solid #282828",
          boxShadow: active ? "0 0 15px rgba(255,0,128,0.2)" : "none",
        }}
      />
      {rightSlot && (
        <div className="absolute inset-y-0 right-4 flex items-center">{rightSlot}</div>
      )}
    </div>
  );
};

// ── Logo Component ─────────────────────────────────────────────────────────────
const Logo: React.FC = () => (
  <div className="flex items-center gap-4">
    <div className="relative group cursor-pointer">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,0,128,0.4)] transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3"
        style={{ background: "linear-gradient(135deg, #FF0080, #B200FF)" }}>
        <FontAwesomeIcon icon={faMusic} className="text-white text-xl animate-music-bounce" />
      </div>
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#FF5500" }}></span>
        <span className="relative inline-flex rounded-full h-4 w-4 border-2 border-[#050002]" style={{ background: "linear-gradient(135deg, #FF7200, #FF3E00)" }}></span>
      </span>
    </div>
    <div className="flex flex-col">
      <span className="text-white text-3xl font-black tracking-tight leading-none">CMusic</span>
      <span className="text-[#FF0080] text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Premium</span>
    </div>
  </div>
);

// ── OTP Input (6 ô riêng biệt) ────────────────────────────────────────────────
const OtpInput: React.FC<{
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
  hasError?: boolean;
}> = ({ value, onChange, disabled, hasError }) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[idx] = digit;
    onChange(next);
    if (digit && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[idx]) {
        const next = [...value];
        next[idx] = "";
        onChange(next);
      } else if (idx > 0) {
        inputs.current[idx - 1]?.focus();
        const next = [...value];
        next[idx - 1] = "";
        onChange(next);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => { next[i] = c; });
    onChange(next);
    const lastIdx = Math.min(pasted.length, 5);
    inputs.current[lastIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array(6).fill(0).map((_, idx) => (
        <input
          key={idx}
          ref={el => { inputs.current[idx] = el; }}
          id={`otp-digit-${idx}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          disabled={disabled}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className="w-11 h-14 text-center text-xl font-black text-white rounded-xl outline-none transition-all duration-200 disabled:opacity-40 cursor-text"
          style={{
            background: value[idx]
              ? "linear-gradient(135deg, rgba(255,0,128,0.25), rgba(178,0,255,0.25))"
              : "rgba(255,255,255,0.04)",
            border: hasError
              ? "1.5px solid rgba(255,0,80,0.8)"
              : value[idx]
                ? "1.5px solid rgba(255,0,128,0.8)"
                : "1.5px solid rgba(255,255,255,0.1)",
            boxShadow: value[idx]
              ? "0 0 12px rgba(255,0,128,0.25)"
              : "none",
            caretColor: "#FF0080",
          }}
        />
      ))}
    </div>
  );
};

// ── Countdown Timer Hook ───────────────────────────────────────────────────────
function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!active) return;
    if (remaining <= 0) { setActive(false); return; }
    const timer = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, active]);

  const reset = useCallback((s = seconds) => {
    setRemaining(s);
    setActive(true);
  }, [seconds]);

  return { remaining, canResend: !active || remaining <= 0, reset };
}

// ── Main Component ─────────────────────────────────────────────────────────────
type Step = "form" | "otp" | "success";

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<Step>("form");
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", displayName: "" });
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState(false);
  const navigate = useNavigate();
  const { remaining, canResend, reset: resetCountdown } = useCountdown(60);

  // ── Bước 1: Đăng ký → Nhận OTP
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError("Mật khẩu xác nhận không khớp!");
    if (form.password.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự!");
    setLoading(true); setError("");
    try {
      const data = await userSignUp({
        email: form.email, password: form.password, displayName: form.displayName,
      });
      if (data.success) {
        setStep("otp");
        resetCountdown(60);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại. Email có thể đã tồn tại!");
    } finally { setLoading(false); }
  };

  // ── Bước 2: Xác thực OTP
  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setOtpError(true); return; }
    setVerifying(true); setOtpError(false);
    try {
      const data = await verifyEmail(form.email, otp);
      if (data.success) {
        setStep("success");
      }
    } catch (err: any) {
      setOtpError(true);
      setOtpDigits(Array(6).fill(""));
      setTimeout(() => setOtpError(false), 800);
    } finally { setVerifying(false); }
  };

  // ── Gửi lại OTP
  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendOtp(form.email);
      setOtpDigits(Array(6).fill(""));

      resetCountdown(60);
    } catch (err: any) {
      // Nếu server báo lỗi throttle → reset đếm lại
    }
  };

  const eyeBtn = (
    <button type="button" onClick={() => setShowPwd(p => !p)}
      className="text-[#4B5563] hover:text-[#FF0080] transition-colors focus:outline-none">
      <FontAwesomeIcon icon={showPwd ? faEyeSlash : faEye} className="text-sm" />
    </button>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#050002] selection:bg-[#FF0080]/30 selection:text-white relative"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes float {
          0% { transform: translateY(0px); } 50% { transform: translateY(-12px); } 100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        @keyframes music-bounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-10deg); }
          50% { transform: scale(1) rotate(0deg); }
          75% { transform: scale(1.1) rotate(10deg); }
        }
        .animate-music-bounce { animation: music-bounce 2s ease-in-out infinite; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.45s ease forwards; }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>

      {/* Ambient Glow */}
      <div className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vw] max-w-[1200px] max-h-[1200px] rounded-full pointer-events-none opacity-[0.15]"
        style={{ background: "radial-gradient(circle, #FF0080 0%, transparent 60%)" }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #B200FF 0%, #FF0080 40%, transparent 70%)" }} />

      {/* ══════════ LEFT — Branding ══════════ */}
      <div className="hidden lg:flex flex-col justify-center w-[55%] h-full p-16 pl-[10%] relative z-10 flex-shrink-0">
        <FontAwesomeIcon icon={faMusic} className="absolute text-[#FF0080]/10 text-6xl top-[20%] left-[60%] animate-float" />
        <FontAwesomeIcon icon={faStar} className="absolute text-[#B200FF]/10 text-4xl bottom-[30%] left-[20%] animate-float" style={{ animationDelay: "1s" }} />
        <div className="mb-10"><Logo /></div>
        <div className="space-y-6 max-w-lg mb-12">
          <h1 className="text-[3.5rem] font-black text-white leading-[1.1] tracking-tight drop-shadow-lg">
            Âm nhạc<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(to right, #FF0080, #D200FF)" }}>
              không giới hạn
            </span>
          </h1>
          <p className="text-base leading-relaxed text-[#9CA3AF]">
            Trải nghiệm âm nhạc đẳng cấp với hàng triệu bài hát, podcast độc quyền và chất lượng âm thanh Hi-Fi.
          </p>
        </div>
        <div className="space-y-4 mb-14">
          {[
            { text: "Nghe nhạc không quảng cáo", icon: faMusic },
            { text: "Tải xuống nghe offline", icon: faDownload },
            { text: "Bảo mật tài khoản 2 lớp", icon: faShieldHalved },
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FF0080]/15">
                <FontAwesomeIcon icon={feature.icon} className="text-[#FF0080] text-[13px]" />
              </div>
              <span className="text-[14px] font-medium text-[#E5E7EB] drop-shadow-md">{feature.text}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-12 border-t border-white/5 pt-8 w-max">
          {[["50M+", "BÀI HÁT"], ["5M+", "NGƯỜI DÙNG"], ["100K+", "NGHỆ SĨ"]].map(([v, l]) => (
            <div key={l}>
              <p className="text-[28px] font-black" style={{ color: "#FF0080", textShadow: "0 0 20px rgba(255,0,128,0.3)" }}>{v}</p>
              <p className="text-[10px] font-bold tracking-widest mt-1 text-[#6B7280]">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ RIGHT — Form Panel ══════════ */}
      <div className="flex-1 h-full flex flex-col justify-center items-center py-8 relative z-10 px-4">
        {/* Mobile Logo */}
        <div className="flex lg:hidden mb-8 transform scale-[0.85] origin-center z-20"><Logo /></div>

        <div className="relative w-full max-w-[420px]">
          {/* Top Glow */}
          <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[70%] h-[2px] z-0 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #FF0080, transparent)", boxShadow: "0 0 25px 8px rgba(255,0,128,0.4)" }} />

          {/* Card */}
          <div className="w-full rounded-[24px] p-6 sm:p-8 relative overflow-hidden z-10"
            style={{ background: "#030002", border: "1px solid rgba(255,0,128,0.2)", backdropFilter: "blur(10px)" }}>

            {/* ────── STEP: FORM ────── */}
            {step === "form" && (
              <div className="animate-slide-up">
                <div className="text-center mb-6">
                  <h1 className="text-white text-[32px] font-semibold text-center mb-2 font-outfit tracking-tight">Tạo tài khoản</h1>
                  <p className="text-[#8B95A1] text-sm">Tham gia cộng đồng yêu nhạc ngay hôm nay</p>
                </div>

                {/* Social Logins */}
                <div className="grid grid-cols-4 gap-4 mb-5">
                  {[
                    { icon: faGoogle, hoverClass: "hover:text-[#ea4335] hover:bg-[#ea4335]/10 hover:border-[#ea4335]/20" },
                    { icon: faFacebookF, hoverClass: "hover:text-[#1877f2] hover:bg-[#1877f2]/10 hover:border-[#1877f2]/20" },
                    { icon: faXTwitter, hoverClass: "hover:text-white hover:bg-white/10 hover:border-white/20" },
                    { icon: faApple, hoverClass: "hover:text-white hover:bg-white/10 hover:border-white/20" }
                  ].map((btn, idx) => (
                    <button key={idx} type="button" className={`h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-400 transition-all duration-300 ${btn.hoverClass}`}>
                      <FontAwesomeIcon icon={btn.icon as any} className="text-lg transition-transform hover:scale-110" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="flex-1 h-px bg-[#222]" />
                  <span className="text-[10px] font-bold tracking-widest text-[#4B5563]">HOẶC</span>
                  <div className="flex-1 h-px bg-[#222]" />
                </div>

                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-[#FF0080]">TÊN HIỂN THỊ</label>
                    <InputField icon={faUserRegular} type="text" value={form.displayName} placeholder="Nhập tên của bạn"
                      onChange={v => setForm(f => ({ ...f, displayName: v }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-[#FF0080]">EMAIL</label>
                    <InputField icon={faEnvelopeRegular} type="email" value={form.email} placeholder="email@example.com"
                      onChange={v => setForm(f => ({ ...f, email: v }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-[#FF0080]">MẬT KHẨU</label>
                    <InputField icon={faLock} type={showPwd ? "text" : "password"} value={form.password}
                      placeholder="Tối thiểu 6 ký tự" onChange={v => setForm(f => ({ ...f, password: v }))}
                      rightSlot={eyeBtn} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-wider text-[#FF0080]">XÁC NHẬN MẬT KHẨU</label>
                    <InputField icon={faLock} type={showPwd ? "text" : "password"} value={form.confirmPassword}
                      placeholder="Nhập lại mật khẩu" onChange={v => setForm(f => ({ ...f, confirmPassword: v }))}
                      rightSlot={eyeBtn} />
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                      style={{ background: "rgba(255,0,128,0.1)", border: "1px solid rgba(255,0,128,0.3)", color: "#FF0080" }}>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#FF0080] animate-pulse" />
                      {error}
                    </div>
                  )}

                  <button disabled={loading}
                    className="w-full py-3.5 rounded-xl font-black tracking-[0.1em] uppercase text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] mt-3 shadow-[0_4px_14px_0_rgba(255,0,128,0.39)]"
                    style={{ background: "linear-gradient(90deg, #FF0080 0%, #B200FF 100%)" }}>
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : "ĐĂNG KÝ NGAY"
                    }
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-[10px] leading-relaxed text-[#6B7280]">
                    Bằng việc đăng ký, bạn đồng ý với{" "}
                    <a href="#" className="text-[#FF0080] hover:text-white transition-colors">Điều khoản</a>{" "}
                    và <a href="#" className="text-[#FF0080] hover:text-white transition-colors">Chính sách bảo mật</a>
                  </p>
                </div>
              </div>
            )}

            {/* ────── STEP: OTP ────── */}
            {step === "otp" && (
              <div className="animate-slide-up">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-scale-in"
                    style={{ background: "linear-gradient(135deg, rgba(255,0,128,0.2), rgba(178,0,255,0.2))", border: "1.5px solid rgba(255,0,128,0.4)", boxShadow: "0 0 30px rgba(255,0,128,0.2)" }}>
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[#FF0080] text-2xl" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-white mb-2">Nhập mã xác thực</h2>
                  <p className="text-[#8B95A1] text-sm leading-relaxed">
                    Chúng tôi vừa gửi mã OTP 6 số đến{" "}
                    <span className="text-white font-bold">{form.email}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className={`mb-3 transition-all ${otpError ? "animate-shake" : ""}`}>
                  <OtpInput
                    value={otpDigits}
                    onChange={setOtpDigits}
                    disabled={verifying}
                    hasError={otpError}
                  />
                </div>

                {otpError && (
                  <p className="text-center text-sm text-[#FF0080] mb-4 animate-slide-up">
                    Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại!
                  </p>
                )}

                {/* OTP Expiry note */}
                <p className="text-center text-[11px] text-[#4B5563] mb-5">
                  Mã có hiệu lực trong{" "}
                  <span className="text-[#FF0080] font-bold">5 phút</span>
                </p>

                {/* Verify Button */}
                <button
                  id="btn-verify-otp"
                  onClick={handleVerifyOtp}
                  disabled={verifying || otpDigits.join("").length < 6}
                  className="w-full py-3.5 rounded-xl font-black tracking-[0.1em] uppercase text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] mb-4 shadow-[0_4px_14px_0_rgba(255,0,128,0.39)]"
                  style={{ background: "linear-gradient(90deg, #FF0080 0%, #B200FF 100%)" }}>
                  {verifying
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : "XÁC THỰC NGAY"
                  }
                </button>

                {/* Resend */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[#4B5563] text-[12px]">Không nhận được mã?</span>
                  {canResend ? (
                    <button
                      id="btn-resend-otp"
                      onClick={handleResend}
                      className="text-[12px] font-bold text-[#FF0080] hover:text-white transition-colors flex items-center gap-1">
                      <FontAwesomeIcon icon={faRotateRight} className="text-[10px]" />
                      Gửi lại
                    </button>
                  ) : (
                    <span className="text-[12px] font-bold text-[#6B7280]">
                      Gửi lại sau{" "}
                      <span className="text-[#FF0080] tabular-nums">{remaining}s</span>
                    </span>
                  )}
                </div>

                {/* Back */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setStep("form"); setOtpDigits(Array(6).fill("")); setOtpError(false); }}
                    className="text-[11px] text-[#4B5563] hover:text-white transition-colors">
                    ← Sửa email hoặc quay lại
                  </button>
                </div>
              </div>
            )}

            {/* ────── STEP: SUCCESS ────── */}
            {step === "success" && (
              <div className="text-center py-4 animate-slide-up">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center animate-scale-in"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1.5px solid rgba(16,185,129,0.4)", boxShadow: "0 0 40px rgba(16,185,129,0.2)" }}>
                    <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 text-4xl" />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-white mb-3">Xác thực thành công! 🎉</h2>
                <p className="text-[#9CA3AF] text-sm leading-relaxed mb-8 px-2">
                  Tài khoản của bạn đã được kích hoạt thành công.<br />
                  Chào mừng bạn đến với <span className="text-[#FF0080] font-bold">CMusic</span>!
                </p>

                <button
                  id="btn-goto-login"
                  onClick={() => navigate("/login")}
                  className="w-full py-3.5 rounded-xl font-black tracking-[0.1em] uppercase text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_14px_0_rgba(255,0,128,0.39)]"
                  style={{ background: "linear-gradient(90deg, #FF0080 0%, #B200FF 100%)" }}>
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-[12px] text-[#8B95A1] mt-6 font-medium">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-bold text-[#FF0080] hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(255,0,128,0.4)]">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};
