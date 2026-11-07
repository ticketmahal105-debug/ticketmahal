import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWishlist } from '../../hooks/useWishlist';
import AuthModal from '../auth/AuthModal';

const WishlistButton = ({ eventId, event, className = '' }) => {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [authOpen, setAuthOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const targetId = eventId || (typeof event === 'object' ? (event?.id || event?.slug) : event);

  // If context is not available or no id, fail gracefully
  if (isWishlisted === undefined || !targetId) return null;

  const saved = Boolean(isWishlisted(targetId));

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    const result = await toggleWishlist(targetId);

    if (result === 'NEEDS_AUTH') {
      setAuthOpen(true);
    }
    
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md border shadow-sm transition-all duration-300 cursor-pointer ${
          saved 
            ? 'border-[#7A1F2B]/30 text-[#7A1F2B] hover:bg-white shadow-md' 
            : 'border-[#EDE3D5] text-[#1C1C1C]/40 hover:text-[#7A1F2B] hover:border-[#F5A300]/40 hover:bg-white'
        } ${className}`}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
        disabled={isAnimating}
      >
        <motion.div
          initial={false}
          animate={{ scale: saved ? [1, 1.25, 1] : 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Heart 
            size={17} 
            className={saved ? 'fill-[#7A1F2B] text-[#7A1F2B]' : 'text-[#1C1C1C]/50 hover:text-[#7A1F2B]'} 
            strokeWidth={saved ? 1.5 : 2}
          />
        </motion.div>
      </motion.button>

      {/* Existing Ticket Mahal Auth Modal */}
      <AuthModal 
        isOpen={authOpen} 
        onClose={() => setAuthOpen(false)} 
        initialStep="login" 
      />
    </>
  );
};

export default WishlistButton;
