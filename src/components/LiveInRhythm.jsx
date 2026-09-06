import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';

const musicEvents = [
  {
    id: "music-01",
    title: "Candlelight Symphony",
    slug: "candlelight-symphony",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
    category: "ORCHESTRA",
    venue: "Dubai Opera",
    city: "Dubai",
    date: "2024-09-24",
    time: "20:00",
    startingPrice: 195,
    currency: "AED",
    badge: "SELLING FAST",
  },
  {
    id: "music-02",
    title: "Echoes of Arabia",
    slug: "echoes-of-arabia",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
    category: "ARABIC MUSIC",
    venue: "Emirates Palace",
    city: "Abu Dhabi",
    date: "2024-09-29",
    time: "21:00",
    startingPrice: 220,
    currency: "AED",
    badge: "JUST ANNOUNCED",
  },
  {
    id: "music-03",
    title: "Midnight Sessions",
    slug: "midnight-sessions",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    category: "DJ NIGHT",
    venue: "Coca-Cola Arena",
    city: "Dubai",
    date: "2024-10-04",
    time: "22:30",
    startingPrice: 150,
    currency: "AED",
    badge: "POPULAR",
  },
  {
    id: "music-04",
    title: "The Royal Orchestra",
    slug: "the-royal-orchestra",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
    category: "LIVE CONCERT",
    venue: "Dubai World Trade Centre",
    city: "Dubai",
    date: "2024-10-12",
    time: "19:30",
    startingPrice: 280,
    currency: "AED",
    badge: "EXCLUSIVE",
  },
  {
    id: "music-05",
    title: "Desert Beats Live",
    slug: "desert-beats-live",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800",
    category: "FESTIVAL",
    venue: "Bab Al Shams Arena",
    city: "Dubai",
    date: "2024-10-18",
    time: "18:00",
    startingPrice: 160,
    currency: "AED",
    badge: "SELLING FAST",
  },
  {
    id: "music-06",
    title: "Acoustic Afterglow",
    slug: "acoustic-afterglow",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800",
    category: "ACOUSTIC",
    venue: "Zabeel Theatre",
    city: "Dubai",
    date: "2024-10-25",
    time: "20:00",
    startingPrice: 140,
    currency: "AED",
    badge: "NEW",
  },
  {
    id: "music-07",
    title: "Dubai Jazz Evening",
    slug: "dubai-jazz-evening",
    image: "https://images.unsplash.com/photo-1525994886773-080587e161c2?auto=format&fit=crop&q=80&w=800",
    category: "LIVE CONCERT",
    venue: "The Agenda",
    city: "Dubai",
    date: "2024-11-02",
    time: "20:30",
    startingPrice: 210,
    currency: "AED",
    badge: "RECOMMENDED",
  }
];

const formatDateParts = (dateString) => {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return { day, month };
};

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

const LiveInRhythm = () => {
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
    <section className="bg-[#FFFDF8] pt-6 md:pt-10 pb-16 lg:pb-20 px-6 md:px-12 relative overflow-hidden border-t border-ticket-beige/40">
      {/* Background Audio Waveform Subdued Linework (2-3% opacity) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
      >
        <path d="M0,300 C300,150 600,450 900,300 C1200,150 1350,380 1440,300" fill="none" stroke="#7A1F2B" strokeWidth="2" />
        <path d="M0,340 C250,200 550,480 850,340 C1150,200 1380,420 1440,340" fill="none" stroke="#F5A300" strokeWidth="1.5" />
        <path d="M0,260 C350,100 650,400 950,260 C1250,120 1320,340 1440,260" fill="none" stroke="#7A1F2B" strokeWidth="1" />
      </svg>

      <div className="max-w-7xl w-full mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <span 
              className="block text-[11px] font-bold tracking-[0.2em] mb-2 uppercase"
              style={{ color: '#7A1F2B' }}
            >
              MUSIC & CONCERTS
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725]">
              Live in Rhythm
            </h2>
            <p className="text-xs md:text-sm text-[#77736D] mt-1.5 font-light">
              From intimate stages to unforgettable arenas.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/category/music"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors"
            >
              <span>Explore All Music</span>
              <motion.div
                className="inline-block"
                whileHover={{ x: 3, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={16} />
              </motion.div>
            </Link>

            {/* Carousel Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous Music Events"
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
                aria-label="Next Music Events"
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
          {musicEvents.map((item) => (
            <Link
              key={item.id}
              to={`/events/${item.slug}`}
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
                    src={item.image}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  
                  {/* Date Badge */}
                  <div className="absolute top-3 left-3 bg-[#FFFDF8] rounded-[10px] shadow-sm px-2.5 py-1 text-center border border-[#EDE3D5]/60 z-10">
                    <span className="block text-[9px] font-bold leading-tight" style={{ color: '#7A1F2B' }}>
                      {formatDateParts(item.date).month}
                    </span>
                    <span className="block text-sm font-black leading-tight" style={{ color: '#292725' }}>
                      {formatDateParts(item.date).day}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={item.id} />
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-xs bg-white/95 backdrop-blur-md text-[#7A1F2B] border border-[#EDE3D5]/80 uppercase">
                        ✦ {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Subtle Perforated Ticket Edge */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 flex justify-evenly overflow-hidden opacity-30 z-10">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-1 h-1.5 rounded-t-full bg-white" />
                    ))}
                  </div>
                </div>

                {/* Card Info Area */}
                <div className="px-1 pt-1">
                  <span className="block text-[10px] font-bold tracking-wider text-[#7A1F2B] uppercase mb-1">
                    {item.category}
                  </span>
                  
                  <h3 className="font-playfair text-lg font-semibold text-[#292725] group-hover:text-[#7A1F2B] transition-colors line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#292725]/60 line-clamp-1 mb-3">
                    {item.venue} • {formatTime(item.time)}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE3D5]/60 text-xs">
                    <span className="text-[#292725]/60 font-light">
                      From <strong className="font-semibold text-[#292725]">{item.currency} {item.startingPrice}</strong>
                    </span>
                    <span className="text-[#7A1F2B] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      View Event ↗
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
              width: `${Math.max(15, ((scrollProgress * (musicEvents.length - 1) + 1) / musicEvents.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default LiveInRhythm;
