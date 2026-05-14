import { Check } from 'lucide-react';

const FEATURES = [
  'Automated payroll with PF, ESI & TDS compliance',
  'Leave, attendance & shift management',
  'Onboarding to offboarding — fully digital',
  'Real-time analytics and custom HR reports',
];

const STATS = [
  { value: '200+', label: 'Companies onboarded' },
  { value: '50,000+', label: 'Employees managed' },
  { value: '99.9%', label: 'Platform uptime' },
];

const FOOTER_LINKS = ['About', 'Features', 'Pricing', 'Contact Us', 'Privacy Policy', 'Terms'];

function BrandMark({ onDark = true }: { onDark?: boolean }) {
  const c = onDark ? 'white' : '#0f172a';
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1" y="1" width="7" height="7" rx="1.5" fill={c} />
      <rect x="10" y="1" width="7" height="7" rx="1.5" fill={c} fillOpacity="0.6" />
      <rect x="1" y="10" width="7" height="7" rx="1.5" fill={c} fillOpacity="0.6" />
      <rect x="10" y="10" width="7" height="7" rx="1.5" fill={c} fillOpacity="0.28" />
    </svg>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'register';
}

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* ── Left brand panel ── */}
      <aside className="relative hidden flex-col bg-slate-950 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[460px] lg:shrink-0 xl:w-[500px]">
        {/* Subtle dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-100"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.042) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 flex h-full flex-col px-10 py-10 xl:px-12">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <BrandMark onDark />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              WorkAxis HRMS
            </span>
          </div>

          {/* Headline */}
          <div className="mt-16 flex-1">
            {variant === 'login' ? (
              <>
                <h2 className="text-[2rem] font-bold leading-snug text-white xl:text-[2.2rem]">
                  Modern HR,<br />built for India.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  From payroll compliance to attendance tracking —
                  everything your HR team needs, in one place.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[2rem] font-bold leading-snug text-white xl:text-[2.2rem]">
                  Set up your<br />team in minutes.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Join 200+ companies already running payroll, leaves,
                  and attendance on WorkAxis HRMS.
                </p>
              </>
            )}

            <ul className="mt-10 space-y-4">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <span className="text-sm text-slate-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats strip */}
          <div className="border-t border-white/10 pt-8">
            <div className="grid grid-cols-3 gap-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-white">{s.value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col bg-white">
        <main className="flex flex-1 flex-col items-center px-6 py-14 sm:px-10">

          {/* Mobile-only logo */}
          <div className="mb-8 flex w-full max-w-[400px] items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900">
              <BrandMark onDark />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              WorkAxis HRMS
            </span>
          </div>

          <div className="w-full max-w-[400px]">
            {children}
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-100 bg-white px-6 py-4">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2.5 sm:flex-row sm:gap-0">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} WorkAxis HRMS. All rights reserved.
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-xs text-slate-400 transition-colors hover:text-slate-600"
                >
                  {link}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
