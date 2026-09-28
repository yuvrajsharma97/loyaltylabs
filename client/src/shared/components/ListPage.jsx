// Page layout for list screens: exactly the height of the app's content area
// (the shell is 100dvh), a fixed header area (title, filters), then a list
// that fills the remaining height and scrolls inside itself, then a footer
// (pagination) pinned underneath.
//
//   <ListPage header={...} footer={<Pagination ... />}>
//     <ScrollPanel className="flex-1">...rows...</ScrollPanel>
//   </ListPage>
//
// If the header grows taller than the screen (lots of summary content), the
// list keeps a usable minimum height and the page itself scrolls instead.
const ListPage = ({ header, footer, maxWidthClassName = 'max-w-2xl', children }) => (
  <div className={`mx-auto flex h-full flex-col px-4 pb-3 pt-4 rail:pb-6 rail:pt-6 ${maxWidthClassName}`}>
    {header && <div className="shrink-0">{header}</div>}
    <div className="mt-4 flex min-h-48 flex-1 flex-col">{children}</div>
    {footer && <div className="shrink-0 pt-3">{footer}</div>}
  </div>
);

export default ListPage;
