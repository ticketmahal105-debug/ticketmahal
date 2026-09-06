import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import PasswordField from './PasswordField';
import AuthMessage from './AuthMessage';

const SignupForm = ({ onSwitchToLogin }) => {
  const { signUp } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '' };
    if (pass.length < 8) return { label: 'Too short', color: 'text-red-400' };
    const hasLower = /[a-z]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    
    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (score < 2) return { label: 'Weak', color: 'text-amber-500' };
    if (score === 2) return { label: 'Fair', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-emerald-500' };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }
    
    if (!formData.agreeTerms) {
      return setError('You must agree to the Terms & Conditions.');
    }

    setLoading(true);

    try {
      const { error: signUpError, data } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim()
      });
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered.');
        }
        throw signUpError;
      }
      
      if (data?.user?.identities?.length === 0) {
        // User already exists edge case in Supabase
        throw new Error('This email is already registered.');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>
        <h4 className="font-playfair text-xl font-semibold text-ticket-charcoal mb-2">Check your inbox</h4>
        <p className="text-sm text-ticket-charcoal/70 mb-6">
          We sent a verification link to: <br/>
          <strong className="text-ticket-charcoal">{formData.email}</strong>
        </p>
        <p className="text-xs text-ticket-charcoal/50 mb-6">
          Please verify your email before signing in.
        </p>
        <button 
          onClick={onSwitchToLogin}
          className="w-full border border-ticket-beige hover:border-ticket-burgundy text-ticket-charcoal font-medium py-3 rounded-full transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  const strength = getPasswordStrength(formData.password);

  return (
    <div className="text-left w-full">
      <AuthMessage type="error" message={error} />
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ticket-charcoal/40 mb-1.5">First Name</label>
            <input 
              type="text" 
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First" 
              required
              autoComplete="given-name"
              className="w-full px-4 py-3 bg-ticket-ivory border border-ticket-beige rounded-xl text-sm outline-none focus:border-ticket-gold transition-colors" 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-ticket-charcoal/40 mb-1.5">Last Name</label>
            <input 
              type="text" 
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last" 
              required
              autoComplete="family-name"
              className="w-full px-4 py-3 bg-ticket-ivory border border-ticket-beige rounded-xl text-sm outline-none focus:border-ticket-gold transition-colors" 
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-ticket-charcoal/40 mb-1.5">Email Address</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@domain.com" 
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-ticket-ivory border border-ticket-beige rounded-xl text-sm outline-none focus:border-ticket-gold transition-colors" 
          />
        </div>
        
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <label className="block text-xs uppercase tracking-wider font-semibold text-ticket-charcoal/40">Password</label>
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${strength.color}`}>
              {strength.label}
            </span>
          </div>
          <PasswordField 
            label={null}
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="new-password"
          />
        </div>

        <PasswordField 
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
        />
        
        <label className="flex items-start gap-2 cursor-pointer group pt-2">
          <input 
            type="checkbox" 
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleChange}
            className="mt-1 w-4 h-4 rounded border-ticket-beige text-ticket-burgundy focus:ring-ticket-gold focus:ring-offset-0 cursor-pointer shrink-0" 
          />
          <span className="text-xs text-ticket-charcoal/70 group-hover:text-ticket-charcoal transition-colors leading-snug">
            I agree to the <a href="#terms" className="text-ticket-burgundy hover:underline">Terms & Conditions</a> and <a href="#privacy" className="text-ticket-burgundy hover:underline">Privacy Policy</a>
          </span>
        </label>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-ticket-burgundy text-ticket-white py-3 rounded-full font-medium hover:bg-ticket-burgundy/90 transition-colors mt-6 disabled:opacity-70 flex justify-center items-center h-12 shadow-[0_4px_12px_rgba(214,179,123,0.2)] hover:shadow-[0_6px_18px_rgba(214,179,123,0.3)] hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>
      
      <p className="text-center text-xs text-ticket-charcoal/50 mt-6">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-ticket-burgundy font-semibold hover:underline">
          Login
        </button>
      </p>
    </div>
  );
};

export default SignupForm;
