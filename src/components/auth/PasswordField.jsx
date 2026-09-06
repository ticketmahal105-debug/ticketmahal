import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordField = ({ 
  label = "Password", 
  placeholder = "••••••••", 
  value, 
  onChange, 
  name = "password", 
  autoComplete = "current-password",
  required = true,
  minLength = 8
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider font-semibold text-ticket-charcoal/40 mb-1.5">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full pl-4 pr-12 py-3 bg-ticket-ivory border border-ticket-beige rounded-xl text-sm outline-none focus:border-ticket-gold transition-colors"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 text-ticket-charcoal/40 hover:text-ticket-charcoal transition-colors"
          tabIndex="-1"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;
