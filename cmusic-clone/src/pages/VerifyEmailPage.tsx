import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic } from "@fortawesome/free-solid-svg-icons";

/**
 * Trang này chỉ giữ để tương thích URL cũ.
 * Hệ thống đã chuyển sang luồng OTP xác thực trực tiếp trong trang Đăng ký.
 * Tự động redirect về trang đăng ký sau 3 giây.
 */
export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/signup"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#050002]"
      style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #FF0080, #B200FF)" }}>
          <FontAwesomeIcon icon={faMusic} className="text-white text-2xl" />
        </div>
        <p className="text-[#9CA3AF] text-sm">Đang chuyển hướng...</p>
      </div>
    </div>
  );
};
