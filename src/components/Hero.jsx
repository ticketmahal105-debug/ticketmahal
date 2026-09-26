import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const banners = [
  {
    id: 1,
    url: 'https://res.cloudinary.com/tejjggbw/image/upload/ChatGPT_Image_Aug_22_2026_10_20_39_AM',
    alt: 'Ticket Mahal Premium Event',
  },
  {
    id: 2,
    url: 'https://res.cloudinary.com/tejjggbw/image/upload/ChatGPT_Image_Aug_22_2026_10_20_31_AM',
    alt: 'Ticket Mahal Luxury Experience',
  },
  {
    id: 3,
    url: 'https://res.cloudinary.com/tejjggbw/image/upload/ChatGPT_Image_Aug_22_2026_10_20_36_AM',
    alt: 'Ticket Mahal Exclusive Access',
  },
];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const timerRef = useRef(null);

  // Check user prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  }, []);

  // Setup autoplay timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isHovered) {
        nextSlide();
      }
    }, 5500); // Autoplay cycle of 5.5s
  }, [isHovered, nextSlide]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTimer]);

  const handleManualNavigation = (action) => {
    if (action === 'next') {
      nextSlide();
    } else {
      prevSlide();
    }
    // Re-trigger timer on manual interaction
    startTimer();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleManualNavigation('next');
      } else if (e.key === 'ArrowLeft') {
        handleManualNavigation('prev');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Touch Swipe Support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped Left -> Next
        handleManualNavigation('next');
      } else {
        // Swiped Right -> Previous
        handleManualNavigation('prev');
      }
    }
  };

  // Slide variants for Framer Motion transitions
  const slideVariants = {
    enter: (dir) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: prefersReducedMotion ? 0 : dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <section className="relative w-full pt-[196px] sm:pt-28 md:pt-32 pb-2 sm:pb-12 md:pb-16 px-2.5 sm:px-6">
      <div className="max-w-7xl w-full mx-auto relative group">
        
        {/* Banner Area */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-[2/1] sm:aspect-[16/8] md:aspect-[16/7] lg:aspect-[16/6] rounded-2xl sm:rounded-[32px] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-ticket-beige/60 bg-beige/10"
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'tween', duration: prefersReducedMotion ? 0 : 0.85, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 0.8 },
              }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={banners[currentIndex].url}
                alt={banners[currentIndex].alt}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          {/* Left Arrow */}
          <button
            onClick={() => handleManualNavigation('prev')}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/85 sm:bg-white/95 backdrop-blur-xs sm:backdrop-blur-none border border-ticket-beige text-ticket-charcoal shadow-md sm:shadow-lg hover:border-ticket-burgundy transition-all duration-300 z-20 group/btn"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:text-ticket-burgundy transition-colors" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => handleManualNavigation('next')}
            aria-label="Next slide"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/85 sm:bg-white/95 backdrop-blur-xs sm:backdrop-blur-none border border-ticket-beige text-ticket-charcoal shadow-md sm:shadow-lg hover:border-ticket-burgundy transition-all duration-300 z-20 group/btn"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:text-ticket-burgundy transition-colors" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-2.5 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2.5 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                  startTimer();
                }}
                aria-label={`Go to slide ${index + 1}`}
                className="group py-1 sm:py-2 px-0.5 sm:px-1 focus:outline-none"
              >
                <div
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ease-out ${
                    currentIndex === index
                      ? 'w-6 sm:w-8 bg-ticket-burgundy shadow-[0_0_8px_rgba(214,179,123,0.4)]'
                      : 'w-1.5 sm:w-2 bg-beige/65 hover:bg-beige'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
