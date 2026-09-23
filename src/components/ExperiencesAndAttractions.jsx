import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import WishlistButton from './wishlist/WishlistButton';
import { dummyMovies } from '../data/dummyMovies';

const experiencesData = dummyMovies.map(m => ({
  ...m,
  category: "CINEMA EXPERIENCE",
  filterCategory: "INDOOR",
  location: m.venue,
  city: "Dubai",
  fullLocation: `${m.venue} · Dubai`,
  duration: m.runtime,
  environment: "Indoor Cinema",
  audience: "All Ages",
  availabilityType: "Daily Showtimes",
  quickFact: `IMDb ${m.imdbRating} • ${m.certificate}`
}));

const filterCategories = [
  { id: "ALL", label: "ALL EXPERIENCES" },
  { id: "FAMILY", label: "FAMILY" },
  { id: "ADVENTURE", label: "ADVENTURE" },
  { id: "INDOOR", label: "INDOOR ESCAPES" },
  { id: "WATER", label: "WATERPARKS" },
  { id: "CULTURE", label: "CULTURE & VIEWS" }
];

export default function ExperiencesAndAttractions() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const filteredExperiences = activeFilter === "ALL"
    ? experiencesData
    : experiencesData.filter(exp => exp.filterCategory === activeFilter);

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
  }, [activeFilter]);

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
      className="bg-[#FFFDF8] pt-6 md:pt-10 pb-16 lg:pb-20 px-6 md:px-12 relative overflow-hidden border-t border-ticket-beige/40"
      aria-label="Experiences and Attractions - Make a Day of It"
    >
      <div className="max-w-7xl w-full mx-auto relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded border border-ticket-burgundy flex items-center justify-center relative bg-ticket-pale-gold/60">
                <Ticket size={11} className="text-ticket-burgundy" strokeWidth={2.2} />
              </div>
              <span className="text-ticket-burgundy text-[11px] font-bold tracking-[0.20em] uppercase">
                EXPERIENCES & ATTRACTIONS
              </span>
            </div>

            <h2 className="font-playfair text-3xl md:text-4xl text-[#292725] leading-tight">
              Make a Day of It
            </h2>
            <p className="text-xs md:text-sm text-[#77736D] mt-1.5 font-light">
              More than an event. Pick an experience and make the day yours.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6">
            <Link
              to="/events?category=Attractions"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#292725] hover:text-[#7A1F2B] transition-colors"
            >
              <span>Explore All Experiences</span>
              <motion.div
                className="inline-block"
                whileHover={{ x: 4, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </motion.div>
            </Link>

            {/* Carousel Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous experiences"
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
                aria-label="Next experiences"
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

        {/* Filter Categories Bar */}
        <div className="mb-8 border-b border-[#EDE3D5]/60 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-6 min-w-max">
            {filterCategories.map(cat => {
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`relative py-1 text-xs font-semibold tracking-wider transition-colors duration-300 uppercase cursor-pointer ${
                    isActive ? 'text-[#7A1F2B]' : 'text-[#77736D] hover:text-[#292725]'
                  }`}
                >
                  <span>{cat.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeAttractionFilterUnderline"
                      className="absolute left-0 right-0 -bottom-3.5 h-[2px] bg-[#F5A300]"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* UNIFORM EQUAL-SIZED CARD TRACK */}
        <div 
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-3 -mx-6 px-6 lg:mx-0 lg:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredExperiences.map((exp) => (
            <Link
              key={exp.id}
              to={`/events/${exp.slug}`}
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
                    src={exp.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40 pointer-events-none select-none"
                  />
                  <motion.img
                    src={exp.image}
                    alt={exp.title}
                    className="relative z-0 w-full h-full object-contain"
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#EDE3D5] shadow-xs">
                    <span className="text-[10px] font-bold text-[#7A1F2B] uppercase">
                      ● {exp.category}
                    </span>
                  </div>

                  {/* Wishlist Button */}
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton eventId={exp.id} />
                  </div>

                  {/* Location Overlay Tag */}
                  <div className="absolute bottom-3 left-3 z-10 text-white flex items-center gap-1 text-[11px] font-medium drop-shadow-md bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                    <MapPin size={11} className="text-[#F5A300]" />
                    <span className="truncate max-w-[150px]">{exp.location}</span>
                  </div>
                </div>

                {/* Card Info Area */}
                <div className="px-1 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold tracking-wider text-[#7A1F2B] uppercase">
                      {exp.availabilityType}
                    </span>
                    {exp.offer && (
                      <span className="text-[9px] font-bold text-white bg-[#7A1F2B] px-2 py-0.5 rounded shadow-2xs">
                        {exp.offer}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-playfair text-lg font-semibold text-[#292725] group-hover:text-[#7A1F2B] transition-colors line-clamp-1 mb-1">
                    {exp.title}
                  </h3>

                  <p className="text-xs text-[#292725]/60 line-clamp-1 mb-3">
                    {exp.duration} • {exp.environment}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE3D5]/60 text-xs">
                    <div className="bg-[#FFF8E8] border border-[#EDE3D5] rounded-lg px-2 py-0.5">
                      <span className="text-[10px] font-bold text-[#7A1F2B] mr-1">DAY PASS</span>
                      <strong className="font-semibold text-[#292725]">{exp.currency} {exp.startingPrice}</strong>
                    </div>
                    <span className="text-[#7A1F2B] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                      Plan Day ↗
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
              width: `${Math.max(15, ((scrollProgress * (filteredExperiences.length - 1) + 1) / filteredExperiences.length) * 100)}%`,
            }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#F5A300] rounded-full" />
          </div>
        </div>

      </div>
    </section>
  );
}
