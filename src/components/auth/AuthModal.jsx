import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthModal = ({ isOpen, onClose, initialStep = 'select' }) => {
  const [step, setStep] = useState(initialStep);
  const [mounted, setMounted] = useState(false);

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
