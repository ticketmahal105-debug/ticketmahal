import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const AdminRoute = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setRoleLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        setRole(data?.role);
      } catch (err) {
        console.error('Error fetching role:', err);
        setRole(null);
      } finally {
        setRoleLoading(false);
      }
    };

    if (!authLoading) {
      checkRole();
    }
  }, [user, authLoading]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-premium-noise flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location, openAuth: true }} replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
