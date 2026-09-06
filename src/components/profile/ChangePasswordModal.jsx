import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await updatePassword(newPassword);
      if (updateError) throw updateError;
      
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-ticket-charcoal/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-ticket-ivory shadow-2xl rounded-3xl overflow-hidden border border-ticket-beige/40 p-8"
          >
            <button
              onClick={handleClose}
              className="absolute top-6 right-6 text-ticket-charcoal/40 hover:text-ticket-charcoal transition-colors bg-white/50 p-2 rounded-full hover:bg-white"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-ticket-white rounded-full flex items-center justify-center mx-auto mb-4 border border-ticket-beige/40 shadow-sm">
                <Lock className="text-ticket-burgundy" size={20} />
              </div>
              <h2 className="font-playfair text-2xl font-semibold text-ticket-charcoal">Change Password</h2>
              <p className="text-sm text-ticket-charcoal/60 mt-2">Enter a new secure password for your account.</p>
            </div>

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-6 text-center"
              >
                <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                  <Check size={32} />
                </div>
                <h3 className="text-lg font-medium text-ticket-charcoal mb-2">Password Updated!</h3>
                <p className="text-sm text-ticket-charcoal/60">Your password has been changed successfully.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ticket-charcoal/60 uppercase tracking-wider mb-1.5 ml-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-ticket-white border border-ticket-beige/80 text-sm font-medium outline-none focus:border-ticket-gold focus:ring-1 focus:ring-ticket-gold/30 transition-all placeholder:text-ticket-charcoal/30"
                    placeholder="Min. 8 characters"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-ticket-charcoal/60 uppercase tracking-wider mb-1.5 ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-2xl bg-ticket-white border border-ticket-beige/80 text-sm font-medium outline-none focus:border-ticket-gold focus:ring-1 focus:ring-ticket-gold/30 transition-all placeholder:text-ticket-charcoal/30"
                    placeholder="Repeat password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-ticket-charcoal text-ticket-white font-medium py-3.5 rounded-2xl hover:bg-ticket-charcoal/90 hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
