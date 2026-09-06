import { useState } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useWishlist } from '../../hooks/useWishlist';
import AuthModal from '../auth/AuthModal';

const WishlistButton = ({ eventId, className = '' }) => {
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [authOpen, setAuthOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // If context is not available (e.g. not wrapped), fail gracefully
  if (isWishlisted === undefined) return null;

  const saved = isWishlisted(eventId);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setAuthOpen(true);
      return;
    }

    setIsAnimating(true);
    await toggleWishlist(eventId);
    
    // Reset animation state after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border shadow-sm transition-all duration-300 ${
          saved 
            ? 'border-ticket-gold/40 text-ticket-burgundy hover:bg-white' 
            : 'border-ticket-beige text-ticket-charcoal/40 hover:text-ticket-burgundy hover:border-ticket-gold/30'
        } ${className}`}
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={saved}
        disabled={isAnimating}
      >
        <motion.div
          initial={false}
          animate={{ scale: saved ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Heart 
            size={18} 
            className={saved ? 'fill-ticket-burgundy' : ''} 
            strokeWidth={saved ? 1.5 : 2}
          />
        </motion.div>
      </motion.button>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialStep="login" />
    </>
  );
};

export default WishlistButton;
