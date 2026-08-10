import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PasswordField from './PasswordField';
import AuthMessage from './AuthMessage';

const LoginForm = ({ onSwitchToSignup, onSwitchToForgot, onSuccess }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Invalid email or password.');
        } else if (signInError.message === 'Email not confirmed') {
          throw new Error('Please verify your email before signing in.');
        }
        throw signInError;
      }
      
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-left w-full">
      <AuthMessage type="error" message={error} />
      
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
        
        <PasswordField 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <div className="flex justify-between items-center px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-beige text-champagne focus:ring-champagne focus:ring-offset-0 cursor-pointer" />
            <span className="text-xs text-charcoal/70 group-hover:text-charcoal transition-colors">Remember me</span>
          </label>
          <button 
            type="button" 
            onClick={onSwitchToForgot}
            className="text-xs font-semibold text-champagne hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-charcoal text-white py-3 rounded-full font-medium hover:bg-charcoal/90 transition-colors mt-6 disabled:opacity-70 flex justify-center items-center h-12"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Access Account'
          )}
        </button>
      </form>
      
      <p className="text-center text-xs text-charcoal/50 mt-6">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} className="text-champagne font-semibold hover:underline">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
