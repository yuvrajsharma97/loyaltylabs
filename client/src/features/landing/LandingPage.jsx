import { Link } from 'react-router-dom';
import Hero from './Hero';

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}>
    <circle cx="9" cy="9" r="8" fill="#E4EDEA" />
    <path d="M5.6 9.3l2.5 2.4 4.4-5.1" stroke="#2B5748" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GlowBackdrop = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
    <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
    <div className="absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-accent/35 blur-[110px]" />
    <div className="absolute bottom-[-60px] left-1/3 h-64 w-64 rounded-full bg-primary-tint/70 blur-[100px]" />
  </div>
);

function buildLinePath(values, max) {
  const width = 320;
  const height = 130;
  const points = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    height - (value / max) * (height - 14) - 7,
  ]);
  return 'M' + points.map((point) => `${point[0].toFixed(1)} ${point[1].toFixed(1)}`).join(' L');
}

function buildAreaPath(values, max) {
  return `${buildLinePath(values, max)} L320 130 L0 130 Z`;
}

const STATS = [
  { value: '412', label: 'Independent shops' },
  { value: '38,204', label: 'Customers collecting' },
  { value: '1.24M', label: 'Points issued' },
  { value: '41%', label: 'Rewards claimed' },
];

const StatsBar = () => (
  <section className="bg-surface-secondary px-4 py-8 sm:px-10 sm:py-9">
    <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-6 sm:grid-cols-4">
      {STATS.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-1">
          <span className="tabular-nums text-[clamp(28px,3.4vw,40px)] font-semibold leading-none tracking-[-.03em] text-text-primary">
            {stat.value}
          </span>
          <span className="text-label uppercase tracking-[.08em] text-accent-text">{stat.label}</span>
        </div>
      ))}
    </div>
  </section>
);

const STEPS = [
  {
    n: '1',
    title: 'Sign up once',
    body: 'One free account, one code. No app to download and nothing to carry — your phone browser is enough.',
  },
  {
    n: '2',
    title: 'Show your code',
    body: 'At the till of any shop on LoyaltyLabs. Staff scan it before you pay and your points land instantly.',
  },
  {
    n: '3',
    title: 'Claim your reward',
    body: 'Free coffee, a pastry, money off. When you can afford it, it appears — redeem and show the code at the counter.',
  },
];

const HowItWorks = () => (
  <section id="how" className="relative overflow-hidden bg-canvas px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-7 sm:gap-9">
      <div className="flex max-w-[620px] flex-col gap-2.5 sm:gap-3">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">How it works</span>
        <h2 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] tracking-[-.025em] text-text-primary">
          Three steps, and it&apos;s running.
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className="glass-card flex flex-col gap-3 rounded-card p-5 shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:p-[22px]"
          >
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-primary-tint font-mono text-body-sm font-semibold text-primary-hover">
              {step.n}
            </span>
            <span className="text-card-title text-text-primary">{step.title}</span>
            <span className="text-body text-text-secondary">{step.body}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const WALLET_POINTS = [
  'Points and stamp cards kept separately for every shop you visit.',
  'Rewards unlock the moment your balance covers them — no hunting.',
  'Redeeming gives you a short code, valid ten minutes, shown at the counter.',
];

const WalletShowcase = () => (
  <section id="wallet" className="relative overflow-hidden border-y border-border bg-surface px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-8 sm:gap-10">
      <div className="mx-auto w-full overflow-hidden rounded-xl border border-border bg-[#EDF1F3] shadow-card sm:rounded-2xl sm:w-3/4">
        <video
          src="/media/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="block aspect-video w-full object-cover"
          style={{ filter: 'saturate(.93) contrast(1.02)' }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-8 sm:gap-10">
        <div className="flex min-w-0 flex-1 basis-[280px] justify-center">
          <div className="glass-card w-[300px] max-w-full rounded-[26px] p-3.5 shadow-dialog">
            <div className="flex flex-col gap-3 rounded-xl bg-primary p-4">
              <span className="font-mono text-label uppercase tracking-[.1em] text-white/65">Total balance</span>
              <div className="flex items-baseline gap-1.5">
                <span className="tabular-nums text-[36px] font-semibold leading-none tracking-[-.03em] text-white">1,240</span>
                <span className="text-body-sm font-medium text-white/70">pts</span>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-card-title text-text-primary">Rye &amp; Co. Bakery</span>
                <span className="rounded-pill bg-surface-secondary px-2 py-1 font-mono text-[11.5px] text-accent-text">6 / 8</span>
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 8 }, (_, index) => (
                  <span
                    key={index}
                    className="h-[26px] flex-1 rounded-[7px]"
                    style={
                      index < 6
                        ? { background: '#FFF78D', border: '1px solid #E6DE6A' }
                        : { background: 'var(--color-canvas)', border: '1px dashed var(--color-border-strong)' }
                    }
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2.5 rounded-xl bg-surface-secondary p-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-card-title text-text-primary">Free flat white</span>
                <span className="tabular-nums text-body-sm text-accent-text">500 pts</span>
              </div>
              <span className="inline-flex h-9 items-center rounded-pill bg-primary px-3.5 text-label font-semibold text-on-primary">
                Redeem
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 basis-[280px] flex-col gap-4">
          <span className="text-label uppercase tracking-[.09em] text-text-muted">Your wallet</span>
          <h2 className="m-0 max-w-[520px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-.025em] text-text-primary">
            Every shop you visit, in one place.
          </h2>
          <p className="m-0 max-w-[520px] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-text-secondary">
            One code works everywhere. Points and stamp cards stack up per shop, rewards appear the moment
            you can afford them, and redeeming gives you a code to show at the counter.
          </p>
          <div className="flex flex-col gap-2.5">
            {WALLET_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-2.5 text-body text-text-secondary">
                {CHECK_ICON}
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const ForShopsForCustomers = () => (
  <section id="shops" className="relative overflow-hidden bg-canvas px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
      <div className="glass-card-tint flex flex-col gap-3.5 rounded-2xl p-6 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:gap-4 sm:p-7">
        <span className="text-label uppercase tracking-[.09em] text-[#4E6B60]">For shops</span>
        <span className="text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.15] tracking-[-.02em] text-text-primary">
          Bring people back.
        </span>
        <span className="text-body leading-[1.55] text-[#3E4A44]">
          Set your points rate and rewards in an afternoon. Scan from the phone in your apron — no card
          readers, no new till.
        </span>
        <Link
          to="/sign-up?as=store"
          className="inline-flex h-12 w-fit items-center rounded-[10px] bg-primary px-5 text-body font-semibold text-on-primary hover:bg-primary-hover"
        >
          Start free trial
        </Link>
      </div>
      <div className="glass-card flex flex-col gap-3.5 rounded-2xl p-6 shadow-card transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:gap-4 sm:p-7">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">For customers</span>
        <span className="text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.15] tracking-[-.02em] text-text-primary">
          Your local, in your pocket.
        </span>
        <span className="text-body leading-[1.55] text-text-secondary">
          One code for every shop you visit. Free, nothing to download, and your points never sit on a
          card you left at home.
        </span>
        <Link
          to="/sign-up"
          className="inline-flex h-12 w-fit items-center rounded-[10px] border border-[#CBDAD4] px-5 text-body font-semibold text-primary-hover hover:bg-primary-tint"
        >
          Join for free
        </Link>
      </div>
    </div>
  </section>
);

const WEEK = [
  { day: 'Mon', value: 28 },
  { day: 'Tue', value: 34 },
  { day: 'Wed', value: 31 },
  { day: 'Thu', value: 45 },
  { day: 'Fri', value: 52 },
  { day: 'Sat', value: 61 },
  { day: 'Sun', value: 42 },
];
const ISSUED = [1200, 1350, 1180, 1420, 1610, 1880, 1540, 1290, 1460, 1720, 1980, 1610, 1380, 1520, 1810, 2040, 1690, 1450, 1580, 1900, 2120, 1740, 1490, 1620, 1960, 2210, 1830, 1560, 1680, 1740];
const REDEEMED = [400, 520, 380, 610, 700, 880, 640, 420, 560, 720, 940, 660, 480, 600, 810, 1020, 700, 520, 640, 900, 1120, 760, 540, 660, 960, 1180, 840, 600, 700, 760];

const AnalyticsShowcase = () => (
  <section id="analytics" className="relative overflow-hidden border-y border-border bg-surface px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-7 sm:gap-9">
      <div className="flex max-w-[640px] flex-col gap-2.5 sm:gap-3">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">For the counter</span>
        <h2 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] tracking-[-.025em] text-text-primary">
          You see exactly what loyalty is doing.
        </h2>
        <p className="m-0 text-[clamp(15.5px,1.3vw,18px)] leading-[1.6] text-text-secondary">
          Points issued and redeemed, scans per day, who&apos;s coming back, and what you still owe in
          unredeemed points. No spreadsheets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 rounded-2xl border border-border bg-canvas p-3.5 sm:grid-cols-2 sm:gap-4 sm:p-5">
        <div className="glass-card flex flex-col gap-4 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-card-title text-text-primary">Scans this week</span>
            <span className="font-mono text-label text-text-muted">293 total</span>
          </div>
          <div className="flex items-end gap-2">
            {WEEK.map((day) => (
              <div key={day.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="tabular-nums font-mono text-[11px] text-text-muted">{day.value}</span>
                <span className="flex h-[120px] w-full items-end">
                  <span
                    className="w-full rounded-t-[5px]"
                    style={{
                      height: `${Math.round((day.value / 61) * 100)}%`,
                      background: day.day === 'Fri' ? 'var(--color-primary)' : '#CBDAD4',
                    }}
                  />
                </span>
                <span
                  className="text-label"
                  style={{ color: day.day === 'Fri' ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                >
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card flex flex-col gap-4 rounded-xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-card-title text-text-primary">Issued vs redeemed</span>
            <div className="flex gap-3.5 text-body-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="h-[3px] w-3.5 rounded bg-primary" /> Issued
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[3px] w-3.5 rounded bg-[#B79A00]" /> Redeemed
              </span>
            </div>
          </div>
          <svg viewBox="0 0 320 130" width="100%" height="152" preserveAspectRatio="none" aria-label="Points issued versus redeemed over 30 days">
            <line x1="0" y1="32" x2="320" y2="32" stroke="var(--color-divider)" strokeWidth="1" />
            <line x1="0" y1="66" x2="320" y2="66" stroke="var(--color-divider)" strokeWidth="1" />
            <line x1="0" y1="100" x2="320" y2="100" stroke="var(--color-divider)" strokeWidth="1" />
            <path d={buildAreaPath(ISSUED, 2400)} fill="var(--color-primary-tint)" />
            <path d={buildLinePath(ISSUED, 2400)} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <path d={buildLinePath(REDEEMED, 2400)} fill="none" stroke="#B79A00" strokeWidth="2" strokeDasharray="4 4" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="flex flex-wrap gap-4 border-t border-divider pt-3 sm:gap-6">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11.5px] text-text-muted">ISSUED</span>
              <span className="tabular-nums text-card-title text-text-primary">48,200</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11.5px] text-text-muted">REDEEMED</span>
              <span className="tabular-nums text-card-title text-text-primary">19,400</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-[11.5px] text-text-muted">LIABILITY</span>
              <span className="tabular-nums text-card-title text-text-primary">28,800</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const PLANS = [
  {
    name: 'Starter',
    price: '£29',
    popular: false,
    features: ['One shop, one till', 'Points and stamp cards', 'Unlimited customers', 'Email support'],
  },
  {
    name: 'Growth',
    price: '£59',
    popular: true,
    features: ['Up to three tills', 'Multiple reward campaigns', 'Customer segments and exports', 'Priority support'],
  },
  {
    name: 'Scale',
    price: '£70',
    popular: false,
    features: ['Unlimited tills and staff logins', 'Multi-site reporting', 'API and webhooks', 'Named account contact'],
  },
];

const Pricing = () => (
  <section id="pricing" className="relative overflow-hidden bg-canvas px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-6 sm:gap-8">
      <div className="flex max-w-[600px] flex-col gap-2.5 sm:gap-3">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">Pricing for shops</span>
        <h2 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] tracking-[-.025em] text-text-primary">
          Always free for customers.
        </h2>
        <p className="m-0 text-[clamp(15.5px,1.3vw,18px)] leading-[1.6] text-text-secondary">
          Shops pay a flat monthly fee. 14 days free, then cancel whenever.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-3 sm:gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col gap-3.5 rounded-2xl p-6 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:gap-4 sm:p-7 ${
              plan.popular ? 'glass-card-tint shadow-lift' : 'glass-card shadow-card'
            }`}
            style={plan.popular ? { borderColor: 'var(--color-primary)' } : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-card-title text-text-primary">{plan.name}</span>
              {plan.popular && (
                <span className="rounded-pill bg-accent px-2.5 py-1 font-mono text-[11.5px] uppercase tracking-[.06em] text-accent-text">
                  Most popular
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="tabular-nums text-[clamp(30px,3.2vw,38px)] font-semibold tracking-[-.03em] text-text-primary">
                {plan.price}
              </span>
              <span className="text-body-sm text-text-muted">/ month + VAT</span>
            </div>
            <div className="h-px bg-divider" />
            <div className="flex flex-col gap-2.5">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5 text-body-sm text-text-secondary">
                  {CHECK_ICON}
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <Link
              to="/sign-up?as=store"
              className={`mt-auto inline-flex h-12 items-center justify-center rounded-[10px] text-body font-semibold ${
                plan.popular
                  ? 'bg-primary text-on-primary hover:bg-primary-hover'
                  : 'border border-[#CBDAD4] text-primary-hover hover:bg-primary-tint'
              }`}
            >
              Start free trial
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonial = () => (
  <section className="bg-surface-secondary px-4 py-12 sm:px-10 sm:py-16">
    <div className="mx-auto flex max-w-[860px] flex-col gap-4 sm:gap-5">
      <p className="m-0 text-[clamp(19px,2.6vw,30px)] leading-[1.4] tracking-[-.015em] text-text-primary">
        &ldquo;We stopped reprinting stamp cards and started recognising our regulars. Half our morning
        queue is on it now.&rdquo;
      </p>
      <span className="font-mono text-label uppercase tracking-[.1em] text-accent-text">
        Bakery owner · Bristol
      </span>
    </div>
  </section>
);

const ClosingCta = () => (
  <section className="bg-primary px-4 py-14 sm:px-10 sm:py-20">
    <div className="mx-auto flex max-w-[1200px] flex-col items-stretch gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2.5 text-center sm:flex-1 sm:basis-[380px] sm:gap-3 sm:text-left">
        <h2 className="m-0 text-[clamp(26px,3.6vw,42px)] font-semibold leading-[1.15] tracking-[-.028em] text-on-primary">
          Start collecting on your next coffee.
        </h2>
        <p className="m-0 mx-auto max-w-[460px] text-[clamp(15.5px,1.3vw,18px)] leading-[1.55] text-white/78 sm:mx-0">
          Free for customers, 14 days free for shops.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
        <Link
          to="/sign-up"
          className="inline-flex h-[52px] items-center justify-center rounded-[10px] bg-canvas px-6 text-body font-semibold text-primary-pressed hover:bg-white"
        >
          Join for free
        </Link>
        <Link
          to="/sign-in"
          className="inline-flex h-[52px] items-center justify-center rounded-[10px] border border-white/50 px-5 text-body font-semibold text-on-primary hover:bg-white/10"
        >
          Sign in
        </Link>
      </div>
    </div>
  </section>
);

// Only links that go somewhere real: sections on this page (href) or app
// routes (to). Add Company/Legal columns back once those pages exist.
const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how' },
      { label: 'Rewards wallet', href: '#wallet' },
      { label: 'For shops', href: '#shops' },
      { label: 'Shop analytics', href: '#analytics' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Join as a customer', to: '/sign-up' },
      { label: 'Register your shop', to: '/sign-up?as=store' },
      { label: 'Customer sign in', to: '/sign-in' },
      { label: 'Shop owner sign in', to: '/sign-in?as=store' },
    ],
  },
];

const FOOTER_LINK_CLASS = 'text-body-sm text-text-secondary hover:text-primary';

const Footer = () => (
  <footer className="border-t border-border bg-canvas px-4 pb-8 pt-10 sm:px-10 sm:pb-10 sm:pt-12">
    <div className="mx-auto flex max-w-[1200px] flex-col gap-7 sm:gap-8">
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-3 sm:gap-6">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="block h-5 w-5 rounded-[6px] bg-primary" />
            <span className="text-card-title text-text-primary">LoyaltyLabs</span>
          </div>
          <span className="max-w-[26ch] text-body-sm text-text-muted">Digital loyalty for UK independents.</span>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:col-span-2">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-2.5">
              <span className="font-mono text-[11.5px] uppercase tracking-[.08em] text-text-muted">{column.title}</span>
              {column.links.map((link) =>
                link.to ? (
                  <Link key={link.label} to={link.to} className={FOOTER_LINK_CLASS}>
                    {link.label}
                  </Link>
                ) : (
                  <a key={link.label} href={link.href} className={FOOTER_LINK_CLASS}>
                    {link.label}
                  </a>
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-border pt-5 text-body-sm text-text-muted sm:flex-row sm:flex-wrap sm:justify-between sm:gap-3">
        <span>© LoyaltyLabs 2026 · Registered in England &amp; Wales</span>
        <span>Prices in GBP · VAT added at checkout</span>
      </div>
    </div>
  </footer>
);

const LandingPage = () => {
  return (
    <div className="bg-canvas">
      <Hero />
      <HowItWorks />
      <WalletShowcase />
      {/* <StatsBar /> */}
      <ForShopsForCustomers />
      <AnalyticsShowcase />
      <Pricing />
      <Testimonial />
      <ClosingCta />
      <Footer />
    </div>
  );
};

export default LandingPage;
