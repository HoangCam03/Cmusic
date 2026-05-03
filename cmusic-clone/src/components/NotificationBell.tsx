import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] rounded-full text-[#a1a1aa] hover:text-white transition-all group"
      >
        <FontAwesomeIcon icon={faBell} className="w-4 h-4 group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-[#ff2d55] text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#09090b] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#121212] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/40">
            <h3 className="text-white text-sm font-black uppercase tracking-widest">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1.5 transition-colors"
              >
                <FontAwesomeIcon icon={faCheckDouble} className="text-[10px]" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-5 py-4 border-b border-white/[0.02] hover:bg-white/[0.03] cursor-pointer transition-all flex gap-4 ${!notification.isRead ? 'bg-purple-500/[0.02]' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 shrink-0 flex items-center justify-center overflow-hidden">
                    {notification.senderId?.avatarUrl ? (
                      <img src={notification.senderId.avatarUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-500">
                        {notification.type.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug mb-1 ${!notification.isRead ? 'text-white font-bold' : 'text-zinc-300 font-medium'}`}>
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faBell} className="text-zinc-600 text-xl" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">Chưa có thông báo nào dành cho bạn</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 text-center border-t border-white/5 bg-zinc-900/20">
              <button className="text-[11px] text-zinc-400 hover:text-white font-bold uppercase tracking-widest transition-colors">
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
