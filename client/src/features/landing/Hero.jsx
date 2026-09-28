import { useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'How it works', sub: ['Collect points', 'Claim rewards', 'Shop directory'] },
  { label: 'For shops', sub: ['Set up stamps', 'Point of sale', 'Shop dashboard'] },
  { label: 'Company', sub: ['Our story', 'Open roles', 'Reach us'] },
  { label: 'Pricing', sub: [] },
];

const ARROW_ICON = (
  <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <path d="M4 9h9M9.5 5.5L13 9l-3.5 3.5" stroke="#1C1F16" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform duration-200"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const HeroNav = () => {
  const [openItem, setOpenItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="glass-chrome sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-14">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="block h-[22px] w-[22px] rounded-[6px] bg-primary" />
        <span className="text-card-title text-text-primary">LoyaltyLabs</span>
      </Link>

      <div className="hidden items-center gap-1 lg:flex">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => item.sub.length > 0 && setOpenItem(item.label)}
            onMouseLeave={() => setOpenItem(null)}
          >
            <button
              type="button"
              className="nav-item flex h-10 items-center gap-1.5 whitespace-nowrap rounded-button px-3 text-body-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-primary-tint hover:text-primary-hover"
            >
              {item.label}
              {item.sub.length > 0 && <ChevronIcon open={openItem === item.label} />}
            </button>
            {item.sub.length > 0 && openItem === item.label && (
              <div
                className="absolute left-0 top-full flex min-w-[180px] flex-col gap-0.5 rounded-xl border border-border bg-surface p-2 shadow-lift"
                style={{ animation: 'dropdown-in .2s ease-out' }}
              >
                {item.sub.map((sub) => (
                  <a
                    key={sub}
                    href="#0"
                    className="rounded-lg px-2.5 py-2 text-body-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-primary-tint hover:text-primary-hover"
                  >
                    {sub}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <Link
          to="/sign-in"
          className="inline-flex h-10 items-center rounded-button border border-[#CBDAD4] px-3.5 text-body-sm font-semibold text-primary-hover hover:bg-primary-tint"
        >
          Sign in
        </Link>
        <Link
          to="/sign-up"
          className="inline-flex h-10 items-center rounded-button bg-primary px-4 text-body-sm font-semibold text-on-primary hover:bg-primary-hover"
        >
          Join for free
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen((value) => !value)}
        aria-label="Menu"
        aria-expanded={mobileOpen}
        className="relative flex h-11 w-11 items-center justify-center text-text-primary lg:hidden"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="absolute transition-all duration-300"
          style={{
            opacity: mobileOpen ? 0 : 1,
            transform: mobileOpen ? 'rotate(90deg) scale(.7)' : 'rotate(0deg) scale(1)',
          }}
        >
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="absolute transition-all duration-300"
          style={{
            opacity: mobileOpen ? 1 : 0,
            transform: mobileOpen ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(.7)',
          }}
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <div
        className="absolute inset-x-3 top-[70px] z-30 transition-[opacity,transform] duration-300 lg:hidden"
        style={{
          opacity: mobileOpen ? 1 : 0,
          transform: mobileOpen ? 'translateY(0)' : 'translateY(-12px)',
          pointerEvents: mobileOpen ? 'auto' : 'none',
        }}
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-dialog">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <div className="text-card-title text-text-primary">{item.label}</div>
              {item.sub.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5 pl-3.5">
                  {item.sub.map((sub) => (
                    <a key={sub} href="#0" className="text-body-sm text-text-muted hover:text-primary-hover">
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2.5 border-t border-border pt-4">
            <Link
              to="/sign-in"
              className="flex h-[46px] flex-1 items-center justify-center rounded-button border border-[#CBDAD4] text-body-sm font-semibold text-primary-hover"
            >
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="flex h-[46px] flex-1 items-center justify-center rounded-button bg-primary text-body-sm font-semibold text-on-primary hover:bg-primary-hover"
            >
              Join for free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const SIDE_CARD_HEIGHT =
  'h-[clamp(100px,20vh,129px)] sm:h-[clamp(100px,20vh,148px)] md:h-[clamp(100px,20vh,165px)] ' +
  'lg:h-[clamp(100px,20vh,181px)] xl:h-[clamp(100px,20vh,194px)] 2xl:h-[clamp(100px,20vh,205px)]';
const CENTER_CARD_HEIGHT =
  'h-[clamp(120px,24vh,150px)] sm:h-[clamp(120px,24vh,172px)] md:h-[clamp(120px,24vh,192px)] ' +
  'lg:h-[clamp(120px,24vh,210px)] xl:h-[clamp(120px,24vh,226px)] 2xl:h-[clamp(120px,24vh,238px)]';

const FloatingCards = () => (
  <div
    className="relative z-[5] mx-auto flex w-full flex-none items-end justify-center px-4 pb-6 pt-10 sm:pb-8 sm:pt-12 md:pb-9 md:pt-14 lg:pb-10 lg:pt-16"
    style={{ pointerEvents: 'none' }}
  >
    <div
      className={`hidden w-auto flex-col justify-between rounded-[18px] border border-border bg-surface p-3.5 shadow-lift sm:flex ${SIDE_CARD_HEIGHT}`}
      style={{ aspectRatio: '1.586', animation: 'float-left 9s ease-in-out infinite' }}
    >
      <div className="h-[clamp(20px,2.2vw,26px)] w-[clamp(26px,3vw,36px)] rounded-[5px] bg-primary-tint" />
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-full bg-primary" />
        <div className="-ml-[11px] h-4 w-4 rounded-full bg-[#CBDAD4]" />
      </div>
    </div>

    <div
      className={`relative z-[2] flex w-auto flex-col justify-between overflow-hidden rounded-[20px] p-3 ${CENTER_CARD_HEIGHT}`}
      style={{
        aspectRatio: '1.586',
        margin: '0 clamp(-38px,-3vw,-22px)',
        background: 'linear-gradient(150deg, #2B5748, #1C3A2E)',
        boxShadow: '0 40px 70px -24px rgba(28,58,46,.5)',
        animation: 'float-center 7s ease-in-out infinite',
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[38%]"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.16) 50%, rgba(255,255,255,0) 100%)',
          animation: 'sheen 7s ease-in-out infinite',
        }}
      />
      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[11.5px] font-medium uppercase tracking-[.08em] text-white/80">Rewards</span>
        <span className="block h-5 w-5 rounded-[6px] bg-canvas" />
      </div>
      <div className="relative flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="h-1.5 w-[34%] rounded-[3px] bg-white/55" />
          <div className="h-1.5 w-1/5 rounded-[3px] bg-white/28" />
          <div className="h-1.5 w-1/5 rounded-[3px] bg-white/28" />
        </div>
        <span className="text-[clamp(15px,1.7vw,22px)] font-semibold leading-none tracking-[-.01em] text-canvas">
          2,480 pts
        </span>
      </div>
    </div>

    <div
      className={`hidden w-auto flex-col items-end justify-between rounded-[18px] border border-border bg-surface p-3.5 shadow-lift sm:flex ${SIDE_CARD_HEIGHT}`}
      style={{ aspectRatio: '1.586', animation: 'float-right 11s ease-in-out infinite' }}
    >
      <div className="h-[clamp(20px,2.2vw,26px)] w-[clamp(26px,3vw,36px)] rounded-[5px] bg-primary-tint" />
      <div className="flex items-center gap-1.5">
        <div className="flex h-[clamp(18px,2vw,24px)] w-[clamp(18px,2vw,24px)] items-center justify-center rounded-full bg-primary font-mono text-[clamp(9px,1vw,12px)] font-bold text-on-primary">
          10
        </div>
        <div className="-ml-[13px] h-[clamp(18px,2vw,24px)] w-[clamp(18px,2vw,24px)] rounded-full bg-[#CBDAD4]" />
      </div>
    </div>
  </div>
);

const Hero = () => (
  <section className="relative flex flex-col overflow-hidden bg-[#F5F7F8] sm:min-h-[100dvh]">
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: 'radial-gradient(120% 80% at 50% 0%, #FFFFFF 0%, #F5F7F8 46%, #E4EDEA 100%)' }}
    />
    <div
      className="pointer-events-none absolute inset-0"
      style={{ background: 'radial-gradient(52% 42% at 50% 76%, rgba(43,87,72,0.10) 0%, rgba(43,87,72,0) 72%)' }}
    />

    <HeroNav />

    <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-8 sm:px-6 sm:pt-10 md:px-8 md:pt-12 lg:px-10 lg:pt-14 xl:px-12 xl:pt-16 2xl:px-14">
      <div className="flex max-w-[1040px] flex-col items-center gap-3 text-center sm:gap-4 md:gap-5">
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11.5px] font-semibold uppercase tracking-[.09em] text-text-muted">
          <span>Any shop, one code</span>
          <span className="h-1 w-1 rounded-full bg-border-strong" />
          <span>Nothing to carry</span>
          <span className="h-1 w-1 rounded-full bg-border-strong" />
          <span>Free for customers</span>
        </div>
        <h1 className="m-0 max-w-[15ch] text-balance text-[34px] font-semibold leading-none tracking-[-.032em] text-text-primary sm:text-[40px] md:text-[46px] lg:text-[56px] xl:text-[64px] 2xl:text-[72px]">
          Get rewarded for <span className="text-primary">shopping local.</span>
        </h1>
        <p className="m-0 max-w-full text-pretty text-base leading-[1.55] text-text-secondary sm:max-w-[520px] md:max-w-[640px] md:text-[17px] lg:max-w-[740px] lg:text-lg xl:max-w-[820px] xl:text-[19px] 2xl:max-w-[860px]">
          Collect points and stamps at the independent shops you already visit, then claim rewards from your
          phone. Nothing to carry, nothing to download — sign up once and enjoy rewards every time you shop.
        </p>
        <div className="flex w-full flex-col items-stretch gap-3 pt-0.5 sm:w-auto sm:flex-row sm:items-center sm:justify-center">
          <Link
            to="/sign-up"
            className="inline-flex h-[52px] items-center justify-center rounded-[10px] bg-primary px-6 text-body font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
          >
            Join for free
          </Link>
          <Link
            to="/sign-up?as=store"
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[10px] border border-border-strong bg-surface px-5 text-body font-semibold text-text-primary transition-colors duration-150 hover:bg-canvas"
          >
            I run a shop {ARROW_ICON}
          </Link>
        </div>
      </div>

      <FloatingCards />
    </div>
  </section>
);

export default Hero;
