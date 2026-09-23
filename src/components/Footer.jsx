import { Link } from 'react-router-dom';
import { ShieldCheck, CreditCard, Globe, Share2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1A1816] text-[#FFFDF8] pt-10 md:pt-12 pb-10 border-t border-ticket-beige/20 relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div 
        className="absolute bottom-0 right-0 w-96 h-96 bg-ticket-burgundy/10 rounded-full blur-3xl pointer-events-none" 
      />
      <div 
        className="absolute top-0 left-0 w-80 h-80 bg-ticket-gold/5 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        

        {/* MAIN NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8 pb-12 border-b border-white/10">
          
          {/* COL 1: LOGO & BRAND */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <img 
                src="https://res.cloudinary.com/tejjggbw/image/upload/Untitled_design_-_2026-08-21T182953.259" 
                alt="Ticket Mahal Logo" 
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </Link>
            
            <p className="text-xs text-white/60 font-light max-w-sm leading-relaxed">
              Your premier digital gateway to extraordinary live events, concerts, theatre productions, and immersive experiences across the UAE.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-1">
              <a 
                href="#instagram" 
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-ticket-gold hover:border-ticket-gold/40 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href="#facebook" 
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-ticket-gold hover:border-ticket-gold/40 transition-all text-xs font-bold"
              >
                f
              </a>
              <a 
                href="#twitter" 
                aria-label="Twitter"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-ticket-gold hover:border-ticket-gold/40 transition-all text-xs font-bold"
              >
                𝕏
              </a>
              <a 
                href="#share" 
                aria-label="Share"
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-ticket-gold hover:border-ticket-gold/40 transition-all"
              >
                <Share2 size={15} />
              </a>
            </div>
          </div>

          {/* COL 2: DISCOVER */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ticket-gold">
              Discover
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/70 font-light">
              <li><Link to="/category/music" className="hover:text-white transition-colors">Music & Concerts</Link></li>
              <li><Link to="/events?category=Theatre" className="hover:text-white transition-colors">Theatre & Shows</Link></li>
              <li><Link to="/category/comedy" className="hover:text-white transition-colors">Comedy & Stand-up</Link></li>
              <li><Link to="/events?category=Attractions" className="hover:text-white transition-colors">Experiences & Attractions</Link></li>
              <li><Link to="/events?environment=outdoor" className="hover:text-white transition-colors">Outdoor Experiences</Link></li>
              <li><Link to="/events?sort=popular" className="hover:text-white transition-colors">Trending Events</Link></li>
            </ul>
          </div>

          {/* COL 3: HELP & SUPPORT */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ticket-gold">
              Support & Help
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/70 font-light">
              <li><a href="#how-to-book" className="hover:text-white transition-colors">How to Book Tickets</a></li>
              <li><a href="#customer-support" className="hover:text-white transition-colors">Customer Support</a></li>
              <li><a href="#faqs" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
              <li><a href="#refund-policy" className="hover:text-white transition-colors">Refund & Cancellation</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* COL 4: ABOUT TICKET MAHAL */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-ticket-gold">
              Ticket Mahal
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/70 font-light">
              <li><a href="#about-us" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#venues" className="hover:text-white transition-colors">Venues & Partners</a></li>
              <li><a href="#list-event" className="hover:text-white transition-colors">List Your Event</a></li>
              <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#press" className="hover:text-white transition-colors">Press & Media</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          
          <div className="flex items-center gap-6">
            <span>© 2026 Ticket Mahal. All rights reserved.</span>
            <div className="hidden sm:flex items-center gap-1.5 text-white/40">
              <Globe size={14} />
              <span>United Arab Emirates</span>
            </div>
          </div>

          {/* Payment Badges / Security */}
          <div className="flex items-center gap-4 text-white/40">
            <div className="flex items-center gap-1">
              <ShieldCheck size={16} className="text-ticket-gold" />
              <span>100% Verified Tickets</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <CreditCard size={16} />
              <span>Secure Checkout</span>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
