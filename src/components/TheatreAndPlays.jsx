import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';

const theatrePlays = [
  {
    id: "theatre-01",
    title: "The Final Act",
    slug: "the-final-act",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=1200",
    category: "Theatre",
    genre: "Drama",
    language: "English",
    languageCode: "EN",
    venue: "Dubai Opera",
    city: "Dubai",
    startDate: "12 SEP",
    endDate: "18 SEP",
    fullDate: "12–18 SEP",
    dateStubMonth: "SEP 12",
    time: "8:00 PM",
    startingPrice: 180,
    currency: "AED",
    status: "Now Playing",
    actNumber: "ACT 01",
    showsCount: "8 SHOWS"
  },
  {
    id: "theatre-02",
    title: "A Midsummer Evening",
    slug: "a-midsummer-evening",
    image: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&q=80&w=800",
    category: "Theatre",
    genre: "Classical",
    language: "English",
    languageCode: "EN",
    venue: "The Theatre · Dubai",
    city: "Dubai",
    startDate: "14 SEP",
    endDate: "20 SEP",
    fullDate: "14 SEP — 20 SEP",
    dateStubMonth: "SEP 14",
    time: "8:00 PM",
    startingPrice: 145,
    currency: "AED",
    status: "Opening Soon",
    badge: "✦ OPENING NIGHT",
    actNumber: "ACT 02",
    showsCount: "6 PERFORMANCES"
  },
  {
    id: "theatre-03",
    title: "Letters from the Stage",
    slug: "letters-from-the-stage",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800",
    category: "Theatre",
    genre: "Drama",
    language: "English",
    languageCode: "EN",
    venue: "Zabeel Theatre",
    city: "Dubai",
    startDate: "22 SEP",
    endDate: "28 SEP",
    fullDate: "22 SEP — 28 SEP",
    dateStubMonth: "SEP 22",
    time: "7:30 PM",
    startingPrice: 160,
    currency: "AED",
    status: "Final Week",
    actNumber: "ACT 03",
    showsCount: "5 PERFORMANCES"
  },
  {
    id: "theatre-04",
    title: "The Palace of Dreams",
    slug: "the-palace-of-dreams",
    image: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=800",
    category: "Theatre",
    genre: "Musical",
    language: "Arabic",
    languageCode: "AR",
    venue: "Dubai Opera Studio",
    city: "Dubai",
    startDate: "01 OCT",
    endDate: "07 OCT",
    fullDate: "01 OCT — 07 OCT",
    dateStubMonth: "OCT 01",
    time: "8:30 PM",
    startingPrice: 220,
    currency: "AED",
    status: "Limited Run",
    actNumber: "ACT 04",
    showsCount: "10 SHOWS"
  },
  {
    id: "theatre-05",
    title: "Between Two Curtains",
    slug: "between-two-curtains",
    image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&q=80&w=800",
    category: "Theatre",
    genre: "Experimental",
    language: "English",
    languageCode: "EN",
    venue: "Alserkal Avenue Studio",
    city: "Dubai",
    startDate: "10 OCT",
    endDate: "12 OCT",
    fullDate: "10 OCT — 12 OCT",
    dateStubMonth: "OCT 10",
    time: "9:00 PM",
    startingPrice: 135,
    currency: "AED",
    status: "One Night Only",
    actNumber: "ACT 05",
    showsCount: "3 PERFORMANCES"
  },
  {
    id: "theatre-06",
    title: "The Last Monologue",
    slug: "the-last-monologue",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&q=80&w=800",
    category: "Theatre",
    genre: "Drama",
    language: "Hindi",
    languageCode: "HI",
    venue: "JWR Arts Centre",
    city: "Dubai",
    startDate: "15 OCT",
    endDate: "19 OCT",
    fullDate: "15 OCT — 19 OCT",
    dateStubMonth: "OCT 15",
    time: "8:00 PM",
    startingPrice: 150,
    currency: "AED",
    status: "Opening Soon",
    actNumber: "ACT 06",
    showsCount: "5 SHOWS"
  },
  {
    id: "theatre-07",
    title: "Arabian Tales",
    slug: "arabian-tales",
    image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&q=80&w=800",
    category: "Theatre",
    genre: "Arabic Theatre",
    language: "Arabic",
    languageCode: "AR",
    venue: "Cultural Foundation",
    city: "Abu Dhabi",
    startDate: "24 OCT",
    endDate: "30 OCT",
    fullDate: "24 OCT — 30 OCT",
    dateStubMonth: "OCT 24",
    time: "7:00 PM",
    startingPrice: 175,
    currency: "AED",
    actNumber: "ACT 07",
    showsCount: "7 PERFORMANCES"
  },
  {
    id: "theatre-08",
    title: "The Grand Musical",
    slug: "the-grand-musical",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
    category: "Theatre",
    genre: "Musical",
    language: "English",
    languageCode: "EN",
    venue: "Etihad Arena",
    city: "Abu Dhabi",
    startDate: "05 NOV",
    endDate: "12 NOV",
    fullDate: "05 NOV — 12 NOV",
    dateStubMonth: "NOV 05",
    time: "8:00 PM",
    startingPrice: 250,
    currency: "AED",
    status: "Now Playing",
    actNumber: "ACT 08",
    showsCount: "12 SHOWS"
  }
];

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
                {/* Image Container with Fixed Equal Aspect Ratio */}
                <div className="relative h-[280px] sm:h-[300px] w-full rounded-[18px] overflow-hidden bg-gray-100 mb-3">
                  <motion.img
                    src={play.image}
                    alt={play.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
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
