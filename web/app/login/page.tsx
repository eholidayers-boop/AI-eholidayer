import { signIn } from '@/lib/auth/config';

export const metadata = { title: 'Login — eHolidayer' };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl mb-6">Login</h1>
      <form
        action={async (formData) => {
          'use server';
          await signIn('credentials', {
            email: formData.get('email'),
            password: formData.get('password'),
            redirectTo: '/'
          });
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="text-sm text-fg-muted">Email</span>
          <input name="email" type="email" required className="mt-1 w-full rounded-md border border-border bg-bg p-2" />
        </label>
        <label className="block">
          <span className="text-sm text-fg-muted">Password</span>
          <input name="password" type="password" required className="mt-1 w-full rounded-md border border-border bg-bg p-2" />
        </label>
        <button type="submit" className="w-full bg-accent text-bg rounded-md py-2">Sign in</button>
      </form>
    </main>
  );
}
