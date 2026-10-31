import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Ticket, Users, Settings, LogOut, 
  Receipt, Tags, Map, FileBarChart, Layers, X 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminSidebar = ({ mobileOpen, onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/admin' },
    { label: 'Events', icon: <Calendar size={18} />, path: '/admin/events' },
    { label: 'Bookings', icon: <Receipt size={18} />, path: '/admin/bookings' },
    { label: 'Tickets', icon: <Ticket size={18} />, path: '/admin/tickets' },
    { label: 'Users', icon: <Users size={18} />, path: '/admin/users' },
    { label: 'Promo Codes', icon: <Tags size={18} />, path: '/admin/promo-codes' },
    { label: 'Categories', icon: <Layers size={18} />, path: '/admin/categories' },
    { label: 'Venues', icon: <Map size={18} />, path: '/admin/venues' },
    { label: 'Reports', icon: <FileBarChart size={18} />, path: '/admin/reports' },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      <div className="p-6 border-b border-ticket-beige/60 flex items-center justify-between">
        <Link 
          to="/admin" 
          onClick={isMobile ? onCloseMobile : undefined}
          className="font-playfair text-2xl font-bold text-ticket-charcoal tracking-wide"
        >
          Ticket Mahal
          <span className="block text-xs font-sans font-semibold text-ticket-burgundy uppercase tracking-[0.2em] mt-1">
            Admin Workspace
          </span>
        </Link>
        {isMobile && (
          <button 
            onClick={onCloseMobile} 
            className="p-2 text-ticket-charcoal/60 hover:text-ticket-charcoal rounded-lg"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.label}
              to={item.path}
              onClick={isMobile ? onCloseMobile : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-ticket-burgundy/10 text-ticket-burgundy border border-ticket-gold/20 font-bold'
                  : 'text-ticket-charcoal/60 hover:bg-ivory hover:text-ticket-charcoal border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-ticket-burgundy' : 'text-ticket-charcoal/40'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-ticket-beige/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-ticket-charcoal/60 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} className="text-ticket-charcoal/40" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="w-64 bg-ticket-white border-r border-ticket-beige/60 flex flex-col h-full hidden md:flex shrink-0">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (Section P Requirement) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] bg-ticket-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
