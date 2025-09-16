import React from 'react';
import { ToastContainer } from 'react-toastify';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AddSong from './pages/AddSong';
import AddPlaylist from './pages/AddPlaylist';
import ListSongs from './pages/ListSongs';
import ListPlaylists from './pages/ListPlaylists';
import ListUsers from './pages/Users/ListUsers';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login/Login';
// Import trang Login Admin (ví dụ)
// import AdminLogin from './pages/AdminLogin'; 

// Hàm kiểm tra trạng thái đăng nhập Admin
// Trong thực tế, bạn sẽ kiểm tra token, cookie, hoặc state global
const checkAdminAuth = () => {
  console.log("Checking admin authentication..."); // Debug log
  // Check for access token and user data
  const accessToken = localStorage.getItem('accessToken');
  const userData = localStorage.getItem('userData');
  
  console.log("Access Token in localStorage:", accessToken ? "Found" : "Not Found"); // Debug log
  console.log("User Data in localStorage:", userData ? "Found" : "Not Found"); // Debug log

  if (!accessToken || !userData) {
    console.log("Authentication failed: Missing token or user data."); // Debug log
    return false;
  }

  try {
    // Parse user data and check role
    const user = JSON.parse(userData);
    console.log("Parsed User Data:", user); // Debug log
    console.log("User Role:", user.role); // Debug log
    const isAdmin = user.role === 'admin';
    console.log("Is Admin:", isAdmin); // Debug log
    return isAdmin;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error); // Debug log
    return false;
  }
};

// Component Protected Route
const ProtectedRoute = ({ children }) => {
  const isAdminAuthenticated = checkAdminAuth();
  if (!isAdminAuthenticated) {
    // Nếu chưa xác thực, chuyển hướng đến trang đăng nhập admin
    return <Navigate to="/login" replace />;
  }
  // Nếu đã xác thực, hiển thị component con (trang yêu cầu truy cập)
  return children;
};

const App = () => {
  const location = useLocation(); // Get current location

  return (
    <div className='flex items-starts min-h-screen'>
      <ToastContainer />
      
      {/* Sidebar and Navbar only display when authenticated AND not on login page */}
      {checkAdminAuth() && location.pathname !== '/login' && <Sidebar />} 

      <div className='flex-1 h-screen overflow-y-scroll bg-[#F3FFF7]'>
         {/* Navbar only display when authenticated AND not on login page */}
        {checkAdminAuth() && location.pathname !== '/login' && <Navbar />} 

        <div className='pt-8 pl-5 sm:pt-12 sm:pl-12'>
          <Routes>
            {/* Route for admin login page (does not need protection) */}
            {/* <Route path="/login" element={<AdminLogin />} /> */}
             <Route path="/login" element={<Login></Login>} /> {/* Placeholder */}


            {/* Các route cần bảo vệ - sử dụng ProtectedRoute */}
            <Route path="/" element={<ProtectedRoute><Navigate to="/list-songs" replace /></ProtectedRoute>} /> {/* Redirect mặc định sau đăng nhập */}
            <Route path="/add-song" element={<ProtectedRoute><AddSong /></ProtectedRoute>} />
            <Route path="/add-playlist" element={<ProtectedRoute><AddPlaylist /></ProtectedRoute>} />
            <Route path="/list-songs" element={<ProtectedRoute><ListSongs /></ProtectedRoute>} />
            <Route path="/list-playlists" element={<ProtectedRoute><ListPlaylists /></ProtectedRoute>} />

            {/* New route for listing users */}
            <Route path="/list-users" element={<ProtectedRoute><ListUsers /></ProtectedRoute>} />

            {/* Route 404 */}
            <Route path="*" element={
              <div className="flex items-center justify-center h-[80vh]">
                <h1 className="text-2xl font-bold text-gray-700">404 - Page Not Found</h1>
              </div>
            } />
          </Routes>
        </div> 
      </div>
    </div>
  );
};

export default App;
