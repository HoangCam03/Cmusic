interface LoginRequiredModalProps {
  onClose?: () => void;
}

export function LoginRequiredModal({ onClose }: LoginRequiredModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="p-6 bg-gray-900 rounded text-white w-96">
        <h2 className="text-2xl mb-4">Cần Đăng Nhập</h2>
        <p className="mb-6 text-gray-400">Vui lòng đăng nhập để tiếp tục</p>
        <button onClick={onClose} className="w-full bg-green-500 p-2 rounded hover:bg-green-600">
          Đóng
        </button>
      </div>
    </div>
  );
}
