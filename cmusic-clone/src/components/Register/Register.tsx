import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const handleSubmit = (): void => {
    navigate("/login");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="w-96 bg-gray-900 p-8 rounded-lg">
        <h1 className="text-2xl text-white mb-6">Đăng Ký</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <input type="text" placeholder="Tên" className="w-full p-2 mb-4 bg-gray-800 text-white rounded" required />
          <input type="email" placeholder="Email" className="w-full p-2 mb-4 bg-gray-800 text-white rounded" required />
          <input type="password" placeholder="Mật khẩu" className="w-full p-2 mb-4 bg-gray-800 text-white rounded" required />
          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
            Đăng Ký
          </button>
        </form>
      </div>
    </div>
  );
}
