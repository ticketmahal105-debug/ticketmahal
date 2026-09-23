import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Authentication will not work.'
  );
}

// Synchronously capture the initial URL state at module evaluation before Supabase or React Router cleans it
export const initialAuthCallbackState = (() => {
  if (typeof window === 'undefined') {
    return {
      hasAuthParams: false,
      isError: false,
      type: null,
      code: null,
      errorDescription: '',
      isRecovery: false,
    };
  }

  const search = window.location.search || '';
  const hash = window.location.hash || '';
  const pathname = window.location.pathname || '';

  const searchParams = new URLSearchParams(search);
  const rawHash = hash.startsWith('#') ? hash.substring(1) : hash;
  const hashParams = new URLSearchParams(rawHash);

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const type = searchParams.get('type') || hashParams.get('type');
  const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
  const error = searchParams.get('error') || hashParams.get('error');
  const errorDescription = searchParams.get('error_description') || hashParams.get('error_description');

  const isRecovery = type === 'recovery';
  const isError = Boolean(errorCode || error || errorDescription);
  const isVerification = Boolean(
    code ||
    tokenHash ||
    accessToken ||
    type === 'signup' ||
    type === 'email_verification' ||
    type === 'email_change' ||
    type === 'invite' ||
    (pathname === '/auth/callback' && (hash.length > 1 || search.length > 1))
  );

  const hasAuthParams = (isVerification || isError) && !isRecovery;

  // Persist verification attempt in sessionStorage so it survives redirects from / to /auth/callback
  if (hasAuthParams && !isRecovery) {
    try {
      sessionStorage.setItem(
        'tm_auth_verification_attempt',
        JSON.stringify({
          isError,
          errorCode,
          error,
          errorDescription,
          code,
          tokenHash,
          type,
          timestamp: Date.now(),
        })
      );
    } catch {
      // Ignore sessionStorage exceptions in private browsing
    }
  }

  return {
    pathname,
    hasAuthParams,
    isError,
    errorCode,
    error,
    errorDescription,
    code,
    tokenHash,
    accessToken,
    refreshToken,
    type,
    isRecovery,
  };
})();

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
