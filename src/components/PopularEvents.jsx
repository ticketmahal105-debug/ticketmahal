import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';

const popularEventsList = [
  {
    id: "popular-01",
    rank: "01",
    title: "Midnight Symphony",
    slug: "midnight-symphony",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
    category: "LIVE MUSIC",
    venue: "Dubai Opera",
    city: "Dubai",
    dateLine: "26 SEP • 8:00 PM",
    startingPrice: 240,
    currency: "AED",
    demandStatus: "MOST BOOKED",
  },
  {
    id: "popular-02",
    rank: "02",
    title: "The Grand Illusion",
    slug: "the-grand-illusion",
    image: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&q=80&w=800",
    category: "MAGIC & SHOWS",
    venue: "Coca-Cola Arena",
    city: "Dubai",
    dateLine: "02 OCT • 9:00 PM",
    startingPrice: 195,
    currency: "AED",
    demandStatus: "SELLING FAST",
  },
  {
    id: "popular-03",
    rank: "03",
    title: "Desert Nights Live",
    slug: "desert-nights-live",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=800",
    category: "FESTIVAL",
    venue: "Expo City",
    city: "Dubai",
    dateLine: "09 OCT • 7:30 PM",
    startingPrice: 175,
    currency: "AED",
    demandStatus: "HIGH DEMAND",
  },
  {
    id: "popular-04",
    rank: "04",
    title: "Laugh After Hours",
    slug: "laugh-after-hours",
    image: "/images/categories/comedy.jpg",
    category: "COMEDY",
    venue: "The Theatre",
    city: "Dubai",
    dateLine: "16 OCT • 8:30 PM",
    startingPrice: 120,
    currency: "AED",
    demandStatus: "TRENDING",
  },
  {
    id: "popular-05",
    rank: "05",
    title: "Rhythm Under the Stars",
    slug: "rhythm-under-the-stars",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    category: "CONCERT",
    venue: "Zabeel Park",
    city: "Dubai",
    dateLine: "23 OCT • 8:00 PM",
    startingPrice: 160,
    currency: "AED",
    demandStatus: "MOST BOOKED",
  },
  {
    id: "popular-06",
    rank: "06",
    title: "Arabian Nights Reimagined",
    slug: "arabian-nights-reimagined",
    image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&q=80&w=800",
    category: "MUSICAL",
    venue: "Dubai Opera",
    city: "Dubai",
    dateLine: "30 OCT • 8:00 PM",
    startingPrice: 210,
    currency: "AED",
    demandStatus: "SELLING FAST",
  },
  {
    id: "popular-07",
    rank: "07",
    title: "Candlelight Sessions",
    slug: "candlelight-sessions",
    image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80&w=800",
    category: "CLASSICAL",
    venue: "Emirates Palace",
    city: "Abu Dhabi",
    dateLine: "06 NOV • 7:00 PM",
    startingPrice: 185,
    currency: "AED",
    demandStatus: "HIGH DEMAND",
  },
  {
    id: "popular-08",
    rank: "08",
    title: "The Royal Stage",
    slug: "the-royal-stage",
    image: "/images/categories/theatre.jpg",
    category: "THEATRE",
    venue: "Dubai World Trade Centre",
    city: "Dubai",
    dateLine: "13 NOV • 8:30 PM",
    startingPrice: 220,
    currency: "AED",
    demandStatus: "TRENDING",
  }
];

const PopularEvents = () => {
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
    <section className="bg-[#FAF6EE] pt-6 md:pt-10 pb-16 lg:pb-20 px-6 md:px-12 relative overflow-hidden border-t border-ticket-beige/40">
      <div className="max-w-7xl w-full mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[#7A1F2B]/10 border border-[#7A1F2B]/20">
                <Crown size={13} className="text-[#7A1F2B]" />
              </div>
              <span 
                className="text-[11px] font-bold tracking-[0.20em] uppercase"
                style={{ color: '#7A1F2B' }}
              >
                POPULAR RIGHT NOW
              </span>
            </div>

            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725] leading-tight">
              Top Trending Events
            </h2>
            <p className="text-xs md:text-sm text-[#77736D] mt-1.5 font-light">
              Most requested and highest-rated experiences across the UAE.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/events?sort=popular"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors"
            >
              <span>View All Trending</span>
              <motion.div
                className="inline-block"
                whileHover={{ x: 3, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={16} />
              </motion.div>
            </Link>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous Popular Events"
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
                aria-label="Next Popular Events"
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
          {popularEventsList.map((item) => (
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

                  {/* Rank Number Tag */}
                  <div className="absolute top-3 left-3 z-10 bg-[#7A1F2B] text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs">
                    #{item.rank}
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={item.id} />
                  </div>

                  {/* Demand Status Badge */}
                  {item.demandStatus && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-xs bg-white/95 backdrop-blur-md text-[#7A1F2B] border border-[#EDE3D5]/80 uppercase">
                        ✦ {item.demandStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info Area */}
                <div className="px-1 pt-1">
                  <span className="block text-[10px] font-bold tracking-wider text-[#7A1F2B] uppercase mb-1">
                    ● {item.category}
                  </span>
                  
                  <h3 className="font-playfair text-lg font-semibold text-[#292725] group-hover:text-[#7A1F2B] transition-colors line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#292725]/60 line-clamp-1 mb-3">
                    {item.venue} • {item.dateLine}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE3D5]/60 text-xs">
                    <span className="text-[#292725]/60 font-light">
                      From <strong className="font-semibold text-[#292725]">{item.currency} {item.startingPrice}</strong>
                    </span>
                    <span className="text-[#7A1F2B] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Book Now ↗
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
              width: `${Math.max(15, ((scrollProgress * (popularEventsList.length - 1) + 1) / popularEventsList.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default PopularEvents;
