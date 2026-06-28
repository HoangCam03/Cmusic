import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faGem, faGraduationCap, faUsers, faStar, faTimes } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

const plans = [
  {
    id: "student",
    name: "Học sinh/Sinh viên",
    price: "29.500₫",
    amount: 29500,
    period: "/tháng",
    description: "Dành cho sinh viên các trường đại học đủ điều kiện.",
    features: ["1 tài khoản Premium", "Nghe nhạc không quảng cáo", "Chất lượng âm thanh cực cao (320kbps)", "Hủy bất cứ lúc nào"],
    icon: faGraduationCap,
    color: "from-blue-500 to-cyan-400"
  },
  {
    id: "premium",
    name: "Cá nhân (Premium)",
    price: "59.000₫",
    amount: 59000,
    period: "/tháng",
    description: "Trải nghiệm âm nhạc không giới hạn cho riêng bạn.",
    features: ["1 tài khoản Premium", "Nghe nhạc không quảng cáo", "Chất lượng âm thanh cực cao", "Hỗ trợ lời bài hát thời gian thực", "Badge Premium đặc biệt"],
    icon: faStar,
    color: "from-purple-600 to-pink-500",
    popular: true
  },
  {
    id: "family",
    name: "Gia đình",
    price: "99.000₫",
    amount: 99000,
    period: "/tháng",
    description: "Dành cho gia đình tối đa 6 thành viên sống cùng một địa chỉ.",
    features: ["6 tài khoản Premium", "Nghe nhạc không quảng cáo", "Kiểm soát nội dung nhạy cảm", "Hủy bất cứ lúc nào"],
    icon: faUsers,
    color: "from-orange-500 to-yellow-500"
  }
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentPlan = currentUser.plan || "free";

  const handleUpgrade = async (plan: any) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");

    // Kiểm tra linh hoạt cả _id hoặc id và sự tồn tại của token
    if ((!user._id && !user.id) || !token) {
      toast.error("Vui lòng đăng nhập để nâng cấp Premium");
      navigate("/signup");
      return;
    }

    // Lấy ID chính xác
    const userId = user._id || user.id;

    setLoading(plan.id);
    try {
      const res = await api.post("/payment/create-order", { 
        userId: userId,
        planId: plan.id,
        amount: plan.amount
      });
      
      if (res.data.return_code === 1) {
        setPaymentData({ ...res.data, amount: plan.amount }); // Lưu thêm số tiền để hiển thị bill
        toast.success("Đã tạo đơn hàng thanh toán ZaloPay!");
      } else {
        toast.error("Không thể tạo đơn hàng, vui lòng thử lại sau");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi kết nối với ZaloPay");
    } finally {
      setLoading(null);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.app_trans_id) return;

    setChecking(true);
    try {
      const res = await api.get(`/payment/status/${paymentData.app_trans_id}`);
      
      if (res.data.status === 'success') {
        toast.success("Thanh toán thành công! Bạn đã là thành viên Premium.");
        
        // Cập nhật localStorage
        const updatedUser = { ...currentUser, plan: res.data.planId || paymentData.planId };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Chuyển sang màn hình hóa đơn
        setSuccessReceipt({
          ...paymentData,
          planId: res.data.planId || paymentData.planId,
          completedAt: new Date().toLocaleString('vi-VN')
        });
        setPaymentData(null);
      } else {
        toast.error("Hệ thống chưa nhận được thanh toán. Vui lòng quét mã và thử lại.");
      }
    } catch (err: any) {
      toast.error("Không thể kiểm tra trạng thái thanh toán lúc này");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex-1 bg-[#09090b] overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto px-6 py-20">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full">
            <FontAwesomeIcon icon={faGem} className="text-purple-400 text-sm" />
            <span className="text-purple-400 text-[11px] font-black uppercase tracking-[0.2em]">CMusic Premium</span>
          </div>
          <h1 className="text-white text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Nâng tầm trải nghiệm <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">âm nhạc của bạn</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-medium">
            Nghe nhạc chất lượng cao, không quảng cáo và tận hưởng các tính năng độc quyền dành riêng cho thành viên Premium.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-zinc-900/40 rounded-3xl p-8 border border-white/5 flex flex-col transition-all duration-500 hover:scale-[1.02] group ${
                plan.popular ? "ring-2 ring-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.15)]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                  Phổ biến nhất
                </div>
              )}

              <div className="mb-8">
                <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
                  <FontAwesomeIcon icon={plan.icon} className="text-white text-xl" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-3xl font-black">{plan.price}</span>
                  <span className="text-zinc-500 text-sm font-medium">{plan.period}</span>
                </div>
                <p className="text-zinc-500 text-sm mt-4 font-medium leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
                    </div>
                    <span className="text-zinc-300 text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleUpgrade(plan)}
                disabled={loading !== null || currentPlan === plan.id}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl ${
                  currentPlan === plan.id
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                  : plan.popular 
                  ? "bg-white text-black hover:bg-zinc-200 active:scale-95" 
                  : "bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95"
                }`}
              >
                {currentPlan === plan.id 
                  ? "Đang sử dụng" 
                  : loading === plan.id 
                    ? "Đang xử lý..." 
                    : "Bắt đầu ngay"
                }
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Preview */}
        <div className="mt-24 text-center">
          <p className="text-zinc-500 text-sm font-medium">
            Bạn có câu hỏi? <span className="text-white hover:underline cursor-pointer">Xem Trung tâm trợ giúp</span> hoặc <span className="text-white hover:underline cursor-pointer">Liên hệ chúng tôi</span>.
          </p>
        </div>

      </div>

      {/* ZaloPay Payment Modal */}
      {paymentData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setPaymentData(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-[#121212] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-8 text-center relative">
               <img src="https://upload.wikimedia.org/wikipedia/vi/f/f9/ZaloPay_Logo.png" className="h-8 mx-auto mb-4 invert brightness-0" alt="ZaloPay" />
               <h3 className="text-white text-xl font-black">Thanh toán đơn hàng</h3>
               <p className="text-blue-100 text-sm mt-1">Sử dụng ứng dụng ZaloPay để quét mã</p>
               
               <button 
                onClick={() => setPaymentData(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-all hover:rotate-90"
               >
                 <FontAwesomeIcon icon={faTimes} className="text-xl" />
               </button>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-3xl mb-6 shadow-2xl">
                 <QRCodeSVG value={paymentData.order_url} size={200} />
              </div>

              <div className="text-center space-y-2 mb-8">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Số tiền</p>
                <p className="text-white text-3xl font-black">{paymentData.amount?.toLocaleString()}₫</p>
              </div>

              <div className="w-full space-y-3">
                 <a 
                  href={paymentData.order_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-500 text-white text-center py-4 rounded-2xl font-black text-sm"
                 >
                   Mở ứng dụng ZaloPay
                 </a>
                 <button 
                  onClick={checkPaymentStatus}
                  disabled={checking}
                  className="w-full bg-zinc-800 text-white py-4 rounded-2xl font-black text-sm"
                 >
                   {checking ? "Đang kiểm tra..." : "Tôi đã thanh toán xong"}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Receipt Modal */}
      {successReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-500" />
          <div className="relative z-10 w-full max-w-sm bg-[#18181b] rounded-[32px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(34,197,94,0.2)] animate-in slide-in-from-bottom-10 duration-500">
            {/* Header Success */}
            <div className="bg-gradient-to-b from-green-500/20 to-transparent p-8 text-center border-b border-white/5">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-bounce-short">
                <FontAwesomeIcon icon={faCheck} className="text-white text-4xl" />
              </div>
              <h3 className="text-white text-2xl font-black tracking-tight mb-2">Thanh toán thành công</h3>
              <p className="text-zinc-400 text-sm">Gói CMusic Premium của bạn đã được kích hoạt.</p>
            </div>

            {/* Receipt Details */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-zinc-500 text-sm font-medium">Mã giao dịch</span>
                  <span className="text-white text-sm font-bold font-mono bg-white/5 px-2 py-1 rounded-md">{successReceipt.app_trans_id}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-zinc-500 text-sm font-medium">Gói cước</span>
                  <span className="text-purple-400 text-sm font-black uppercase tracking-wider">{successReceipt.planId}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-zinc-500 text-sm font-medium">Thời gian</span>
                  <span className="text-zinc-300 text-sm font-medium">{successReceipt.completedAt}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-zinc-500 text-sm font-medium">Tổng tiền</span>
                  <span className="text-white text-2xl font-black">{successReceipt.amount?.toLocaleString()}₫</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setSuccessReceipt(null);
                  window.location.reload();
                }}
                className="w-full mt-4 bg-white text-black py-4 rounded-2xl font-black text-sm hover:bg-zinc-200 transition-all active:scale-95 shadow-xl"
              >
                Bắt đầu nghe nhạc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
