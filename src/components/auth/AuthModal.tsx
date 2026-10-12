import { useState, type FormEvent } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { ModalShell, ModalHeader } from '@/components/ui/ModalShell';
import { useAuth } from '@/sync/auth';

interface AuthModalProps {
  mode: 'login' | 'signup';
}

export function AuthModal({ mode }: AuthModalProps) {
  const { login, signup, openAuth, closeAuth } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const title = isSignup ? 'Create your account' : 'Welcome back';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (isSignup) await signup(username.trim(), password);
      else await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      onClose={closeAuth}
      label={title}
      panel="max-w-sm w-full rounded-xl border border-white/10 bg-[var(--bg-deep)] text-slate-100 shadow-2xl shadow-black/50 animate-scale-in"
    >
      <ModalHeader
        title={title}
        onClose={closeAuth}
        icon={
          isSignup ? (
            <UserPlus className="text-[var(--accent-bright)]" size={20} />
          ) : (
            <LogIn className="text-[var(--accent-bright)]" size={20} />
          )
        }
      />
      <form onSubmit={onSubmit} className="px-5 py-4 flex flex-col gap-3">
        <p className="text-sm text-slate-400 -mt-1">
          {isSignup
            ? 'One account, same boards on every device.'
            : 'Sign in to sync your boards across devices.'}
        </p>
        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition-opacity duration-150 hover:opacity-85"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.6 2.8-.1.1C3.4 21.4 7.4 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.5 0 10.2 0 12s.5 3.5 1.4 5.1l3.8-2.7z"
            />
            <path
              fill="#EA4335"
              d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.9l3.8 2.8c1-2.9 3.7-5 6.8-5z"
            />
          </svg>
          Continue with Google
        </a>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          <span className="h-px flex-1 bg-white/10" /> or{' '}
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-300">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            maxLength={20}
            placeholder="e.g. m4ster"
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-300">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={8}
            placeholder={isSignup ? '8+ characters' : 'Your password'}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-[var(--accent)] focus:outline-none"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !username.trim() || !password}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && <Loader2 size={16} className="animate-spin" />}
          {isSignup ? 'Create account' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-slate-400">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={() => openAuth(isSignup ? 'login' : 'signup')}
            className="font-semibold text-[var(--accent-bright)] hover:underline"
          >
            {isSignup ? 'Sign in' : 'Create one'}
          </button>
        </p>
      </form>
    </ModalShell>
  );
}
