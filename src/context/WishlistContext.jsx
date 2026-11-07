import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getWishlistEventIds, addToWishlist, removeFromWishlist } from '../services/wishlistService';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistEventIds, setWishlistEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);
  const pendingCheckDoneRef = useRef(false);

  // Show subtle toast notification
  const showToast = useCallback((message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Fetch wishlist IDs for authenticated user
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistEventIds(new Set());
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await getWishlistEventIds(user.id);
      setWishlistEventIds(new Set(data || []));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Check and process any pending wishlist item after user logs in (Email, Password, or Google OAuth)
  useEffect(() => {
    if (!user) {
      pendingCheckDoneRef.current = false;
      return;
    }

    if (pendingCheckDoneRef.current) return;
    pendingCheckDoneRef.current = true;

    try {
      const pendingEventId = sessionStorage.getItem('tm_pending_wishlist_event_id');
      if (pendingEventId) {
        sessionStorage.removeItem('tm_pending_wishlist_event_id');

        // Optimistically add to state
        setWishlistEventIds((prev) => new Set([...prev, pendingEventId]));

        // Persist to database
        addToWishlist(user.id, pendingEventId).then(({ error }) => {
          if (!error) {
            showToast('Added to your Wishlist');
          }
        });
      }
    } catch (_) {}
  }, [user, showToast]);

  // Toggle Wishlist handler
  const toggleWishlist = async (eventId) => {
    if (!eventId) return false;

    // Logged-out visitor: Store intended event and notify caller to open login modal
    if (!user) {
      try {
        sessionStorage.setItem('tm_pending_wishlist_event_id', eventId);
      } catch (_) {}
      return 'NEEDS_AUTH';
    }

    const isCurrentlySaved = wishlistEventIds.has(eventId);
    
    // 1. Optimistic UI update
    setWishlistEventIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });

    // 2. Immediate feedback toast
    if (isCurrentlySaved) {
      showToast('Removed from your Wishlist');
    } else {
      showToast('Added to your Wishlist');
    }

    // 3. Persist to database
    try {
      let result;
      if (isCurrentlySaved) {
        result = await removeFromWishlist(user.id, eventId);
      } else {
        result = await addToWishlist(user.id, eventId);
      }

      if (result.error && result.error.code !== '23505') {
        throw result.error;
      }
      return true;
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      
      // Rollback optimistic update on actual error
      setWishlistEventIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.add(eventId);
        } else {
          next.delete(eventId);
        }
        return next;
      });
      showToast('Could not update wishlist. Please try again.');
      return false;
    }
  };

  const handleAddToWishlist = async (eventId) => {
    if (!eventId) return false;
    if (!user) {
      try {
        sessionStorage.setItem('tm_pending_wishlist_event_id', eventId);
      } catch (_) {}
      return 'NEEDS_AUTH';
    }
    if (wishlistEventIds.has(eventId)) return true;
    setWishlistEventIds((prev) => new Set([...prev, eventId]));
    showToast('Added to your Wishlist');
    const { error } = await addToWishlist(user.id, eventId);
    if (error && error.code !== '23505') {
      setWishlistEventIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      showToast('Could not update wishlist. Please try again.');
      return false;
    }
    return true;
  };

  const handleRemoveFromWishlist = async (eventId) => {
    if (!eventId) return false;
    if (!user) return false;
    if (!wishlistEventIds.has(eventId)) return true;
    setWishlistEventIds((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    showToast('Removed from your Wishlist');
    const { error } = await removeFromWishlist(user.id, eventId);
    if (error) {
      setWishlistEventIds((prev) => new Set([...prev, eventId]));
      showToast('Could not update wishlist. Please try again.');
      return false;
    }
    return true;
  };

  const isWishlisted = useCallback((eventId) => {
    if (!eventId) return false;
    return wishlistEventIds.has(eventId);
  }, [wishlistEventIds]);

  const value = {
    wishlistEventIds,
    wishlistItems: Array.from(wishlistEventIds),
    wishlistCount: wishlistEventIds.size,
    loading,
    toggleWishlist,
    addToWishlist: handleAddToWishlist,
    removeFromWishlist: handleRemoveFromWishlist,
    isWishlisted,
    refreshWishlist: fetchWishlist,
    showToast
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}

      {/* Global Subtle Wishlist Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 20, x: '-50%', scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1C1C1C] text-white px-5 py-3 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.25)] border border-[#7A1F2B]/40 flex items-center gap-3 z-[99999] pointer-events-none"
          >
            <div className="w-5 h-5 rounded-full bg-[#7A1F2B] flex items-center justify-center shrink-0">
              <Heart size={11} className="text-white fill-white" />
            </div>
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              {toastMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </WishlistContext.Provider>
  );
};
