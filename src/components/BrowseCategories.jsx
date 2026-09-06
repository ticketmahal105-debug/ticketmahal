import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const categories = [
  {
    id: 1,
    name: 'Concerts',
    subtitle: '120+ experiences',
    image: '/images/categories/concerts.jpg',
  },
  {
    id: 2,
    name: 'Theatre & Shows',
    subtitle: '85+ experiences',
    image: '/images/categories/theatre.jpg',
  },
  {
    id: 3,
    name: 'Comedy',
    subtitle: '40+ experiences',
    image: '/images/categories/comedy.jpg',
  },
  {
    id: 4,
    name: 'Sports',
    subtitle: '30+ experiences',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 5,
    name: 'Family Attractions',
    subtitle: '95+ experiences',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 6,
    name: 'Dining Experiences',
    subtitle: '150+ experiences',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 7,
    name: 'Festivals',
    subtitle: '25+ experiences',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 8,
    name: 'Arabic Events',
    subtitle: '60+ experiences',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 9,
    name: 'Exhibitions',
    subtitle: '50+ experiences',
    image: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 10,
    name: 'Workshops',
    subtitle: '35+ experiences',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=800',
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
    <section className="bg-ticket-cream pt-12 pb-8 px-6 md:px-12 flex justify-center items-center overflow-hidden">
      <div className="max-w-7xl w-full mx-auto">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-12 border-b border-ticket-beige/40 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-ticket-burgundy mb-2 block">
              Discover
            </span>
            <h2 className="font-playfair text-3xl md:text-4xl text-ticket-charcoal">
              Browse by Category
            </h2>
          </motion.div>

          <Link
            to="/categories"
            className="group flex items-center gap-1.5 text-sm font-medium text-ticket-charcoal/80 hover:text-ticket-burgundy transition-colors duration-300"
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
                className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-ticket-charcoal/80 text-white shadow-lg hover:bg-ticket-burgundy transition-all duration-300 z-30"
              >
                <ArrowLeft size={18} />
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
                className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-ticket-charcoal/80 text-white shadow-lg hover:bg-ticket-burgundy transition-all duration-300 z-30"
              >
                <ArrowRight size={18} />
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
            className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide py-4 px-2 cursor-grab active:cursor-grabbing select-none"
          >
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.6,
                  delay: prefersReducedMotion ? 0 : idx * 0.06,
                  ease: "easeOut",
                }}
                className="snap-start flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 lg:w-64 lg:h-64 group"
              >
                <Link
                  to={`/category/${cat.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="relative block w-full h-full rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ticket-burgundy"
                >
                  {/* Background Image with Zoom on Hover */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/60 group-hover:from-black/60 group-hover:via-black/20 group-hover:to-black/50 transition-colors duration-300" />

                  {/* Content Overlay inside Square Card (Top-Left aligned like reference image) */}
                  <div className="relative z-10 p-4 sm:p-5 md:p-6 h-full flex flex-col justify-between">
                    <div className="text-left">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold uppercase tracking-tight text-white leading-tight drop-shadow-md">
                        {cat.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-white/90 tracking-wide mt-1.5 drop-shadow">
                        {cat.subtitle}
                      </p>
                    </div>

                    {/* Subtle bottom accent arrow on hover */}
                    <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white/90">
                      <ArrowUpRight size={20} strokeWidth={2} />
                    </div>
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
