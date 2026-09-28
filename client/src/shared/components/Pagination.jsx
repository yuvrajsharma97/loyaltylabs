import Icon from './Icon';

// Page numbers to show around the current page, with gaps as 'gap':
// e.g. [1, 'gap', 4, 5, 6, 'gap', 12].
function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((page) => pages.add(page));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((page) => pages.add(page));

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push('gap');
    items.push(page);
  });
  return items;
}

const PageButton = ({ isActive, children, ...props }) => (
  <button
    type="button"
    aria-current={isActive ? 'page' : undefined}
    className={`flex h-9 min-w-9 items-center justify-center rounded-button px-2 tabular-nums text-label transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
      isActive ? 'bg-primary text-on-primary' : 'text-text-secondary hover:bg-primary-tint hover:text-primary'
    }`}
    {...props}
  >
    {children}
  </button>
);

// Shared list footer: "21-40 of 87 transactions" plus Prev / page numbers /
// Next. Numbers collapse to "Page 2 of 5" on phones. Renders only the count
// when everything fits on one page.
const Pagination = ({ pagination, onPageChange, itemLabel = 'items', isDisabled = false, className = '' }) => {
  if (!pagination || pagination.total === 0) return null;

  const { page, limit, total, totalPages } = pagination;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  // itemLabel is plural ("shops"); drop the trailing "s" for a single item.
  const label = total === 1 ? itemLabel.replace(/s$/, '') : itemLabel;

  const goTo = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    // The list's ScrollPanel scrolls itself back to the top for the new page.
    onPageChange(nextPage);
  };

  return (
    // One row at every width so it takes as little of the list's height as possible.
    <nav aria-label="Pagination" className={`flex items-center justify-between gap-3 ${className}`}>
      <p className="tabular-nums text-label text-text-muted wide:text-body-sm">
        {first}–{last} of {total} {label}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <PageButton aria-label="Previous page" disabled={isDisabled || page <= 1} onClick={() => goTo(page - 1)}>
            <Icon name="chevron_left" />
          </PageButton>

          <span className="px-1 tabular-nums text-label text-text-secondary wide:hidden">
            {page} / {totalPages}
          </span>

          <div className="hidden items-center gap-1 wide:flex">
            {getPageItems(page, totalPages).map((item, index) =>
              item === 'gap' ? (
                <span key={`gap-${index}`} className="px-1 text-text-muted">
                  …
                </span>
              ) : (
                <PageButton
                  key={item}
                  isActive={item === page}
                  disabled={isDisabled}
                  aria-label={`Page ${item}`}
                  onClick={() => goTo(item)}
                >
                  {item}
                </PageButton>
              )
            )}
          </div>

          <PageButton aria-label="Next page" disabled={isDisabled || page >= totalPages} onClick={() => goTo(page + 1)}>
            <Icon name="chevron_right" />
          </PageButton>
        </div>
      )}
    </nav>
  );
};

export default Pagination;
