import Icon from './Icon';

const SearchInput = ({ className = '', ...props }) => {
  return (
    <div className="flex h-11 items-center gap-2 rounded-pill border border-border bg-surface px-4">
      <Icon name="search" className="text-text-muted" />
      <input
        type="search"
        className={`h-full flex-1 bg-transparent text-body text-text-primary outline-none placeholder:text-text-muted ${className}`}
        {...props}
      />
    </div>
  );
};

export default SearchInput;
