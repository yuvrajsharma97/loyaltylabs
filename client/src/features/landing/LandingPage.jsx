import { Link } from 'react-router-dom';
import Hero from './Hero';

const CHECK_ICON = (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}>
    <circle cx="9" cy="9" r="8" fill="#E4EDEA" />
    <path d="M5.6 9.3l2.5 2.4 4.4-5.1" stroke="#2B5748" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLUS_ICON = (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flex: 'none', marginTop: 3 }}>
    <circle cx="9" cy="9" r="8" fill="#2B5748" />
    <path d="M9 5.5v7M5.5 9h7" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const GlowBackdrop = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
    <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
    <div className="absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-accent/35 blur-[110px]" />
    <div className="absolute bottom-[-60px] left-1/3 h-64 w-64 rounded-full bg-primary-tint/70 blur-[100px]" />
  </div>
);

const STEPS = [
  {
    n: '1',
    title: 'Set your rewards',
    body: 'Choose points per £1 or per visit (per visit works like a stamp card) and add the rewards you want to give.',
  },
  {
    n: '2',
    title: 'Scan at the till',
    body: 'Customers show their FuseCard on their phone. Staff scan it from any phone, with no card readers and no new till.',
  },
  {
    n: '3',
    title: 'See who comes back',
    body: 'Every visit and reward is recorded, so you can see what brings people back and change rewards whenever you like.',
  },
];

const HowItWorks = () => (
  <section id="how" className="relative overflow-hidden bg-canvas px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-7 sm:gap-9">
      <div className="flex max-w-[620px] flex-col gap-2.5 sm:gap-3">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">How it works</span>
        <h2 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] tracking-[-.025em] text-text-primary">
          Up and running in an afternoon.
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

const DIGITAL_FEATURES = [
  {
    title: 'Nothing to lose or forget',
    body: "Points live on your customers' phones. One code works at every shop on LoyaltyLabs.",
  },
  {
    title: 'Rewards you control',
    body: 'Set points per £1 or per visit, and change rewards any time. Nothing to reprint.',
  },
  {
    title: 'Fair at the till',
    body: 'Staff PINs on every scan and a dispute log, so points stay accurate.',
  },
  {
    title: "See what's working",
    body: 'Visits, rewards claimed and your most popular rewards, all in one dashboard.',
  },
];

const DoMoreWithLoyalty = () => (
  <section id="digital" className="relative overflow-hidden border-y border-border bg-surface px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-7 sm:gap-9">
      <div className="flex max-w-[680px] flex-col gap-2.5 sm:gap-3">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">Do more with loyalty</span>
        <h2 className="m-0 text-balance text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] tracking-[-.025em] text-text-primary">
          Your whole loyalty programme, in one place.
        </h2>
        <p className="m-0 text-[clamp(15.5px,1.3vw,18px)] leading-[1.6] text-text-secondary">
          Points, rewards, staff and customer records together, so you spend less time running loyalty and
          more time serving the people who keep coming back.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
        {DIGITAL_FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="glass-card flex items-start gap-3 rounded-2xl p-5 shadow-card transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:p-6"
          >
            {PLUS_ICON}
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-card-title text-text-primary">{feature.title}</span>
              <span className="text-body text-text-secondary">{feature.body}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const WALLET_POINTS = [
  'Points kept separately for every shop you visit.',
  'Rewards unlock the moment your balance covers them, with no hunting.',
  'Redeeming gives you a short code, valid ten minutes, shown at the counter.',
];

const WalletShowcase = () => (
  <section id="wallet" className="relative overflow-hidden bg-canvas px-4 py-14 sm:px-10 sm:py-20">
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
          <span className="text-label uppercase tracking-[.09em] text-text-muted">For your customers</span>
          <h2 className="m-0 max-w-[520px] text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.1] tracking-[-.025em] text-text-primary">
            A reason to come back, in their pocket.
          </h2>
          <p className="m-0 max-w-[520px] text-[clamp(16px,1.3vw,18px)] leading-[1.6] text-text-secondary">
            One code works at every shop on LoyaltyLabs. Points stack up per shop, rewards appear the moment
            they can afford them, and redeeming gives them a code to show at the counter.
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
  <section id="shops" className="relative overflow-hidden border-y border-border bg-surface px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
      <div className="glass-card-tint flex flex-col gap-3.5 rounded-2xl p-6 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:gap-4 sm:p-7">
        <span className="text-label uppercase tracking-[.09em] text-[#4E6B60]">For shops</span>
        <span className="text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.15] tracking-[-.02em] text-text-primary">
          Bring people back.
        </span>
        <span className="text-body leading-[1.55] text-[#3E4A44]">
          Set your points rate and rewards in an afternoon. Scan from the phone in your apron, with no card
          readers and no new till. Six weeks free to see if it brings people back.
        </span>
        <Link
          to="/sign-up?as=store"
          className="inline-flex h-12 w-fit items-center rounded-[10px] bg-primary px-5 text-body font-semibold text-on-primary hover:bg-primary-hover"
        >
          Start 6 weeks free
        </Link>
      </div>
      <div className="glass-card flex flex-col gap-3.5 rounded-2xl p-6 shadow-card transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:gap-4 sm:p-7">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">For customers</span>
        <span className="text-[clamp(22px,2.4vw,28px)] font-semibold leading-[1.15] tracking-[-.02em] text-text-primary">
          Your local, in your pocket.
        </span>
        <span className="text-body leading-[1.55] text-text-secondary">
          One code for every shop on LoyaltyLabs. Free, nothing to download, and your points are always on
          your phone.
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

// Mirrors the tiles on the real owner dashboard (OwnerDashboard.jsx).
// Figures are illustrative and labelled as an example on the page.
const EXAMPLE_KPIS = [
  { label: 'Visits', value: '1,318' },
  { label: 'Redemptions', value: '164' },
  { label: 'Fulfilment rate', value: '96%' },
  { label: 'Points issued', value: '48,200' },
  { label: 'Points redeemed', value: '19,400' },
  { label: 'Fulfilled', value: '157' },
];

const EXAMPLE_TOP_REWARDS = [
  { title: 'Free flat white', count: 92 },
  { title: 'Pastry of the day', count: 47 },
  { title: '£2 off any loaf', count: 25 },
];

const AnalyticsShowcase = () => (
  <section id="analytics" className="relative overflow-hidden bg-canvas px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-7 sm:gap-9">
      <div className="flex max-w-[640px] flex-col gap-2.5 sm:gap-3">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">Your dashboard</span>
        <h2 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] tracking-[-.025em] text-text-primary">
          See what&apos;s bringing people back.
        </h2>
        <p className="m-0 text-[clamp(15.5px,1.3vw,18px)] leading-[1.6] text-text-secondary">
          Visits, rewards claimed, points issued and redeemed, and which rewards your customers come back
          for. No spreadsheets, and nothing to count by hand.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3.5 sm:p-5">
        <span className="font-mono text-[11.5px] uppercase tracking-[.08em] text-text-muted">Example shop · illustrative figures</span>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {EXAMPLE_KPIS.map((kpi) => (
              <div key={kpi.label} className="glass-card flex flex-col gap-1 rounded-xl p-3.5">
                <span className="text-label text-text-muted">{kpi.label}</span>
                <span className="tabular-nums text-card-title text-text-primary">{kpi.value}</span>
              </div>
            ))}
          </div>
          <div className="glass-card flex flex-col rounded-xl p-4 sm:p-5">
            <span className="text-card-title text-text-primary">Top rewards</span>
            {EXAMPLE_TOP_REWARDS.map((reward, index) => (
              <div key={reward.title} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-0">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-tint tabular-nums text-label text-primary">
                  {index + 1}
                </span>
                <span className="flex-1 text-body text-text-primary">{reward.title}</span>
                <span className="tabular-nums text-body-sm text-text-secondary">{reward.count} redeemed</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const PLAN_FEATURES = [
  'Points per £1 or per visit',
  'Rewards you set and change any time',
  'Staff PINs for the till',
  'Visits and rewards dashboard',
];

const PLANS = [
  {
    id: 'one_shop',
    name: '1 Shop',
    price: '£5.99',
    period: '/ month',
    highlight: false,
    note: 'For a single shop. Cancel any month.',
    features: ['1 shop', 'Unlimited customers', ...PLAN_FEATURES],
  },
  {
    id: 'three_shops',
    name: '3 Shops',
    price: '£15.99',
    period: '/ month',
    highlight: true,
    note: 'For owners with a few sites.',
    features: ['Up to 3 shops', 'Unlimited customers', ...PLAN_FEATURES],
  },
  {
    id: 'five_shops',
    name: '5 Shops',
    price: '£25.99',
    period: '/ month',
    highlight: false,
    note: 'Our lowest price per shop.',
    features: ['Up to 5 shops', 'Unlimited customers', ...PLAN_FEATURES],
  },
];

const Pricing = () => (
  <section id="pricing" className="relative overflow-hidden border-y border-border bg-surface px-4 py-14 sm:px-10 sm:py-20">
    <GlowBackdrop />
    <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-6 sm:gap-8">
      <div className="flex max-w-[620px] flex-col gap-2.5 sm:gap-3">
        <span className="text-label uppercase tracking-[.09em] text-text-muted">Pricing for shops</span>
        <h2 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-[1.15] tracking-[-.025em] text-text-primary">
          Six weeks free. Then see if it&apos;s worth it.
        </h2>
        <p className="m-0 text-[clamp(15.5px,1.3vw,18px)] leading-[1.6] text-text-secondary">
          Every shop gets its first six weeks free, long enough to watch regulars come back. After that, plans
          start at £5.99 a month with no limit on customers. Always free for customers.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-3.5 sm:grid-cols-3 sm:gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col gap-3.5 rounded-2xl p-6 transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-lift sm:gap-4 sm:p-7 ${
              plan.highlight ? 'glass-card-tint shadow-lift' : 'glass-card shadow-card'
            }`}
            style={plan.highlight ? { borderColor: 'var(--color-primary)' } : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-card-title text-text-primary">{plan.name}</span>
              {plan.highlight && (
                <span className="rounded-pill bg-accent px-2.5 py-1 font-mono text-[11.5px] uppercase tracking-[.06em] text-accent-text">
                  Best value
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1.5">
                <span className="tabular-nums text-[clamp(30px,3.2vw,38px)] font-semibold tracking-[-.03em] text-text-primary">
                  {plan.price}
                </span>
                <span className="text-body-sm text-text-muted">{plan.period} + VAT</span>
              </div>
              <span className="text-body-sm text-text-secondary">{plan.note}</span>
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
              to={`/sign-up?as=store&plan=${plan.id}`}
              className={`mt-auto inline-flex h-12 items-center justify-center rounded-[10px] text-body font-semibold ${
                plan.highlight
                  ? 'bg-primary text-on-primary hover:bg-primary-hover'
                  : 'border border-[#CBDAD4] text-primary-hover hover:bg-primary-tint'
              }`}
            >
              Start 6 weeks free
            </Link>
          </div>
        ))}
      </div>

      <p className="m-0 max-w-[720px] text-body-sm text-text-muted">
        Every plan includes unlimited customers. Prices exclude VAT.
      </p>
    </div>
  </section>
);

const ClosingCta = () => (
  <section className="bg-primary px-4 py-14 sm:px-10 sm:py-20">
    <div className="mx-auto flex max-w-[1200px] flex-col items-stretch gap-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-2.5 text-center sm:flex-1 sm:basis-[380px] sm:gap-3 sm:text-left">
        <h2 className="m-0 text-[clamp(26px,3.6vw,42px)] font-semibold leading-[1.15] tracking-[-.028em] text-on-primary">
          Go digital. Do more with loyalty.
        </h2>
        <p className="m-0 mx-auto max-w-[460px] text-[clamp(15.5px,1.3vw,18px)] leading-[1.55] text-white/78 sm:mx-0">
          Six weeks free for shops. Always free for customers.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
        <Link
          to="/sign-up?as=store"
          className="inline-flex h-[52px] items-center justify-center rounded-[10px] bg-canvas px-6 text-body font-semibold text-primary-pressed hover:bg-white"
        >
          Start 6 weeks free
        </Link>
        <Link
          to="/sign-up"
          className="inline-flex h-[52px] items-center justify-center rounded-[10px] border border-white/50 px-5 text-body font-semibold text-on-primary hover:bg-white/10"
        >
          Join as a customer
        </Link>
      </div>
    </div>
  </section>
);

// Only links that go somewhere real: sections on this page (href) or app
// routes (to).
const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how' },
      { label: 'Why go digital', href: '#digital' },
      { label: 'For customers', href: '#wallet' },
      { label: 'Shop dashboard', href: '#analytics' },
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
      { label: 'Privacy policy', to: '/privacy' },
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
          <span className="max-w-[28ch] text-body-sm text-text-muted">Digital loyalty for UK independents.</span>
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
      <DoMoreWithLoyalty />
      <WalletShowcase />
      <ForShopsForCustomers />
      <AnalyticsShowcase />
      <Pricing />
      <ClosingCta />
      <Footer />
    </div>
  );
};

export default LandingPage;
