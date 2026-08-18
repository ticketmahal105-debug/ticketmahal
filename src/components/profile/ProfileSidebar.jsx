import { User, Ticket, Calendar, Heart, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProfileSidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'My Profile', icon: <User size={18} />, path: '/profile' },
    { label: 'My Tickets', icon: <Ticket size={18} />, path: '/my-tickets' },
    { label: 'My Bookings', icon: <Calendar size={18} />, path: '/bookings' },
    { label: 'Wishlist', icon: <Heart size={18} />, path: '/wishlist' },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
              isActive
                ? 'bg-champagne/10 text-charcoal border border-champagne/20'
                : 'text-charcoal/60 hover:bg-ivory hover:text-charcoal border border-transparent'
            }`}
          >
            <span className={isActive ? 'text-champagne' : 'text-charcoal/40'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}

      <div className="h-[1px] bg-beige/40 my-4" />

      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-red-600/80 hover:bg-red-50 hover:text-red-600 transition-all duration-300"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
};

export default ProfileSidebar;
