import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faGem, faGraduationCap, faUsers, faStar } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";

const plans = [
  {
    id: "student",
    name: "Học sinh/Sinh viên",
    price: "29.500₫",
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

  const handleUpgrade = async (planId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để nâng cấp");
      navigate("/signup");
      return;
    }

    setLoading(planId);
    try {
      const res = await api.post("/auth/upgrade-plan", { plan: planId });
      if (res.data.success) {
        toast.success(`Chúc mừng! Bạn đã nâng cấp lên gói ${planId.toUpperCase()} thành công.`);
        
        // Cập nhật lại thông tin user trong localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        user.plan = planId;
        localStorage.setItem("user", JSON.stringify(user));
        
        // Chờ 2s rồi về trang chủ
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi khi thanh toán");
    } finally {
      setLoading(null);
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
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                  plan.popular 
                  ? "bg-white text-black hover:bg-zinc-200" 
                  : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {loading === plan.id ? "Đang xử lý..." : "Bắt đầu ngay"}
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
    </div>
  );
};

export default PricingPage;
