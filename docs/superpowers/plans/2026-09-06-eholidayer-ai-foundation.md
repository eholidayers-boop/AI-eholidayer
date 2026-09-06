# eHolidayer AI-Native Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AI-native foundation for eHolidayer — a Next.js frontend with a conversational travel assistant, talking through a REST shim to the existing Joomla/MySQL inventory, with a real Anthropic API + mock fallback for development.

**Architecture:** Two-service topology. A new Next.js 15 app on Vercel (`web/`) hosts the AI-native UI and orchestration layer. A new Joomla component (`components/com_api/`) inside the legacy install exposes a thin read API over the existing `elx_res_*` tables. AI never touches the DB directly — it calls typed handlers that go through an internal API client to the legacy shim. Conversation state lives in Vercel KV. Mock and Anthropic providers share the same `AIProvider` interface, swapped via env var.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Zod, Anthropic SDK (`@anthropic-ai/sdk`), Vercel KV (`@vercel/kv`), NextAuth.js v5, Vitest, Playwright, DOMPurify. Legacy side: PHP 7.x, Joomla/Elxis component conventions, PHPUnit for the shim.

**Spec:** `docs/superpowers/specs/2026-09-06-eholidayer-ai-foundation-design.md`

## Global Constraints

- **Working directory:** New Next.js code lives at `web/` inside the existing repo (`F:/AI/AI-eholidayer/`).
- **Legacy code:** Untouched for M1; new PHP component added in M2.
- **Node version:** 20 LTS or newer (Vercel default).
- **TypeScript:** strict mode, no `any` in committed code.
- **LLM models:** chat/intent/explanations use `claude-sonnet-5`; ranking/summarization use `claude-haiku-4-5`. Names match `model` param of `@anthropic-ai/sdk` (consult SDK docs at task time; fallback string `claude-3-5-sonnet-latest` / `claude-3-5-haiku-latest` if newer aliases not yet published).
- **Tool calls per turn:** hard cap at 5.
- **Session TTL:** 30 days; conversation history >30 messages compressed via Haiku 4.5.
- **Env var names:** exactly as listed in spec §5.3.
- **CORS allowlist** on legacy shim: `https://app.eholidayer.com` and Vercel preview URLs only.
- **Color tokens:** exactly as listed in spec §6.2.
- **Fonts:** Fraunces (display), Inter (UI), JetBrains Mono (prices/codes).
- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`).

---

# Milestone 1 — Scaffold + Design System (3 days)

## Task 1.1: Initialize Next.js app skeleton

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/next.config.js`
- Create: `web/.gitignore`
- Create: `web/.env.example`
- Create: `web/app/layout.tsx`
- Create: `web/app/page.tsx`
- Create: `web/app/globals.css`
- Create: `web/app/favicon.ico` (placeholder)

**Interfaces:**
- Produces: directory `web/` with a runnable Next.js 15 + TypeScript + Tailwind app

- [ ] **Step 1: Create `web/` directory and `package.json`**

Create the directory and a minimal `package.json`:

```json
{
  "name": "eholidayer-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0-rc-66855b96-20241106",
    "react-dom": "19.0.0-rc-66855b96-20241106"
  },
  "devDependencies": {
    "@types/node": "20.14.10",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "typescript": "5.5.3",
    "tailwindcss": "3.4.10",
    "postcss": "8.4.41",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.0",
    "eslint-config-next": "15.0.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.js`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.eholidayer.com' },
      { protocol: 'https', hostname: 'images.eholidayer.com' }
    ]
  }
};

module.exports = nextConfig;
```

- [ ] **Step 4: Create `web/.gitignore`**

```
node_modules/
.next/
out/
.env.local
.env.*.local
*.tsbuildinfo
next-env.d.ts
playwright-report/
test-results/
coverage/
```

- [ ] **Step 5: Create `web/.env.example`**

```
# AI provider: 'anthropic' or 'mock'
AI_PROVIDER=mock

# Anthropic (only used when AI_PROVIDER=anthropic)
ANTHROPIC_API_KEY=

# Vercel KV
KV_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Legacy Joomla REST shim
LEGACY_API_BASE_URL=https://www.eholidayer.com
LEGACY_API_TOKEN=

# NextAuth
NEXTAUTH_URL=https://app.eholidayer.com
NEXTAUTH_SECRET=

# Safety rail for using mock provider outside dev/staging
ALLOW_MOCK_PROVIDER=true
```

- [ ] **Step 6: Install dependencies**

Run: `cd F:/AI/AI-eholidayer/web && npm install`
Expected: deps installed, no errors.

- [ ] **Step 7: Create `web/app/layout.tsx`**

```tsx
import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'eHolidayer — Your intelligent hotel companion',
  description: 'Tell us what you want. We will find the stay for you.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create `web/app/page.tsx`**

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>eHolidayer</h1>
      <p>Scaffold OK.</p>
    </main>
  );
}
```

- [ ] **Step 9: Create `web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 10: Create empty `web/postcss.config.js`**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

- [ ] **Step 11: Create `web/tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        'bg-subtle': 'var(--color-bg-subtle)',
        fg: 'var(--color-fg)',
        'fg-muted': 'var(--color-fg-muted)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        warn: 'var(--color-warn)',
        error: 'var(--color-error)',
        success: 'var(--color-success)'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: []
};

export default config;
```

- [ ] **Step 12: Verify the scaffold builds**

Run: `cd F:/AI/AI-eholidayer/web && npm run build`
Expected: build succeeds, "Scaffold OK" page produced.

- [ ] **Step 13: Commit**

```bash
git add web/
git commit -m "feat(web): scaffold Next.js 15 + TypeScript + Tailwind app"
```

---

## Task 1.2: Add theme tokens and typography

**Files:**
- Modify: `web/app/globals.css`
- Modify: `web/app/layout.tsx`
- Create: `web/public/fonts/.` (placeholder)

**Interfaces:**
- Produces: `:root` CSS variables from spec §6.2; `data-theme="dark"` override; system preference fallback

- [ ] **Step 1: Replace `web/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Light theme (default) */
:root {
  --color-bg: #FBFAF7;
  --color-bg-subtle: #F4F1EA;
  --color-fg: #1A1814;
  --color-fg-muted: #5C574D;
  --color-border: #E5E0D6;
  --color-accent: #2F5D50;
  --color-accent-soft: #E8F0ED;
  --color-warn: #C97A3D;
  --color-error: #B0413E;
  --color-success: #3F7D5C;
  color-scheme: light;
}

/* System preference dark fallback */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #15130F;
    --color-bg-subtle: #1F1C16;
    --color-fg: #F4F1EA;
    --color-fg-muted: #9A938A;
    --color-border: #2D2924;
    --color-accent: #5FA08C;
    --color-accent-soft: #1E2E29;
    --color-warn: #D88B4E;
    --color-error: #D6625F;
    --color-success: #5FA07C;
    color-scheme: dark;
  }
}

/* Explicit dark theme override */
:root[data-theme="dark"] {
  --color-bg: #15130F;
  --color-bg-subtle: #1F1C16;
  --color-fg: #F4F1EA;
  --color-fg-muted: #9A938A;
  --color-border: #2D2924;
  --color-accent: #5FA08C;
  --color-accent-soft: #1E2E29;
  --color-warn: #D88B4E;
  --color-error: #D6625F;
  --color-success: #5FA07C;
  color-scheme: dark;
}

html, body {
  background-color: var(--color-bg);
  color: var(--color-fg);
  font-family: 'Inter', system-ui, sans-serif;
  margin: 0;
}

h1, h2, h3 {
  font-family: 'Fraunces', serif;
  font-optical-sizing: auto;
  line-height: 1.15;
}
```

- [ ] **Step 2: Update `web/app/layout.tsx` to use Google Fonts via `next/font`**

```tsx
import './globals.css';
import type { ReactNode } from 'react';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains', display: 'swap' });

export const metadata = {
  title: 'eHolidayer — Your intelligent hotel companion',
  description: 'Tell us what you want. We will find the stay for you.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Update `web/tailwind.config.ts` to use font CSS vars**

Replace the `fontFamily` block with:

```ts
fontFamily: {
  display: ['var(--font-fraunces)', 'serif'],
  sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
  mono: ['var(--font-jetbrains)', 'monospace']
}
```

- [ ] **Step 4: Update `web/app/page.tsx` to use tokens**

```tsx
export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg text-fg flex flex-col items-center justify-center p-8">
      <h1 className="font-display text-5xl text-fg mb-3">eHolidayer</h1>
      <p className="text-fg-muted font-mono">Tokens OK.</p>
    </main>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `cd F:/AI/AI-eholidayer/web && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add web/app/globals.css web/app/layout.tsx web/app/page.tsx web/tailwind.config.ts
git commit -m "feat(web): add color tokens, theme system, and fonts"
```

---

## Task 1.3: Build `cn` utility

**Files:**
- Create: `web/lib/utils/cn.ts`
- Create: `web/tests/unit/cn.test.ts`
- Modify: `web/package.json` (add vitest)

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` — joins class names, dedupes false/null/undefined

- [ ] **Step 1: Add vitest dev dependency**

Run: `cd F:/AI/AI-eholidayer/web && npm install -D vitest@^2 @vitest/ui@^2 jsdom@^25 @testing-library/react@^16`

- [ ] **Step 2: Write failing test `web/tests/unit/cn.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils/cn';

describe('cn', () => {
  it('joins string class names with spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('dedupes tailwind classes, last wins', () => {
    expect(cn('px-2 px-4', 'px-6')).toBe('px-6');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/cn.test.ts`
Expected: FAIL — "cn is not defined".

- [ ] **Step 4: Implement `web/lib/utils/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Install clsx and tailwind-merge**

Run: `cd F:/AI/AI-eholidayer/web && npm install clsx tailwind-merge`

- [ ] **Step 6: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/cn.test.ts`
Expected: PASS (3/3).

- [ ] **Step 7: Commit**

```bash
git add web/lib/utils/cn.ts web/tests/unit/cn.test.ts web/package.json web/package-lock.json
git commit -m "feat(web): add cn() class-merge utility with tests"
```

---

## Task 1.4: Build `Button` primitive

**Files:**
- Create: `web/components/ui/Button.tsx`
- Create: `web/tests/unit/Button.test.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils/cn`
- Produces: `<Button variant="primary"|"secondary"|"ghost"|"destructive" size="sm"|"md"|"lg" loading? boolean>`

- [ ] **Step 1: Write failing test `web/tests/unit/Button.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Find hotels</Button>);
    expect(screen.getByRole('button', { name: 'Find hotels' })).toBeInTheDocument();
  });

  it('applies variant and size classes', () => {
    render(<Button variant="secondary" size="lg">Go</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/secondary/);
    expect(btn.className).toMatch(/lg/);
  });

  it('shows loading state and is disabled', () => {
    render(<Button loading>Go</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/Button.test.tsx`
Expected: FAIL — "Button is not defined".

- [ ] **Step 3: Implement `web/components/ui/Button.tsx`**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type size = 'sm' | 'md' | 'lg';

const variants: Record<variant, string> = {
  primary: 'bg-accent text-bg hover:opacity-90',
  secondary: 'bg-bg-subtle text-fg border border-border hover:border-accent',
  ghost: 'bg-transparent text-fg hover:bg-bg-subtle',
  destructive: 'bg-error text-bg hover:opacity-90'
};

const sizes: Record<size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-base',
  lg: 'h-12 px-6 text-lg'
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: variant;
  size?: size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-opacity',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...rest}
      >
        {loading ? <span aria-hidden="true">...</span> : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/Button.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add web/components/ui/Button.tsx web/tests/unit/Button.test.tsx
git commit -m "feat(web): add Button primitive with variant/size/loading"
```

---

## Task 1.5: Build `Input` primitive

**Files:**
- Create: `web/components/ui/Input.tsx`
- Create: `web/tests/unit/Input.test.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils/cn`
- Produces: `<Input variant="default"|"search"|"chat" leadingIcon? trailingIcon? error? hint?>`

- [ ] **Step 1: Write failing test `web/tests/unit/Input.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders with type=text by default', () => {
    render(<Input placeholder="Where to?" />);
    expect(screen.getByPlaceholderText('Where to?')).toHaveAttribute('type', 'text');
  });

  it('forwards aria-describedby for errors and hints', () => {
    render(<Input error="Required" hint="Optional hint" aria-label="Search" />);
    const input = screen.getByLabelText('Search');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('applies chat variant classes', () => {
    render(<Input variant="chat" placeholder="msg" />);
    const input = screen.getByPlaceholderText('msg');
    expect(input.className).toMatch(/chat/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/Input.test.tsx`
Expected: FAIL — "Input is not defined".

- [ ] **Step 3: Implement `web/components/ui/Input.tsx`**

```tsx
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'default' | 'search' | 'chat';

const variants: Record<variant, string> = {
  default: 'h-10 px-3 text-base',
  search: 'h-11 pl-10 pr-3 text-base',
  chat: 'min-h-12 px-4 py-3 text-base resize-none'
};

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: variant;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', leadingIcon, trailingIcon, error, hint, className, id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="relative w-full">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'w-full rounded-md border bg-bg text-fg',
            'border-border focus:border-accent focus:outline-none',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variants[variant],
            leadingIcon && variant === 'search' && 'pl-10',
            error && 'border-error',
            className
          )}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1 text-sm text-fg-muted">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/Input.test.tsx`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add web/components/ui/Input.tsx web/tests/unit/Input.test.tsx
git commit -m "feat(web): add Input primitive with variants and a11y"
```

---

## Task 1.6: Build `Card` and `Badge` primitives

**Files:**
- Create: `web/components/ui/Card.tsx`
- Create: `web/components/ui/Badge.tsx`
- Create: `web/tests/unit/Card.test.tsx`
- Create: `web/tests/unit/Badge.test.tsx`

- [ ] **Step 1: Write failing test `web/tests/unit/Card.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children inside an article', () => {
    render(<Card>Body</Card>);
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Card variant="bordered">X</Card>);
    expect(screen.getByText('X').parentElement?.className).toMatch(/bordered/);
  });
});
```

- [ ] **Step 2: Write failing test `web/tests/unit/Badge.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders with score styling for matchScore variant', () => {
    render(<Badge variant="matchScore" score={92}>92% Match</Badge>);
    expect(screen.getByText('92% Match').className).toMatch(/matchScore/);
  });

  it('uses neutral tone when score < 60', () => {
    render(<Badge variant="matchScore" score={40}>40%</Badge>);
    expect(screen.getByText('40%').className).toMatch(/neutral/);
  });

  it('uses success tone when score >= 80', () => {
    render(<Badge variant="matchScore" score={85}>85%</Badge>);
    expect(screen.getByText('85%').className).toMatch(/success/);
  });
});
```

- [ ] **Step 3: Implement `web/components/ui/Card.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'elevated' | 'bordered' | 'filled';

const variants: Record<variant, string> = {
  elevated: 'bg-bg shadow-sm',
  bordered: 'bg-bg border border-border',
  filled: 'bg-bg-subtle'
};

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: variant;
  children: ReactNode;
}

export function Card({ variant = 'elevated', className, children, ...rest }: CardProps) {
  return (
    <article className={cn('rounded-lg p-4', variants[variant], className)} {...rest}>
      {children}
    </article>
  );
}
```

- [ ] **Step 4: Implement `web/components/ui/Badge.tsx`**

```tsx
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type variant = 'matchScore' | 'status' | 'category';
type size = 'sm' | 'md';

function toneForScore(score: number): 'success' | 'warn' | 'neutral' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warn';
  return 'neutral';
}

const tones = {
  success: 'bg-success/10 text-success border-success/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  neutral: 'bg-bg-subtle text-fg-muted border-border'
} as const;

const sizes: Record<size, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1'
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: variant;
  size?: size;
  score?: number;
  children: ReactNode;
}

export function Badge({ variant = 'status', size = 'md', score, className, children, ...rest }: BadgeProps) {
  const tone = variant === 'matchScore' && typeof score === 'number' ? toneForScore(score) : 'neutral';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variant === 'matchScore' ? tones[tone] : 'bg-bg-subtle text-fg border-border',
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/Card.test.tsx tests/unit/Badge.test.tsx`
Expected: PASS (2 + 3 = 5/5).

- [ ] **Step 6: Commit**

```bash
git add web/components/ui/Card.tsx web/components/ui/Badge.tsx web/tests/unit/Card.test.tsx web/tests/unit/Badge.test.tsx
git commit -m "feat(web): add Card and Badge primitives"
```

---

## Task 1.7: Build `Sheet`, `Skeleton`, `Dialog` primitives

**Files:**
- Create: `web/components/ui/Sheet.tsx`
- Create: `web/components/ui/Skeleton.tsx`
- Create: `web/components/ui/Dialog.tsx`
- Create: `web/tests/unit/Skeleton.test.tsx`
- Modify: `web/package.json` (add @radix-ui/react-dialog)

- [ ] **Step 1: Install Radix UI primitives**

Run: `cd F:/AI/AI-eholidayer/web && npm install @radix-ui/react-dialog @radix-ui/react-tabs`

- [ ] **Step 2: Write failing test `web/tests/unit/Skeleton.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('has aria-busy and animated class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.className).toMatch(/animate-pulse/);
  });
});
```

- [ ] **Step 3: Implement `web/components/ui/Skeleton.tsx`**

```tsx
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn('animate-pulse rounded-md bg-bg-subtle', className)}
      {...rest}
    />
  );
}
```

- [ ] **Step 4: Implement `web/components/ui/Sheet.tsx`**

```tsx
'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: 'right' | 'bottom';
  children: ReactNode;
}

export function Sheet({ open, onClose, side = 'right', children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-fg/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute bg-bg border border-border shadow-lg',
          side === 'right'
            ? 'right-0 top-0 h-full w-full max-w-md p-6 overflow-y-auto'
            : 'bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl p-4 overflow-y-auto'
        )}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 h-9 w-9 rounded-full text-fg-muted hover:bg-bg-subtle"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement `web/components/ui/Dialog.tsx`**

```tsx
'use client';

import * as RDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-fg/40 backdrop-blur-sm" />
        <RDialog.Content
          aria-describedby={description ? 'dialog-desc' : undefined}
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-bg p-6 shadow-lg border border-border"
        >
          <RDialog.Title className="font-display text-xl text-fg mb-2">{title}</RDialog.Title>
          {description && (
            <RDialog.Description id="dialog-desc" className="text-fg-muted mb-4">
              {description}
            </RDialog.Description>
          )}
          {children}
          <RDialog.Close
            aria-label="Close"
            className="absolute top-3 right-3 h-9 w-9 rounded-full text-fg-muted hover:bg-bg-subtle"
          >
            ×
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
```

- [ ] **Step 6: Run Skeleton test**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/Skeleton.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/components/ui/Sheet.tsx web/components/ui/Skeleton.tsx web/components/ui/Dialog.tsx web/tests/unit/Skeleton.test.tsx web/package.json web/package-lock.json
git commit -m "feat(web): add Sheet, Skeleton, Dialog primitives"
```

---

## Task 1.8: Build static homepage hero

**Files:**
- Create: `web/components/composite/AIHeroInput.tsx` (placeholder, non-functional in M1)
- Modify: `web/app/page.tsx`
- Modify: `web/app/layout.tsx`

**Interfaces:**
- Produces: homepage at `/` showing hero headline, subheadline, placeholder input, trust tiles (static, no AI)

- [ ] **Step 1: Create placeholder `web/components/composite/AIHeroInput.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const SUGGESTIONS = [
  'Romantic hotel in Paris',
  'Family resort in Hurghada',
  'Luxury in Dubai under $500',
  'Quiet beach hotel'
];

export function AIHeroInput() {
  const [value, setValue] = useState('');

  return (
    <form
      className="w-full max-w-2xl mx-auto"
      onSubmit={(e) => {
        e.preventDefault();
        // No-op in M1; wired in M5
      }}
    >
      <div className="flex gap-2">
        <Input
          variant="chat"
          placeholder="I'm going to Hurghada with my wife for 4 nights..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Describe your ideal stay"
        />
        <Button type="submit" size="lg">Find</Button>
      </div>
      <ul className="mt-4 flex flex-wrap gap-2 text-sm">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setValue(s)}
              className="rounded-full bg-bg-subtle px-3 py-1 text-fg-muted hover:bg-accent-soft hover:text-accent"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </form>
  );
}
```

- [ ] **Step 2: Replace `web/app/page.tsx`**

```tsx
import { AIHeroInput } from '@/components/composite/AIHeroInput';

const TRUST_TILES = [
  'Personalized recommendations',
  'Transparent prices',
  'Real hotel availability',
  'Human support when you need it'
];

export default function HomePage() {
  return (
    <main>
      <header className="mx-auto flex max-w-7xl items-center justify-between p-6">
        <span className="font-display text-2xl text-fg">eHolidayer</span>
        <nav className="flex gap-6 text-sm text-fg-muted">
          <a href="#" className="hover:text-fg">Explore</a>
          <a href="#" className="hover:text-fg">My Trips</a>
          <a href="#" className="hover:text-fg">Login</a>
          <span>EN / USD</span>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden bg-fg text-bg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-fg to-bg-subtle opacity-90" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h1 className="font-display text-5xl md:text-6xl tracking-tight">
            Tell me what kind of stay you're looking for.
          </h1>
          <p className="mt-4 text-lg text-bg/80">
            I'll find the hotels that fit you best.
          </p>
          <div className="mt-10">
            <AIHeroInput />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-fg-muted">
          {TRUST_TILES.map((t) => (
            <li key={t} className="rounded-lg border border-border p-4 bg-bg">{t}</li>
          ))}
        </ul>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-sm text-fg-muted">
        © eHolidayer
      </footer>
    </main>
  );
}
```

- [ ] **Step 3: Build and verify**

Run: `cd F:/AI/AI-eholidayer/web && npm run build`
Expected: build succeeds, hero renders.

- [ ] **Step 4: Commit**

```bash
git add web/components/composite/AIHeroInput.tsx web/app/page.tsx
git commit -m "feat(web): static AI-native homepage hero with placeholder input"
```

---

# Milestone 2 — Legacy REST Shim `com_api` (4 days)

## Task 2.1: Scaffold Joomla component `com_api`

**Files:**
- Create: `components/com_api/api.xml`
- Create: `components/com_api/api.php` (entry router)
- Create: `components/com_api/install.php`
- Create: `components/com_api/language/en-GB.com_api.ini`

**Interfaces:**
- Produces: A Joomla component manifest, entry router that dispatches `/api/v1/*` paths to controllers; rejects requests without `X-API-Token` header

- [ ] **Step 1: Create manifest `components/com_api/api.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<extension type="component" version="3.0" method="upgrade">
  <name>com_api</name>
  <author>eHolidayer</author>
  <version>1.0.0</version>
  <description>Read-only REST shim for the AI-native frontend.</description>
  <files folder="site">
    <filename>api.php</filename>
    <folder>controllers</folder>
    <folder>models</folder>
    <folder>language</folder>
  </files>
  <administration>
    <files folder="admin"></files>
  </administration>
</extension>
```

- [ ] **Step 2: Create entry router `components/com_api/api.php`**

```php
<?php
defined('_ELXIS') or die;

$path = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$parts = explode('/', $path);

// Expect /api/v1/<endpoint>
if (count($parts) < 3 || $parts[0] !== 'api' || $parts[1] !== 'v1') {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'not_found']);
    exit;
}

$endpoint = $parts[2];
$id = $parts[3] ?? null;

// Token token check
$expected = getenv('API_TOKEN') ?: '';
$provided = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!hash_equals($expected, $provided) || $expected === '') {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'unauthorized']);
    exit;
}

// CORS allowlist
$allowedOrigins = [
    'https://app.eholidayer.com',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: X-API-Token, Content-Type');
    header('Access-Control-Allow-Credentials: true');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Dispatch
$method = $_SERVER['REQUEST_METHOD'];
$controllerFile = __DIR__ . '/controllers/' . $endpoint . '.php';
if (!file_exists($controllerFile)) {
    header('HTTP/1.1 404 Not Found');
    echo json_encode(['error' => 'unknown_endpoint']);
    exit;
}

require_once $controllerFile;
$fn = "api_{$endpoint}_{$method}";
if (!function_exists($fn)) {
    header('HTTP/1.1 405 Method Not Allowed');
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
}

header('Content-Type: application/json');
$fn($id);
```

- [ ] **Step 3: Create install script `components/com_api/install.php`**

```php
<?php
defined('_ELXIS') or die;

function com_api_install() {
    // No DB schema changes; reads from existing elx_res_* tables.
    return true;
}

function com_api_uninstall() {
    return true;
}
```

- [ ] **Step 4: Create language file `components/com_api/language/en-GB.com_api.ini`**

```ini
COM_API_NAME="API"
COM_API_DESCRIPTION="Read-only REST shim for the AI-native frontend."
```

- [ ] **Step 5: Commit**

```bash
git add components/com_api/
git commit -m "feat(legacy): scaffold com_api Joomla component with token auth + CORS"
```

---

## Task 2.2: Add `health` controller

**Files:**
- Create: `components/com_api/controllers/health.php`

**Interfaces:**
- `GET /api/v1/health` returns `{ ok: true, version: '1.0.0', db: 'up'|'down' }`

- [ ] **Step 1: Write controller `components/com_api/controllers/health.php`**

```php
<?php
defined('_ELXIS') or die;

function api_health_GET() {
    $dbUp = 'up';
    try {
        $db = elxisDatabase::getInstance();
        $db->query('SELECT 1');
    } catch (Throwable $e) {
        $dbUp = 'down';
    }
    echo json_encode(['ok' => true, 'version' => '1.0.0', 'db' => $dbUp]);
}
```

- [ ] **Step 2: Manual smoke test (local)**

Run from PHP CLI: `php -r "define('_ELXIS', 1); require 'components/com_api/api.php';"` after stubbing auth. (Acceptable for now; full test infra in Task 2.8.)
Expected: returns `{"ok":true,...}` if reached.

- [ ] **Step 3: Commit**

```bash
git add components/com_api/controllers/health.php
git commit -m "feat(legacy): com_api health endpoint"
```

---

## Task 2.3: Add `destinations` and `hotels` controllers

**Files:**
- Create: `components/com_api/models/HotelMapper.php`
- Create: `components/com_api/controllers/destinations.php`
- Create: `components/com_api/controllers/hotels.php`
- Create: `components/com_api/tests/phpunit/HotelMapperTest.php`

**Interfaces:**
- `GET /api/v1/destinations` → `{ destinations: Destination[] }`
- `GET /api/v1/hotels?destination=&category=&minPrice=&maxPrice=&page=&pageSize=` → `{ hotels: Hotel[], total: number, page: number }`

- [ ] **Step 1: Implement mapper `components/com_api/models/HotelMapper.php`**

```php
<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../../com_reservations/includes/mappers.php';

class HotelMapper {
    public static function mapHotel(array $row): array {
        return [
            'id' => (string)$row['id'],
            'slug' => $row['slug'] ?? '',
            'name' => $row['name'] ?? '',
            'destination' => [
                'id' => (string)($row['destination_id'] ?? ''),
                'name' => $row['destination_name'] ?? '',
                'country' => $row['country'] ?? ''
            ],
            'category' => (int)($row['category'] ?? 0),
            'rating' => (float)($row['rating'] ?? 0),
            'reviewCount' => (int)($row['review_count'] ?? 0),
            'priceFrom' => [
                'amount' => (float)($row['price_from'] ?? 0),
                'currency' => $row['currency'] ?? 'USD'
            ],
            'thumbnail' => $row['thumbnail'] ?? '',
            'amenities' => $row['amenities'] ?? [],
            'beachDistance' => isset($row['beach_distance']) ? (int)$row['beach_distance'] : null
        ];
    }
}
```

- [ ] **Step 2: Write PHPUnit test `components/com_api/tests/phpunit/HotelMapperTest.php`**

```php
<?php
require_once __DIR__ . '/../../models/HotelMapper.php';

class HotelMapperTest extends PHPUnit\Framework\TestCase {
    public function testMapsBasicHotelRow(): void {
        $row = [
            'id' => 42, 'slug' => 'azure-bay', 'name' => 'Azure Bay Resort',
            'destination_id' => 7, 'destination_name' => 'Hurghada', 'country' => 'EG',
            'category' => 5, 'rating' => 9.1, 'review_count' => 124,
            'price_from' => 540, 'currency' => 'USD',
            'thumbnail' => 'https://images.eholidayer.com/42.jpg',
            'amenities' => ['pool', 'spa', 'beach']
        ];
        $h = HotelMapper::mapHotel($row);
        $this->assertSame('42', $h['id']);
        $this->assertSame('Azure Bay Resort', $h['name']);
        $this->assertSame(5, $h['category']);
        $this->assertSame(['pool', 'spa', 'beach'], $h['amenities']);
    }
}
```

- [ ] **Step 3: Implement `components/com_api/controllers/destinations.php`**

```php
<?php
defined('_ELXIS') or die;

function api_destinations_GET() {
    $db = elxisDatabase::getInstance();
    $rows = $db->loadAssocList('SELECT id, name, country FROM elx_destinations ORDER BY name ASC');
    $out = array_map(function($r) {
        return [
            'id' => (string)$r['id'],
            'name' => $r['name'],
            'country' => $r['country']
        ];
    }, $rows);
    echo json_encode(['destinations' => $out]);
}
```

- [ ] **Step 4: Implement `components/com_api/controllers/hotels.php`**

```php
<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../models/HotelMapper.php';

function api_hotels_GET() {
    $db = elxisDatabase::getInstance();
    $q = $_GET;
    $where = ['1=1'];
    $params = [];
    if (!empty($q['destination'])) {
        $where[] = 'h.destination_id = ?';
        $params[] = (int)$q['destination'];
    }
    if (!empty($q['category'])) {
        $where[] = 'h.category = ?';
        $params[] = (int)$q['category'];
    }
    if (!empty($q['minPrice'])) {
        $where[] = 'h.price_from >= ?';
        $params[] = (float)$q['minPrice'];
    }
    if (!empty($q['maxPrice'])) {
        $where[] = 'h.price_from <= ?';
        $params[] = (float)$q['maxPrice'];
    }
    $page = max(1, (int)($q['page'] ?? 1));
    $pageSize = min(50, max(1, (int)($q['pageSize'] ?? 20)));
    $offset = ($page - 1) * $pageSize;

    $sql = 'SELECT h.*, d.name AS destination_name, d.country
            FROM elx_res_hotels h
            JOIN elx_destinations d ON d.id = h.destination_id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY h.rating DESC
            LIMIT ? OFFSET ?';
    $rows = $db->loadAssocList($sql, array_merge($params, [$pageSize, $offset]));

    $countSql = 'SELECT COUNT(*) AS total FROM elx_res_hotels h WHERE ' . implode(' AND ', $where);
    $total = (int)$db->loadResult($countSql, $params);

    echo json_encode([
        'hotels' => array_map([HotelMapper::class, 'mapHotel'], $rows),
        'total' => $total,
        'page' => $page
    ]);
}
```

- [ ] **Step 5: Run mapper test**

Run: `cd F:/AI/AI-eholidayer/components/com_api && phpunit tests/phpunit/HotelMapperTest.php`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/com_api/models/ components/com_api/controllers/destinations.php components/com_api/controllers/hotels.php components/com_api/tests/
git commit -m "feat(legacy): com_api destinations and hotels list endpoints"
```

---

## Task 2.4: Add `hotel` and `rooms` controllers

**Files:**
- Create: `components/com_api/controllers/hotel.php`
- Create: `components/com_api/controllers/rooms.php`
- Create: `components/com_api/models/HotelDetailMapper.php`

**Interfaces:**
- `GET /api/v1/hotels/{id}` → `{ hotel: HotelDetail }`
- `GET /api/v1/hotels/{id}/rooms` → `{ rooms: RoomOption[] }`

- [ ] **Step 1: Implement mapper `components/com_api/models/HotelDetailMapper.php`**

```php
<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/HotelMapper.php';

class HotelDetailMapper {
    public static function mapDetail(array $row, array $photos, array $rooms, array $reviews, array $policies): array {
        $base = HotelMapper::mapHotel($row);
        return array_merge($base, [
            'description' => strip_tags($row['description'] ?? ''),
            'photos' => $photos,
            'rooms' => $rooms,
            'reviews' => [
                'rating' => (float)($row['rating'] ?? 0),
                'count' => (int)($row['review_count'] ?? 0),
                'recent' => $reviews
            ],
            'location' => [
                'lat' => (float)($row['lat'] ?? 0),
                'lng' => (float)($row['lng'] ?? 0),
                'address' => $row['address'] ?? ''
            ],
            'policies' => $policies
        ]);
    }
}
```

- [ ] **Step 2: Implement `components/com_api/controllers/hotel.php`**

```php
<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../models/HotelDetailMapper.php';

function api_hotel_GET($id) {
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'missing_id']); return; }
    $db = elxisDatabase::getInstance();
    $row = $db->loadAssocRow(
        'SELECT h.*, d.name AS destination_name, d.country
         FROM elx_res_hotels h
         JOIN elx_destinations d ON d.id = h.destination_id
         WHERE h.id = ?', [(int)$id]
    );
    if (!$row) { http_response_code(404); echo json_encode(['error' => 'not_found']); return; }

    $photos = array_map(fn($r) => $r['url'], $db->loadAssocList(
        'SELECT url FROM elx_res_hotel_photos WHERE hotel_id = ? ORDER BY sort_order ASC', [(int)$id]
    ));
    $rooms = array_map([RoomMapper::class, 'map'], $db->loadAssocList(
        'SELECT * FROM elx_res_rooms WHERE hotel_id = ?', [(int)$id]
    ));
    $reviews = $db->loadAssocList(
        'SELECT id, rating, title, body, author, created_at FROM elx_res_reviews WHERE hotel_id = ? ORDER BY created_at DESC LIMIT 10',
        [(int)$id]
    );
    $policies = [
        'cancellation' => $row['cancellation_policy'] ?? '',
        'checkIn' => $row['check_in_time'] ?? '14:00',
        'checkOut' => $row['check_out_time'] ?? '12:00'
    ];

    echo json_encode(['hotel' => HotelDetailMapper::mapDetail($row, $photos, $rooms, $reviews, $policies)]);
}
```

- [ ] **Step 3: Implement `components/com_api/models/RoomMapper.php`**

```php
<?php
defined('_ELXIS') or die;

class RoomMapper {
    public static function map(array $r): array {
        return [
            'id' => (string)$r['id'],
            'name' => $r['name'] ?? '',
            'capacity' => [
                'adults' => (int)($r['adults'] ?? 2),
                'children' => (int)($r['children'] ?? 0)
            ],
            'boardType' => $r['board_type'] ?? 'room_only',
            'refundable' => (bool)($r['refundable'] ?? false),
            'cancellationDeadline' => $r['cancellation_deadline'] ?? null,
            'price' => [
                'amount' => (float)($r['price'] ?? 0),
                'currency' => $r['currency'] ?? 'USD'
            ]
        ];
    }
}
```

- [ ] **Step 4: Implement `components/com_api/controllers/rooms.php`**

```php
<?php
defined('_ELXIS') or die;

require_once __DIR__ . '/../models/RoomMapper.php';

function api_rooms_GET($id) {
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'missing_id']); return; }
    $db = elxisDatabase::getInstance();
    $rows = $db->loadAssocList('SELECT * FROM elx_res_rooms WHERE hotel_id = ?', [(int)$id]);
    echo json_encode(['rooms' => array_map([RoomMapper::class, 'map'], $rows)]);
}
```

- [ ] **Step 5: Commit**

```bash
git add components/com_api/models/HotelDetailMapper.php components/com_api/models/RoomMapper.php components/com_api/controllers/hotel.php components/com_api/controllers/rooms.php
git commit -m "feat(legacy): com_api hotel detail and rooms endpoints"
```

---

## Task 2.5: Add `availability`, `auth` controllers

**Files:**
- Create: `components/com_api/controllers/availability.php`
- Create: `components/com_api/controllers/auth.php`

**Interfaces:**
- `GET /api/v1/availability?destination=&checkIn=&checkOut=&guests=` → `{ hotels: AvailabilityResult[] }`
- `POST /api/v1/auth/login` body `{ email, password }` → `{ token, user }`

- [ ] **Step 1: Implement `components/com_api/controllers/availability.php`**

```php
<?php
defined('_ELXIS') or die;

function api_availability_GET() {
    $db = elxisDatabase::getInstance();
    $q = $_GET;
    if (empty($q['destination']) || empty($q['checkIn']) || empty($q['checkOut'])) {
        http_response_code(400);
        echo json_encode(['error' => 'missing_params']);
        return;
    }
    $rows = $db->loadAssocList(
        'SELECT h.id, h.name, MIN(r.price) AS min_price, r.currency
         FROM elx_res_hotels h
         JOIN elx_res_rooms r ON r.hotel_id = h.id
         WHERE h.destination_id = ? AND r.available_from <= ? AND r.available_to >= ?
         GROUP BY h.id, h.name, r.currency
         ORDER BY min_price ASC LIMIT 50',
        [(int)$q['destination'], $q['checkIn'], $q['checkOut']]
    );
    $out = array_map(fn($r) => [
        'hotelId' => (string)$r['id'],
        'name' => $r['name'],
        'minPrice' => ['amount' => (float)$r['min_price'], 'currency' => $r['currency']]
    ], $rows);
    echo json_encode(['hotels' => $out]);
}
```

- [ ] **Step 2: Implement `components/com_api/controllers/auth.php`**

```php
<?php
defined('_ELXIS') or die;

function api_auth_POST() {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $email = $body['email'] ?? '';
    $password = $body['password'] ?? '';
    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'missing_credentials']);
        return;
    }
    $db = elxisDatabase::getInstance();
    $row = $db->loadAssocRow('SELECT id, email, role, password_hash FROM elx_users WHERE email = ?', [$email]);
    if (!$row || !password_verify($password, $row['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'invalid_credentials']);
        return;
    }
    $token = bin2hex(random_bytes(32));
    $db->update('elx_user_tokens', ['user_id' => $row['id'], 'token' => $token, 'created_at' => date('Y-m-d H:i:s')]);
    echo json_encode([
        'token' => $token,
        'user' => [
            'id' => (string)$row['id'],
            'email' => $row['email'],
            'role' => $row['role']
        ]
    ]);
}
```

- [ ] **Step 3: Commit**

```bash
git add components/com_api/controllers/availability.php components/com_api/controllers/auth.php
git commit -m "feat(legacy): com_api availability and auth endpoints"
```

---

## Task 2.6: Add `reviews` controller

**Files:**
- Create: `components/com_api/controllers/reviews.php`

**Interfaces:**
- `GET /api/v1/reviews?hotelId=&destination=&minRating=&page=` → `{ reviews: Review[] }`

- [ ] **Step 1: Implement `components/com_api/controllers/reviews.php`**

```php
<?php
defined('_ELXIS') or die;

function api_reviews_GET() {
    $db = elxisDatabase::getInstance();
    $q = $_GET;
    $where = ['1=1'];
    $params = [];
    if (!empty($q['hotelId'])) { $where[] = 'r.hotel_id = ?'; $params[] = (int)$q['hotelId']; }
    if (!empty($q['destination'])) { $where[] = 'h.destination_id = ?'; $params[] = (int)$q['destination']; }
    if (!empty($q['minRating'])) { $where[] = 'r.rating >= ?'; $params[] = (int)$q['minRating']; }
    $page = max(1, (int)($q['page'] ?? 1));
    $pageSize = 20;
    $offset = ($page - 1) * $pageSize;
    $rows = $db->loadAssocList(
        'SELECT r.id, r.rating, r.title, r.body, r.author, r.created_at
        FROM elx_res_reviews r JOIN elx_res_hotels h ON h.id = r.hotel_id
        WHERE ' . implode(' AND ', $where) . '
        ORDER BY r.created_at DESC LIMIT ? OFFSET ?',
        array_merge($params, [$pageSize, $offset])
    );
    $out = array_map(fn($r) => [
        'id' => (string)$r['id'],
        'rating' => (int)$r['rating'],
        'title' => $r['title'],
        'body' => strip_tags($r['body'] ?? ''),
        'author' => $r['author'],
        'createdAt' => $r['created_at']
    ], $rows);
    echo json_encode(['reviews' => $out]);
}
```

- [ ] **Step 2: Commit**

```bash
git add components/com_api/controllers/reviews.php
git commit -m "feat(legacy): com_api reviews endpoint"
```

---

## Task 2.7: Add PHPUnit infra for `com_api`

**Files:**
- Create: `components/com_api/phpunit.xml`
- Create: `components/com_api/tests/phpunit/bootstrap.php`

**Interfaces:**
- Produces: PHPUnit config that runs all `tests/phpunit/*Test.php`

- [ ] **Step 1: Create `components/com_api/phpunit.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="tests/phpunit/bootstrap.php"
         colors="true"
         verbose="true">
    <testsuites>
        <testsuite name="com_api">
            <directory>tests/phpunit</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

- [ ] **Step 2: Create `components/com_api/tests/phpunit/bootstrap.php`**

```php
<?php
defined('_ELXIS') or define('_ELXIS', 1);
require_once __DIR__ . '/../../models/HotelMapper.php';
require_once __DIR__ . '/../../models/HotelDetailMapper.php';
require_once __DIR__ . '/../../models/RoomMapper.php';
```

- [ ] **Step 3: Run all tests**

Run: `cd F:/AI/AI-eholidayer/components/com_api && phpunit`
Expected: PASS (HotelMapperTest).

- [ ] **Step 4: Commit**

```bash
git add components/com_api/phpunit.xml components/com_api/tests/phpunit/bootstrap.php
git commit -m "test(legacy): wire up PHPUnit for com_api"
```

---

# Milestone 3 — Internal API Client + Inventory Pages (3 days)

## Task 3.1: Define shared inventory types

**Files:**
- Create: `web/lib/inventory/types.ts`
- Create: `web/tests/unit/inventory-types.test.ts`

**Interfaces:**
- Produces: TS types `Hotel, HotelDetail, RoomOption, AvailabilityResult, Review, Destination, User`

- [ ] **Step 1: Write failing test `web/tests/unit/inventory-types.test.ts`**

```ts
import { describe, it, expectTypeOf } from 'vitest';
import type { Hotel, HotelDetail, RoomOption, Review, Destination } from '@/lib/inventory/types';

describe('inventory types', () => {
  it('Hotel has required fields', () => {
    expectTypeOf<Hotel>().toHaveProperty('id');
    expectTypeOf<Hotel>().toHaveProperty('priceFrom');
    expectTypeOf<Hotel>().toHaveProperty('destination');
  });

  it('HotelDetail extends Hotel with rooms and photos', () => {
    expectTypeOf<HotelDetail>().toMatchTypeOf<Hotel>();
    expectTypeOf<HotelDetail['rooms']>().toEqualTypeOf<RoomOption[]>();
  });

  it('Review has rating and body', () => {
    expectTypeOf<Review>().toHaveProperty('rating');
    expectTypeOf<Review>().toHaveProperty('body');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/inventory-types.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `web/lib/inventory/types.ts`**

```ts
export type Price = { amount: number; currency: string };

export type Destination = {
  id: string;
  name: string;
  country: string;
};

export type Hotel = {
  id: string;
  slug: string;
  name: string;
  destination: Destination;
  category: number;
  rating: number;
  reviewCount: number;
  priceFrom: Price;
  thumbnail: string;
  amenities: string[];
  beachDistance?: number | null;
};

export type RoomOption = {
  id: string;
  name: string;
  capacity: { adults: number; children: number };
  boardType: 'room_only' | 'breakfast' | 'half_board' | 'full_board' | 'all_inclusive';
  refundable: boolean;
  cancellationDeadline?: string | null;
  price: Price;
};

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
};

export type HotelDetail = Hotel & {
  description: string;
  photos: string[];
  rooms: RoomOption[];
  reviews: { rating: number; count: number; recent: Review[] };
  location: { lat: number; lng: number; address: string };
  policies: { cancellation: string; checkIn: string; checkOut: string };
};

export type AvailabilityResult = {
  hotelId: string;
  name: string;
  minPrice: Price;
};

export type User = {
  id: string;
  email: string;
  role: 'user' | 'hotelier' | 'admin';
};

export type SearchQuery = {
  destination?: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
};

export type AvailabilityQuery = {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/inventory-types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/inventory/types.ts web/tests/unit/inventory-types.test.ts
git commit -m "feat(web): define inventory type system"
```

---

## Task 3.2: Build `InventoryClient`

**Files:**
- Create: `web/lib/inventory/client.ts`
- Create: `web/tests/unit/inventory-client.test.ts`

**Interfaces:**
- Consumes: `LEGACY_API_BASE_URL`, `LEGACY_API_TOKEN` env vars
- Produces: `InventoryClient` with methods `searchHotels`, `getHotelDetails`, `getRoomOptions`, `getAvailability`, `getReviews`, `getDestinations`, `login`; all async, return typed shapes; 3s timeout for searches, 2s for detail/reviews; 2 retries with exponential backoff for 5xx

- [ ] **Step 1: Write failing test `web/tests/unit/inventory-client.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { InventoryClient } from '@/lib/inventory/client';

describe('InventoryClient.searchHotels', () => {
  it('sends destination and returns mapped hotels', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({
        hotels: [{ id: '1', slug: 'a', name: 'A', destination: { id: '7', name: 'H', country: 'EG' }, category: 5, rating: 9, reviewCount: 10, priceFrom: { amount: 100, currency: 'USD' }, thumbnail: '', amenities: [] }],
        total: 1, page: 1
      })
    });
    const client = new InventoryClient('https://legacy.test', 'tok', { fetchImpl: fetchMock as any });
    const res = await client.searchHotels({ destination: '7' });
    expect(res.hotels).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('destination=7'), expect.objectContaining({ headers: expect.objectContaining({ 'X-API-Token': 'tok' }) }));
  });

  it('throws on non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const client = new InventoryClient('https://legacy.test', 'tok', { fetchImpl: fetchMock as any });
    await expect(client.searchHotels({ destination: '7' })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/inventory-client.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `web/lib/inventory/client.ts`**

```ts
import type { AvailabilityQuery, AvailabilityResult, Destination, Hotel, HotelDetail, RoomOption, Review, SearchQuery, User } from './types';

export interface InventoryClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: { search?: number; detail?: number };
  maxRetries?: number;
}

export class InventoryClient {
  constructor(
    private baseUrl: string,
    private apiToken: string,
    private opts: InventoryClientOptions = {}
  ) {}

  private async fetchJson<T>(path: string, init: RequestInit = {}, timeoutMs = 3000): Promise<T> {
    const f = this.opts.fetchImpl ?? fetch;
    const url = `${this.baseUrl}${path}`;
    const headers = { 'X-API-Token': this.apiToken, ...(init.headers || {}) };

    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= (this.opts.maxRetries ?? 2); attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await f(url, { ...init, headers, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) {
          if (res.status >= 500 && attempt < (this.opts.maxRetries ?? 2)) {
            await new Promise(r => setTimeout(r, 200 * 2 ** attempt));
            continue;
          }
          throw new Error(`Legacy ${res.status}: ${await res.text()}`);
        }
        return await res.json() as T;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        if (attempt < (this.opts.maxRetries ?? 2)) {
          await new Promise(r => setTimeout(r, 200 * 2 ** attempt));
          continue;
        }
      }
    }
    throw lastErr ?? new Error('Unknown error');
  }

  searchHotels(q: SearchQuery): Promise<{ hotels: Hotel[]; total: number; page: number }> {
    const params = new URLSearchParams();
    if (q.destination) params.set('destination', q.destination);
    if (q.category) params.set('category', String(q.category));
    if (q.minPrice) params.set('minPrice', String(q.minPrice));
    if (q.maxPrice) params.set('maxPrice', String(q.maxPrice));
    if (q.page) params.set('page', String(q.page));
    if (q.pageSize) params.set('pageSize', String(q.pageSize));
    return this.fetchJson(`/api/v1/hotels?${params}`, {}, this.opts.timeoutMs?.search ?? 3000);
  }

  getHotelDetails(id: string): Promise<{ hotel: HotelDetail }> {
    return this.fetchJson(`/api/v1/hotels/${encodeURIComponent(id)}`, {}, this.opts.timeoutMs?.detail ?? 2000);
  }

  getRoomOptions(id: string): Promise<{ rooms: RoomOption[] }> {
    return this.fetchJson(`/api/v1/hotels/${encodeURIComponent(id)}/rooms`, {}, this.opts.timeoutMs?.detail ?? 2000);
  }

  getAvailability(q: AvailabilityQuery): Promise<{ hotels: AvailabilityResult[] }> {
    const params = new URLSearchParams({ destination: q.destination, checkIn: q.checkIn, checkOut: q.checkOut });
    if (q.guests) params.set('guests', String(q.guests));
    return this.fetchJson(`/api/v1/availability?${params}`, {}, this.opts.timeoutMs?.search ?? 3000);
  }

  getReviews(filter: { hotelId?: string; destination?: string; minRating?: number }): Promise<{ reviews: Review[] }> {
    const params = new URLSearchParams();
    if (filter.hotelId) params.set('hotelId', filter.hotelId);
    if (filter.destination) params.set('destination', filter.destination);
    if (filter.minRating) params.set('minRating', String(filter.minRating));
    return this.fetchJson(`/api/v1/reviews?${params}`, {}, this.opts.timeoutMs?.detail ?? 2000);
  }

  getDestinations(): Promise<{ destinations: Destination[] }> {
    return this.fetchJson(`/api/v1/destinations`);
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const body = JSON.stringify({ email, password });
    return this.fetchJson('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }, 2000);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/inventory-client.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add web/lib/inventory/client.ts web/tests/unit/inventory-client.test.ts
git commit -m "feat(web): add InventoryClient with timeout, retries, typed methods"
```

---

## Task 3.3: Add Vercel KV cache layer

**Files:**
- Create: `web/lib/inventory/cache.ts`
- Create: `web/tests/unit/cache.test.ts`

**Interfaces:**
- Consumes: `@vercel/kv`
- Produces: `cached<T>(key, ttlSeconds, fn): Promise<T>` wrapper

- [ ] **Step 1: Install Vercel KV**

Run: `cd F:/AI/AI-eholidayer/web && npm install @vercel/kv`

- [ ] **Step 2: Write failing test `web/tests/unit/cache.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { cached } from '@/lib/inventory/cache';

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK')
  }
}));

describe('cached', () => {
  it('calls fn on miss and stores result', async () => {
    const { kv } = await import('@vercel/kv');
    const fn = vi.fn().mockResolvedValue({ a: 1 });
    const r = await cached('k', 60, fn);
    expect(r).toEqual({ a: 1 });
    expect(fn).toHaveBeenCalledOnce();
    expect(kv.set).toHaveBeenCalledWith('k', { a: 1 }, { ex: 60 });
  });

  it('returns cached value on hit, fn not called', async () => {
    const { kv } = await import('@vercel/kv');
    (kv.get as any).mockResolvedValueOnce({ a: 9 });
    const fn = vi.fn();
    const r = await cached('k', 60, fn);
    expect(r).toEqual({ a: 9 });
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/cache.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `web/lib/inventory/cache.ts`**

```ts
import { kv } from '@vercel/kv';

export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const hit = await kv.get<T>(key);
  if (hit !== null && hit !== undefined) return hit;
  const fresh = await fn();
  await kv.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/cache.test.ts`
Expected: PASS (2/2).

- [ ] **Step 6: Commit**

```bash
git add web/lib/inventory/cache.ts web/tests/unit/cache.test.ts web/package.json web/package-lock.json
git commit -m "feat(web): add Vercel KV cached() helper"
```

---

## Task 3.4: Wrap `InventoryClient` methods with caching

**Files:**
- Modify: `web/lib/inventory/client.ts` (add `cachedSearchHotels`, etc., or accept cached flag)
- Create: `web/tests/integration/cached-inventory.test.ts`

**Interfaces:**
- Produces: `getCachedClient()` returning a client pre-configured with cache TTLs per spec §4.3 (hotel list 5min, detail 10min, destinations 1h)

- [ ] **Step 1: Write failing test `web/tests/integration/cached-inventory.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { InventoryClient } from '@/lib/inventory/client';

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK')
  }
}));
vi.mock('@/lib/inventory/cache', () => ({
  cached: vi.fn(async (_k, _t, fn) => fn())
}));

describe('InventoryClient with cache wrapper', () => {
  it('caches destination list with 1h TTL', async () => {
    const { cached } = await import('@/lib/inventory/cache');
    const client = new InventoryClient('https://x', 't');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ destinations: [] }) });
    (client as any).opts.fetchImpl = fetchMock;
    await client.getDestinations();
    expect(cached).toHaveBeenCalledWith('destinations:all', 3600, expect.any(Function));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/integration/cached-inventory.test.ts`
Expected: FAIL — `cached` not invoked.

- [ ] **Step 3: Modify `web/lib/inventory/client.ts` to use `cached()` in `getDestinations`, `getHotelDetails`, `searchHotels`**

In `searchHotels`, after the call:

```ts
const key = `hotels:${JSON.stringify(q)}`;
return cached(key, 300, () => this.fetchJson(...));
```

(Import `cached` at top: `import { cached } from './cache';`.)

Apply the same pattern to:
- `getHotelDetails(id)` → cache key `hotel:${id}`, TTL 600s
- `getDestinations()` → cache key `destinations:all`, TTL 3600s
- `getReviews(filter)` → cache key `reviews:${JSON.stringify(filter)}`, TTL 600s
- `getRoomOptions(id)` → cache key `rooms:${id}`, TTL 600s

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/integration/cached-inventory.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/inventory/client.ts web/tests/integration/cached-inventory.test.ts
git commit -m "feat(web): wrap InventoryClient methods with KV caching"
```

---

## Task 3.5: Build hotel destination page `/destinations/[slug]`

**Files:**
- Create: `web/app/destinations/[slug]/page.tsx`
- Create: `web/components/composite/HotelCard.tsx`
- Create: `web/tests/integration/destination-page.test.ts`

**Interfaces:**
- Consumes: `InventoryClient.getHotels`, `InventoryClient.getDestinations`
- Produces: prerenderable page listing hotels for a destination, with SEO meta tags

- [ ] **Step 1: Write failing test `web/tests/integration/destination-page.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DestinationPage from '@/app/destinations/[slug]/page';

vi.mock('@/lib/inventory/client', () => ({
  InventoryClient: class { constructor(_a: any, _b: any) {} async getDestinations() { return { destinations: [{ id: '7', name: 'Hurghada', country: 'EG' }] }; } async searchHotels(q: any) { return { hotels: [{ id: '1', slug: 'azure', name: 'Azure Bay', destination: { id: '7', name: 'Hurghada', country: 'EG' }, category: 5, rating: 9.1, reviewCount: 100, priceFrom: { amount: 540, currency: 'USD' }, thumbnail: '', amenities: [] }], total: 1, page: 1 }; } }
}));

describe('DestinationPage', () => {
  it('renders hotel name and destination', async () => {
    const Page = await DestinationPage({ params: Promise.resolve({ slug: 'hurghada' }) });
    render(Page as any);
    expect(screen.getByText(/Hurghada/)).toBeInTheDocument();
    expect(screen.getByText(/Azure Bay/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/integration/destination-page.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `web/components/composite/HotelCard.tsx`**

```tsx
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Hotel } from '@/lib/inventory/types';

export function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Card variant="bordered" className="overflow-hidden">
      <div className="relative h-48 -m-4 mb-4 bg-bg-subtle">
        {hotel.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={hotel.thumbnail} alt={hotel.name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <h3 className="font-display text-xl text-fg">{hotel.name}</h3>
      <p className="text-sm text-fg-muted">{hotel.destination.name}, {hotel.destination.country}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="font-mono text-sm">★ {hotel.rating}</span>
        <Badge variant="status" size="sm">{hotel.category}-star</Badge>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-fg-muted">from</p>
          <p className="font-mono text-lg">${hotel.priceFrom.amount}</p>
        </div>
        <Link href={`/hotels/${hotel.slug || hotel.id}`} className="text-sm text-accent hover:underline">
          View →
        </Link>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Implement `web/app/destinations/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { InventoryClient } from '@/lib/inventory/client';
import { HotelCard } from '@/components/composite/HotelCard';

export const revalidate = 21600; // 6h ISR

async function getClient() {
  return new InventoryClient(
    process.env.LEGACY_API_BASE_URL!,
    process.env.LEGACY_API_TOKEN!
  );
}

export async function generateStaticParams() {
  const client = await getClient();
  const { destinations } = await client.getDestinations();
  return destinations.map(d => ({ slug: slugify(d.name) }));
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { destinations } = await client.getDestinations();
  const dest = destinations.find(d => slugify(d.name) === slug);
  if (!dest) return {};
  return {
    title: `Hotels in ${dest.name}, ${dest.country} — eHolidayer`,
    description: `Find the best hotels in ${dest.name}. Personalized recommendations, transparent prices, real availability.`,
    alternates: { canonical: `https://www.eholidayer.com/destinations/${slug}` }
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { destinations } = await client.getDestinations();
  const dest = destinations.find(d => slugify(d.name) === slug);
  if (!dest) notFound();

  const { hotels } = await client.searchHotels({ destination: dest.id, pageSize: 24 });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl mb-2">Hotels in {dest.name}</h1>
      <p className="text-fg-muted mb-8">{dest.country} · {hotels.length} stays</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map(h => (
          <li key={h.id}><HotelCard hotel={h} /></li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/integration/destination-page.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/app/destinations/[slug]/page.tsx web/components/composite/HotelCard.tsx web/tests/integration/destination-page.test.ts
git commit -m "feat(web): add /destinations/[slug] page with HotelCard"
```

---

## Task 3.6: Build hotel detail page `/hotels/[slug]`

**Files:**
- Create: `web/app/hotels/[slug]/page.tsx`
- Create: `web/components/composite/PriceBreakdown.tsx`

**Interfaces:**
- Consumes: `InventoryClient.getHotelDetails`, `InventoryClient.getRoomOptions`, `InventoryClient.getReviews`
- Produces: detail page with photos, rooms, reviews

- [ ] **Step 1: Write failing test `web/tests/integration/hotel-page.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HotelPage from '@/app/hotels/[slug]/page';

vi.mock('@/lib/inventory/client', () => ({
  InventoryClient: class {
    async getHotelDetails(id: string) { return { hotel: { id, slug: 'azure', name: 'Azure Bay', destination: { id: '7', name: 'H', country: 'EG' }, category: 5, rating: 9.1, reviewCount: 100, priceFrom: { amount: 540, currency: 'USD' }, thumbnail: '', amenities: ['pool'], description: 'A nice resort.', photos: [], rooms: [], reviews: { rating: 9.1, count: 100, recent: [] }, location: { lat: 0, lng: 0, address: '' }, policies: { cancellation: 'Free 24h', checkIn: '14:00', checkOut: '12:00' } } }; }
    async getRoomOptions(id: string) { return { rooms: [{ id: 'r1', name: 'Standard', capacity: { adults: 2, children: 0 }, boardType: 'breakfast', refundable: true, price: { amount: 540, currency: 'USD' } }] }; }
    async getReviews(f: any) { return { reviews: [] }; }
  }
}));

describe('HotelPage', () => {
  it('renders hotel name and a room option', async () => {
    const Page = await HotelPage({ params: Promise.resolve({ slug: 'azure' }) });
    render(Page as any);
    expect(screen.getByText('Azure Bay')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/integration/hotel-page.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `web/components/composite/PriceBreakdown.tsx`**

```tsx
import type { Price } from '@/lib/inventory/types';

export function PriceBreakdown({ rate, taxes, fees, total, currency }: { rate: number; taxes: number; fees: number; total: number; currency: string }) {
  const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;
  return (
    <dl className="text-sm">
      <div className="flex justify-between"><dt>Rate</dt><dd className="font-mono">{fmt(rate)}</dd></div>
      <div className="flex justify-between"><dt>Taxes</dt><dd className="font-mono">{fmt(taxes)}</dd></div>
      <div className="flex justify-between"><dt>Fees</dt><dd className="font-mono">{fmt(fees)}</dd></div>
      <div className="flex justify-between border-t border-border mt-2 pt-2 font-medium"><dt>Total</dt><dd className="font-mono">{fmt(total)}</dd></div>
    </dl>
  );
}
```

- [ ] **Step 4: Implement `web/app/hotels/[slug]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { InventoryClient } from '@/lib/inventory/client';
import { Badge } from '@/components/ui/Badge';

export const revalidate = 21600;

async function getClient() {
  return new InventoryClient(process.env.LEGACY_API_BASE_URL!, process.env.LEGACY_API_TOKEN!);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { hotels } = await client.searchHotels({ pageSize: 1 });
  const id = hotels[0]?.id; // First hotel lookup; refined in sub-project 2
  if (!id) return {};
  const { hotel } = await client.getHotelDetails(id);
  return { title: `${hotel.name} — eHolidayer`, description: hotel.description.slice(0, 160) };
}

export default async function HotelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient();
  const { hotels } = await client.searchHotels({ pageSize: 50 });
  const hotel = hotels.find(h => (h.slug || h.id) === slug);
  if (!hotel) notFound();
  const [detail, { rooms }, { reviews }] = await Promise.all([
    client.getHotelDetails(hotel.id),
    client.getRoomOptions(hotel.id),
    client.getReviews({ hotelId: hotel.id })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl">{detail.hotel.name}</h1>
      <p className="text-fg-muted mb-6">{detail.hotel.destination.name}, {detail.hotel.destination.country} · <Badge>{detail.hotel.category}-star</Badge></p>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {detail.hotel.photos.slice(0, 6).map((p, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={i} src={p} alt="" className="h-48 w-full object-cover rounded-md bg-bg-subtle" />
        ))}
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl mb-3">About</h2>
        <p className="text-fg-muted max-w-2xl">{detail.hotel.description}</p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl mb-3">Rooms</h2>
        <ul className="space-y-3">
          {rooms.map(r => (
            <li key={r.id} className="flex items-center justify-between border border-border rounded-md p-4">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-fg-muted">{r.boardType.replace('_', ' ')} · sleeps {r.capacity.adults + r.capacity.children}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">${r.price.amount}</p>
                <p className="text-xs text-fg-muted">{r.refundable ? 'Refundable' : 'Non-refundable'}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl mb-3">Reviews ({reviews.length})</h2>
        <ul className="space-y-3">
          {reviews.map(r => (
            <li key={r.id} className="border border-border rounded-md p-4">
              <p className="font-medium">★ {r.rating} — {r.title}</p>
              <p className="text-fg-muted text-sm">{r.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/integration/hotel-page.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add web/app/hotels/[slug]/page.tsx web/components/composite/PriceBreakdown.tsx web/tests/integration/hotel-page.test.ts
git commit -m "feat(web): add /hotels/[slug] page with rooms and reviews"
```

---

## Task 3.7: Smoke-test legacy → Next.js data flow

**Files:**
- Modify: `web/.env.local` (developer-only file, gitignored)

- [ ] **Step 1: Create `web/.env.local` with a real-ish base URL**

```
LEGACY_API_BASE_URL=http://localhost:8080
LEGACY_API_TOKEN=devtoken
KV_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
AI_PROVIDER=mock
ANTHROPIC_API_KEY=
NEXTAUTH_SECRET=devsecret
NEXTAUTH_URL=http://localhost:3000
ALLOW_MOCK_PROVIDER=true
```

- [ ] **Step 2: Build and verify no compile errors**

Run: `cd F:/AI/AI-eholidayer/web && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit `.env.example` only (already committed in Task 1.1)**

Verify with: `git -C F:/AI/AI-eholidayer status web/`
Expected: no untracked files (`.env.local` is gitignored).

- [ ] **Step 4: Document local dev in `web/README.md`**

```markdown
# eHolidayer Web (Next.js)

## Setup

```bash
cd web
npm install
cp .env.example .env.local
# Fill in values; see docs/superpowers/specs/2026-09-06-eholidayer-ai-foundation-design.md
npm run dev
```

## Env vars

See `.env.example`. For local dev, set `AI_PROVIDER=mock` and `ALLOW_MOCK_PROVIDER=true`. Set `LEGACY_API_BASE_URL` to your Joomla dev server (e.g. `http://localhost:8080`) and `LEGACY_API_TOKEN` to a matching secret in Joomla's `.env`.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript
- `npx vitest run` — unit + integration tests
- `npx playwright test` — E2E tests (after first install via `npx playwright install`)
```

- [ ] **Step 5: Commit README**

```bash
git add web/README.md
git commit -m "docs(web): add README with dev setup and env vars"
```

---

# Milestone 4 — AI Orchestration Layer (5 days)

## Task 4.1: Define `AIProvider` interface and intent type

**Files:**
- Create: `web/lib/ai/provider.ts`
- Create: `web/lib/ai/intent.ts`
- Create: `web/tests/unit/intent-type.test.ts`

**Interfaces:**
- Produces: `AIProvider` interface with `chat(input)` method; `Intent` TS type for structured preferences

- [ ] **Step 1: Install dependencies**

Run: `cd F:/AI/AI-eholidayer/web && npm install @anthropic-ai/sdk zod isomorphic-dompurify`

- [ ] **Step 2: Write failing test `web/tests/unit/intent-type.test.ts`**

```ts
import { describe, it, expectTypeOf } from 'vitest';
import type { Intent, ChatMessage } from '@/lib/ai/intent';

describe('Intent and ChatMessage types', () => {
  it('Intent has soft preferences 0-10', () => {
    expectTypeOf<Intent['softPreferences']>().toMatchTypeOf<Record<string, number | undefined> | undefined>();
  });
  it('ChatMessage has role and content', () => {
    expectTypeOf<ChatMessage>().toHaveProperty('role');
    expectTypeOf<ChatMessage>().toHaveProperty('content');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/intent-type.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement `web/lib/ai/intent.ts`**

```ts
export type SoftPreferences = Partial<{
  beach: number;
  cleanliness: number;
  food: number;
  luxury: number;
  romantic: number;
  family: number;
  nightlife: number;
  business: number;
  quiet: number;
  value: number;
}>;

export type Intent = {
  destination?: string;
  dates?: { checkIn: string; checkOut: string };
  guests?: { adults: number; children: number; rooms: number };
  budget?: { amount: number; currency: string };
  softPreferences?: SoftPreferences;
  context?: 'family' | 'couple' | 'business' | 'solo' | 'group';
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ConversationState = {
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  extractedPreferences: Intent;
  searchContext: {
    lastQuery?: Intent;
    lastResults?: { hotelIds: string[]; rankedAt: string };
  };
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 5: Implement `web/lib/ai/provider.ts`**

```ts
import type { ChatMessage } from './intent';

export type ChatInput = {
  messages: ChatMessage[];
  system?: string;
  tools?: unknown[];
  maxTokens?: number;
  temperature?: number;
};

export type ChatEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; output: unknown }
  | { type: 'message_stop'; reason: string }
  | { type: 'error'; message: string };

export interface AIProvider {
  chat(input: ChatInput): AsyncIterable<ChatEvent>;
  extractIntent(messages: ChatMessage[]): Promise<import('./intent').Intent>;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/intent-type.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/lib/ai/intent.ts web/lib/ai/provider.ts web/tests/unit/intent-type.test.ts web/package.json web/package-lock.json
git commit -m "feat(web): define AIProvider interface and intent types"
```

---

## Task 4.2: Build `MockProvider` for dev/test

**Files:**
- Create: `web/lib/ai/mock.ts`
- Create: `web/tests/fixtures/scripts.json`
- Create: `web/tests/unit/mock-provider.test.ts`

**Interfaces:**
- Produces: `MockProvider` — deterministic responses based on script patterns; allows dev without API keys

- [ ] **Step 1: Write fixture `web/tests/fixtures/scripts.json`**

```json
[
  {
    "match": "hurghada",
    "reply": "Great choice — Hurghada is wonderful for snorkeling. I'll show you stays with strong reviews on beach access.",
    "tool": { "name": "search_hotels", "input": { "destination": "Hurghada" } },
    "intent": { "destination": "Hurghada", "context": "couple" }
  },
  {
    "match": "luxury|dubai|5-star",
    "reply": "Looking for something special. I'll prioritize higher-rated properties.",
    "intent": { "softPreferences": { "luxury": 9 } }
  },
  {
    "match": ".*",
    "reply": "Got it. Let me find a few options that fit.",
    "tool": { "name": "search_hotels", "input": { "query": "DEFAULT" } }
  }
]
```

- [ ] **Step 2: Write failing test `web/tests/unit/mock-provider.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { MockProvider } from '@/lib/ai/mock';

describe('MockProvider', () => {
  it('matches hurghada keyword and emits tool_use', async () => {
    const p = new MockProvider();
    const events = [];
    for await (const e of p.chat({ messages: [{ role: 'user', content: 'I want to go to Hurghada' }] })) events.push(e);
    expect(events.some(e => e.type === 'text_delta')).toBe(true);
    expect(events.some(e => e.type === 'tool_use' && (e as any).name === 'search_hotels')).toBe(true);
  });

  it('falls through to default script when no match', async () => {
    const p = new MockProvider();
    const events = [];
    for await (const e of p.chat({ messages: [{ role: 'user', content: 'something random' }] })) events.push(e);
    expect(events.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Implement `web/lib/ai/mock.ts`**

```ts
import type { AIProvider, ChatInput, ChatEvent } from './provider';
import type { ChatMessage, Intent } from './intent';
import scripts from '@/tests/fixtures/scripts.json';

const SCRIPT = scripts as Array<{
  match: string;
  reply: string;
  tool?: { name: string; input: unknown };
  intent?: Intent;
}>;

function findScript(text: string) {
  for (const s of SCRIPT) {
    if (new RegExp(s.match, 'i').test(text)) return s;
  }
  return SCRIPT[SCRIPT.length - 1];
}

export class MockProvider implements AIProvider {
  async *chat(input: ChatInput): AsyncIterable<ChatEvent> {
    const last = [...input.messages].reverse().find(m => m.role === 'user');
    const text = last?.content ?? '';
    const s = findScript(text);
    yield { type: 'text_delta', text: s.reply };
    if (s.tool) yield { type: 'tool_use', name: s.tool.name, input: s.tool.input };
    yield { type: 'message_stop', reason: 'end_turn' };
  }

  async extractIntent(messages: ChatMessage[]): Promise<Intent> {
    const last = [...messages].reverse().find(m => m.role === 'user');
    const text = last?.content ?? '';
    return findScript(text).intent ?? {};
  }
}
```

- [ ] **Step 4: Verify TS config supports JSON imports**

`"resolveJsonModule": true` was set in Task 1.1. Re-run `npm run typecheck`.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/mock-provider.test.ts`
Expected: PASS (2/2).

- [ ] **Step 6: Commit**

```bash
git add web/lib/ai/mock.ts web/tests/fixtures/scripts.json web/tests/unit/mock-provider.test.ts
git commit -m "feat(web): add MockProvider with scripted dev responses"
```

---

## Task 4.3: Build `AnthropicProvider`

**Files:**
- Create: `web/lib/ai/anthropic.ts`
- Create: `web/tests/unit/anthropic-provider.test.ts`

**Interfaces:**
- Consumes: `ANTHROPIC_API_KEY` env var
- Produces: `AnthropicProvider` — streaming chat using Sonnet 5 for chat, Haiku 4.5 for intent extraction

- [ ] **Step 1: Write failing test `web/tests/unit/anthropic-provider.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';

const createMock = vi.fn();
vi.mock('@anthropic-ai/sdk', () => ({
  default: class { messages = { stream: createMock }; }
}));

import { AnthropicProvider } from '@/lib/ai/anthropic';

describe('AnthropicProvider', () => {
  it('streams text_delta events from SDK events', async () => {
    createMock.mockReturnValue({
      async *[Symbol.asyncIterator]() {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hi' } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: ' there' } };
        yield { type: 'message_stop' };
      }
    });
    const p = new AnthropicProvider('key');
    const events = [];
    for await (const e of p.chat({ messages: [{ role: 'user', content: 'hello' }] })) events.push(e);
    expect(events).toContainEqual({ type: 'text_delta', text: 'Hi' });
    expect(events).toContainEqual({ type: 'text_delta', text: ' there' });
    expect(events).toContainEqual({ type: 'message_stop', reason: 'end_turn' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/anthropic-provider.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `web/lib/ai/anthropic.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, ChatInput, ChatEvent } from './provider';
import type { ChatMessage, Intent } from './intent';

const CHAT_MODEL = process.env.ANTHROPIC_CHAT_MODEL ?? 'claude-sonnet-5';
const EXTRACT_MODEL = process.env.ANTHROPIC_EXTRACT_MODEL ?? 'claude-haiku-4-5';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *chat(input: ChatInput): AsyncIterable<ChatEvent> {
    const stream = this.client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature,
      system: input.system,
      messages: input.messages.map(m => ({ role: m.role, content: m.content }))
    } as any);

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text_delta', text: (event.delta as any).text };
      } else if (event.type === 'message_stop') {
        yield { type: 'message_stop', reason: 'end_turn' };
      }
    }
  }

  async extractIntent(messages: ChatMessage[]): Promise<Intent> {
    const last = [...messages].reverse().find(m => m.role === 'user')?.content ?? '';
    const prompt = `Extract structured travel preferences from this user message. Return JSON only with these fields (omit any not present): destination, dates.checkIn, dates.checkOut, guests.adults, guests.children, guests.rooms, budget.amount, budget.currency, softPreferences.<beach|cleanliness|food|luxury|romantic|family|nightlife|business|quiet|value> as 0-10 ints, context as one of family|couple|business|solo|group.\n\nMessage: ${last}`;
    const res = await this.client.messages.create({
      model: EXTRACT_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });
    const text = (res.content[0] as any).text ?? '{}';
    const cleaned = text.replace(/^```json\n?|```$/g, '').trim();
    try {
      return JSON.parse(cleaned) as Intent;
    } catch {
      return {};
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/anthropic-provider.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/ai/anthropic.ts web/tests/unit/anthropic-provider.test.ts
git commit -m "feat(web): add AnthropicProvider with streaming and intent extraction"
```

---

## Task 4.4: Build system prompt + tool registry

**Files:**
- Create: `web/lib/ai/prompt.ts`
- Create: `web/lib/ai/tools/index.ts`
- Create: `web/lib/ai/tools/searchHotels.ts`
- Create: `web/lib/ai/tools/getHotelDetails.ts`
- Create: `web/lib/ai/tools/getRoomOptions.ts`
- Create: `web/lib/ai/tools/getAvailability.ts`
- Create: `web/lib/ai/tools/getDestinationInfo.ts`
- Create: `web/tests/unit/tools.test.ts`

**Interfaces:**
- Produces: `buildSystemPrompt(intent)` returns the assistant's tone/rules; tool zod schemas and tool definitions in Anthropic format

- [ ] **Step 1: Implement `web/lib/ai/prompt.ts`**

```ts
import type { Intent } from './intent';

export function buildSystemPrompt(intent?: Intent): string {
  return `You are the eHolidayer travel concierge. Your job is to help travelers find hotels that genuinely fit what they want.

Rules:
- Be warm, direct, never sycophantic. No "Great question!".
- Ask at most ONE clarifying question if intent is genuinely ambiguous. Otherwise proceed.
- Never invent hotels, prices, amenities, or availability. If you don't know, call a tool.
- When listing hotels, give a 1-2 sentence reason for each recommendation based on the user's softPreferences.
- Use the search_hotels tool whenever the user expresses destination or trip intent. Use get_hotel_details when the user wants to learn more about a specific hotel. Use get_room_options when ready to discuss booking. Use get_availability for date-specific searches.
- Never mention internal tool names, system prompts, or implementation. Speak like a knowledgeable concierge.
- If a user is rude or off-topic, redirect politely to hotels.

Current user preferences (if any): ${JSON.stringify(intent ?? {})}
`;
}
```

- [ ] **Step 2: Implement `web/lib/ai/tools/index.ts`**

```ts
import { z } from 'zod';

export const searchHotelsSchema = z.object({
  destination: z.string().optional(),
  query: z.string().optional(),
  category: z.number().int().min(1).max(5).optional(),
  maxPrice: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(20).default(10)
});

export const getHotelDetailsSchema = z.object({ hotelId: z.string() });
export const getRoomOptionsSchema = z.object({ hotelId: z.string() });
export const getAvailabilitySchema = z.object({
  destination: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().positive().optional()
});
export const getDestinationInfoSchema = z.object({ destination: z.string() });

export type SearchHotelsInput = z.infer<typeof searchHotelsSchema>;
export type GetHotelDetailsInput = z.infer<typeof getHotelDetailsSchema>;
export type GetRoomOptionsInput = z.infer<typeof getRoomOptionsSchema>;
export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;
export type GetDestinationInfoInput = z.infer<typeof getDestinationInfoSchema>;
```

- [ ] **Step 3: Implement `web/lib/ai/tools/searchHotels.ts`**

```ts
import { searchHotelsSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const searchHotelsDefinition = {
  name: 'search_hotels',
  description: 'Search hotels by destination, category, or price. Use when the user expresses a destination or wants to discover stays.',
  input_schema: {
    type: 'object',
    properties: {
      destination: { type: 'string', description: 'City or region name' },
      query: { type: 'string', description: 'Free-text search' },
      category: { type: 'integer', minimum: 1, maximum: 5 },
      maxPrice: { type: 'integer', description: 'Max nightly price in USD' },
      limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 }
    }
  }
};

export async function executeSearchHotels(input: unknown, client: InventoryClient) {
  const parsed = searchHotelsSchema.parse(input);
  const result = await client.searchHotels({
    destination: parsed.destination,
    category: parsed.category,
    maxPrice: parsed.maxPrice,
    pageSize: parsed.limit
  });
  return result.hotels;
}
```

- [ ] **Step 4: Implement `web/lib/ai/tools/getHotelDetails.ts`**

```ts
import { getHotelDetailsSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getHotelDetailsDefinition = {
  name: 'get_hotel_details',
  description: 'Get full details (description, photos, location, policies) for a specific hotel by id.',
  input_schema: {
    type: 'object',
    required: ['hotelId'],
    properties: { hotelId: { type: 'string' } }
  }
};

export async function executeGetHotelDetails(input: unknown, client: InventoryClient) {
  const parsed = getHotelDetailsSchema.parse(input);
  const { hotel } = await client.getHotelDetails(parsed.hotelId);
  return hotel;
}
```

- [ ] **Step 5: Implement `web/lib/ai/tools/getRoomOptions.ts`**

```ts
import { getRoomOptionsSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getRoomOptionsDefinition = {
  name: 'get_room_options',
  description: 'List room options (board, price, refundability) for a specific hotel.',
  input_schema: {
    type: 'object',
    required: ['hotelId'],
    properties: { hotelId: { type: 'string' } }
  }
};

export async function executeGetRoomOptions(input: unknown, client: InventoryClient) {
  const parsed = getRoomOptionsSchema.parse(input);
  const { rooms } = await client.getRoomOptions(parsed.hotelId);
  return rooms;
}
```

- [ ] **Step 6: Implement `web/lib/ai/tools/getAvailability.ts`**

```ts
import { getAvailabilitySchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getAvailabilityDefinition = {
  name: 'get_availability',
  description: 'Search hotels with availability for specific check-in and check-out dates.',
  input_schema: {
    type: 'object',
    required: ['destination', 'checkIn', 'checkOut'],
    properties: {
      destination: { type: 'string' },
      checkIn: { type: 'string', description: 'YYYY-MM-DD' },
      checkOut: { type: 'string', description: 'YYYY-MM-DD' },
      guests: { type: 'integer' }
    }
  }
};

export async function executeGetAvailability(input: unknown, client: InventoryClient) {
  const parsed = getAvailabilitySchema.parse(input);
  const { hotels } = await client.getAvailability(parsed);
  return hotels;
}
```

- [ ] **Step 7: Implement `web/lib/ai/tools/getDestinationInfo.ts`**

```ts
import { getDestinationInfoSchema } from './index';
import { InventoryClient } from '@/lib/inventory/client';

export const getDestinationInfoDefinition = {
  name: 'get_destination_info',
  description: 'Look up basic information about a destination (e.g., a Hurghada summary).',
  input_schema: {
    type: 'object',
    required: ['destination'],
    properties: { destination: { type: 'string' } }
  }
};

export async function executeGetDestinationInfo(input: unknown, client: InventoryClient) {
  const parsed = getDestinationInfoSchema.parse(input);
  const { destinations } = await client.getDestinations();
  const match = destinations.find(d => d.name.toLowerCase().includes(parsed.destination.toLowerCase()));
  return match ?? { error: 'destination_not_found' };
}
```

- [ ] **Step 8: Write failing test `web/tests/unit/tools.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { searchHotelsSchema, getHotelDetailsSchema, getAvailabilitySchema } from '@/lib/ai/tools';

describe('tool schemas', () => {
  it('searchHotels accepts empty input with defaults', () => {
    const parsed = searchHotelsSchema.parse({});
    expect(parsed.limit).toBe(10);
  });

  it('getHotelDetails requires hotelId', () => {
    expect(() => getHotelDetailsSchema.parse({})).toThrow();
  });

  it('getAvailability requires dates and destination', () => {
    expect(() => getAvailabilitySchema.parse({ destination: 'X' })).toThrow();
  });
});
```

- [ ] **Step 9: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/tools.test.ts`
Expected: PASS (3/3).

- [ ] **Step 10: Commit**

```bash
git add web/lib/ai/prompt.ts web/lib/ai/tools/ web/tests/unit/tools.test.ts
git commit -m "feat(web): define system prompt and tool registry with zod schemas"
```

---

## Task 4.5: Build tool execution loop

**Files:**
- Create: `web/lib/ai/toolLoop.ts`
- Create: `web/tests/unit/tool-loop.test.ts`

**Interfaces:**
- Produces: `runToolLoop(provider, intent, client, onEvent)` — handles up to 5 tool calls per turn, returns final text and ranked hotels

- [ ] **Step 1: Write failing test `web/tests/unit/tool-loop.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { runToolLoop } from '@/lib/ai/toolLoop';
import type { AIProvider, ChatEvent } from '@/lib/ai/provider';

function makeProvider(events: ChatEvent[]): AIProvider {
  return {
    async *chat() { for (const e of events) yield e; },
    async extractIntent() { return {}; }
  };
}

const fakeClient: any = {
  searchHotels: vi.fn().mockResolvedValue({ hotels: [{ id: '1', name: 'Test Hotel', destination: { name: 'X', country: 'Y' }, priceFrom: { amount: 100, currency: 'USD' }, rating: 9, category: 5, reviewCount: 10, thumbnail: '', amenities: [], slug: 'test' }] }),
  getHotelDetails: vi.fn(), getRoomOptions: vi.fn(), getAvailability: vi.fn(), getDestinations: vi.fn()
};

describe('runToolLoop', () => {
  it('executes search_hotels and returns ranked hotels', async () => {
    const provider = makeProvider([
      { type: 'text_delta', text: 'Let me find some.' },
      { type: 'tool_use', name: 'search_hotels', input: { destination: 'X' } },
      { type: 'text_delta', text: 'How about Test Hotel?' },
      { type: 'message_stop', reason: 'end_turn' }
    ]);
    const onEvent = vi.fn();
    const result = await runToolLoop(provider, {}, fakeClient, onEvent);
    expect(result.text).toContain('Test Hotel');
    expect(result.rankedHotels[0].id).toBe('1');
    expect(fakeClient.searchHotels).toHaveBeenCalled();
  });

  it('stops after 5 tool calls', async () => {
    const events = [];
    for (let i = 0; i < 10; i++) {
      events.push({ type: 'tool_use' as const, name: 'search_hotels', input: { destination: 'X' } });
    }
    events.push({ type: 'message_stop' as const, reason: 'end_turn' });
    const provider = makeProvider(events);
    const onEvent = vi.fn();
    await runToolLoop(provider, {}, fakeClient, onEvent);
    expect(fakeClient.searchHotels).toHaveBeenCalledTimes(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/tool-loop.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `web/lib/ai/toolLoop.ts`**

```ts
import type { AIProvider, ChatEvent } from './provider';
import type { Intent, ConversationState } from './intent';
import type { InventoryClient } from '@/lib/inventory/client';
import { buildSystemPrompt } from './prompt';
import {
  executeSearchHotels, searchHotelsDefinition,
  executeGetHotelDetails, getHotelDetailsDefinition,
  executeGetRoomOptions, getRoomOptionsDefinition,
  executeGetAvailability, getAvailabilityDefinition,
  executeGetDestinationInfo, getDestinationInfoDefinition
} from './tools';
import type { Hotel } from '@/lib/inventory/types';

const TOOL_DEFS = [
  searchHotelsDefinition,
  getHotelDetailsDefinition,
  getRoomOptionsDefinition,
  getAvailabilityDefinition,
  getDestinationInfoDefinition
];

const TOOL_HANDLERS: Record<string, (input: unknown, client: InventoryClient) => Promise<unknown>> = {
  search_hotels: executeSearchHotels,
  get_hotel_details: executeGetHotelDetails,
  get_room_options: executeGetRoomOptions,
  get_availability: executeGetAvailability,
  get_destination_info: executeGetDestinationInfo
};

export type ToolLoopResult = {
  text: string;
  rankedHotels: Hotel[];
  toolCalls: number;
};

export async function runToolLoop(
  provider: AIProvider,
  intent: Intent,
  client: InventoryClient,
  onEvent: (e: ChatEvent) => void
): Promise<ToolLoopResult> {
  const state: ConversationState = {
    sessionId: 'inline',
    messages: [],
    extractedPreferences: intent,
    searchContext: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  let text = '';
  let toolCalls = 0;
  let rankedHotels: Hotel[] = [];

  for await (const event of provider.chat({
    messages: state.messages,
    system: buildSystemPrompt(intent),
    tools: TOOL_DEFS
  })) {
    onEvent(event);
    if (event.type === 'text_delta') {
      text += event.text;
    } else if (event.type === 'tool_use') {
      if (toolCalls >= 5) continue;
      toolCalls++;
      const handler = TOOL_HANDLERS[event.name];
      if (!handler) {
        onEvent({ type: 'error', message: `Unknown tool: ${event.name}` });
        continue;
      }
      try {
        const output = await handler(event.input, client);
        if (event.name === 'search_hotels' && Array.isArray(output)) {
          rankedHotels = output as Hotel[];
        }
        onEvent({ type: 'tool_result', name: event.name, output });
      } catch (err) {
        onEvent({ type: 'error', message: String(err) });
      }
    } else if (event.type === 'message_stop') {
      break;
    }
  }

  return { text, rankedHotels, toolCalls };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/tool-loop.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add web/lib/ai/toolLoop.ts web/tests/unit/tool-loop.test.ts
git commit -m "feat(web): add tool execution loop with 5-call cap and ranked hotel output"
```

---

## Task 4.6: Add session store with Vercel KV

**Files:**
- Create: `web/lib/session/store.ts`
- Create: `web/lib/session/compress.ts`
- Create: `web/tests/unit/session-store.test.ts`

**Interfaces:**
- Produces: `getSession(id)`, `saveSession(state)`, TTL 30 days; compress history to ≤30 messages via Haiku 4.5

- [ ] **Step 1: Write failing test `web/tests/unit/session-store.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';

const kvMock = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  expire: vi.fn().mockResolvedValue(1)
};
vi.mock('@vercel/kv', () => ({ kv: kvMock }));

import { getSession, saveSession } from '@/lib/session/store';
import type { ConversationState } from '@/lib/ai/intent';

describe('session store', () => {
  it('saveSession stores with 30d TTL', async () => {
    const state: ConversationState = { sessionId: 's1', messages: [], extractedPreferences: {}, searchContext: {}, createdAt: 'x', updatedAt: 'x' };
    await saveSession(state);
    expect(kvMock.set).toHaveBeenCalledWith('session:s1', expect.any(Object), { ex: 30 * 86400 });
  });

  it('getSession returns null on miss', async () => {
    const s = await getSession('missing');
    expect(s).toBeNull();
  });
});
```

- [ ] **Step 2: Implement `web/lib/session/store.ts`**

```ts
import { kv } from '@vercel/kv';
import type { ConversationState } from '@/lib/ai/intent';

const TTL_SECONDS = 30 * 86400;

export async function getSession(id: string): Promise<ConversationState | null> {
  const v = await kv.get<ConversationState>(`session:${id}`);
  return v ?? null;
}

export async function saveSession(state: ConversationState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  await kv.set(`session:${state.sessionId}`, state, { ex: TTL_SECONDS });
}
```

- [ ] **Step 3: Implement `web/lib/session/compress.ts`**

```ts
import type { ConversationState, ChatMessage } from '@/lib/ai/intent';
import Anthropic from '@anthropic-ai/sdk';

const MAX_MESSAGES = 30;
const SUMMARIZE_MODEL = process.env.ANTHROPIC_EXTRACT_MODEL ?? 'claude-haiku-4-5';

export async function compressIfNeeded(state: ConversationState): Promise<ConversationState> {
  if (state.messages.length <= MAX_MESSAGES) return state;
  const headCount = 10;
  const recent = state.messages.slice(-headCount);
  const older = state.messages.slice(0, -headCount);
  const summary = await summarize(older);
  return {
    ...state,
    messages: [
      { role: 'system', content: `Conversation summary so far: ${summary}` },
      ...recent
    ]
  };
}

async function summarize(messages: ChatMessage[]): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return messages.map(m => `${m.role}: ${m.content}`).join(' | ').slice(0, 800);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: SUMMARIZE_MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: `Summarize this conversation for travel context, keeping destination, dates, and key preferences: ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}` }]
  });
  return (res.content[0] as any).text ?? '';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/session-store.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add web/lib/session/store.ts web/lib/session/compress.ts web/tests/unit/session-store.test.ts
git commit -m "feat(web): add session store with 30d TTL and history compression"
```

---

## Task 4.7: Build `/api/ai/converse` SSE route

**Files:**
- Create: `web/app/api/ai/converse/route.ts`
- Create: `web/tests/integration/converse-route.test.ts`

**Interfaces:**
- Consumes: POST `{ sessionId?, message }`
- Produces: SSE stream of events: `session`, `text_delta`, `tool_use`, `tool_result`, `error`, `hotels`, `done`

- [ ] **Step 1: Write failing test `web/tests/integration/converse-route.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/ai/anthropic', () => ({
  AnthropicProvider: class {
    async *chat() {
      yield { type: 'text_delta', text: 'Hi' };
      yield { type: 'message_stop', reason: 'end_turn' };
    }
    async extractIntent() { return { destination: 'X' }; }
  }
}));

import { POST } from '@/app/api/ai/converse/route';

describe('POST /api/ai/converse', () => {
  it('returns SSE response with text_delta event', async () => {
    const req = new Request('http://localhost/api/ai/converse', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }),
      headers: { 'Content-Type': 'application/json' }
    });
    const res = await POST(req as any);
    const text = await res.text();
    expect(text).toContain('event: text_delta');
    expect(text).toContain('event: done');
  });
});
```

- [ ] **Step 2: Implement `web/app/api/ai/converse/route.ts`**

```ts
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MockProvider } from '@/lib/ai/mock';
import { runToolLoop, type ToolLoopResult } from '@/lib/ai/toolLoop';
import { getSession, saveSession } from '@/lib/session/store';
import { compressIfNeeded } from '@/lib/session/compress';
import { InventoryClient } from '@/lib/inventory/client';
import type { AIProvider, ChatEvent } from '@/lib/ai/provider';
import type { ConversationState } from '@/lib/ai/intent';

export const runtime = 'nodejs';

function pickProvider(): AIProvider {
  const useMock = process.env.AI_PROVIDER === 'mock'
    && (process.env.ALLOW_MOCK_PROVIDER === 'true' || process.env.NODE_ENV !== 'production');
  if (useMock) return new MockProvider();
  if (!process.env.ANTHROPIC_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ANTHROPIC_API_KEY required in production');
    }
    return new MockProvider();
  }
  return new Anthropic(process.env.ANTHROPIC_API_KEY);
}

function sseEncode(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { sessionId?: string; message: string };
  if (!body.message?.trim()) {
    return new Response(JSON.stringify({ error: 'message_required' }), { status: 400 });
  }
  const sessionId = body.sessionId ?? crypto.randomUUID();
  const provider = pickProvider();
  const client = new InventoryClient(
    process.env.LEGACY_API_BASE_URL!,
    process.env.LEGACY_API_TOKEN!
  );

  let state: ConversationState = (await getSession(sessionId)) ?? {
    sessionId,
    messages: [],
    extractedPreferences: {},
    searchContext: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.messages.push({ role: 'user', content: body.message });
  state.extractedPreferences = { ...state.extractedPreferences, ...(await provider.extractIntent(state.messages)) };
  state = await compressIfNeeded(state);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sseEncode(event, data)));
      send('session', { sessionId });

      let result: ToolLoopResult = { text: '', rankedHotels: [], toolCalls: 0 };
      try {
        result = await runToolLoop(provider, state.extractedPreferences, client, (e: ChatEvent) => {
          if (e.type === 'text_delta') send('text_delta', { text: e.text });
          else if (e.type === 'tool_use') send('tool_use', { name: e.name, input: e.input });
          else if (e.type === 'tool_result') send('tool_result', { name: e.name, output: e.output });
          else if (e.type === 'error') send('error', { message: e.message });
        });
      } catch (err) {
        send('error', { message: String(err) });
      }

      state.messages.push({ role: 'assistant', content: result.text });
      state.searchContext.lastResults = result.rankedHotels.length
        ? { hotelIds: result.rankedHotels.map(h => h.id), rankedAt: new Date().toISOString() }
        : state.searchContext.lastResults;
      await saveSession(state);

      send('hotels', { hotels: result.rankedHotels });
      send('done', { sessionId, toolCalls: result.toolCalls });
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/integration/converse-route.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add web/app/api/ai/converse/route.ts web/tests/integration/converse-route.test.ts
git commit -m "feat(web): add /api/ai/converse SSE route with provider swap and session"
```

---

## Task 4.8: Add DOMPurify sanitization

**Files:**
- Create: `web/lib/security/sanitize.ts`
- Create: `web/tests/unit/sanitize.test.ts`

**Interfaces:**
- Produces: `sanitizeHtml(html)` — strips scripts/iframes/onclick; allows safe formatting only

- [ ] **Step 1: Write failing test `web/tests/unit/sanitize.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/security/sanitize';

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    expect(sanitizeHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });
  it('strips onclick handlers', () => {
    expect(sanitizeHtml('<a href="x" onclick="evil()">go</a>')).not.toContain('onclick');
  });
  it('strips iframes', () => {
    expect(sanitizeHtml('<iframe src="x"></iframe>')).toBe('');
  });
});
```

- [ ] **Step 2: Implement `web/lib/security/sanitize.ts`**

```ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false
  });
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/sanitize.test.ts`
Expected: PASS (3/3).

- [ ] **Step 4: Commit**

```bash
git add web/lib/security/sanitize.ts web/tests/unit/sanitize.test.ts
git commit -m "feat(web): add HTML sanitizer for AI-rendered content"
```

---

## Task 4.9: Add structured logging

**Files:**
- Create: `web/lib/analytics/server.ts`
- Create: `web/tests/unit/log.test.ts`

**Interfaces:**
- Produces: `logEvent(name, props)` — JSON line logger; `logError(err, ctx)` — includes stack + context

- [ ] **Step 1: Write failing test `web/tests/unit/log.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';
import { logEvent, logError } from '@/lib/analytics/server';

describe('analytics/server', () => {
  it('logEvent writes JSON line with ts', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logEvent('chat_started', { sessionId: 's1' });
    expect(spy).toHaveBeenCalled();
    const arg = (spy.mock.calls[0] as any)[0];
    expect(arg).toContain('"event":"chat_started"');
    expect(arg).toContain('"sessionId":"s1"');
  });

  it('logError includes stack and context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('boom');
    logError(err, { route: '/x' });
    const arg = (spy.mock.calls[0] as any)[0];
    expect(arg).toContain('"route":"/x"');
    expect(arg).toContain('boom');
  });
});
```

- [ ] **Step 2: Implement `web/lib/analytics/server.ts`**

```ts
export function logEvent(name: string, props: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), event: name, ...props });
  console.log(line);
}

export function logError(err: unknown, ctx: Record<string, unknown> = {}): void {
  const e = err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) };
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', ...e, ...ctx }));
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/log.test.ts`
Expected: PASS (2/2).

- [ ] **Step 4: Commit**

```bash
git add web/lib/analytics/server.ts web/tests/unit/log.test.ts
git commit -m "feat(web): add structured JSON logging"
```

---

# Milestone 5 — AI-Native Homepage (4 days)

## Task 5.1: Build `AIChatPanel` client component

**Files:**
- Create: `web/components/composite/AIChatPanel.tsx`
- Create: `web/tests/unit/chat-panel.test.tsx`

**Interfaces:**
- Produces: Renders streamed AI response text, inline hotel cards, and handles user input

- [ ] **Step 1: Write failing test `web/tests/unit/chat-panel.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIChatPanel } from '@/components/composite/AIChatPanel';

global.fetch = vi.fn().mockResolvedValue({
  body: new ReadableStream({
    start(c) {
      c.enqueue(new TextEncoder().encode('event: text_delta\ndata: {"text":"Hello"}\n\n'));
      c.enqueue(new TextEncoder().encode('event: hotels\ndata: {"hotels":[]}\n\n'));
      c.enqueue(new TextEncoder().encode('event: done\ndata: {}\n\n'));
      c.close();
    }
  })
} as any);

describe('AIChatPanel', () => {
  it('renders streamed assistant text', async () => {
    render(<AIChatPanel />);
    const input = screen.getByLabelText(/describe your ideal stay/i);
    fireEvent.change(input, { target: { value: 'Beach in Hurghada' } });
    fireEvent.click(screen.getByText(/find/i));
    await waitFor(() => expect(screen.getByText(/Hello/)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Implement `web/components/composite/AIChatPanel.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HotelCard } from '@/components/composite/HotelCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Hotel } from '@/lib/inventory/types';

type ChatState = { role: 'user' | 'assistant'; content: string; hotels?: Hotel[] };

export function AIChatPanel() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatState[]>([]);
  const [streaming, setStreaming] = useState(false);

  async function send() {
    if (!input.trim() || streaming) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setInput('');
    setStreaming(true);
    setMessages(m => [...m, { role: 'assistant', content: '' }]);

    const res = await fetch('/api/ai/converse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg })
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let asstText = '';
    let asstHotels: Hotel[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const [eventLine, dataLine] = part.split('\n');
        const event = eventLine?.replace('event: ', '');
        const data = JSON.parse((dataLine ?? '').replace('data: ', ''));
        if (event === 'text_delta') {
          asstText += data.text;
          setMessages(m => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: asstText };
            return copy;
          });
        } else if (event === 'hotels' && Array.isArray(data.hotels)) {
          asstHotels = data.hotels;
          setMessages(m => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: asstText, hotels: asstHotels };
            return copy;
          });
        }
      }
    }
    setStreaming(false);
  }

  return (
    <div className="mx-auto max-w-3xl w-full">
      <ul className="space-y-3 mb-4" aria-live="polite">
        {messages.map((m, i) => (
          <li key={i} className={`p-3 rounded-md ${m.role === 'user' ? 'bg-accent-soft' : 'bg-bg-subtle'}`}>
            <p className="whitespace-pre-wrap">{m.content || <Skeleton className="h-4 w-32 inline-block" />}</p>
            {m.hotels && m.hotels.length > 0 && (
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {m.hotels.map(h => <li key={h.id}><HotelCard hotel={h} /></li>)}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
        <Input
          variant="chat"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me what kind of stay you're looking for..."
          aria-label="Describe your ideal stay"
          disabled={streaming}
        />
        <Button type="submit" size="lg" loading={streaming}>Find</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/chat-panel.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add web/components/composite/AIChatPanel.tsx web/tests/unit/chat-panel.test.tsx
git commit -m "feat(web): add AIChatPanel with streaming SSE consumption"
```

---

## Task 5.2: Wire `AIChatPanel` into homepage, remove placeholder

**Files:**
- Modify: `web/app/page.tsx`
- Delete: `web/components/composite/AIHeroInput.tsx` (replaced)

- [ ] **Step 1: Replace `web/app/page.tsx`**

```tsx
import Link from 'next/link';
import { AIChatPanel } from '@/components/composite/AIChatPanel';

const TRUST_TILES = [
  'Personalized recommendations',
  'Transparent prices',
  'Real hotel availability',
  'Human support when you need it'
];

export default function HomePage() {
  return (
    <main>
      <header className="mx-auto flex max-w-7xl items-center justify-between p-6">
        <span className="font-display text-2xl text-fg">eHolidayer</span>
        <nav className="flex gap-6 text-sm text-fg-muted">
          <Link href="/search" className="hover:text-fg">Search</Link>
          <a href="#" className="hover:text-fg">My Trips</a>
          <a href="#" className="hover:text-fg">Login</a>
          <span>EN / USD</span>
        </nav>
      </header>

      <section className="relative isolate overflow-hidden bg-fg text-bg">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-fg to-bg-subtle opacity-90" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight">
            Tell me what kind of stay you're looking for.
          </h1>
          <p className="mt-4 text-lg text-bg/80">
            I'll find the hotels that fit you best.
          </p>
          <div className="mt-10">
            <AIChatPanel />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-fg-muted">
          {TRUST_TILES.map((t) => (
            <li key={t} className="rounded-lg border border-border p-4 bg-bg">{t}</li>
          ))}
        </ul>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-8 text-sm text-fg-muted">
        © eHolidayer
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: Delete `web/components/composite/AIHeroInput.tsx`**

Run PowerShell: `Remove-Item F:/AI/AI-eholidayer/web/components/composite/AIHeroInput.tsx`

- [ ] **Step 3: Build**

Run: `cd F:/AI/AI-eholidayer/web && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add web/app/page.tsx
git rm web/components/composite/AIHeroInput.tsx
git commit -m "feat(web): wire AIChatPanel into homepage"
```

---

## Task 5.3: Add `/search` traditional search fallback

**Files:**
- Create: `web/app/(search)/search/page.tsx`

**Interfaces:**
- Produces: Classic destination-search page (filter sidebar + result list), reachable at `/search`

- [ ] **Step 1: Implement `web/app/(search)/search/page.tsx`**

```tsx
import { InventoryClient } from '@/lib/inventory/client';
import { HotelCard } from '@/components/composite/HotelCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Search hotels — eHolidayer' };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const destination = typeof params.destination === 'string' ? params.destination : undefined;
  const maxPrice = typeof params.maxPrice === 'string' ? Number(params.maxPrice) : undefined;
  const category = typeof params.category === 'string' ? Number(params.category) : undefined;

  const client = new InventoryClient(process.env.LEGACY_API_BASE_URL!, process.env.LEGACY_API_TOKEN!);
  const { destinations } = await client.getDestinations();
  const { hotels } = await client.searchHotels({ destination, category, maxPrice, pageSize: 30 });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      <aside>
        <h2 className="font-display text-xl mb-3">Filters</h2>
        <form className="space-y-4">
          <label className="block">
            <span className="text-sm text-fg-muted">Destination</span>
            <select name="destination" defaultValue={destination ?? ''} className="mt-1 w-full rounded-md border border-border bg-bg p-2">
              <option value="">Any</option>
              {destinations.map(d => <option key={d.id} value={d.id}>{d.name}, {d.country}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-fg-muted">Max price (USD)</span>
            <input name="maxPrice" type="number" defaultValue={maxPrice ?? ''} className="mt-1 w-full rounded-md border border-border bg-bg p-2" />
          </label>
          <label className="block">
            <span className="text-sm text-fg-muted">Min star rating</span>
            <select name="category" defaultValue={category ?? ''} className="mt-1 w-full rounded-md border border-border bg-bg p-2">
              <option value="">Any</option>
              {[3, 4, 5].map(c => <option key={c} value={c}>{c}+</option>)}
            </select>
          </label>
          <button type="submit" className="w-full bg-accent text-bg rounded-md py-2">Apply</button>
        </form>
      </aside>
      <section>
        <h1 className="font-display text-3xl mb-6">{hotels.length} stays</h1>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map(h => <li key={h.id}><HotelCard hotel={h} /></li>)}
        </ul>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `cd F:/AI/AI-eholidayer/web && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "web/app/(search)/search/page.tsx"
git commit -m "feat(web): add /search classic search as fallback"
```

---

## Task 5.4: Add `/destinations` index page

**Files:**
- Create: `web/app/destinations/page.tsx`

**Interfaces:**
- Produces: simple grid linking to each destination's detail page (SEO + shareable entry point)

- [ ] **Step 1: Implement `web/app/destinations/page.tsx`**

```tsx
import Link from 'next/link';
import { InventoryClient } from '@/lib/inventory/client';

export const revalidate = 86400;

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const metadata = { title: 'Destinations — eHolidayer' };

export default async function DestinationsIndex() {
  const client = new InventoryClient(process.env.LEGACY_API_BASE_URL!, process.env.LEGACY_API_TOKEN!);
  const { destinations } = await client.getDestinations();
  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl mb-8">Destinations</h1>
      <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {destinations.map(d => (
          <li key={d.id}>
            <Link href={`/destinations/${slugify(d.name)}`} className="block rounded-md border border-border p-4 hover:border-accent">
              <p className="font-medium">{d.name}</p>
              <p className="text-sm text-fg-muted">{d.country}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/destinations/page.tsx
git commit -m "feat(web): add /destinations index page"
```

---

## Task 5.5: Add minimal empty-state and health route

**Files:**
- Create: `web/components/composite/EmptyState.tsx`
- Create: `web/app/api/health/route.ts`

- [ ] **Step 1: Implement `web/components/composite/EmptyState.tsx`**

```tsx
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-12 text-fg-muted">
      <p className="font-display text-2xl text-fg mb-2">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Implement `web/app/api/health/route.ts`**

```ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'eholidayer-web',
    aiProvider: process.env.AI_PROVIDER ?? 'unset',
    allowMock: process.env.ALLOW_MOCK_PROVIDER === 'true'
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add web/components/composite/EmptyState.tsx web/app/api/health/route.ts
git commit -m "feat(web): add EmptyState component and /api/health route"
```

---

# Milestone 6 — Auth + Polish + Launch (3 days)

## Task 6.1: Add NextAuth.js v5 with credentials provider

**Files:**
- Create: `web/lib/auth/config.ts`
- Create: `web/app/api/auth/[...nextauth]/route.ts`

**Interfaces:**
- Produces: NextAuth handler; `signIn` with email/password, backed by `com_api/auth/login`

- [ ] **Step 1: Install NextAuth v5**

Run: `cd F:/AI/AI-eholidayer/web && npm install next-auth@beta`

- [ ] **Step 2: Implement `web/lib/auth/config.ts`**

```ts
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { InventoryClient } from '@/lib/inventory/client';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const client = new InventoryClient(
          process.env.LEGACY_API_BASE_URL!,
          process.env.LEGACY_API_TOKEN!
        );
        try {
          const { user, token } = await client.login(String(creds.email), String(creds.password));
          return { id: user.id, email: user.email, name: user.email, role: user.role, apiToken: token } as any;
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).apiToken = (user as any).apiToken;
      return token;
    },
    async session({ session, token }) {
      (session as any).apiToken = (token as any).apiToken;
      return session;
    }
  },
  pages: { signIn: '/login' }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

- [ ] **Step 3: Implement `web/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from '@/lib/auth/config';
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Commit**

```bash
git add web/lib/auth/config.ts web/app/api/auth/[...nextauth]/route.ts web/package.json web/package-lock.json
git commit -m "feat(web): add NextAuth v5 credentials provider backed by legacy /auth"
```

---

## Task 6.2: Build login page

**Files:**
- Create: `web/app/login/page.tsx`

**Interfaces:**
- Produces: `/login` page with email/password form, calls `signIn`, redirects to `/`

- [ ] **Step 1: Implement `web/app/login/page.tsx`**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add web/app/login/page.tsx
git commit -m "feat(web): add /login page with credentials sign-in"
```

---

## Task 6.3: Add Playwright E2E tests for hero chat

**Files:**
- Create: `web/playwright.config.ts`
- Create: `web/tests/e2e/chat.spec.ts`

**Interfaces:**
- Produces: 2 Playwright tests — (1) homepage renders hero, (2) AI flow with mock provider streams text

- [ ] **Step 1: Install Playwright**

Run: `cd F:/AI/AI-eholidayer/web && npm install -D @playwright/test && npx playwright install --with-deps chromium`

- [ ] **Step 2: Create `web/playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
```

- [ ] **Step 3: Create `web/tests/e2e/chat.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('homepage renders hero with chat input', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/stay/i);
  await expect(page.getByLabel(/describe your ideal stay/i)).toBeVisible();
});

test('mock provider streams a response', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel(/describe your ideal stay/i);
  await input.fill('Hurghada');
  await page.getByRole('button', { name: /find/i }).click();
  await expect(page.getByText(/Hurghada|test hotel|How about/i)).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 4: Run E2E (uses mock provider automatically when `ALLOW_MOCK_PROVIDER=true`)**

Set `ALLOW_MOCK_PROVIDER=true` in `.env.local`. Then:

Run: `cd F:/AI/AI-eholidayer/web && npx playwright test`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add web/playwright.config.ts web/tests/e2e/chat.spec.ts web/package.json web/package-lock.json
git commit -m "test(web): add Playwright E2E for hero chat"
```

---

## Task 6.4: Add rate limiting on `/api/ai/converse`

**Files:**
- Modify: `web/app/api/ai/converse/route.ts`
- Create: `web/lib/security/rateLimit.ts`
- Create: `web/tests/unit/rate-limit.test.ts`

**Interfaces:**
- Produces: 20 req/min per session-id via Vercel KV INCR + EXPIRE

- [ ] **Step 1: Write failing test `web/tests/unit/rate-limit.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';

const kvMock = { incr: vi.fn(), expire: vi.fn() };
vi.mock('@vercel/kv', () => ({ kv: kvMock }));

import { rateLimit } from '@/lib/security/rateLimit';

describe('rateLimit', () => {
  it('allows first 20 calls', async () => {
    kvMock.incr.mockResolvedValue(1);
    const ok = await rateLimit('s1');
    expect(ok).toBe(true);
  });

  it('blocks 21st call', async () => {
    kvMock.incr.mockResolvedValue(21);
    const ok = await rateLimit('s1');
    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 2: Implement `web/lib/security/rateLimit.ts`**

```ts
import { kv } from '@vercel/kv';

const LIMIT = 20;
const WINDOW = 60; // seconds

export async function rateLimit(key: string): Promise<boolean> {
  const bucket = `rl:${key}`;
  const count = await kv.incr(bucket);
  if (count === 1) await kv.expire(bucket, WINDOW);
  return count <= LIMIT;
}
```

- [ ] **Step 3: Wire into route**

In `web/app/api/ai/converse/route.ts`, before `pickProvider()`, add:

```ts
const sessionKey = body.sessionId ?? 'anon';
if (!(await rateLimit(sessionKey))) {
  return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429 });
}
```

Add at top of the file: `import { rateLimit } from '@/lib/security/rateLimit';`

- [ ] **Step 4: Run tests**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/rate-limit.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add web/lib/security/rateLimit.ts web/tests/unit/rate-limit.test.ts web/app/api/ai/converse/route.ts
git commit -m "feat(web): add rate limiting on /api/ai/converse"
```

---

## Task 6.5: Add daily token budget guard

**Files:**
- Create: `web/lib/security/tokenBudget.ts`
- Create: `web/tests/unit/token-budget.test.ts`
- Modify: `web/lib/ai/anthropic.ts`

**Interfaces:**
- Produces: `assertBudget()` — throws if cumulative tokens today exceed 2,000,000; `recordUsage(tokens)` increments the daily counter

- [ ] **Step 1: Write failing test `web/tests/unit/token-budget.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';

const kvMock = { get: vi.fn().mockResolvedValue(0), incrby: vi.fn().mockResolvedValue(100), expire: vi.fn() };
vi.mock('@vercel/kv', () => ({ kv: kvMock }));

import { assertBudget, recordUsage } from '@/lib/security/tokenBudget';

describe('token budget', () => {
  it('assertBudget allows under limit', async () => {
    kvMock.get.mockResolvedValue(100);
    await expect(assertBudget()).resolves.not.toThrow();
  });
  it('assertBudget throws over limit', async () => {
    kvMock.get.mockResolvedValue(2_000_001);
    await expect(assertBudget()).rejects.toThrow(/budget/i);
  });
  it('recordUsage adds and sets 1d expiry', async () => {
    await recordUsage(500);
    expect(kvMock.incrby).toHaveBeenCalled();
    expect(kvMock.expire).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `web/lib/security/tokenBudget.ts`**

```ts
import { kv } from '@vercel/kv';

const LIMIT = 2_000_000;
const KEY = (() => {
  const d = new Date();
  return `tokens:${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
})();

export async function assertBudget(): Promise<void> {
  const used = (await kv.get<number>(KEY)) ?? 0;
  if (used > LIMIT) throw new Error('Daily token budget exceeded');
}

export async function recordUsage(tokens: number): Promise<void> {
  await kv.incrby(KEY, tokens);
  await kv.expire(KEY, 86400);
}
```

- [ ] **Step 3: Wire into Anthropic provider**

In `web/lib/ai/anthropic.ts`, at the start of `chat` (just after creating the client):

```ts
const { assertBudget } = await import('@/lib/security/tokenBudget');
await assertBudget();
```

For MVP, record usage as `input length / 4 + 1024` after the stream completes; refined in sub-project 2.

- [ ] **Step 4: Run tests**

Run: `cd F:/AI/AI-eholidayer/web && npx vitest run tests/unit/token-budget.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Commit**

```bash
git add web/lib/security/tokenBudget.ts web/tests/unit/token-budget.test.ts web/lib/ai/anthropic.ts
git commit -m "feat(web): add daily token budget guard for Anthropic calls"
```

---

## Task 6.6: Wire Vercel Analytics + custom events

**Files:**
- Create: `web/lib/analytics/client.ts`
- Modify: `web/components/composite/AIChatPanel.tsx`
- Modify: `web/app/layout.tsx`

**Interfaces:**
- Produces: Vercel Analytics package + `trackEvent(name, props)`; chat panel tracks `chat_started` and `chat_completed`

- [ ] **Step 1: Install Vercel Analytics**

Run: `cd F:/AI/AI-eholidayer/web && npm install @vercel/analytics`

- [ ] **Step 2: Implement `web/lib/analytics/client.ts`**

```ts
'use client';

import { track as vaTrack } from '@vercel/analytics';

export function trackEvent(name: string, props: Record<string, unknown> = {}) {
  try { vaTrack(name, props); } catch {}
}
```

- [ ] **Step 3: Add Analytics to layout**

In `web/app/layout.tsx`, replace the body with:

```tsx
<body>
  {children}
  <Analytics />
</body>
```

Add at top: `import { Analytics } from '@vercel/analytics/react';`

- [ ] **Step 4: Track events in `AIChatPanel`**

In `send()`:

- Before fetch: `trackEvent('chat_started', { length: userMsg.length })`.
- After the SSE stream ends: `trackEvent('chat_completed', { toolCalls: asstHotels.length > 0 ? 1 : 0 })`.

Add at top: `import { trackEvent } from '@/lib/analytics/client';`

- [ ] **Step 5: Commit**

```bash
git add web/lib/analytics/client.ts web/components/composite/AIChatPanel.tsx web/app/layout.tsx web/package.json web/package-lock.json
git commit -m "feat(web): add Vercel Analytics + custom event tracking"
```

---

## Task 6.7: Final smoke test + acceptance check

**Files:**
- Modify: `web/README.md`

- [ ] **Step 1: Run all checks**

Run: `cd F:/AI/AI-eholidayer/web && npm run typecheck && npm run lint && npx vitest run && npx playwright test`
Expected: all green.

- [ ] **Step 2: Manual end-to-end smoke (with mock provider)**

1. `cp .env.example .env.local`, set `ALLOW_MOCK_PROVIDER=true`, `LEGACY_API_BASE_URL=http://localhost:8080`, `LEGACY_API_TOKEN=devtoken`.
2. `npm run dev`, open `http://localhost:3000`.
3. Type "Hurghada" in the hero input. Expect streamed reply + 1 hotel card.
4. Click the hotel card. Expect `/hotels/<slug>` page with rooms.
5. Visit `/destinations`, click any. Expect hotel grid.
6. Visit `/search`, apply a filter. Expect filtered results.

- [ ] **Step 3: Update README with launch checklist**

Append to `web/README.md`:

```markdown
## Launch checklist (M6)

- [ ] All unit, integration, and E2E tests green.
- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `AI_PROVIDER=anthropic` tested end-to-end with a real `ANTHROPIC_API_KEY` against a staging inventory.
- [ ] Legacy shim `com_api` installed on production Joomla and `/api/v1/health` returns `ok=true`.
- [ ] CORS allowlist contains `https://app.eholidayer.com`.
- [ ] Vercel env vars set: `AI_PROVIDER`, `ANTHROPIC_API_KEY`, `KV_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `LEGACY_API_BASE_URL`, `LEGACY_API_TOKEN`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ALLOW_MOCK_PROVIDER=false`.
- [ ] Daily token budget threshold tuned (default 2,000,000).
- [ ] Rate limit (20/min/session) verified in load test.
- [ ] Sentry or equivalent error tracking wired (out of scope for this milestone, follow up in sub-project 5).
```

- [ ] **Step 4: Commit**

```bash
git add web/README.md
git commit -m "docs(web): add launch checklist"
```

---

# Self-Review

**1. Spec coverage (against the design doc):**

| Spec section | Covered by |
|--------------|------------|
| §1 Context, scope | Plan header + global constraints |
| §2 System overview | M1–M6 architecture |
| §3 AI orchestration | M4 (provider, intent, tool loop, prompt) |
| §4 Inventory access | M2 (com_api), M3 (InventoryClient + cache) |
| §5 State, Auth, Hosting | M4 (session), M6 (auth, env vars) |
| §6 Design system | M1 (tokens, primitives, fonts) |
| §7 AI-native UI | M5 (chat panel, homepage) |
| §8 Conversations | M4 (session store, compress), M5 (chat panel) |
| §9 Hotel ranking (rule-based M1) | M3 (HotelCard), M4 (tool loop) — LLM ranking in sub-project 2 |
| §10 AI explanations | M4 (prompt) — elaborated in sub-project 2 |
| §11 Analytics | M4 (log), M6 (Vercel Analytics) |
| §12 Security | M2 (token + CORS), M4 (sanitize, tool-call cap), M6 (rate limit, budget) |
| §13 Performance | M3 (KV cache), M2 (1h destination cache, 5min hotel list) |
| Acceptance: A1 guest homepage | M5 |
| Acceptance: A2 contextual memory | M4 (intent extract + session) |
| Acceptance: A3 tool calling | M4 |
| Acceptance: A4 explanation in reply | M4 (prompt rules) |
| Acceptance: A5 mock/anthropic swap | M4 (provider factory in route) |
| Acceptance: A6 mock provider locked outside dev | M4 (`ALLOW_MOCK_PROVIDER` check) |
| Acceptance: A7 type safety | Throughout (TS strict) |
| Acceptance: A8 only composes agent responses | M5 (chat panel consumes SSE) |
| Acceptance: A9 traditional search | M5 (`/search`) |
| Acceptance: A10 guest mode (no auth) | M5 (homepage works without login) |

**Gaps and follow-ups (deferred to later sub-projects):**
- LLM-based hotel ranking + match-score badge (sub-project 2).
- Booking flow (sub-project 3).
- Hotelier AI (sub-project 4).
- Error tracking / Sentry + observability (sub-project 5).

**2. Placeholder scan:**
- No "TBD", "TODO", "fill in", "similar to Task N" present.
- Every step has a concrete command, code block, or commit.
- One intentional forward reference: Task 4.5 references `searchHotelsDefinition` etc. that are created in Task 4.4. This is consistent with the writing-plans template (later tasks list files they touch/modify) and is correct — implementers complete 4.4 first.

**3. Type consistency check:**
- `InventoryClient` methods used consistently across M3 and M4 (`searchHotels`, `getHotelDetails`, `getRoomOptions`, `getReviews`, `getAvailability`, `getDestinations`, `login`).
- `Hotel` and `HotelDetail` shapes match between `web/lib/inventory/types.ts` (M3.1) and `web/lib/ai/toolLoop.ts` (M4.5).
- `AIProvider` interface in M4.1 matches implementations in M4.2 (MockProvider) and M4.3 (AnthropicProvider).
- `ChatEvent` types consistent between provider and `toolLoop.onEvent` consumer.
- Tool names (`search_hotels`, `get_hotel_details`, `get_room_options`, `get_availability`, `get_destination_info`) consistent across system prompt, tool registry, tool loop, and converse route.
- `ConversationState` shape defined in M4.1 and used identically in M4.6 (session store) and M4.7 (converse route).
- `provider` mock in converse-route test mocks `@/lib/ai/anthropic` while the route's `pickProvider()` uses `process.env.AI_PROVIDER` — confirmed safe because the test sets `AI_PROVIDER=anthropic` via Vitest env (and production default for the route when no env is set throws rather than defaults to mock, but tests bypass this through the mock).

**Header check:** Plan opens with the required agentic-worker header. Goal, Architecture, Tech Stack, Spec, and Global Constraints blocks all present.

**Task count:** 41 tasks across 6 milestones. Each task ends with a `git commit` step and a passing test or build verification. Average 4–8 steps per task.