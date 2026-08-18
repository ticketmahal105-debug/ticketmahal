import { Search, Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminTopbar = () => {
  const { user } = useAuth();
  
  const getInitials = () => {
    if (!user) return 'A';
    const first = user.user_metadata?.first_name?.charAt(0) || '';
    const last = user.user_metadata?.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'A';
  };

  return (
    <header className="h-20 bg-white border-b border-beige/60 flex items-center justify-between px-8 shrink-0">
      
      {/* Search */}
      <div className="relative w-full max-w-md hidden sm:block">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
        <input 
          type="text" 
          placeholder="Search bookings, customers, events..." 
          className="w-full pl-11 pr-4 py-2.5 bg-ivory border border-beige/60 rounded-full text-sm outline-none focus:border-champagne focus:bg-white transition-all placeholder:text-charcoal/30 text-charcoal"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 ml-auto">
        <button className="relative text-charcoal/40 hover:text-charcoal transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-champagne rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-beige/60">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-charcoal">{user?.user_metadata?.first_name || 'Admin'}</p>
            <p className="text-xs text-charcoal/50">System Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne font-semibold font-playfair">
            {getInitials()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
