import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';

const premiereExperiences = [
  {
    id: "premiere-01",
    title: "Cirque Nocturne",
    slug: "cirque-nocturne",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
    category: "Live Performance",
    venue: "Dubai Opera",
    city: "Dubai",
    premiereDate: "2024-09-28",
    time: "20:00",
    startingPrice: 195,
    currency: "AED",
    status: "FIRST ACCESS",
    badge: "Premiere",
  },
  {
    id: "premiere-02",
    title: "The Royal Symphony",
    slug: "the-royal-symphony",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
    category: "Classical",
    venue: "Dubai Opera",
    city: "Dubai",
    premiereDate: "2024-10-02",
    time: "19:30",
    startingPrice: 220,
    currency: "AED",
    status: "JUST ANNOUNCED",
    badge: "Premiere",
  },
  {
    id: "premiere-03",
    title: "Arabian Nights Reimagined",
    slug: "arabian-nights-reimagined",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800",
    category: "Musical",
    venue: "Coca-Cola Arena",
    city: "Dubai",
    premiereDate: "2024-10-15",
    time: "20:30",
    startingPrice: 180,
    currency: "AED",
    status: "OPENING WEEK",
    badge: "Premiere",
  },
  {
    id: "premiere-04",
    title: "Velvet Curtain",
    slug: "velvet-curtain",
    image: "/images/categories/theatre.jpg",
    category: "Theatre",
    venue: "Zabeel Theatre",
    city: "Dubai",
    premiereDate: "2024-10-22",
    time: "21:00",
    startingPrice: 210,
    currency: "AED",
    status: "FIRST ACCESS",
    badge: "Premiere",
  },
  {
    id: "premiere-05",
    title: "Beyond Illusion",
    slug: "beyond-illusion",
    image: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&q=80&w=800",
    category: "Magic & Mystery",
    venue: "The Agenda",
    city: "Dubai",
    premiereDate: "2024-11-05",
    time: "19:00",
    startingPrice: 250,
    currency: "AED",
    status: "JUST ANNOUNCED",
    badge: "Premiere",
  },
  {
    id: "premiere-06",
    title: "Echoes of Arabia",
    slug: "echoes-of-arabia",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
    category: "Orchestra",
    venue: "Emirates Palace Auditorium",
    city: "Abu Dhabi",
    premiereDate: "2024-11-12",
    time: "20:00",
    startingPrice: 175,
    currency: "AED",
    status: "NEW",
    badge: "Premiere",
  }
];

const formatPremiereDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return `${day} ${month}`;
};

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

const PremiereShows = () => {
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
    <section className="bg-ticket-cream pt-6 md:pt-10 pb-16 lg:pb-20 px-6 md:px-12 relative overflow-hidden border-t border-ticket-beige/40">
      <div className="max-w-7xl w-full mx-auto relative z-10">
        
        {/* Section Intro / Asymmetric Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-[#7A1F2B]/10 flex items-center justify-center">
                <Sparkles size={12} className="text-[#7A1F2B]" />
              </div>
              <span 
                className="text-[11px] font-bold tracking-[0.22em] uppercase"
                style={{ color: '#7A1F2B' }}
              >
                PREMIERE
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#7A1F2B] bg-[#FBF3F4] px-2.5 py-0.5 rounded-full ml-2 border border-[#7A1F2B]/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5A300] animate-pulse" />
                3 NEW THIS WEEK
              </span>
            </div>

            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725] leading-tight">
              Be the first to experience what’s next.
            </h2>
            <p className="text-xs md:text-sm text-[#77736D] mt-1.5 font-light max-w-xl">
              Freshly announced shows, exclusive launches and first-access experiences.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/events?collection=premiere"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors"
            >
              <span>View All Premieres</span>
              <motion.div
                className="inline-block"
                whileHover={{ x: 3, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={16} />
              </motion.div>
            </Link>
            
            {/* Scroll Navigation Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous Premieres"
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
                aria-label="Next Premieres"
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
          {premiereExperiences.map((item) => (
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
                  
                  {/* Status Badge */}
                  {item.status && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#7A1F2B] text-[10px] font-bold tracking-wider border border-[#EDE3D5]/80 shadow-xs uppercase">
                        {item.status}
                      </span>
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={item.id} />
                  </div>

                  {/* Premiere Date Overlap */}
                  <div className="absolute bottom-3 left-3 bg-[#FFFDF8]/95 backdrop-blur-md border border-[#EDE3D5] rounded-lg px-2.5 py-1 text-center shadow-xs z-10">
                    <span className="block text-[9px] font-bold tracking-wider text-[#7A1F2B] uppercase">
                      PREMIERE • {formatPremiereDate(item.premiereDate)}
                    </span>
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
                      View Premiere ↗
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
              width: `${Math.max(15, ((scrollProgress * (premiereExperiences.length - 1) + 1) / premiereExperiences.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default PremiereShows;
