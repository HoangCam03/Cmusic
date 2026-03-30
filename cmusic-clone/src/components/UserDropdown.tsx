interface UserDropdownProps {
  onLogout?: () => void;
}

export function UserDropdown({ onLogout }: UserDropdownProps) {
  return (
    <div className="absolute top-10 right-0 bg-gray-900 rounded shadow-lg">
      <button onClick={onLogout} className="w-full text-left px-4 py-2 text-white hover:bg-gray-800">
        Đăng Xuất
      </button>
    </div>
  );
}
