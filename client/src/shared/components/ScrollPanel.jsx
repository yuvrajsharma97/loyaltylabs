import { useEffect, useRef } from 'react';

// Scrollable container for a list, so a long list scrolls inside itself
// instead of stretching the page. Used inside a ListPage it fills the
// remaining screen height; pass a max-h-* class instead where it sits inside
// other content (e.g. a settings tab).
//
// resetKey: when it changes (new page / new filter) the panel jumps back to
// the top - pass something that identifies the current result set, such as
// the first item's id.
const ScrollPanel = ({ resetKey, className = '', children }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  return (
    // Vertical scrolling only - content wraps rather than ever scrolling sideways.
    <div ref={panelRef} className={`scroll-thin min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain ${className}`}>
      {children}
    </div>
  );
};

export default ScrollPanel;
