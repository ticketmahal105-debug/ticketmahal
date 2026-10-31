import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminTopbar = ({ onToggleMobileMenu }) => {
  const { user } = useAuth();
  
  const getInitials = () => {
    if (!user) return 'A';
    const first = user.user_metadata?.first_name?.charAt(0) || '';
    const last = user.user_metadata?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A';
  };

  return (
    <header className="h-20 bg-ticket-white border-b border-ticket-beige/60 flex items-center justify-between px-4 sm:px-8 shrink-0">
      
      {/* Mobile Hamburger Menu Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-ticket-charcoal/70 hover:text-ticket-burgundy border border-ticket-beige/60 rounded-xl"
          title="Open Admin Navigation"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" />
          <input 
            type="text" 
            placeholder="Search bookings, customers, events..." 
            className="w-full pl-11 pr-4 py-2.5 bg-ticket-ivory border border-ticket-beige/60 rounded-full text-sm outline-none focus:border-ticket-gold focus:bg-white transition-all placeholder:text-ticket-charcoal/30 text-ticket-charcoal"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 sm:gap-6 ml-auto">
        <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-ticket-beige/60">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-ticket-charcoal">{user?.user_metadata?.first_name || 'Admin'}</p>
            <p className="text-xs text-ticket-charcoal/50">System Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-ticket-burgundy/10 border border-ticket-gold/20 flex items-center justify-center text-ticket-burgundy font-semibold font-playfair">
            {getInitials()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
