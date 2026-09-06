import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PasswordField from '../components/auth/PasswordField';
import AuthMessage from '../components/auth/AuthMessage';
import Navbar from '../components/Navbar';

const ResetPassword = () => {
  const { updatePassword, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If we're fully loaded and there is no session, they shouldn't be here
  // (unless they just arrived via link, in which case session might take a moment to establish from hash)
  useEffect(() => {
    if (!authLoading && !session) {
      navigate('/');
    }
  }, [authLoading, session, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }

    setLoading(true);

    try {
      const { error: updateError } = await updatePassword(password);
      
      if (updateError) throw updateError;
      
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Unable to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-premium-noise flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-24">
          <div className="w-8 h-8 border-2 border-ticket-gold/30 border-t-ticket-burgundy rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-premium-noise flex flex-col selection:bg-ticket-burgundy/30 selection:text-charcoal">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-24">
        <div className="w-full max-w-[440px] bg-ticket-white border border-ticket-beige rounded-[28px] p-8 shadow-2xl text-center">
          {success ? (
            <div className="py-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-playfair text-2xl font-semibold text-ticket-charcoal mb-2">Password Updated</h1>
              <p className="text-sm text-ticket-charcoal/70 mb-8 leading-relaxed">
                Your password has been successfully updated. You can now use your new password to log in.
              </p>
              <button 
                onClick={() => navigate('/')}
                className="w-full bg-ticket-burgundy text-ticket-white font-medium py-3.5 rounded-full shadow-[0_4px_12px_rgba(214,179,123,0.2)] hover:shadow-[0_6px_18px_rgba(214,179,123,0.3)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Continue to Ticket Mahal
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-playfair text-2xl font-semibold text-ticket-charcoal mb-6">Create New Password</h1>
              
              <div className="text-left">
                <AuthMessage type="error" message={error} />
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <PasswordField 
                    label="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  
                  <PasswordField 
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-ticket-burgundy text-ticket-white py-3.5 rounded-full font-medium hover:bg-ticket-burgundy/90 transition-colors mt-8 disabled:opacity-70 flex justify-center items-center h-[52px] shadow-[0_4px_12px_rgba(214,179,123,0.2)] hover:shadow-[0_6px_18px_rgba(214,179,123,0.3)] hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
