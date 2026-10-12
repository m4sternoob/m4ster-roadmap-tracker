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
