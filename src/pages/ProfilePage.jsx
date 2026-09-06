import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileSummary from '../components/profile/ProfileSummary';
import PersonalInformation from '../components/profile/PersonalInformation';
import AccountInformation from '../components/profile/AccountInformation';
import SecuritySection from '../components/profile/SecuritySection';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine initially
            console.error('Error fetching profile:', error);
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleProfileUpdate = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="bg-premium-noise min-h-screen selection:bg-ticket-burgundy/30 selection:text-charcoal pt-32 px-6 pb-24 font-sans">
      <Navbar />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-playfair text-3xl md:text-4xl text-ticket-charcoal font-semibold tracking-wide">
            My Profile
          </h1>
          <p className="text-ticket-charcoal/60 mt-2">Manage your personal details and account information.</p>
        </div>

        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-[280px] shrink-0">
              <div className="bg-ticket-white border border-ticket-beige rounded-3xl p-4 shadow-sm sticky top-32">
                <ProfileSidebar />
              </div>
            </div>

            {/* Main Profile Content */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">
              <ProfileSummary profile={profile} user={user} />
              
              <PersonalInformation 
                profile={profile} 
                user={user} 
                onProfileUpdate={handleProfileUpdate} 
              />
              
              <AccountInformation profile={profile} user={user} />
              
              <SecuritySection />

              {/* My Tickets Preview */}
              <div className="mt-4 text-center p-8 border border-dashed border-ticket-beige/80 rounded-2xl bg-ivory/50">
                <p className="font-playfair text-xl text-ticket-charcoal font-semibold mb-2">No tickets yet</p>
                <p className="text-ticket-charcoal/60 text-sm mb-6">Your booked event tickets will appear here.</p>
                <a href="/" className="px-6 py-2.5 bg-ticket-burgundy text-ticket-white text-sm font-medium rounded-full shadow-sm hover:bg-ticket-charcoal hover:text-white transition-all duration-300">
                  Explore Events
                </a>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-ticket-white px-6 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-ticket-beige flex items-center gap-3 z-50"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-ticket-charcoal">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
