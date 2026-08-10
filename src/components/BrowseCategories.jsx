import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const categories = [
  {
    id: 1,
    name: 'Concerts',
    subtitle: '120+ experiences',
    image: 'https://images.unsplash.com/photo-1540039155732-d68f2c5c4e32?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 2,
    name: 'Theatre & Shows',
    subtitle: '85+ experiences',
    image: 'https://images.unsplash.com/photo-1507676184212-d0c30a3c2002?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 3,
    name: 'Comedy',
    subtitle: '40+ experiences',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eed262?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 4,
    name: 'Sports',
    subtitle: '30+ experiences',
    image: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 5,
    name: 'Family Attractions',
    subtitle: '95+ experiences',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 6,
    name: 'Dining Experiences',
    subtitle: '150+ experiences',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 7,
    name: 'Festivals',
    subtitle: '25+ experiences',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 8,
    name: 'Arabic Events',
    subtitle: '60+ experiences',
    image: 'https://images.unsplash.com/photo-1528143358888-6d3c7f67bd5d?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 9,
    name: 'Exhibitions',
    subtitle: '50+ experiences',
    image: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: 10,
    name: 'Workshops',
    subtitle: '35+ experiences',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=400',
  },
];

const BrowseCategories = () => {
  const scrollRef = useRef(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const updateArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowPrev(scrollLeft > 10);
      setShowNext(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateArrows);
      // Run once initially
      updateArrows();
      window.addEventListener('resize', updateArrows);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, []);

  const handleScroll = (dir) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: dir === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Drag-to-scroll functionality for desktop mouse support
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftVal = useRef(0);

  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftVal.current = scrollRef.current.scrollLeft;
  };

  const handleMouseLeaveOrUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeftVal.current - walk;
  };

  return (
    <section className="bg-ivory py-24 px-6 md:px-12 flex justify-center items-center overflow-hidden">
      <div className="max-w-7xl w-full mx-auto">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-12 border-b border-beige/40 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-champagne mb-2 block">
              Discover
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl text-charcoal">
              Browse by Category
            </h2>
          </motion.div>

          <Link
            to="/categories"
            className="group flex items-center gap-1.5 text-sm font-medium text-charcoal/80 hover:text-champagne transition-colors duration-300"
          >
            <span>View All Categories</span>
            <motion.div
              className="inline-block"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowUpRight size={16} strokeWidth={1.5} />
            </motion.div>
          </Link>
        </div>

        {/* Carousel Wrapper */}
        <div className="relative w-full">
          {/* Prev Arrow */}
          <AnimatePresence>
            {showPrev && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => handleScroll('prev')}
                className="hidden md:flex absolute -left-6 top-[35%] -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white border border-beige text-charcoal shadow-md hover:border-champagne hover:text-champagne hover:-translate-x-0.5 transition-all duration-300 z-30"
              >
                <ArrowLeft size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Next Arrow */}
          <AnimatePresence>
            {showNext && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => handleScroll('next')}
                className="hidden md:flex absolute -right-6 top-[35%] -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white border border-beige text-charcoal shadow-md hover:border-champagne hover:text-champagne hover:translate-x-0.5 transition-all duration-300 z-30"
              >
                <ArrowRight size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Category Scroller */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.8,
                  delay: prefersReducedMotion ? 0 : idx * 0.08,
                  ease: "easeOut",
                }}
                className="snap-start flex-shrink-0 w-[42%] sm:w-[22%] md:w-[18%] lg:w-[13.5%] flex flex-col items-center text-center group"
              >
                <Link
                  to={`/category/${cat.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="flex flex-col items-center focus:outline-none focus:ring-1 focus:ring-champagne/40 rounded-3xl p-1"
                >
                  {/* Double Ring Circular Image Container */}
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full border border-champagne/20 flex items-center justify-center p-1.5 transition-all duration-300 group-hover:border-champagne/55 group-hover:shadow-[0_8px_20px_rgba(214,179,123,0.12)] bg-white/20"
                  >
                    <div className="w-full h-full rounded-full border border-ivory overflow-hidden bg-ivory">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-[1.03]"
                      />
                    </div>
                  </motion.div>

                  {/* Titles */}
                  <div className="mt-4">
                    <h3 className="text-sm md:text-base font-medium text-charcoal group-hover:text-champagne transition-colors duration-300 line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] md:text-xs text-charcoal/45 font-light tracking-wide mt-1">
                      {cat.subtitle}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default BrowseCategories;
