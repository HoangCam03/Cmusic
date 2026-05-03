import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faDisplay, 
  faBell, 
  faCogs, 
  faShieldAlt,
  faMoon,
  faEnvelope,
  faVolumeUp,
  faSync,
  faClock,
  faKey,
  faChevronDown,
  faTimes,
  faLock
} from "@fortawesome/free-solid-svg-icons";
import { changePassword } from "../services/UserLogin/UserLoginService";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotify: true,
    pushNotify: true,
    soundNotify: true,
    autoRefresh: true
  });

  // Password Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        toast.success("Đổi mật khẩu thành công!");
        setShowPasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.message || "Đổi mật khẩu thất bại!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const SectionCard = ({ icon, title, subtitle, children }: any) => (
    <div className="bg-[#0c0c0c] border border-white/[0.05] rounded-2xl overflow-hidden shadow-2xl mb-6">
      <div className="px-8 py-6 border-b border-white/[0.03]">
        <div className="flex items-center gap-4">
          <div className="text-[#ff2d55] text-xl opacity-80">
            <FontAwesomeIcon icon={icon} />
          </div>
          <div>
            <h2 className="text-white text-[16px] font-bold tracking-tight">{title}</h2>
            <p className="text-zinc-500 text-[11px] font-medium tracking-wide mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-8 py-2">
        {children}
      </div>
    </div>
  );

  const SettingRow = ({ icon, label, sublabel, children }: any) => (
    <div className="flex items-center justify-between py-6 border-b border-white/[0.03] last:border-0 grow">
      <div className="flex items-center gap-4">
        {icon && <div className="w-5 text-zinc-600 text-[14px] flex justify-center"><FontAwesomeIcon icon={icon} /></div>}
        <div className="flex flex-col">
          <span className="text-zinc-200 text-[13.5px] font-bold">{label}</span>
          <span className="text-zinc-600 text-[11px] font-medium mt-0.5">{sublabel}</span>
        </div>
      </div>
      <div className="flex items-center">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <button 
      onClick={onToggle}
      className={`w-11 h-6 rounded-full relative transition-all duration-300 cursor-pointer ${active ? 'bg-[#ff2d55]' : 'bg-zinc-800'}`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${active ? 'left-6' : 'left-1'}`}></div>
    </button>
  );

  const SelectBox = ({ value }: { value: string }) => (
    <div className="relative group cursor-pointer">
      <div className="bg-[#050505] border border-white/[0.08] px-4 py-2 rounded-lg flex items-center gap-6 min-w-[140px] justify-between group-hover:border-white/20 transition-all">
        <span className="text-white text-[12px] font-bold">{value}</span>
        <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-zinc-600" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] font-inter antialiased pb-20">
      
      {/* 1. Clinical Header */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
          <div>
            <h1 className="text-white text-[18px] font-bold tracking-tight leading-none">Cài đặt</h1>
            <p className="text-zinc-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-70">Tùy chỉnh giao diện và cấu hình hệ thống</p>
          </div>
        </div>
      </div>

      {/* 2. Main Content Wrapper */}
      <div className="max-w-3xl mx-auto w-full pt-10 px-6">
        
        {/* UI Settings */}
        <SectionCard icon={faDisplay} title="Giao diện" subtitle="Tùy chỉnh giao diện hiển thị">
          <SettingRow label="Chủ đề" sublabel="Chọn chế độ sáng hoặc tối">
            <div className="flex items-center gap-2 bg-[#050505] border border-white/[0.08] px-4 py-2 rounded-lg">
               <FontAwesomeIcon icon={faMoon} className="text-[12px] text-zinc-400" />
               <span className="text-white text-[12px] font-bold ml-1">Tối</span>
               <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-zinc-600 ml-4" />
            </div>
          </SettingRow>
          <SettingRow label="Ngôn ngữ" sublabel="Chọn ngôn ngữ hiển thị">
            <div className="flex items-center gap-2 bg-[#050505] border border-white/[0.08] px-4 py-2 rounded-lg">
               <div className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-white">VN</div>
               <span className="text-white text-[12px] font-bold ml-1">Tiếng Việt</span>
               <FontAwesomeIcon icon={faChevronDown} className="text-[10px] text-zinc-600 ml-4" />
            </div>
          </SettingRow>
        </SectionCard>

        {/* Notification Settings */}
        <SectionCard icon={faBell} title="Thông báo" subtitle="Cấu hình gửi thông báo">
          <SettingRow icon={faEnvelope} label="Thông báo Email" sublabel="Nhận thông báo qua email">
            <Toggle active={settings.emailNotify} onToggle={() => toggleSetting('emailNotify')} />
          </SettingRow>
          <SettingRow icon={faBell} label="Thông báo Push" sublabel="Nhận thông báo đẩy trên trình duyệt">
            <Toggle active={settings.pushNotify} onToggle={() => toggleSetting('pushNotify')} />
          </SettingRow>
          <SettingRow icon={faVolumeUp} label="Âm thanh cảnh báo" sublabel="Phát âm thanh khi có cảnh báo mới">
            <Toggle active={settings.soundNotify} onToggle={() => toggleSetting('soundNotify')} />
          </SettingRow>
        </SectionCard>

        {/* General Settings */}
        <SectionCard icon={faCogs} title="Cài đặt chung" subtitle="Thông tin cơ bản của hệ thống">
          <SettingRow icon={faSync} label="Tự động làm mới" sublabel="Tự động cập nhật dữ liệu dashboard">
            <Toggle active={settings.autoRefresh} onToggle={() => toggleSetting('autoRefresh')} />
          </SettingRow>
          <SettingRow icon={faClock} label="Khoảng thời gian làm mới" sublabel="Chọn tần suất cập nhật dữ liệu">
            <SelectBox value="30 giây" />
          </SettingRow>
        </SectionCard>

        {/* Security Settings */}
        <SectionCard icon={faShieldAlt} title="Bảo mật" subtitle="Cài đặt bảo mật tài khoản">
          <SettingRow label="Đổi mật khẩu" sublabel="Cập nhật mật khẩu đăng nhập">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl transition-all flex items-center gap-3 active:scale-95 cursor-pointer"
            >
               <FontAwesomeIcon icon={faKey} className="text-[11px] text-zinc-400" />
               <span className="text-white text-[12px] font-bold">Đổi mật khẩu</span>
            </button>
          </SettingRow>
          <SettingRow label="Xác thực hai yếu tố (2FA)" sublabel="Đang bật — mã OTP yêu cầu mỗi lần đăng nhập">
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-500 text-[10px] font-black uppercase tracking-widest">Active</div>
          </SettingRow>
        </SectionCard>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
           <button className="bg-[#ff2d55] hover:bg-[#ff4b6d] text-white text-[12px] font-black uppercase tracking-widest px-10 py-4 rounded-2xl transition-all shadow-xl shadow-[#ff2d55]/20 flex items-center gap-3 active:scale-95 group cursor-pointer">
              <span className="tracking-widest">Lưu tất cả thay đổi</span>
           </button>
        </div>

      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ff2d55]/20 flex items-center justify-center text-[#ff2d55]">
                  <FontAwesomeIcon icon={faLock} className="text-xs" />
                </div>
                <h3 className="text-white font-bold text-[16px]">Đổi mật khẩu</h3>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handlePasswordChange} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-zinc-400 text-[11px] font-black uppercase tracking-widest ml-1">Mật khẩu cũ</label>
                <input 
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#ff2d55]/50 transition-all placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-[11px] font-black uppercase tracking-widest ml-1">Mật khẩu mới</label>
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#ff2d55]/50 transition-all placeholder:text-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 text-[11px] font-black uppercase tracking-widest ml-1">Xác nhận mật khẩu mới</label>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#ff2d55]/50 transition-all placeholder:text-zinc-700"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#ff2d55] hover:bg-[#ff4b6d] disabled:opacity-50 text-white text-[12px] font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-lg shadow-[#ff2d55]/20 active:scale-[0.98] cursor-pointer"
                >
                  {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
