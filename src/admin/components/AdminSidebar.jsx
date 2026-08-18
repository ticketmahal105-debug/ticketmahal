import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Ticket, Users, Settings, LogOut, Receipt, Tags, Map, FileBarChart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const AdminSidebar = () => {
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
    // { label: 'Payments', icon: <CreditCard size={18} />, path: '/admin/payments' },
    { label: 'Promo Codes', icon: <Tags size={18} />, path: '/admin/promo-codes' },
    { label: 'Categories', icon: <LayoutDashboard size={18} />, path: '/admin/categories' },
    { label: 'Venues', icon: <Map size={18} />, path: '/admin/venues' },
    { label: 'Reports', icon: <FileBarChart size={18} />, path: '/admin/reports' },
    { label: 'Settings', icon: <Settings size={18} />, path: '/admin/settings' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-beige/60 flex flex-col h-full hidden md:flex shrink-0">
      <div className="p-6 border-b border-beige/60">
        <Link to="/admin" className="font-playfair text-2xl font-bold text-charcoal tracking-wide">
          Ticket Mahal
          <span className="block text-xs font-sans font-semibold text-champagne uppercase tracking-[0.2em] mt-1">
            Admin Workspace
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1.5 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-champagne/10 text-champagne border border-champagne/20'
                  : 'text-charcoal/60 hover:bg-ivory hover:text-charcoal border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-champagne' : 'text-charcoal/40'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-beige/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-charcoal/60 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={18} className="text-charcoal/40" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
