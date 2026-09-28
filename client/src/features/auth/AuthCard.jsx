const AuthCard = ({ title, subtitle, children }) => (
  <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
    <div className="w-full max-w-sm rounded-card border border-border bg-surface p-6 shadow-card">
      <h1 className="text-page-title text-text-primary">{title}</h1>
      {subtitle && <p className="mt-1 text-body-sm text-text-secondary">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </div>
);

export default AuthCard;
