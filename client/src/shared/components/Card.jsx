const Card = ({ isInteractive = false, className = '', children, ...props }) => {
  const interactiveClasses = isInteractive
    ? 'transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-lift cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 shadow-card ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
