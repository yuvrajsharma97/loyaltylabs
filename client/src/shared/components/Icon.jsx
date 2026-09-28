// Renders a Material Symbols Outlined glyph by name, e.g. <Icon name="home" />.
// isFilled switches the "active" glyph weight used for the current nav item.
const Icon = ({ name, isFilled = false, className = '', style, ...props }) => {
  return (
    <span
      className={`material-symbols-outlined select-none ${isFilled ? 'filled' : ''} ${className}`}
      style={{ fontSize: '1.25em', lineHeight: 1, ...style }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  );
};

export default Icon;
