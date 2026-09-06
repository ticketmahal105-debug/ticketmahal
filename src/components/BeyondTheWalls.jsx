import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';

const outdoorEvents = [
  {
    id: "outdoor-01",
    title: "Desert Soundscape",
    slug: "desert-soundscape",
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1000",
    category: "FESTIVAL",
    venue: "Al Marmoom Desert Reserve",
    city: "Dubai",
    dateTag: "SAT • 24 OCT",
    time: "18:00",
    startingPrice: 180,
    currency: "AED",
    badge: "WEEKEND PICK",
    locationPin: "Al Marmoom, Dubai",
  },
  {
    id: "outdoor-02",
    title: "Sunset Sessions",
    slug: "sunset-sessions",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
    category: "BEACH",
    venue: "JBR Beach",
    city: "Dubai",
    dateTag: "FRI • 30 OCT",
    time: "17:30",
    startingPrice: 150,
    currency: "AED",
    badge: "SUNSET EVENT",
    locationPin: "JBR Beach, Dubai",
  },
  {
    id: "outdoor-03",
    title: "Open Air Cinema Nights",
    slug: "open-air-cinema-nights",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800",
    category: "OPEN AIR",
    venue: "Expo City Dome Plaza",
    city: "Dubai",
    dateTag: "SAT • 07 NOV",
    time: "19:00",
    startingPrice: 95,
    currency: "AED",
    badge: "OUTDOOR",
    locationPin: "Expo City, Dubai",
  },
  {
    id: "outdoor-04",
    title: "Dubai Beach Festival",
    slug: "dubai-beach-festival",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800",
    category: "FESTIVAL",
    venue: "Nikki Beach Resort",
    city: "Dubai",
    dateTag: "FRI • 13 NOV",
    time: "16:00",
    startingPrice: 220,
    currency: "AED",
    badge: "SELLING FAST",
    locationPin: "Nikki Beach, Dubai",
  },
  {
    id: "outdoor-05",
    title: "Rhythm in the Dunes",
    slug: "rhythm-in-the-dunes",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800",
    category: "DESERT",
    venue: "Bab Al Shams Arena",
    city: "Dubai",
    dateTag: "FRI • 27 NOV",
    time: "18:30",
    startingPrice: 200,
    currency: "AED",
    badge: "DESERT SAFARI",
    locationPin: "Bab Al Shams, Dubai",
  },
  {
    id: "outdoor-06",
    title: "Moonlight Theatre",
    slug: "moonlight-theatre",
    image: "/images/categories/theatre.jpg",
    category: "ROOFTOP",
    venue: "Al Wasl Plaza Rooftop",
    city: "Dubai",
    dateTag: "SAT • 05 DEC",
    time: "20:00",
    startingPrice: 175,
    currency: "AED",
    badge: "ROOFTOP SHOW",
    locationPin: "Al Wasl, Dubai",
  }
];

const BeyondTheWalls = () => {
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
              <div className="relative flex items-center justify-center">
                <Sun size={14} className="text-[#7A1F2B]" />
              </div>
              <span 
                className="text-[11px] font-bold tracking-[0.20em] uppercase"
                style={{ color: '#7A1F2B' }}
              >
                OUTDOOR EXPERIENCES
              </span>
            </div>

            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725] leading-tight">
              Beyond the Walls
            </h2>
            <p className="text-xs md:text-sm text-[#77736D] mt-1.5 font-light">
              Open skies. Live moments. Unforgettable experiences.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/events?environment=outdoor"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors"
            >
              <span>Explore Outdoors</span>
              <motion.div
                className="inline-block"
                whileHover={{ x: 3, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={16} />
              </motion.div>
            </Link>

            {/* Navigation Arrow Controls */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous Outdoor Experiences"
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
                aria-label="Next Outdoor Experiences"
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
          {outdoorEvents.map((item) => (
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

                  {/* Location Pin Pill */}
                  <div className="absolute top-3 left-3 z-10 bg-white/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#EDE3D5] shadow-xs flex items-center gap-1">
                    <MapPin size={11} className="text-[#7A1F2B]" />
                    <span className="text-[11px] font-semibold text-[#292725] truncate max-w-[130px]">
                      {item.locationPin}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={item.id} />
                  </div>

                  {/* Date Tag */}
                  <div className="absolute bottom-3 left-3 bg-[#FFFDF8]/95 backdrop-blur-md border border-[#EDE3D5] rounded-lg px-2.5 py-1 text-center shadow-xs z-10">
                    <span className="block text-[9px] font-bold tracking-wider text-[#7A1F2B] uppercase">
                      {item.dateTag}
                    </span>
                  </div>
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
                    {item.venue} • {item.time}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE3D5]/60 text-xs">
                    <span className="text-[#292725]/60 font-light">
                      From <strong className="font-semibold text-[#292725]">{item.currency} {item.startingPrice}</strong>
                    </span>
                    <span className="text-[#7A1F2B] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Explore ↗
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
              width: `${Math.max(15, ((scrollProgress * (outdoorEvents.length - 1) + 1) / outdoorEvents.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
};

export default BeyondTheWalls;
