import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthMessage from './AuthMessage';
import { ArrowLeft } from 'lucide-react';

const ForgotPasswordForm = ({ onBack }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error: resetError } = await resetPassword(email, redirectUrl);
      
      if (resetError) throw resetError;
      
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-champagne/10 text-champagne rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>
        <h4 className="font-playfair text-xl font-semibold text-charcoal mb-2">Check your inbox</h4>
        <p className="text-sm text-charcoal/70 mb-8 leading-relaxed">
          We've sent a password reset link to your email address.
        </p>
        <button 
          onClick={onBack}
          className="w-full border border-beige hover:border-champagne text-charcoal font-medium py-3 rounded-full transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="text-left w-full">
      <AuthMessage type="error" message={error} />
      
      <p className="text-sm text-charcoal/70 mb-6 leading-relaxed">
        Enter your email address and we'll send you a secure link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-charcoal/40 mb-1.5">
            Email Address
          </label>
          <input 
            type="email" 
            placeholder="name@domain.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-ivory border border-beige rounded-xl text-sm outline-none focus:border-champagne transition-colors" 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-champagne text-white py-3 rounded-full font-medium hover:bg-champagne/90 transition-colors mt-6 disabled:opacity-70 flex justify-center items-center h-12"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
      
      <div className="text-center mt-6">
        <button 
          onClick={onBack} 
          className="text-xs font-semibold text-charcoal/50 hover:text-charcoal transition-colors flex items-center justify-center gap-1.5 mx-auto"
        >
          <ArrowLeft size={14} /> Back to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
