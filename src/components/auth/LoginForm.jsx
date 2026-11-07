import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PasswordField from './PasswordField';
import AuthMessage from './AuthMessage';

const LoginForm = ({ onSwitchToSignup, onSwitchToForgot, onSuccess }) => {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedEmail = (email || '').trim();

    try {
      const { error: signInError } = await signIn(normalizedEmail, password);
      
      if (signInError) {
        const msg = (signInError.message || '').toLowerCase();
        if (
          msg.includes('invalid') || 
          msg.includes('credentials') || 
          msg.includes('grant') || 
          signInError.status === 400
        ) {
          throw new Error('Incorrect email or password. Please check your details and try again.');
        } else if (msg.includes('not confirmed') || msg.includes('unconfirmed')) {
          throw new Error('Please verify your email before signing in.');
        }
        throw new Error('Incorrect email or password. Please check your details and try again.');
      }
      
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Incorrect email or password. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-left w-full">
      <AuthMessage type="error" message={error} />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ticket-charcoal/40 mb-1.5">
            Email Address
          </label>
          <input 
            type="email" 
            placeholder="name@domain.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-ticket-ivory border border-ticket-beige rounded-xl text-sm outline-none focus:border-ticket-gold transition-colors" 
          />
        </div>
        
        <PasswordField 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <div className="flex justify-between items-center px-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" className="w-4 h-4 rounded border-ticket-beige text-ticket-burgundy focus:ring-ticket-gold focus:ring-offset-0 cursor-pointer" />
            <span className="text-xs text-ticket-charcoal/70 group-hover:text-ticket-charcoal transition-colors">Remember me</span>
          </label>
          <button 
            type="button" 
            onClick={onSwitchToForgot}
            className="text-xs font-semibold text-ticket-burgundy hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-ticket-charcoal text-ticket-white py-3 rounded-full font-medium hover:bg-ticket-charcoal/90 transition-colors mt-6 disabled:opacity-70 flex justify-center items-center h-12"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Access Account'
          )}
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t border-ticket-charcoal/10 w-full" />
          <span className="bg-ticket-white px-3 text-xs text-ticket-charcoal/40 uppercase tracking-wider">or</span>
          <div className="border-t border-ticket-charcoal/10 w-full" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-ticket-charcoal/10 bg-ticket-ivory/60 hover:bg-ticket-ivory text-ticket-charcoal font-medium py-3 rounded-full transition-all duration-300 shadow-sm hover:shadow disabled:opacity-60 text-sm h-12"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>
      </form>
      
      <p className="text-center text-xs text-ticket-charcoal/50 mt-6">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} className="text-ticket-burgundy font-semibold hover:underline">
          Sign up
        </button>
      </p>
    </div>
  );
};

export default LoginForm;
