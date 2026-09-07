import { Check } from 'lucide-react';

const FEATURES = [
  'Payroll, PF, ESI & TDS — fully automated',
  'Leave, attendance & shifts — zero manual work',
  'Onboarding to offboarding — end to end',
];

const STATS = [
  { value: '200+', label: 'Companies' },
  { value: '50,000+', label: 'Employees' },
  { value: '99.9%', label: 'Uptime' },
];

const FOOTER_LINKS = ['About', 'Features', 'Pricing', 'Contact Us', 'Privacy Policy', 'Terms'];

const TESTIMONIALS = [
  {
    quote:
      'WorkAxis cut our monthly payroll processing from 2 days to under 3 hours. Best HR decision our company has made.',
    name: 'Rahul Kapoor',
    title: 'HR Director',
    company: 'TechNova Systems',
    initials: 'RK',
  },
  {
    quote:
      'The leave and attendance module alone saved us countless hours every week. Our employees love the self-service portal.',
    name: 'Priya Sharma',
    title: 'Head of People Ops',
    company: 'Orbits Technologies',
    initials: 'PS',
  },
];

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

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    /* auth-panel-surface = white/4% — subtle card lift inside the dark panel */
    <div className="rounded-2xl border border-auth-panel-border bg-auth-panel-surface p-5">
      <svg
        className="mb-3 h-7 w-7 text-auth-panel-border"
        fill="currentColor"
        viewBox="0 0 32 32"
        aria-hidden
      >
        <path d="M10 8C5.6 8 2 11.6 2 16v8h8v-8H6c0-2.2 1.8-4 4-4V8zm14 0c-4.4 0-8 3.6-8 8v8h8v-8h-4c0-2.2 1.8-4 4-4V8z" />
      </svg>

      <p className="text-sm leading-relaxed text-auth-panel-subtext">{t.quote}</p>

      <div className="mt-4 flex items-center gap-3">
        {/* Avatar — uses primary action colour for a branded feel */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-auth-panel-surface ring-1 ring-auth-panel-border">
          <span className="text-xs font-bold tracking-wide text-auth-panel-fg">{t.initials}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-auth-panel-fg">{t.name}</p>
          <p className="text-xs text-auth-panel-muted">
            {t.title} · {t.company}
          </p>
        </div>
      </div>
    </div>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  variant?: 'login' | 'register';
}

export function AuthLayout({ children, variant = 'login' }: AuthLayoutProps) {
  const testimonial = (variant === 'login' ? TESTIMONIALS[0] : TESTIMONIALS[1])!;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* ── Left brand panel — always-dark, independent of app theme ── */}
      <aside className="relative hidden flex-col bg-auth-panel lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-115 lg:shrink-0 xl:w-125">
        {/* Subtle dot-grid texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.042) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 flex h-full flex-col px-10 py-10 xl:px-12">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-auth-panel-surface">
              <BrandMark onDark />
            </div>
            <span className="text-sm font-semibold tracking-tight text-auth-panel-fg">
              WorkAxis HRMS
            </span>
          </div>

          {/* Headline + features */}
          <div className="mt-14 flex-1">
            {variant === 'login' ? (
              <>
                <h2 className="text-[2rem] font-bold leading-snug text-auth-panel-fg xl:text-[2.2rem]">
                  Modern HR,<br />built for India.
                </h2>
                <p className="mt-3.5 text-sm leading-relaxed text-auth-panel-subtext">
                  From payroll compliance to attendance tracking —
                  everything your HR team needs, in one place.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-[2rem] font-bold leading-snug text-auth-panel-fg xl:text-[2.2rem]">
                  Set up your<br />team in minutes.
                </h2>
                <p className="mt-3.5 text-sm leading-relaxed text-auth-panel-subtext">
                  Join 200+ companies already running payroll, leaves,
                  and attendance on WorkAxis HRMS.
                </p>
              </>
            )}

            <ul className="mt-8 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-auth-panel-muted" />
                  <span className="text-sm text-auth-panel-subtext">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <TestimonialCard t={testimonial} />
            </div>
          </div>

          {/* Stats strip */}
          <div className="border-t border-auth-panel-border pt-6">
            <div className="grid grid-cols-3 gap-4">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-auth-panel-fg">{s.value}</p>
                  <p className="mt-0.5 text-xs text-auth-panel-muted">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col bg-background">
        <main className="flex flex-1 flex-col items-center px-6 py-14 sm:px-10">

          {/* Mobile-only logo */}
          <div className="mb-8 flex w-full max-w-100 items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground">
              <BrandMark onDark />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground">
              WorkAxis HRMS
            </span>
          </div>

          <div className="w-full max-w-100">
            {children}
          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t bg-background px-6 py-4">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2.5 sm:flex-row sm:gap-0">
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} WorkAxis HRMS. All rights reserved.
            </p>
            <nav aria-label="Footer links" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
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
