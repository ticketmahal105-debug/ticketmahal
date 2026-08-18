import { createContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getWishlistEventIds, addToWishlist, removeFromWishlist } from '../services/wishlistService';

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistEventIds, setWishlistEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlistEventIds(new Set());
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await getWishlistEventIds(user.id);
      setWishlistEventIds(new Set(data));
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggleWishlist = async (eventId) => {
    if (!user) return false; // Needs authentication

    const isWishlisted = wishlistEventIds.has(eventId);
    
    // Optimistic UI update
    setWishlistEventIds((prev) => {
      const newSet = new Set(prev);
      if (isWishlisted) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });

    try {
      let error;
      if (isWishlisted) {
        const result = await removeFromWishlist(user.id, eventId);
        error = result.error;
      } else {
        const result = await addToWishlist(user.id, eventId);
        error = result.error;
      }

      if (error) {
        throw error;
      }
      return true; // Success
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // Revert optimistic update on failure
      setWishlistEventIds((prev) => {
        const newSet = new Set(prev);
        if (isWishlisted) {
          newSet.add(eventId);
        } else {
          newSet.delete(eventId);
        }
        return newSet;
      });
      return false; // Failure
    }
  };

  const isWishlisted = (eventId) => wishlistEventIds.has(eventId);

  const value = {
    wishlistEventIds,
    wishlistCount: wishlistEventIds.size,
    loading,
    toggleWishlist,
    isWishlisted,
    refreshWishlist: fetchWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
