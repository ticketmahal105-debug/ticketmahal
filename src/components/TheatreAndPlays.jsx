import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';
import { dummyMovies } from '../data/dummyMovies';

const theatrePlays = dummyMovies.map((m, idx) => ({
  ...m,
  genre: m.genre.split(',')[0],
  language: m.language.split(',')[0],
  languageCode: "EN",
  startDate: m.releaseDate.substring(0, 6).toUpperCase(),
  endDate: "LIMITED RUN",
  fullDate: m.releaseDate,
  dateStubMonth: m.releaseDate.substring(0, 6).toUpperCase(),
  time: "8:00 PM",
  status: "Premiering Soon",
  actNumber: `ACT 0${idx + 1}`,
  showsCount: "DAILY SHOWTIMES"
}));

export default function TheatreAndPlays() {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      setScrollProgress(progress);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      handleScroll();
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section 
      className="bg-[#FAF6EE] pt-6 md:pt-10 pb-16 lg:pb-20 px-6 md:px-12 relative overflow-hidden border-t border-ticket-beige/40"
      aria-label="Theatre and Plays - On Stage"
    >
      {/* Background Soft Curved Shapes */}
      <div 
        aria-hidden="true"
        className="absolute left-0 top-0 bottom-0 w-36 sm:w-64 md:w-80 bg-gradient-to-r from-ticket-burgundy/[0.03] via-ticket-burgundy/[0.01] to-transparent pointer-events-none rounded-r-[100%] blur-xl transform -translate-x-12"
      />
      <div 
        aria-hidden="true"
        className="absolute right-0 top-0 bottom-0 w-36 sm:w-64 md:w-80 bg-gradient-to-l from-ticket-burgundy/[0.03] via-ticket-burgundy/[0.01] to-transparent pointer-events-none rounded-l-[100%] blur-xl transform translate-x-12"
      />

      <div className="max-w-7xl w-full mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-ticket-burgundy text-[11px] font-bold tracking-[0.20em] uppercase">
                THEATRE & PLAYS
              </span>
              <span className="text-ticket-gold text-xs">◆</span>
              <span className="text-ticket-muted text-[11px] font-semibold tracking-wider uppercase">
                NOW SHOWING
              </span>
            </div>

            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725] leading-tight">
              On Stage
            </h2>

            {/* The Curtain Line Motif */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <div className="h-[1px] w-12 bg-gradient-to-r from-ticket-burgundy/60 to-ticket-burgundy/20" />
              <span className="text-ticket-gold text-xs">✦</span>
              <div className="h-[1px] w-12 bg-gradient-to-l from-ticket-burgundy/60 to-ticket-burgundy/20" />
            </div>

            <p className="text-xs md:text-sm text-[#77736D] mt-1 font-light">
              Stories come alive when the curtain rises.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/events?category=Theatre"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors duration-300"
            >
              <span>Explore All Plays</span>
              <motion.div
                className="inline-block"
                whileHover={{ x: 4, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </motion.div>
            </Link>

            {/* Navigation Arrow Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous Plays"
                className={`w-10 h-10 rounded-full bg-white border border-[#EDE3D5] flex items-center justify-center text-[#292725] transition-all duration-300 shadow-sm ${
                  canScrollLeft
                    ? 'hover:bg-[#7A1F2B] hover:text-white hover:border-[#7A1F2B] cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Next Plays"
                className={`w-10 h-10 rounded-full bg-white border border-[#EDE3D5] flex items-center justify-center text-[#292725] transition-all duration-300 shadow-sm ${
                  canScrollRight
                    ? 'hover:bg-[#7A1F2B] hover:text-white hover:border-[#7A1F2B] cursor-pointer'
                    : 'opacity-40 cursor-not-allowed'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* UNIFORM EQUAL-SIZED CARD TRACK */}
        <div 
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-3 -mx-6 px-6 lg:mx-0 lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {theatrePlays.map((play) => (
            <Link
              key={play.id}
              to={`/events/${play.slug}`}
              className="group flex-none w-[270px] sm:w-[290px] lg:w-[310px] snap-start"
            >
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white rounded-[24px] border border-[#EDE3D5]/80 p-3.5 shadow-xs hover:shadow-md transition-all duration-300"
              >
                {/* Poster Container - 3:4 Ratio with Uncropped Fit */}
                <div className="relative aspect-[3/4] w-full rounded-[18px] overflow-hidden bg-neutral-900/90 mb-3">
                  <img
                    src={play.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40 pointer-events-none select-none"
                  />
                  <motion.img
                    src={play.image}
                    alt={play.title}
                    className="relative z-0 w-full h-full object-contain"
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />

                  {/* Act Number Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#EDE3D5] shadow-xs">
                    <span className="text-[10px] font-bold text-[#7A1F2B] tracking-wider">
                      {play.actNumber}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={play.id} />
                  </div>

                  {/* Ticket Stub Date */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 bg-[#FFF8E8] border border-[#EDE3D5] rounded-lg px-2.5 py-1 flex items-center justify-between shadow-xs">
                    <span className="text-[10px] font-bold text-[#7A1F2B] uppercase">
                      {play.dateStubMonth || play.startDate}
                    </span>
                    <span className="h-3 w-[1px] bg-[#F5A300]/40" />
                    <span className="text-[10px] font-semibold text-[#292725]">
                      {play.time}
                    </span>
                  </div>
                </div>

                {/* Card Info Area */}
                <div className="px-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tracking-wider text-[#7A1F2B] uppercase">
                      ◆ {play.genre} · {play.languageCode}
                    </span>
                    {play.showsCount && (
                      <span className="text-[9px] text-[#77736D] uppercase">
                        {play.showsCount}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-playfair text-lg font-semibold text-[#292725] group-hover:text-[#7A1F2B] transition-colors line-clamp-1 mb-1">
                    {play.title}
                  </h3>

                  <p className="text-xs text-[#292725]/60 line-clamp-1 mb-3">
                    {play.venue}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE3D5]/60 text-xs">
                    <span className="text-[#292725]/60 font-light">
                      From <strong className="font-semibold text-[#292725]">{play.currency} {play.startingPrice}</strong>
                    </span>
                    <span className="text-[#7A1F2B] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Details ↗
                    </span>
                  </div>
                </div>

              </motion.div>
            </Link>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-full h-[2px] bg-[#EDE3D5] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#7A1F2B] transition-all duration-300 ease-out relative"
            style={{ 
              width: `${Math.max(15, ((scrollProgress * (theatrePlays.length - 1) + 1) / theatrePlays.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
}
