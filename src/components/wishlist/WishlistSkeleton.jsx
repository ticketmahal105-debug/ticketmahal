const WishlistSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-beige/60 rounded-3xl overflow-hidden flex flex-col">
          <div className="h-48 w-full bg-beige/40 shrink-0" />
          <div className="p-5 flex-1 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="h-4 w-20 bg-beige/30 rounded-md" />
              <div className="h-6 w-3/4 bg-beige/50 rounded-lg" />
              <div className="flex flex-col gap-2 mt-2">
                <div className="h-4 w-1/2 bg-beige/30 rounded-md" />
                <div className="h-4 w-2/3 bg-beige/20 rounded-md" />
              </div>
            </div>
            <div className="pt-4 border-t border-beige/40 flex justify-between">
              <div className="h-5 w-24 bg-beige/40 rounded-md" />
              <div className="h-5 w-16 bg-beige/30 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WishlistSkeleton;
