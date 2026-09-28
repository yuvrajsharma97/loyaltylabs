import Skeleton from './Skeleton';

// The list-loading shape used everywhere a transaction/activity list is
// fetching: avatar, two lines of text, and a trailing amount.
const SkeletonRow = () => {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
};

export default SkeletonRow;
