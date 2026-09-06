import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

const ProfileSummary = ({ profile, user }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const getFirstName = () => {
    return profile?.first_name || user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';
  };

  const getFullName = () => {
    const first = profile?.first_name || user?.user_metadata?.first_name || '';
    const last = profile?.last_name || user?.user_metadata?.last_name || '';
    if (first || last) return `${first} ${last}`.trim();
    return user?.user_metadata?.full_name || getFirstName();
  };

  const getInitial = () => {
    return getFirstName().charAt(0).toUpperCase();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Ensure the file is an image and under 5MB
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB.');
        return;
      }

      // 1. Upload to Supabase Storage (assuming a bucket named 'avatars')
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // If storage is not configured, we'll silently fail for now
        // since the prompt says "If Supabase Storage is not configured yet: prepare the UI and clearly structure the code for integration."
        console.warn('Avatar upload failed, storage might not be configured:', uploadError);
        alert('Storage not configured. Upload UI is ready though!');
        return;
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update Profile Table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Optionally trigger a reload or context update here
      window.location.reload();

    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Error uploading avatar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <div className="bg-ticket-white border border-ticket-beige rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
      <div className="relative group">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-ticket-burgundy text-ticket-white flex items-center justify-center text-3xl font-semibold shadow-sm border-4 border-ivory">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            getInitial()
          )}
        </div>
        
        <button
          onClick={handleAvatarClick}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 bg-ticket-white border border-ticket-beige rounded-full flex items-center justify-center text-ticket-charcoal hover:text-ticket-burgundy hover:border-ticket-gold/40 transition-colors shadow-sm z-10"
        >
          {uploading ? (
            <div className="w-3 h-3 border-2 border-ticket-charcoal/30 border-t-charcoal rounded-full animate-spin" />
          ) : (
            <Camera size={14} />
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
      </div>

      <div className="flex-1">
        <h2 className="font-playfair text-2xl text-ticket-charcoal font-semibold tracking-wide">
          {getFullName()}
        </h2>
        <p className="text-ticket-charcoal/60 text-sm mt-1">{user?.email}</p>
        
        <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-ticket-burgundy/10 border border-ticket-gold/20 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-ticket-burgundy"></span>
          <span className="text-xs font-semibold text-ticket-charcoal tracking-wide uppercase">Ticket Mahal Member</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;
