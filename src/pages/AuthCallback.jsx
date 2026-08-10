import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

const AuthCallback = () => {
  const [message, setMessage] = useState('Verifying your session...');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase automatically handles the hash fragment containing the access token.
    // We just wait for the onAuthStateChange in AuthContext to pick it up, or manually verify it here.
    const verifySession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session) {
          setMessage('Email verified successfully.');
          // Redirect to home after a brief delay so they see the success message
          setTimeout(() => navigate('/'), 2000);
        } else {
          throw new Error('No valid session found.');
        }
      } catch {
        setError(true);
        setMessage('This verification link has expired or is invalid.');
      }
    };

    verifySession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-premium-noise flex flex-col selection:bg-champagne/30 selection:text-charcoal">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24">
        <div className="w-full max-w-[440px] bg-white border border-beige rounded-[28px] p-8 shadow-2xl text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${error ? 'bg-red-50 text-red-500' : 'bg-champagne/10 text-champagne'}`}>
            {error ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <div className="w-6 h-6 border-2 border-champagne/30 border-t-champagne rounded-full animate-spin" />
            )}
          </div>
          
          <h1 className="font-playfair text-2xl font-semibold text-charcoal mb-2">
            {error ? 'Verification Failed' : 'Verifying...'}
          </h1>
          
          <p className="text-sm text-charcoal/70 mb-8 leading-relaxed">
            {message}
          </p>
          
          {error && (
            <button 
              onClick={() => navigate('/')}
              className="w-full border border-beige hover:border-champagne text-charcoal font-medium py-3.5 rounded-full transition-colors"
            >
              Return to Homepage
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default AuthCallback;
