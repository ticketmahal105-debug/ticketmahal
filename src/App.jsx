import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BrowseCategories from './components/BrowseCategories';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './routes/ProtectedRoute';

function Home() {
  return (
    <div className="bg-premium-noise min-h-screen selection:bg-champagne/30 selection:text-charcoal">
      <Navbar />
      <main>
        <Hero />
        <BrowseCategories />
      </main>
    </div>
  );
}

// Example protected component placeholder
function Profile() {
  return (
    <div className="bg-premium-noise min-h-screen selection:bg-champagne/30 selection:text-charcoal pt-32 px-6">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="font-playfair text-3xl text-charcoal">My Profile</h1>
        <p className="mt-4 text-charcoal/70">This is a protected route.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
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
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
