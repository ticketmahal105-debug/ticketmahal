import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { User, Ticket, Calendar, Heart, LogOut, ChevronDown, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data?.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Error fetching role in UserMenu:', err);
      }
    };
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const getFirstName = () => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };
  
  const getInitial = () => {
    return getFirstName().charAt(0).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-1.5 py-1.5 bg-ivory/50 border border-transparent hover:border-beige hover:bg-white rounded-full transition-all duration-300"
      >
        <div className="w-8 h-8 rounded-full bg-ticket-burgundy text-ticket-white flex items-center justify-center text-xs font-semibold shadow-sm">
          {getInitial()}
        </div>
        <span className="text-sm font-medium text-ticket-charcoal hidden md:block">
          {getFirstName()}
        </span>
        <ChevronDown size={14} className={`text-ticket-charcoal/40 transition-transform duration-300 hidden md:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-[calc(100%+8px)] right-0 w-56 bg-ticket-white border border-ticket-beige rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2 z-50 text-left overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-ticket-beige/40 bg-ticket-ivory/30">
              <p className="text-sm font-semibold text-ticket-charcoal truncate">{user?.user_metadata?.full_name || getFirstName()}</p>
              <p className="text-xs text-ticket-charcoal/50 truncate">{user?.email}</p>
            </div>
            
            <div className="py-1">
              {isAdmin && (
                <button 
                  onClick={() => { setIsOpen(false); navigate('/admin'); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-ticket-burgundy hover:bg-ticket-burgundy/10 transition-colors flex items-center gap-3 font-semibold border-b border-beige/30"
                >
                  <ShieldAlert size={16} /> Admin Panel
                </button>
              )}
              <button 
                onClick={() => { setIsOpen(false); navigate('/profile'); }}
                className="w-full text-left px-4 py-2.5 text-sm text-ticket-charcoal/70 hover:text-ticket-charcoal hover:bg-ivory transition-colors flex items-center gap-3"
              >
                <User size={16} className="text-ticket-charcoal/40" /> My Profile
              </button>
              <button 
                onClick={() => { setIsOpen(false); navigate('/my-tickets'); }}
                className="w-full text-left px-4 py-2.5 text-sm text-ticket-charcoal/70 hover:text-ticket-charcoal hover:bg-ivory transition-colors flex items-center gap-3"
              >
                <Ticket size={16} className="text-ticket-charcoal/40" /> My Tickets
              </button>
              <button 
                onClick={() => { setIsOpen(false); navigate('/bookings'); }}
                className="w-full text-left px-4 py-2.5 text-sm text-ticket-charcoal/70 hover:text-ticket-charcoal hover:bg-ivory transition-colors flex items-center gap-3"
              >
                <Calendar size={16} className="text-ticket-charcoal/40" /> My Bookings
              </button>
              <button 
                onClick={() => { setIsOpen(false); navigate('/wishlist'); }}
                className="w-full text-left px-4 py-2.5 text-sm text-ticket-charcoal/70 hover:text-ticket-charcoal hover:bg-ivory transition-colors flex items-center gap-3"
              >
                <Heart size={16} className="text-ticket-charcoal/40" /> Wishlist
              </button>
            </div>

            
            <div className="border-t border-ticket-beige/40 py-1 mt-1">
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600/80 hover:text-red-600 hover:bg-red-50/50 transition-colors flex items-center gap-3 font-medium"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
