import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronDown, X, Globe, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';
import UserMenu from './UserMenu';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Dubai');
  const [authOpen, setAuthOpen] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);

  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const searchRef = useRef(null);
  const locationRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle auto-open auth modal from protected routes
  useEffect(() => {
    if (location.state?.openAuth && !user && !loading) {
      setAuthOpen(true);
      // Clear the state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, user, loading, navigate]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const locations = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Ajman', 'Al Ain'];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-ivory/95 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.03)] border-b border-beige'
            : 'py-5 bg-ivory/90 backdrop-blur-sm border-b border-beige/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-4">
          {/* Main Desktop and Mobile Header Row 1 */}
          <div className="flex items-center justify-between gap-6">
            {/* 1. LOGO */}
            <div className="flex-shrink-0">
              <a href="/" className="font-playfair text-xl md:text-2xl font-semibold tracking-wide text-charcoal hover:text-champagne transition-colors">
                Ticket Mahal
              </a>
            </div>

            {/* 2. DESKTOP LARGE SEARCH BAR */}
            <div ref={searchRef} className="hidden md:block flex-1 max-w-2xl relative">
              <div className="relative flex items-center">
                <Search className="absolute left-4 text-charcoal/40" size={18} />
                <input
                  type="text"
                  placeholder="Search events, artists, venues or experiences"
                  onFocus={() => setSearchFocused(true)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-charcoal/10 rounded-2xl text-sm font-medium text-charcoal placeholder-charcoal/40 outline-none focus:border-champagne focus:ring-1 focus:ring-champagne/30 transition-all duration-300 shadow-sm"
                />
              </div>

              {/* Suggestions Panel */}
              <AnimatePresence>
                {searchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-beige/80 rounded-2xl shadow-xl p-5 z-50 text-left"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-charcoal/40 font-semibold mb-3">Recent Searches</h4>
                        <ul className="space-y-2 text-sm text-charcoal/70">
                          <li className="hover:text-champagne cursor-pointer transition-colors">La Perle Dubai</li>
                          <li className="hover:text-champagne cursor-pointer transition-colors">Opera Ballet</li>
                          <li className="hover:text-champagne cursor-pointer transition-colors">Fine Dining DIFC</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[11px] uppercase tracking-wider text-charcoal/40 font-semibold mb-3">Trending Events</h4>
                        <ul className="space-y-2 text-sm text-charcoal/70">
                          <li className="hover:text-champagne cursor-pointer transition-colors">Dubai Symphony Orchestra</li>
                          <li className="hover:text-champagne cursor-pointer transition-colors">Comedy Night Live</li>
                          <li className="hover:text-champagne cursor-pointer transition-colors">Skyline Jazz Gala</li>
                        </ul>
                      </div>
                    </div>
                    <div className="border-t border-beige/40 mt-4 pt-4 flex gap-8">
                      <div className="flex-1">
                        <h4 className="text-[11px] uppercase tracking-wider text-charcoal/40 font-semibold mb-2">Popular Categories</h4>
                        <div className="flex flex-wrap gap-2">
                          {['Opera', 'Fine Dining', 'Concerts', 'Theatre'].map((c) => (
                            <span key={c} className="text-xs px-3 py-1 bg-ivory rounded-full text-charcoal/60 hover:text-charcoal cursor-pointer transition-colors border border-beige">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Side Items (Location, Auth, Burger) */}
            <div className="flex items-center gap-4">
              
              {/* 3. DESKTOP LOCATION SELECTOR */}
              <div ref={locationRef} className="hidden md:block relative">
                <button
                  onClick={() => setLocationOpen(!locationOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-ivory border border-beige rounded-2xl text-sm font-medium text-charcoal hover:bg-white hover:border-champagne/40 transition-all duration-300"
                >
                  <MapPin size={16} className="text-champagne" />
                  <span>{selectedLocation}</span>
                  <ChevronDown size={14} className={`text-charcoal/40 transition-transform duration-300 ${locationOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {locationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white border border-beige/80 rounded-2xl shadow-xl py-2 z-50 text-left"
                    >
                      <button
                        onClick={() => {
                          setSelectedLocation('Dubai');
                          setLocationOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-champagne hover:bg-ivory transition-colors flex items-center gap-2 border-b border-beige/40"
                      >
                        <MapPin size={12} /> Use my current location
                      </button>
                      {locations.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => {
                            setSelectedLocation(loc);
                            setLocationOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-ivory ${
                            selectedLocation === loc ? 'text-champagne font-semibold' : 'text-charcoal/70'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. SIGN UP / LOGIN OR USER MENU */}
              {!loading && (
                user ? (
                  <UserMenu />
                ) : (
                  <>
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="hidden md:block text-sm font-medium text-charcoal hover:text-champagne transition-colors"
                    >
                      Sign Up / Login
                    </button>
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="md:hidden text-xs font-medium text-charcoal border border-beige bg-white/80 px-3 py-1.5 rounded-full hover:bg-white transition-colors"
                    >
                      Login
                    </button>
                  </>
                )
              )}
              {loading && <div className="w-16 h-8 animate-pulse bg-beige/30 rounded-full" />}

              {/* 5. THREE-LINE BURGER MENU */}
              <button
                onClick={() => setBurgerOpen(true)}
                className="flex flex-col justify-center items-center gap-1.5 w-10 h-10 rounded-full border border-beige bg-white/40 hover:bg-white hover:border-champagne/40 transition-all duration-300"
              >
                <span className="w-5 h-[1px] bg-charcoal"></span>
                <span className="w-5 h-[1px] bg-charcoal"></span>
                <span className="w-5 h-[1px] bg-charcoal"></span>
              </button>

            </div>
          </div>

          {/* MOBILE SEARCH ROW 2 */}
          <div className="md:hidden flex flex-col gap-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-charcoal/40" size={16} />
              <input
                type="text"
                placeholder="Search events, artists, or venues"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-charcoal/10 rounded-2xl text-xs font-medium text-charcoal outline-none focus:border-champagne transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {/* Mobile Compact Location */}
              <button
                onClick={() => setLocationOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-ivory border border-beige rounded-xl text-xs font-medium text-charcoal"
              >
                <MapPin size={12} className="text-champagne" />
                <span>{selectedLocation}</span>
                <ChevronDown size={10} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* AUTHENTICATION MODAL */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />

      {/* SLIDE-OUT DRAWER */}
      <AnimatePresence>
        {burgerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Drawer Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBurgerOpen(false)}
              className="absolute inset-0 bg-charcoal/20 backdrop-blur-sm"
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-ivory shadow-2xl p-10 flex flex-col justify-between border-l border-beige/40 overflow-y-auto"
            >
              <div>
                <div className="flex justify-between items-center mb-12">
                  <span className="font-playfair text-xl font-semibold text-charcoal tracking-wide">Discovery Menu</span>
                  <button
                    onClick={() => setBurgerOpen(false)}
                    className="text-charcoal/50 hover:text-charcoal transition-colors border border-beige p-2 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Nav Links */}
                <nav className="flex flex-col gap-6 text-left">
                  {['Home', 'Events', 'Categories', 'Venues', 'Organizers', 'About', 'Contact', 'FAQs'].map((item) => (
                    <a
                      key={item}
                      href={`#${item.toLowerCase()}`}
                      onClick={() => setBurgerOpen(false)}
                      className="font-playfair text-2xl text-charcoal/80 hover:text-champagne transition-colors"
                    >
                      {item}
                    </a>
                  ))}
                  <div className="h-[1px] bg-champagne/20 my-4" />
                  <a
                    href="#organizer"
                    onClick={() => setBurgerOpen(false)}
                    className="text-sm font-medium tracking-wider text-champagne hover:text-charcoal transition-colors flex items-center gap-2 uppercase"
                  >
                    Become an Organizer <ArrowRight size={14} />
                  </a>
                </nav>
              </div>

              <div className="mt-12 space-y-8 text-left">
                {/* Language Switch */}
                <div className="flex items-center gap-2 text-xs font-semibold text-charcoal/60">
                  <Globe size={14} />
                  <button className="text-charcoal">English</button>
                  <span className="opacity-30">|</span>
                  <button className="hover:text-charcoal transition-colors font-sans">العربية</button>
                </div>

                {/* Socials */}
                <div className="flex gap-4 text-xs font-medium text-charcoal/40">
                  <a href="#instagram" className="hover:text-champagne transition-colors">Instagram</a>
                  <a href="#twitter" className="hover:text-champagne transition-colors">Twitter</a>
                  <a href="#linkedin" className="hover:text-champagne transition-colors">LinkedIn</a>
                </div>

                {/* Brand Tagline */}
                <div>
                  <p className="font-playfair italic text-charcoal/50 text-sm">"Experiences Worthy of You"</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
