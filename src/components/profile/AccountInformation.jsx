import { CheckCircle2, XCircle } from 'lucide-react';

const AccountInformation = ({ profile, user }) => {
  const isVerified = user?.email_confirmed_at != null;
  const memberSince = new Date(user?.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Create a friendly ID TM-XXXXXX from the first few characters of the UUID
  const accountId = `TM-${user?.id?.substring(0, 8).toUpperCase()}`;

  return (
    <div className="bg-ticket-white border border-ticket-beige rounded-2xl p-6 shadow-sm">
      <h3 className="font-playfair text-xl text-ticket-charcoal font-semibold tracking-wide mb-6">
        Account Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-xs uppercase tracking-wider text-ticket-charcoal/40 font-semibold mb-2">
            Email Status
          </label>
          <div className="flex items-center gap-2">
            {isVerified ? (
              <>
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-sm font-medium text-ticket-charcoal">Verified</span>
              </>
            ) : (
              <>
                <XCircle size={16} className="text-ticket-charcoal/40" />
                <span className="text-sm font-medium text-ticket-charcoal/70">Not Verified</span>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ticket-charcoal/40 font-semibold mb-2">
            Member Since
          </label>
          <p className="text-sm font-medium text-ticket-charcoal">{memberSince}</p>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-ticket-charcoal/40 font-semibold mb-2">
            Account ID
          </label>
          <p className="text-sm font-medium text-ticket-charcoal/70 font-mono bg-ticket-ivory inline-block px-2 py-0.5 rounded border border-ticket-beige/40">
            {accountId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountInformation;
