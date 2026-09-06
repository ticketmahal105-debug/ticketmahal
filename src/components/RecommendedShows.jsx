import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';

const recommendedShows = [
  {
    id: "1",
    title: "The Phantom of the Opera",
    slug: "phantom-of-the-opera",
    image: "/images/categories/theatre.jpg",
    category: "Theatre",
    venue: "Dubai Opera",
    city: "Dubai",
    date: "2024-09-24",
    time: "20:00",
    startingPrice: 250,
    currency: "AED",
    badge: "EDITOR'S PICK",
  },
  {
    id: "2",
    title: "Candlelight Symphony",
    slug: "candlelight-symphony",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
    category: "Music",
    venue: "Coca-Cola Arena",
    city: "Dubai",
    date: "2024-09-18",
    time: "19:30",
    startingPrice: 150,
    currency: "AED",
    badge: "SELLING FAST",
  },
  {
    id: "3",
    title: "Laugh Out Loud Dubai",
    slug: "laugh-out-loud-dubai",
    image: "/images/categories/comedy.jpg",
    category: "Comedy",
    venue: "The Agenda",
    city: "Dubai",
    date: "2024-09-20",
    time: "21:00",
    startingPrice: 195,
    currency: "AED",
    badge: "POPULAR",
  },
  {
    id: "4",
    title: "Arabian Nights Live",
    slug: "arabian-nights-live",
    image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&q=80&w=800",
    category: "Cultural",
    venue: "Dubai World Trade Centre",
    city: "Dubai",
    date: "2024-10-05",
    time: "18:00",
    startingPrice: 120,
    currency: "AED",
    badge: "NEW",
  },
  {
    id: "5",
    title: "Broadway Under the Stars",
    slug: "broadway-under-the-stars",
    image: "https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&q=80&w=800",
    category: "Musical",
    venue: "Zabeel Park",
    city: "Dubai",
    date: "2024-10-12",
    time: "19:00",
    startingPrice: 85,
    currency: "AED",
    badge: "OUTDOOR",
  },
  {
    id: "6",
    title: "The Illusionist",
    slug: "the-illusionist",
    image: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&q=80&w=800",
    category: "Magic",
    venue: "Dubai Opera",
    city: "Dubai",
    date: "2024-10-25",
    time: "20:30",
    startingPrice: 300,
    currency: "AED",
    badge: "MUST SEE",
  }
];

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return { month, day };
};

const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

const RecommendedShows = () => {
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
    <section className="bg-[#FFFDF8] pt-6 md:pt-10 pb-16 lg:pb-20 px-6 md:px-12 overflow-hidden">
      <div className="max-w-7xl w-full mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <span 
              className="block text-[11px] font-bold tracking-[0.2em] mb-2 uppercase"
              style={{ color: '#7A1F2B' }}
            >
              CURATED FOR YOU
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725]">
              Recommended Shows
            </h2>
            <p className="text-sm text-[#292725]/60 mt-1.5 font-light">
              Handpicked experiences worth stepping out for.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/events"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors duration-300"
            >
              <span>See All Shows</span>
              <motion.div
                className="inline-block group-hover:text-[#7A1F2B]"
                whileHover={{ x: 4, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </motion.div>
            </Link>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous shows"
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
                aria-label="Next shows"
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

        {/* UNIFORM CARD TRACK / CAROUSEL */}
        <div 
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-3 -mx-6 px-6 lg:mx-0 lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {recommendedShows.map((show) => (
            <Link
              key={show.id}
              to={`/events/${show.slug}`}
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
                    src={show.image}
                    alt={show.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  
                  {/* Date Badge */}
                  <div className="absolute top-3 left-3 bg-[#FFFDF8] rounded-[10px] shadow-sm px-2.5 py-1 text-center border border-[#EDE3D5]/60 z-10">
                    <span className="block text-[9px] font-bold leading-tight" style={{ color: '#7A1F2B' }}>
                      {formatDate(show.date).month}
                    </span>
                    <span className="block text-sm font-black leading-tight" style={{ color: '#292725' }}>
                      {formatDate(show.date).day}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={show.id} />
                  </div>

                  {/* Badge */}
                  {show.badge && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="text-[9px] font-bold tracking-wider px-2.5 py-1 rounded-full shadow-xs bg-white/95 backdrop-blur-md text-[#7A1F2B] border border-[#EDE3D5]/80">
                        ✦ {show.badge}
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
                    {show.category}
                  </span>
                  
                  <h3 className="font-playfair text-lg font-semibold text-[#292725] group-hover:text-[#7A1F2B] transition-colors line-clamp-1 mb-1">
                    {show.title}
                  </h3>

                  <p className="text-xs text-[#292725]/60 line-clamp-1 mb-3">
                    {show.venue} • {formatTime(show.time)}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE3D5]/60 text-xs">
                    <span className="text-[#292725]/60 font-light">
                      From <strong className="font-semibold text-[#292725]">{show.currency} {show.startingPrice}</strong>
                    </span>
                    <span className="text-[#7A1F2B] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      View Show ↗
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
              width: `${Math.max(15, ((scrollProgress * (recommendedShows.length - 1) + 1) / recommendedShows.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default RecommendedShows;
