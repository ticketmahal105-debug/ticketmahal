import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './routes/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import MyTicketsPage from './pages/MyTicketsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import WishlistPage from './pages/WishlistPage';
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
    <div className="bg-premium-noise min-h-screen selection:bg-ticket-burgundy/30 selection:text-charcoal">
      <Navbar />
      <main>
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
    </div>
  );
}


function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
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
