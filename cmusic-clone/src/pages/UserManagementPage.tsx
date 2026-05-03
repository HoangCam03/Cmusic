import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUser,
  faUsers,
  faMicrophone,
  faTrash,
  faEdit,
  faEllipsisV,
  faCircle,
  faUserPlus,
  faShieldHalved,
  faEye,
  faEyeSlash,
  faSort,
  faSortUp,
  faSortDown
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

interface User {
  _id: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl?: string;
  isOnline?: boolean;
  gender?: string;
  country?: string;
  plan?: string;
}

import {
  getAllUsers,
  getUserStats,
  updateUserRole,
  deleteUser,
  createUser,
  updateUserProfile
} from '../services/UserManagement/UserManagement';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [statsData, setStatsData] = useState({ total: 0, artists: 0, regularUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Custom Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Xác nhận',
    danger: true,
    onConfirm: () => {}
  });

  const closeConfirm = () => setConfirmDialog(prev => ({ ...prev, open: false }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const userData = await getAllUsers(currentPage, 10, searchTerm);
      if (userData.success) {
        setUsers(userData.data.users);
        setTotalPages(userData.data.pagination?.totalPages || 1);
      }

      const statsJson = await getUserStats();
      if (statsJson.success) {
        setStatsData({
          total: statsJson.data.total,
          artists: statsJson.data.artists,
          regularUsers: statsJson.data.regularUsers
        });
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu người dùng:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...users].sort((a: any, b: any) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setUsers(sorted);
  };

  const handleDeleteUser = async (userId: string, displayName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Xóa tài khoản',
      message: `Bạn có chắc chắn muốn xóa tài khoản "${displayName}"? Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa người dùng',
      danger: true,
      onConfirm: async () => {
        closeConfirm();
        const loadingToast = toast.loading('Đang thực hiện xóa...');
        try {
          const res = await deleteUser(userId);
          if (res.success) {
            toast.success('Đã xóa người dùng thành công!', { id: loadingToast });
            fetchData();
            setOpenMenuId(null);
          } else {
            toast.error('Lỗi khi xóa người dùng!', { id: loadingToast });
          }
        } catch (error) {
          toast.error('Lỗi khi xóa người dùng!', { id: loadingToast });
        }
      }
    });
  };

  const handleUpdateRole = async (userId: string, displayName: string, currentRole: string) => {
    const newRole = currentRole === 'artist' ? 'user' : 'artist';
    const isPromotion = newRole === 'artist';
    setConfirmDialog({
      open: true,
      title: isPromotion ? 'Nâng cấp Nghệ sĩ' : 'Hạ xuống Người dùng',
      message: isPromotion
        ? `Bạn có muốn nâng cấp tài khoản "${displayName}" lên Nghệ sĩ không? Người dùng sẽ có thêm quyền đăng tải nội dung.`
        : `Bạn có muốn hạ cấp "${displayName}" xuống Người dùng không? Quyền đăng tải nội dung sẽ bị thu hồi.`,
      confirmLabel: isPromotion ? 'Nâng cấp' : 'Hạ cấp',
      danger: !isPromotion,
      onConfirm: async () => {
        closeConfirm();
        const loadingToast = toast.loading('Đang cập nhật vai trò...');
        try {
          const res = await updateUserRole(userId, newRole);
          if (res.success) {
            toast.success('Đã cập nhật vai trò thành công!', { id: loadingToast });
            fetchData();
            setOpenMenuId(null);
          } else {
            toast.error('Lỗi khi cập nhật vai trò!', { id: loadingToast });
          }
        } catch (error) {
          toast.error('Lỗi khi cập nhật vai trò!', { id: loadingToast });
        }
      }
    });
  };

  useEffect(() => {
    fetchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchTerm, currentPage]);

  const stats = [
    { label: "Tổng người dùng", value: statsData.total, icon: faUsers, color: "text-blue-500" },
    { label: "Nghệ sĩ", value: statsData.artists, icon: faMicrophone, color: "text-[#ff2d55]" },
    { label: "Người nghe", value: statsData.regularUsers, icon: faUser, color: "text-emerald-500" },
  ];

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return { label: "Admin", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
      case "artist":
        return { label: "Artist", color: "text-[#ff2d55] bg-[#ff2d55]/10 border-[#ff2d55]/20" };
      default:
        return { label: "User", color: "text-zinc-500 bg-white/5 border-white/10" };
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [adding, setAdding] = useState(false);
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await createUser(newUser);
      if (res.success) {
        toast.success(`Đã tạo thành viên ${newUser.displayName} thành công!`);
        setIsModalOpen(false);
        setNewUser({ displayName: '', email: '', password: '', role: 'user' });
        fetchData();
      } else {
        toast.error(res.message || "Lỗi khi tạo người dùng!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi hệ thống khi tạo người dùng!");
    } finally {
      setAdding(false);
    }
  };

  // State Edit User
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  const openEditModal = (user: User) => {
    setEditingUser({ ...user, password: '' });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
    setShowEditUserPassword(false);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setSavingEdit(true);
    try {
      const res = await updateUserProfile(editingUser._id, {
        displayName: editingUser.displayName,
        country: editingUser.country,
        gender: editingUser.gender,
        plan: editingUser.plan,
        password: editingUser.password || undefined
      });

      // Nếu Role thay đổi, gọi thêm API updateRole
      const originalUser = users.find(u => u._id === editingUser._id);
      let roleRes = { success: true, message: '' };
      if (originalUser && originalUser.role !== editingUser.role) {
         roleRes = await updateUserRole(editingUser._id, editingUser.role);
      }

      if (res.success && roleRes.success) {
        toast.success(`Cập nhật thông tin ${editingUser.displayName} thành công!`);
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchData();
        
        // Also call role update if role changed and it is different
        // In real app, might want a single API call for both or handle role separately 
      } else {
         toast.error(res.message || "Lỗi khi cập nhật!");
      }
    } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi hệ thống khi cập nhật!");
    } finally {
        setSavingEdit(false);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <FontAwesomeIcon icon={faSort} className="ml-2 text-[10px] text-zinc-700 hover:text-zinc-500" />;
    return sortConfig.direction === 'asc' 
      ? <FontAwesomeIcon icon={faSortUp} className="ml-2 text-[12px] text-[#ff2d55]" />
      : <FontAwesomeIcon icon={faSortDown} className="ml-2 text-[12px] text-[#ff2d55]" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] font-inter antialiased pb-20">

      {/* 1. Header with Add Button */}
      <div className="px-10 py-5 border-b border-white/[0.08] flex justify-between items-center bg-[#050505] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-5 bg-[#ff2d55] rounded-full drop-shadow-[0_0_5px_#ff2d55]"></div>
          <div>
            <h1 className="text-white text-[18px] font-bold tracking-tight leading-none">Quản lý người dùng</h1>
            <p className="text-zinc-400 text-[11px] mt-1.5 font-medium uppercase tracking-widest opacity-70">Thống kê và quản trị tài khoản thành viên hệ thống</p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff2d55] hover:bg-[#ff4b6d] text-white text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-[#ff2d55]/10 flex items-center gap-2 active:scale-95 group cursor-pointer"
        >
          <FontAwesomeIcon icon={faUserPlus} className="text-[11px] group-hover:scale-110 transition-transform" />
          Thêm người dùng
        </button>
      </div>

      {/* MODAL THÊM NGƯỜI DÙNG (REGISTER PAGE STYLE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
             onClick={() => !adding && setIsModalOpen(false)}
           ></div>
           
           <div className="relative w-full max-w-[420px] rounded-[24px] overflow-hidden animate-in zoom-in-95 duration-500"
                style={{ background: "#030002", border: "1px solid rgba(255,0,128,0.2)", backdropFilter: "blur(10px)" }}>
              
              {/* Top Glow Line */}
              <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[70%] h-[2px] z-[1] rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #FF0080, transparent)", boxShadow: "0 0 25px 8px rgba(255,0,128,0.4)" }} />

              <div className="relative p-8 sm:p-10">
                 <div className="text-center mb-8">
                    <h1 className="text-white text-[28px] font-semibold text-center mb-2 font-outfit uppercase tracking-tight">Thêm thành viên</h1>
                    <p className="text-[#8B95A1] text-[12px] font-medium">Khởi tạo tài khoản hệ thống mới</p>
                 </div>

                 <form onSubmit={handleCreateUser} className="space-y-4" autoComplete="off">
                    <input style={{ display: 'none' }} type="text" name="fake-user-name" />
                    <input style={{ display: 'none' }} type="password" name="fake-password" />

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Tên hiển thị</label>
                       <input 
                         required
                         type="text" 
                         autoComplete="none"
                         value={newUser.displayName}
                         onChange={e => setNewUser({...newUser, displayName: e.target.value})}
                         className="w-full px-5 py-3.5 rounded-[10px] bg-transparent border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all placeholder:text-[#4B5563]"
                         placeholder="Nhập tên người dùng..."
                       />
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Địa chỉ Email</label>
                       <input 
                         required
                         type="email" 
                         autoComplete="none"
                         name="admin-add-user-email"
                         value={newUser.email}
                         onChange={e => setNewUser({...newUser, email: e.target.value})}
                         className="w-full px-5 py-3.5 rounded-[10px] bg-transparent border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all placeholder:text-[#4B5563]"
                         placeholder="example@gmail.com"
                       />
                    </div>

                    <div className="space-y-1">
                       <div className="flex justify-between items-end">
                          <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Mật khẩu</label>
                          <button 
                            type="button"
                            onClick={() => {
                               const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                               let pass = "";
                               for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                               setNewUser({...newUser, password: pass});
                            }}
                            className="text-[9px] font-black uppercase text-zinc-500 hover:text-[#FF0080] transition-colors cursor-pointer mr-1"
                          >
                             Tạo mã ngẫu nhiên ✨
                          </button>
                       </div>
                       <div className="relative">
                          <input 
                            required
                            type={showNewUserPassword ? "text" : "password"} 
                            autoComplete="new-password"
                            name="admin-add-user-password"
                            value={newUser.password}
                            onChange={e => setNewUser({...newUser, password: e.target.value})}
                            className="w-full px-5 py-3.5 pr-20 rounded-[10px] bg-transparent border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all placeholder:text-[#4B5563]"
                            placeholder="*******"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors cursor-pointer"
                          >
                             <FontAwesomeIcon icon={showNewUserPassword ? faEyeSlash : faEye} className="text-xs" />
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2 mt-4">
                       <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Vai trò hệ thống</label>
                       <div className="bg-[#050505] border border-white/[0.05] p-1 rounded-xl flex items-center relative h-12 overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => setNewUser({...newUser, role: 'user'})}
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest z-10 transition-all duration-300 cursor-pointer ${
                              newUser.role === 'user' ? 'text-white' : 'text-[#4B5563] hover:text-zinc-400'
                            }`}
                          >
                             Người dùng
                          </button>
                          <button 
                            type="button"
                            onClick={() => setNewUser({...newUser, role: 'artist'})}
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest z-10 transition-all duration-300 cursor-pointer ${
                              newUser.role === 'artist' ? 'text-white' : 'text-[#4B5563] hover:text-zinc-400'
                            }`}
                          >
                             Nghệ sĩ
                          </button>
                          <button 
                            type="button"
                            onClick={() => setNewUser({...newUser, role: 'admin'})}
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest z-10 transition-all duration-300 cursor-pointer ${
                              newUser.role === 'admin' ? 'text-white' : 'text-[#4B5563] hover:text-zinc-400'
                            }`}
                          >
                             Quản trị
                          </button>
                          <div className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] transition-all duration-500 ease-out shadow-[0_0_20px_rgba(255,45,85,0.4)] ${
                            newUser.role === 'user' ? 'left-1' : 
                            newUser.role === 'artist' ? 'left-[33.333%]' : 'left-[66.666%]'
                          }`} style={{ 
                               background: newUser.role === 'admin' ? "#4a3512" : "#4a151f",
                               border: newUser.role === 'admin' ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,45,85,0.3)",
                               borderRadius: "8px" 
                             }}>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6">
                       <button 
                         type="submit"
                         disabled={adding}
                         className="w-full py-4 rounded-xl font-black tracking-[0.1em] uppercase text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_14px_0_rgba(255,0,128,0.39)]"
                         style={{ background: "linear-gradient(90deg, #FF0080 0%, #B200FF 100%)" }}
                       >
                          {adding ? 'Đang tạo...' : 'XÁC NHẬN TẠO'}
                       </button>
                       <button 
                         type="button"
                         disabled={adding}
                         onClick={() => setIsModalOpen(false)}
                         className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4B5563] hover:text-white transition-all cursor-pointer"
                       >
                          Hủy bỏ
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* EDIT MODAL THÊM QUẢN LÝ VÀ CHỈNH SỬA THÔNG TIN */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
             onClick={() => !savingEdit && setIsEditModalOpen(false)}
           ></div>
           
           <div className="relative w-full max-w-[420px] rounded-[24px] overflow-hidden animate-in zoom-in-95 duration-500"
                style={{ background: "#030002", border: "1px solid rgba(255,0,128,0.2)", backdropFilter: "blur(10px)" }}>
              
              {/* Top Glow Line */}
              <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[70%] h-[2px] z-[1] rounded-full"
                style={{ background: "linear-gradient(90deg, transparent, #FF0080, transparent)", boxShadow: "0 0 25px 8px rgba(255,0,128,0.4)" }} />

              <div className="relative p-8 sm:p-10">
                 <div className="text-center mb-8">
                    <h1 className="text-white text-[28px] font-semibold text-center mb-2 font-outfit uppercase tracking-tight">Cập nhật thông tin</h1>
                    <p className="text-[#8B95A1] text-[12px] font-medium">Chỉnh sửa hồ sơ cho thành viên</p>
                 </div>

                 <form onSubmit={handleSaveEditUser} className="space-y-4" autoComplete="off">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Tên hiển thị</label>
                       <input 
                         required
                         type="text" 
                         value={editingUser.displayName}
                         onChange={e => setEditingUser({...editingUser, displayName: e.target.value})}
                         className="w-full px-5 py-3.5 rounded-[10px] bg-transparent border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all placeholder:text-[#4B5563]"
                       />
                    </div>

                    <div className="flex gap-4">
                      {/* Gender */}
                      <div className="space-y-1 flex-1 mt-2">
                        <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Giới tính</label>
                        <select 
                          value={editingUser.gender || 'other'}
                          onChange={e => setEditingUser({...editingUser, gender: e.target.value})}
                          className="w-full px-5 py-3.5 rounded-[10px] bg-[#050505] border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all cursor-pointer appearance-none"
                        >
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>

                      {/* Country */}
                      <div className="space-y-1 flex-1 mt-2">
                        <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Quốc gia</label>
                        <input 
                          type="text" 
                          value={editingUser.country || ''}
                          onChange={e => setEditingUser({...editingUser, country: e.target.value})}
                          className="w-full px-5 py-3.5 rounded-[10px] bg-transparent border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all placeholder:text-[#4B5563]"
                          placeholder="VD: VN, US, UK..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {/* Plan / Gói cước */}
                      <div className="space-y-1 flex-1 mt-2">
                        <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Gói cước</label>
                        <select 
                          value={editingUser.plan || 'free'}
                          onChange={e => setEditingUser({...editingUser, plan: e.target.value})}
                          className="w-full px-5 py-3.5 rounded-[10px] bg-[#050505] border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all cursor-pointer appearance-none"
                        >
                          <option value="free">Free</option>
                          <option value="premium">Premium</option>
                          <option value="student">Student</option>
                          <option value="family">Family</option>
                        </select>
                      </div>

                      <div className="space-y-1 flex-1 mt-2">
                        <label className="text-[10px] font-bold tracking-wider text-[#8B95A1] ml-1 uppercase">Địa chỉ Email (chỉ xem)</label>
                        <input 
                          type="email" 
                          readOnly
                          value={editingUser.email}
                          className="w-full px-5 py-3.5 rounded-[10px] bg-[#0c0c0c] border border-[#282828] text-zinc-500 text-sm opacity-60 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 mt-2">
                       <div className="flex justify-between items-end">
                          <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Mật khẩu mới (Để trống nếu không đổi)</label>
                          <button 
                            type="button"
                            onClick={() => {
                               const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                               let pass = "";
                               for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                               setEditingUser({...editingUser, password: pass});
                            }}
                            className="text-[9px] font-black uppercase text-zinc-500 hover:text-[#FF0080] transition-colors cursor-pointer mr-1"
                          >
                             Tạo mã ngẫu nhiên ✨
                          </button>
                       </div>
                       <div className="relative">
                          <input 
                            type={showEditUserPassword ? "text" : "password"} 
                            autoComplete="new-password"
                            value={editingUser.password || ''}
                            onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                            className="w-full px-5 py-3.5 pr-20 rounded-[10px] bg-transparent border border-[#282828] text-white text-sm outline-none focus:border-[#FF0080] focus:shadow-[0_0_15px_rgba(255,0,128,0.2)] transition-all placeholder:text-[#4B5563]"
                            placeholder="Nhập mật khẩu mới..."
                          />
                          <button 
                            type="button"
                            onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors cursor-pointer"
                          >
                             <FontAwesomeIcon icon={showEditUserPassword ? faEyeSlash : faEye} className="text-xs" />
                          </button>
                       </div>
                    </div>

                    {/* Role Selection Slider */}
                    <div className="space-y-2 mt-4">
                       <label className="text-[10px] font-bold tracking-wider text-[#FF0080] ml-1 uppercase">Vai trò hệ thống</label>
                       <div className="bg-[#050505] border border-white/[0.05] p-1 rounded-xl flex items-center relative h-12 overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => setEditingUser({...editingUser, role: 'user'})}
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest z-10 transition-all duration-300 cursor-pointer ${
                              editingUser.role === 'user' ? 'text-white' : 'text-[#4B5563] hover:text-zinc-400'
                            }`}
                          >
                             Người dùng
                          </button>
                          <button 
                            type="button"
                            onClick={() => setEditingUser({...editingUser, role: 'artist'})}
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest z-10 transition-all duration-300 cursor-pointer ${
                              editingUser.role === 'artist' ? 'text-white' : 'text-[#4B5563] hover:text-zinc-400'
                            }`}
                          >
                             Nghệ sĩ
                          </button>
                          <button 
                            type="button"
                            onClick={() => setEditingUser({...editingUser, role: 'admin'})}
                            className={`flex-1 text-[9px] font-black uppercase tracking-widest z-10 transition-all duration-300 cursor-pointer ${
                              editingUser.role === 'admin' ? 'text-white' : 'text-[#4B5563] hover:text-zinc-400'
                            }`}
                          >
                             Quản trị
                          </button>
                          
                          {/* Sliding Pill Accent */}
                          <div className={`absolute top-1 bottom-1 w-[calc(33.333%-4px)] transition-all duration-500 ease-out shadow-[0_0_20px_rgba(255,45,85,0.4)] ${
                            editingUser.role === 'user' ? 'left-1' : 
                            editingUser.role === 'artist' ? 'left-[33.333%]' : 'left-[66.666%]'
                          }`} style={{ 
                               background: editingUser.role === 'admin' ? "#4a3512" : "#4a151f",
                               border: editingUser.role === 'admin' ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,45,85,0.3)",
                               borderRadius: "8px" 
                             }}>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6">
                       <button 
                         type="submit"
                         disabled={savingEdit}
                         className="w-full py-4 rounded-xl font-black tracking-[0.1em] uppercase text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_14px_0_rgba(255,0,128,0.39)]"
                         style={{ background: "linear-gradient(90deg, #FF0080 0%, #B200FF 100%)" }}
                       >
                          {savingEdit ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
                       </button>
                       <button 
                         type="button"
                         disabled={savingEdit}
                         onClick={() => setIsEditModalOpen(false)}
                         className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4B5563] hover:text-white transition-all cursor-pointer"
                       >
                          Hủy bỏ
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}

      {/* 2. Stats Row */}
      <div className="px-10 py-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[#0c0c0c] border border-white/[0.05] rounded-2xl p-6 flex items-center gap-6 shadow-xl group hover:border-white/10 transition-all">
            <div className={`w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center text-xl ${stat.color} group-hover:scale-110 transition-transform`}>
              <FontAwesomeIcon icon={stat.icon} />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-black opacity-60 mb-1">{stat.label}</p>
              <h2 className="text-white text-[24px] font-black tracking-tighter leading-none">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Search Section */}
      <div className="px-10 py-2 flex gap-4">
        <div className="relative flex-1 group">
          <FontAwesomeIcon icon={faSearch} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#ff2d55] transition-colors text-sm" />
          <input
            type="text"
            placeholder="Tìm kiếm thành viên..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#0c0c0c] border border-white/[0.05] rounded-xl py-3.5 pl-14 pr-6 text-white text-[13px] outline-none focus:border-[#ff2d55]/30 transition-all placeholder:text-zinc-800"
          />
        </div>
      </div>

      {/* 4. Table Section */}
      <div className="px-10 py-8">
        <div className="bg-[#0c0c0c]/50 border border-white/[0.05] rounded-2xl shadow-2xl overflow-visible relative">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-black">
                <th className="px-8 py-5 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('displayName')}>
                  Thành viên
                  {getSortIcon('displayName')}
                </th>
                <th className="px-8 py-5 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('role')}>
                  Vai trò
                  {getSortIcon('role')}
                </th>
                <th className="px-8 py-5 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('createdAt')}>
                  Ngày tham gia
                  {getSortIcon('createdAt')}
                </th>
                <th className="px-6 py-5 text-left">Gói cước</th>
                <th className="px-6 py-5 text-left">Quốc gia</th>
                <th className="px-8 py-5 text-center">Trạng thái</th>
                <th className="px-8 py-5 text-right w-[100px]">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-white/[0.03]">
                    <td colSpan={7} className="px-8 py-6 h-14 bg-white/[0.01]"></td>
                  </tr>
                ))
              ) : users.length > 0 ? (
                users.map((user) => {
                  const badge = getRoleBadge(user.role);
                  return (
                    <tr key={user._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all group">

                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#050505] border border-white/10 flex items-center justify-center font-black text-blue-400 overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:border-blue-500/50 transition-all">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">{user.displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-white text-[13.5px] font-bold group-hover:text-[#ff2d55] transition-colors">{user.displayName}</p>
                            <p className="text-zinc-500 text-[11px] font-medium">{user.email}</p>
                            <p 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(user._id);
                                toast.success("Đã sao chép UserID!");
                              }}
                              className="text-zinc-700 text-[9px] font-mono hover:text-purple-400 cursor-pointer transition-colors flex items-center gap-1.5"
                              title="Click để sao chép UserID"
                            >
                              ID: {user._id}
                              <FontAwesomeIcon icon={faSort} className="text-[7px] rotate-90 opacity-40" />
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-5">
                        <div className={`inline-flex px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${badge.color}`}>
                          {badge.label}
                        </div>
                      </td>

                      <td className="px-8 py-5 text-zinc-400 text-[12px] font-medium uppercase tracking-tight">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            user.plan === 'premium' ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20' :
                            user.plan === 'student' ? 'bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20' :
                            user.plan === 'family' ? 'bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20' :
                            'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}>
                            {user.plan || 'Free'}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-zinc-400 text-[12px] font-medium uppercase tracking-tight">
                        {user.country || 'VN'}
                      </td>

                      <td className="px-8 py-5 text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${user.isOnline
                            ? 'text-emerald-500 border-emerald-500/10 bg-emerald-500/5 shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                            : 'text-zinc-600 border-white/5 bg-white/[0.01]'
                          }`}>
                          <FontAwesomeIcon icon={faCircle} className={`text-[6px] ${user.isOnline ? 'animate-pulse' : ''}`} />
                          {user.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </td>

                      <td className="px-8 py-5 text-right relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user._id ? null : user._id);
                          }}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${openMenuId === user._id ? 'bg-[#ff2d55] text-white' : 'text-zinc-600 hover:text-white hover:bg-white/5'
                            }`}
                        >
                          <FontAwesomeIcon icon={faEllipsisV} className="text-[12px]" />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === user._id && (
                          <div
                            ref={menuRef}
                            className="absolute right-10 top-0 translate-y-[-50%] w-48 bg-[#121212] border border-white/[0.08] rounded-xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in duration-200"
                          >
                            <button 
                              onClick={() => openEditModal(user)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faEdit} className="w-4" />
                              Chỉnh sửa thông tin
                            </button>
                            <button
                              onClick={() => handleUpdateRole(user._id, user.displayName, user.role)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faShieldHalved} className="w-4" />
                              {user.role === 'artist' ? 'Hạ cấp xuống User' : 'Nâng cấp Nghệ sĩ'}
                            </button>
                            <div className="h-[1px] bg-white/[0.05] my-1 mx-2"></div>
                            <button
                              onClick={() => handleDeleteUser(user._id, user.displayName)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-4" />
                              Xóa tài khoản
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center text-zinc-700 italic text-sm">
                    Không tìm thấy kết quả nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Simplified Pagination UI */}
        {(totalPages > 1) && (
          <div className="mt-8 flex justify-center items-center gap-8 bg-[#0c0c0c]/30 border border-white/[0.05] p-4 rounded-2xl">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white disabled:opacity-20 transition-all cursor-pointer flex items-center gap-3 group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-[#ff2d55] transition-colors"></div>
              Trước
            </button>

            <div className="flex flex-col items-center">
              <span className="text-white text-[13px] font-black tracking-tighter">{currentPage}</span>
              <span className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Trang / {totalPages || 1}</span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white disabled:opacity-20 transition-all cursor-pointer flex items-center gap-3 group"
            >
              Sau
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-[#ff2d55] transition-colors"></div>
            </button>
          </div>
        )}
      </div>

      {/* ── CUSTOM CONFIRM DIALOG ── */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={closeConfirm}
          />
          <div
            className="relative w-full max-w-[380px] rounded-2xl overflow-hidden animate-in zoom-in-95 duration-300"
            style={{ background: '#111010', border: confirmDialog.danger ? '1px solid rgba(255,45,85,0.25)' : '1px solid rgba(59,130,246,0.25)' }}
          >
            {/* Top glow */}
            <div
              className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full"
              style={{
                background: confirmDialog.danger
                  ? 'linear-gradient(90deg, transparent, #FF2D55, transparent)'
                  : 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
                boxShadow: confirmDialog.danger ? '0 0 20px 6px rgba(255,45,85,0.3)' : '0 0 20px 6px rgba(59,130,246,0.3)'
              }}
            />

            <div className="p-8">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 mx-auto ${
                confirmDialog.danger ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-500/10 border border-blue-500/20'
              }`}>
                <FontAwesomeIcon
                  icon={confirmDialog.danger ? faTrash : faShieldHalved}
                  className={`text-lg ${confirmDialog.danger ? 'text-red-500' : 'text-blue-400'}`}
                />
              </div>

              <h2 className="text-white text-[18px] font-bold text-center tracking-tight mb-2">{confirmDialog.title}</h2>
              <p className="text-zinc-400 text-[12.5px] text-center leading-relaxed">{confirmDialog.message}</p>

              <div className="flex gap-3 mt-7">
                <button
                  onClick={closeConfirm}
                  className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-white transition-all cursor-pointer active:scale-95 ${
                    confirmDialog.danger
                      ? 'bg-red-600 hover:bg-red-500 shadow-[0_4px_14px_rgba(239,68,68,0.3)]'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-[0_4px_14px_rgba(59,130,246,0.3)]'
                  }`}
                >
                  {confirmDialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
