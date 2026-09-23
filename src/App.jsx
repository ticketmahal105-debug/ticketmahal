import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { initialAuthCallbackState } from './lib/supabase';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BrowseCategories from './components/BrowseCategories';
import PromoBanner from './components/PromoBanner';
import RecommendedShows from './components/RecommendedShows';
import PremiereShows from './components/PremiereShows';
import LiveInRhythm from './components/LiveInRhythm';
import BeyondTheWalls from './components/BeyondTheWalls';
import TheLaughLounge from './components/TheLaughLounge';
import TheatreAndPlays from './components/TheatreAndPlays';
import ExperiencesAndAttractions from './components/ExperiencesAndAttractions';
import PopularEvents from './components/PopularEvents';
import Footer from './components/Footer';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './routes/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import MyTicketsPage from './pages/MyTicketsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import WishlistPage from './pages/WishlistPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CategoryPage from './pages/CategoryPage';
import { WishlistProvider } from './context/WishlistContext';
import AdminRoute from './routes/AdminRoute';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminEvents from './admin/pages/AdminEvents';
import AdminEventForm from './admin/pages/AdminEventForm';
import AdminBookings from './admin/pages/AdminBookings';
import AdminBookingDetails from './admin/pages/AdminBookingDetails';
import AdminTickets from './admin/pages/AdminTickets';
import AdminUsers from './admin/pages/AdminUsers';

function Home() {
  return (
    <div className="bg-premium-noise min-h-screen selection:bg-ticket-burgundy/30 selection:text-charcoal flex flex-col justify-between">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BrowseCategories />
        <PromoBanner />
        <RecommendedShows />
        <PremiereShows />
        <LiveInRhythm />
        <BeyondTheWalls />
        <TheLaughLounge />
        <TheatreAndPlays />
        <ExperiencesAndAttractions />
        <PopularEvents />
      </main>
      <Footer />
    </div>
  );
}


function AuthCallbackHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // If already on /auth/callback or /reset-password, do nothing
    if (location.pathname === '/auth/callback' || location.pathname === '/reset-password') {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const rawHash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(rawHash);

    const type = searchParams.get('type') || hashParams.get('type');

    // If password recovery link, route to /reset-password
    if (type === 'recovery') {
      navigate('/reset-password' + window.location.search + window.location.hash, { replace: true });
      return;
    }

    // Check for email verification / auth callback indicators
    const hasCode = searchParams.has('code') || Boolean(initialAuthCallbackState.code);
    const hasTokenHash = searchParams.has('token_hash') || Boolean(initialAuthCallbackState.tokenHash);
    const hasSignupType =
      type === 'signup' ||
      type === 'email_verification' ||
      type === 'email_change' ||
      type === 'invite';
    const hasAccessToken = hashParams.has('access_token') || Boolean(initialAuthCallbackState.accessToken);
    const hasAuthError =
      searchParams.has('error_code') ||
      hashParams.has('error_code') ||
      searchParams.has('error') ||
      hashParams.has('error') ||
      initialAuthCallbackState.isError;

    if (
      hasCode ||
      hasTokenHash ||
      (hasAccessToken && (hasSignupType || !type)) ||
      hasAuthError ||
      initialAuthCallbackState.hasAuthParams
    ) {
      navigate('/auth/callback' + window.location.search + window.location.hash, { replace: true });
    }
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <BrowserRouter>
          <AuthCallbackHandler />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events/:slug" element={<EventDetailsPage />} />
          <Route path="/category/:categorySlug" element={<CategoryPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected Routes Example */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-tickets" 
            element={
              <ProtectedRoute>
                <MyTicketsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-bookings" 
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-bookings/:bookingNumber" 
            element={
              <ProtectedRoute>
                <BookingDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings" 
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bookings/:bookingNumber" 
            element={
              <ProtectedRoute>
                <BookingDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wishlist" 
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="events/new" element={<AdminEventForm />} />
            <Route path="events/:id/edit" element={<AdminEventForm />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="bookings/:bookingNumber" element={<AdminBookingDetails />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
