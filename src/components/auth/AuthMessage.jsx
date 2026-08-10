import { AlertCircle, CheckCircle2 } from 'lucide-react';

const AuthMessage = ({ type = 'error', message }) => {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      className={`flex items-start gap-3 p-3 mb-4 rounded-xl text-sm ${
        isError ? 'bg-red-50/50 text-red-800' : 'bg-emerald-50/50 text-emerald-800'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isError ? (
          <AlertCircle size={16} className="text-red-500/80" />
        ) : (
          <CheckCircle2 size={16} className="text-emerald-500/80" />
        )}
      </div>
      <p className="leading-relaxed">{message}</p>
    </div>
  );
};

export default AuthMessage;
