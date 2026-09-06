import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Edit2, X, Check } from 'lucide-react';

const PersonalInformation = ({ profile, user, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile || user) {
      setFormData({
        firstName: profile?.first_name || user?.user_metadata?.first_name || '',
        lastName: profile?.last_name || user?.user_metadata?.last_name || '',
        phone: profile?.phone || '',
      });
    }
  }, [profile, user]);

  const handleCancel = () => {
    setFormData({
      firstName: profile?.first_name || user?.user_metadata?.first_name || '',
      lastName: profile?.last_name || user?.user_metadata?.last_name || '',
      phone: profile?.phone || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (formData.phone && !/^\+?[0-9\s\-]{7,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    try {
      const updates = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone: formData.phone.trim(),
        updated_at: new Date(),
      };

      // 1. Update Profiles Table
      const { error: dbError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (dbError) {
        // If profile row doesn't exist yet, we might want to insert instead,
        // but our handle_new_user trigger should handle existence.
        // Let's handle the potential error gracefully if trigger wasn't run.
        console.warn('Error updating profile row, might not exist:', dbError);
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, email: user.email, ...updates }]);
          
        if (insertError) throw insertError;
      }

      // 2. Update Auth Metadata (so navbar updates instantly without reload)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: updates.first_name,
          last_name: updates.last_name,
          full_name: `${updates.first_name} ${updates.last_name}`.trim(),
        }
      });

      if (authError) throw authError;

      onProfileUpdate?.('Profile updated successfully.');
      setIsEditing(false);

    } catch (error) {
      console.error('Error saving profile:', error);
      alert("We couldn't update your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = `w-full px-4 py-2.5 bg-ticket-white border rounded-xl text-sm font-medium text-ticket-charcoal outline-none transition-all duration-300 ${
    isEditing 
      ? 'border-ticket-beige focus:border-ticket-gold focus:ring-1 focus:ring-ticket-gold/30' 
      : 'border-transparent bg-transparent px-0 cursor-default pointer-events-none'
  }`;

  return (
    <div className="bg-ticket-white border border-ticket-beige rounded-2xl p-6 shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-playfair text-xl text-ticket-charcoal font-semibold tracking-wide">
          Personal Information
        </h3>
        
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.button
              key="edit"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-sm font-medium text-ticket-charcoal/60 hover:text-ticket-burgundy transition-colors"
            >
              <Edit2 size={16} />
              Edit Profile
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="text-xs font-medium text-ticket-charcoal/60 hover:text-ticket-charcoal px-3 py-1.5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 text-xs font-medium bg-ticket-charcoal text-ticket-white px-4 py-1.5 rounded-full hover:bg-ticket-charcoal/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Save Changes
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ticket-charcoal/40 font-semibold mb-1">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className={`${inputClasses} ${errors.firstName ? 'border-red-300' : ''}`}
            placeholder="First Name"
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ticket-charcoal/40 font-semibold mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className={`${inputClasses} ${errors.lastName ? 'border-red-300' : ''}`}
            placeholder="Last Name"
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ticket-charcoal/40 font-semibold mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className="w-full px-4 py-2.5 bg-transparent border-transparent text-sm font-medium text-ticket-charcoal/70 outline-none cursor-default px-0 pointer-events-none"
          />
          {isEditing && (
             <p className="text-[10px] text-ticket-charcoal/40 mt-1">Email cannot be changed here directly.</p>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ticket-charcoal/40 font-semibold mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`${inputClasses} ${errors.phone ? 'border-red-300' : ''}`}
            placeholder="+971 50 123 4567"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>
    </div>
  );
};

export default PersonalInformation;
