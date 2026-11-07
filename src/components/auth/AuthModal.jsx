import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthModal = ({ isOpen, onClose, initialStep = 'select' }) => {
  const [step, setStep] = useState(initialStep);
  const [mounted, setMounted] = useState(false);
  const { signInWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign In error:', err);
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus or handle scroll lock (simplified scroll lock)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-ticket-charcoal/10 backdrop-blur-[4px]"
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[440px] bg-ticket-white border border-ticket-beige rounded-[28px] p-8 shadow-2xl z-10 text-center flex flex-col max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute top-6 right-6 text-ticket-charcoal/40 hover:text-ticket-charcoal hover:bg-ivory p-2 rounded-full transition-colors z-20"
            >
              <X size={20} />
            </button>

            {/* Select State */}
            {step === 'select' && (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-full"
              >
                <div className="mb-8 mt-2">
                  <h3 id="auth-modal-title" className="font-playfair text-2xl font-semibold text-ticket-charcoal mb-3">
                    Welcome to Ticket Mahal
                  </h3>
                  <p className="text-ticket-charcoal/60 text-sm leading-relaxed">
                    Begin your journey to discovering unforgettable events in the Middle East.
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  <button
                    onClick={() => setStep('signup')}
                    className="w-full bg-ticket-burgundy text-ticket-white font-medium py-3.5 rounded-full shadow-[0_4px_12px_rgba(214,179,123,0.2)] hover:shadow-[0_6px_18px_rgba(214,179,123,0.3)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Create an Account
                  </button>
                  <button
                    onClick={() => setStep('login')}
                    className="w-full border border-ticket-charcoal/10 hover:border-ticket-gold/40 text-ticket-charcoal/80 hover:text-ticket-charcoal font-medium py-3.5 rounded-full hover:bg-ivory/50 transition-all duration-300"
                  >
                    Login to Your Account
                  </button>

                  <div className="relative my-2 flex items-center justify-center">
                    <div className="border-t border-ticket-charcoal/10 w-full" />
                    <span className="bg-ticket-white px-3 text-xs text-ticket-charcoal/40 uppercase tracking-wider">or</span>
                    <div className="border-t border-ticket-charcoal/10 w-full" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 border border-ticket-charcoal/10 bg-ticket-ivory/60 hover:bg-ticket-ivory text-ticket-charcoal font-medium py-3.5 rounded-full transition-all duration-300 shadow-sm hover:shadow disabled:opacity-60"
                  >
                    {googleLoading ? (
                      <div className="w-5 h-5 border-2 border-ticket-burgundy/30 border-t-ticket-burgundy rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Login State */}
            {step === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col"
              >
                <h3 id="auth-modal-title" className="font-playfair text-2xl font-semibold text-ticket-charcoal text-center mb-6">
                  Login
                </h3>
                <LoginForm 
                  onSwitchToSignup={() => setStep('signup')} 
                  onSwitchToForgot={() => setStep('forgot')}
                  onSuccess={onClose}
                />
              </motion.div>
            )}

            {/* Signup State */}
            {step === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                <h3 id="auth-modal-title" className="font-playfair text-2xl font-semibold text-ticket-charcoal text-center mb-6">
                  Create Account
                </h3>
                <SignupForm onSwitchToLogin={() => setStep('login')} />
              </motion.div>
            )}

            {/* Forgot Password State */}
            {step === 'forgot' && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col"
              >
                <h3 id="auth-modal-title" className="font-playfair text-2xl font-semibold text-ticket-charcoal text-center mb-6">
                  Reset Password
                </h3>
                <ForgotPasswordForm onBack={() => setStep('login')} />
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AuthModal;
