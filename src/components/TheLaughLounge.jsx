import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, Mic, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';

const comedyShows = [
  {
    id: "comedy-01",
    title: "Laugh After Hours",
    slug: "laugh-after-hours",
    image: "/images/categories/comedy.jpg",
    category: "STAND-UP",
    language: "EN",
    venue: "The Theatre, Mall of the Emirates",
    city: "Dubai",
    date: "FRI • 25 SEP",
    time: "8:30 PM",
    startingPrice: 120,
    currency: "AED",
    badge: "TONIGHT'S HEADLINER",
  },
  {
    id: "comedy-02",
    title: "Punchline Society",
    slug: "punchline-society",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=600",
    category: "STAND-UP",
    language: "EN",
    venue: "Comedy Club Dubai",
    city: "Dubai",
    date: "SAT • 26 SEP",
    time: "9:00 PM",
    startingPrice: 95,
    currency: "AED",
    badge: "SPECIAL GUEST",
  },
  {
    id: "comedy-03",
    title: "The Late Show",
    slug: "the-late-show",
    image: "/images/categories/comedy.jpg",
    category: "IMPROV",
    language: "EN",
    venue: "The Agenda",
    city: "Dubai",
    date: "FRI • 02 OCT",
    time: "10:30 PM",
    startingPrice: 110,
    currency: "AED",
    badge: "SELLING FAST",
  },
  {
    id: "comedy-04",
    title: "No Filter",
    slug: "no-filter",
    image: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=600",
    category: "ARABIC COMEDY",
    language: "AR",
    venue: "Dubai Opera Studio",
    city: "Dubai",
    date: "SAT • 10 OCT",
    time: "8:00 PM",
    startingPrice: 130,
    currency: "AED",
    badge: "NEW MATERIAL",
  },
  {
    id: "comedy-05",
    title: "Straight Face",
    slug: "straight-face",
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=600",
    category: "STAND-UP",
    language: "EN",
    venue: "Zabeel Theatre",
    city: "Dubai",
    date: "FRI • 16 OCT",
    time: "9:30 PM",
    startingPrice: 140,
    currency: "AED",
    badge: "ONE NIGHT ONLY",
  },
  {
    id: "comedy-06",
    title: "Comedy Under the Lights",
    slug: "comedy-under-the-lights",
    image: "https://images.unsplash.com/photo-1585699324551-f6c309eed262?auto=format&fit=crop&q=80&w=600",
    category: "STAND-UP",
    language: "EN",
    venue: "Coca-Cola Arena Studio",
    city: "Dubai",
    date: "SAT • 24 OCT",
    time: "8:30 PM",
    startingPrice: 150,
    currency: "AED",
    badge: "FEATURED ACT",
  }
];

const TheLaughLounge = () => {
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
      <div className="max-w-7xl w-full mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[#7A1F2B]/10 border border-[#7A1F2B]/20">
                <Mic size={13} className="text-[#7A1F2B]" />
              </div>
              <span 
                className="text-[11px] font-bold tracking-[0.20em] uppercase"
                style={{ color: '#7A1F2B' }}
              >
                COMEDY & STAND-UP
              </span>
            </div>

            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725] leading-tight">
              The Laugh Lounge
            </h2>
            <p className="text-xs md:text-sm text-[#77736D] mt-1.5 font-light">
              Good nights. Great stories. Even better punchlines.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/category/comedy"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors"
            >
              <span>Explore All Comedy</span>
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
                aria-label="Previous Comedy Shows"
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
                aria-label="Next Comedy Shows"
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
          {comedyShows.map((item) => (
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

                  {/* Language Badge */}
                  <div className="absolute top-3 left-3 z-10 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#EDE3D5] shadow-xs">
                    <span className="text-[10px] font-bold text-[#7A1F2B]">
                      {item.language}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={item.id} />
                  </div>

                  {/* Date Tag */}
                  <div className="absolute bottom-3 left-3 bg-[#FFFDF8]/95 backdrop-blur-md border border-[#EDE3D5] rounded-lg px-2.5 py-1 text-center shadow-xs z-10">
                    <span className="block text-[9px] font-bold tracking-wider text-[#7A1F2B] uppercase">
                      {item.date}
                    </span>
                  </div>
                </div>

                {/* Card Info Area */}
                <div className="px-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tracking-wider text-[#7A1F2B] uppercase">
                      ● {item.category}
                    </span>
                    {item.badge && (
                      <span className="text-[9px] font-bold text-[#7A1F2B] bg-[#FBF3F4] px-2 py-0.5 rounded border border-[#7A1F2B]/10">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-playfair text-lg font-semibold text-[#292725] group-hover:text-[#7A1F2B] transition-colors line-clamp-1 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#292725]/60 line-clamp-1 mb-3">
                    {item.venue} • {item.time}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE3D5]/60 text-xs">
                    <span className="text-[#292725]/60 font-light">
                      From <strong className="font-semibold text-[#292725]">{item.currency} {item.startingPrice}</strong>
                    </span>
                    <span className="text-[#7A1F2B] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Get Tickets ↗
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
              width: `${Math.max(15, ((scrollProgress * (comedyShows.length - 1) + 1) / comedyShows.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default TheLaughLounge;
