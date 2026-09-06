import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-premium-noise flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Redirect to home and pass a state so the home page could automatically open the login modal
    return <Navigate to="/" state={{ from: location, openAuth: true }} replace />;
  }

  return children;
};

export default ProtectedRoute;
