export default function Card({ className = '', hoverable = false, children, ...props }) {
  const hoverClasses = hoverable
    ? 'elevation-l1 hover:elevation-l2 hover:scale-[1.015] transition-all duration-300'
    : 'shadow-sm';
  return (
    <div
      className={`bg-surface-container-lowest border border-outline-variant p-xl rounded-xl ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
