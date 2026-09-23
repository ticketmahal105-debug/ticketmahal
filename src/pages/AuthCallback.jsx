import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Mail, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

const AuthCallback = () => {
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error' | 'no_token'
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Resend link state
  const [resendEmail, setResendEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const processingRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    // Prevent duplicate processing in React StrictMode
    if (processingRef.current) return;
    processingRef.current = true;

    const handleAuthCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') || hashParams.get('type');
        const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
        const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');
        const errorParam = searchParams.get('error') || hashParams.get('error');

        // Check if Supabase redirected with an explicit error
        if (errorCode || errorParam || errorDesc) {
          const isLinkExpired =
            errorCode === 'otp_expired' ||
            (errorDesc && errorDesc.toLowerCase().includes('expired'));

          setIsExpired(isLinkExpired);
          setErrorMessage(
            isLinkExpired
              ? 'This verification link has expired. Please request a new link below to activate your account.'
              : errorDesc
              ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
              : 'This verification link is invalid or has already been used.'
          );
          setStatus('error');
          return;
        }

        // Case 1: PKCE Code Flow (?code=...)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            const isCodeExpired =
              error.status === 400 ||
              error.message?.toLowerCase().includes('expired') ||
              error.message?.toLowerCase().includes('invalid');

            setIsExpired(isCodeExpired);
            setErrorMessage(
              isCodeExpired
                ? 'This verification link has expired or has already been used. Please request a fresh link below.'
                : error.message || 'Unable to verify email.'
            );
            setStatus('error');
            return;
          }

          if (data?.session || data?.user) {
            if (data?.user?.email) {
              setResendEmail(data.user.email);
            }
            // Clear credentials from URL bar for clean UX and security
            window.history.replaceState({}, document.title, window.location.pathname);
            setStatus('success');
            return;
          }
        }

        // Case 2: Token Hash OTP Flow (?token_hash=...&type=...)
        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type || 'signup',
          });

          if (error) {
            const isOtpExpired =
              error.message?.toLowerCase().includes('expired') ||
              error.message?.toLowerCase().includes('invalid');

            setIsExpired(isOtpExpired);
            setErrorMessage(
              isOtpExpired
                ? 'This verification link has expired or has already been used. Please request a fresh link below.'
                : error.message || 'Unable to verify email.'
            );
            setStatus('error');
            return;
          }

          if (data?.session || data?.user) {
            if (data?.user?.email) {
              setResendEmail(data.user.email);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            setStatus('success');
            return;
          }
        }

        // Case 3: Implicit Hash Fragment Flow (#access_token=...&refresh_token=...)
        if (hashParams.has('access_token')) {
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              setErrorMessage('Failed to establish verification session. Please try again.');
              setStatus('error');
              return;
            }

            if (data?.session || data?.user) {
              if (data?.user?.email) {
                setResendEmail(data.user.email);
              }
              window.history.replaceState({}, document.title, window.location.pathname);
              setStatus('success');
              return;
            }
          }
        }

        // Case 4: No verification parameters in URL
        // Do not display success merely because /auth/callback was visited directly.
        setStatus('no_token');
      } catch {
        setErrorMessage('An unexpected error occurred during email verification.');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [location]);

  // Handle request for a new verification link
  const handleResendLink = async (e) => {
    if (e) e.preventDefault();
    if (!resendEmail || !resendEmail.includes('@')) {
      setResendError('Please enter a valid email address.');
      return;
    }

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setResendError(error.message || 'Unable to send verification email. Please try again later.');
      } else {
        setResendSuccess(true);
        setResendCooldown(60);
      }
    } catch {
      setResendError('An unexpected network error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] bg-premium-noise flex flex-col justify-between selection:bg-[#7A1F2B]/20 selection:text-[#292725]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-28 sm:py-32">
        {/* SUCCESS STATE */}
        {status === 'success' && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[500px] mx-auto bg-[#FFFFFF] border border-[#EDE3D5] rounded-[32px] p-8 sm:p-12 shadow-[0_20px_50px_rgba(41,39,37,0.06)] text-center relative overflow-hidden"
          >
            {/* Top Circular pale-burgundy background with animated checkmark */}
            <div className="w-20 h-20 rounded-full bg-[#FBF3F4] border border-[#7A1F2B]/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg
                className="w-9 h-9 text-[#7A1F2B]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <motion.path
                  d="M20 6L9 17L4 12"
                  initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.6, delay: 0.25, ease: 'easeOut' }
                  }
                />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-[#292725] tracking-tight mb-3">
              You're All Set!
            </h1>

            {/* Supporting text */}
            <p className="font-inter text-sm sm:text-base text-[#292725]/85 font-medium leading-relaxed max-w-sm mx-auto mb-2">
              Your email has been successfully verified. Welcome to Ticket Mahal!
            </p>

            {/* Additional message */}
            <p className="font-inter text-xs sm:text-sm text-[#77736D] leading-relaxed max-w-sm mx-auto mb-8">
              Your account is ready. Discover unforgettable experiences, book events and manage your tickets in one place.
            </p>

            {/* Primary Action Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 px-6 rounded-full bg-[#7A1F2B] hover:bg-[#681923] text-white font-medium text-sm tracking-wide shadow-sm hover:ring-2 hover:ring-[#F5A300]/40 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Explore Ticket Mahal</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 text-[#F5A300]">→</span>
            </button>

            {/* Secondary Profile Link */}
            <div className="mt-4">
              <button
                onClick={() => navigate('/profile')}
                className="inline-block text-xs sm:text-sm font-medium text-[#77736D] hover:text-[#7A1F2B] transition-colors py-1 cursor-pointer underline-offset-4 hover:underline"
              >
                Go to My Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* VERIFYING LOADING STATE */}
        {status === 'verifying' && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-[460px] mx-auto bg-[#FFFFFF] border border-[#EDE3D5] rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(41,39,37,0.06)] text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#FBF3F4] border border-[#7A1F2B]/10 flex items-center justify-center mx-auto mb-5">
              <div className="w-7 h-7 border-2 border-[#7A1F2B]/20 border-t-[#7A1F2B] rounded-full animate-spin" />
            </div>

            <h1 className="font-playfair text-xl sm:text-2xl font-semibold text-[#292725] mb-2">
              Verifying Your Email
            </h1>

            <p className="font-inter text-xs sm:text-sm text-[#77736D] leading-relaxed max-w-xs mx-auto">
              Please wait a moment while we confirm your account details...
            </p>
          </motion.div>
        )}

        {/* ERROR / EXPIRED STATE */}
        {status === 'error' && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[480px] mx-auto bg-[#FFFFFF] border border-[#EDE3D5] rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(41,39,37,0.06)] text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#FBF3F4] border border-[#7A1F2B]/15 flex items-center justify-center mx-auto mb-5 text-[#7A1F2B]">
              {isExpired ? <Clock className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <h1 className="font-playfair text-2xl font-semibold text-[#292725] mb-2">
              {isExpired ? 'Verification Link Expired' : 'Verification Failed'}
            </h1>

            <p className="font-inter text-xs sm:text-sm text-[#77736D] leading-relaxed max-w-sm mx-auto mb-6">
              {errorMessage || 'This verification link is invalid or has expired.'}
            </p>

            {/* Resend Verification Form */}
            <form onSubmit={handleResendLink} className="space-y-3 mb-6 text-left">
              <div>
                <label htmlFor="resend-email" className="block text-[11px] font-semibold uppercase tracking-wider text-[#292725]/70 mb-1.5 pl-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736D]/60 w-4 h-4" />
                  <input
                    id="resend-email"
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF6EE] border border-[#EDE3D5] rounded-xl text-xs sm:text-sm text-[#292725] placeholder-[#77736D]/50 focus:outline-none focus:border-[#7A1F2B] focus:ring-1 focus:ring-[#7A1F2B]/30 transition-all"
                  />
                </div>
              </div>

              {resendError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200/60 rounded-lg p-2.5">
                  {resendError}
                </p>
              )}

              {resendSuccess && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/60 rounded-lg p-2.5">
                  A fresh verification email has been sent. Please check your inbox and spam folder.
                </p>
              )}

              <button
                type="submit"
                disabled={isResending || resendCooldown > 0}
                className="w-full py-3 px-5 rounded-full bg-[#7A1F2B] hover:bg-[#681923] text-white font-medium text-xs sm:text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:ring-2 hover:ring-[#F5A300]/30"
              >
                <span>
                  {isResending
                    ? 'Sending New Link...'
                    : resendCooldown > 0
                    ? `Resend Link in ${resendCooldown}s`
                    : 'Request New Verification Link'}
                </span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="pt-2 border-t border-[#EDE3D5]/60 flex items-center justify-center gap-4 text-xs font-medium text-[#77736D]">
              <button
                onClick={() => navigate('/')}
                className="hover:text-[#7A1F2B] transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
              <span>•</span>
              <button
                onClick={() => navigate('/', { state: { openAuth: true } })}
                className="hover:text-[#7A1F2B] transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        )}

        {/* DIRECT VISIT WITHOUT TOKENS / NO TOKEN STATE */}
        {status === 'no_token' && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-[480px] mx-auto bg-[#FFFFFF] border border-[#EDE3D5] rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(41,39,37,0.06)] text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#FBF3F4] border border-[#7A1F2B]/15 flex items-center justify-center mx-auto mb-5 text-[#7A1F2B]">
              <Mail className="w-8 h-8" />
            </div>

            <h1 className="font-playfair text-2xl font-semibold text-[#292725] mb-2">
              Email Verification
            </h1>

            <p className="font-inter text-xs sm:text-sm text-[#77736D] leading-relaxed max-w-sm mx-auto mb-8">
              No active email verification link was detected. If you recently registered, please open the confirmation link sent to your email inbox.
            </p>

            <button
              onClick={() => navigate('/')}
              className="w-full py-3.5 px-6 rounded-full bg-[#7A1F2B] hover:bg-[#681923] text-white font-medium text-sm tracking-wide shadow-sm hover:ring-2 hover:ring-[#F5A300]/40 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer mb-3"
            >
              <span>Explore Ticket Mahal</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1 text-[#F5A300]">→</span>
            </button>

            <button
              onClick={() => navigate('/', { state: { openAuth: true } })}
              className="inline-block text-xs sm:text-sm font-medium text-[#77736D] hover:text-[#7A1F2B] transition-colors py-1 cursor-pointer"
            >
              Sign In to Your Account
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AuthCallback;
