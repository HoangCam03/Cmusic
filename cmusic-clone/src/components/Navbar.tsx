export function Navbar() {
  return (
    <nav className="bg-black text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">CMusic</h1>
      <div>
        <button className="px-4 py-2 bg-green-500 rounded hover:bg-green-600">Đăng Nhập</button>
      </div>
    </nav>
  );
}
