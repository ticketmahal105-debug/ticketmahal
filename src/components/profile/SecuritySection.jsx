import { useState } from 'react';
import ChangePasswordModal from './ChangePasswordModal';

const SecuritySection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white border border-beige rounded-2xl p-6 shadow-sm">
      <h3 className="font-playfair text-xl text-charcoal font-semibold tracking-wide mb-6">
        Security
      </h3>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-charcoal/40 font-semibold mb-1">
            Password
          </label>
          <div className="text-xl tracking-[0.2em] text-charcoal/70 mt-1">
            ••••••••••••
          </div>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 border border-beige rounded-full text-sm font-medium text-charcoal hover:bg-ivory hover:border-champagne/40 transition-colors w-fit"
        >
          Change Password
        </button>
      </div>

      <ChangePasswordModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default SecuritySection;
