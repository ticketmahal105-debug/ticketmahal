const ProfileSkeleton = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Skeleton */}
        <div className="w-full md:w-[280px] shrink-0">
          <div className="bg-white/50 border border-ticket-beige/40 rounded-3xl p-4 flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-ticket-beige/30 rounded-2xl" />
            ))}
            <div className="h-[1px] bg-beige/40 my-2" />
            <div className="h-12 w-full bg-ticket-beige/30 rounded-2xl" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Summary Skeleton */}
          <div className="bg-white/50 border border-ticket-beige/40 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-beige/40" />
            <div className="flex-1 flex flex-col gap-3 w-full items-center md:items-start">
              <div className="h-8 w-48 bg-beige/40 rounded-lg" />
              <div className="h-4 w-32 bg-ticket-beige/30 rounded-md" />
              <div className="h-6 w-36 bg-ticket-beige/30 rounded-full mt-2" />
            </div>
          </div>

          {/* Personal Info Skeleton */}
          <div className="bg-white/50 border border-ticket-beige/40 rounded-2xl p-6">
            <div className="h-6 w-48 bg-beige/40 rounded-lg mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-ticket-beige/30 rounded mb-2" />
                  <div className="h-10 w-full bg-beige/20 rounded-xl" />
                </div>
              ))}
            </div>
          </div>

          {/* Account Info Skeleton */}
          <div className="bg-white/50 border border-ticket-beige/40 rounded-2xl p-6">
             <div className="h-6 w-48 bg-beige/40 rounded-lg mb-6" />
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i}>
                    <div className="h-3 w-20 bg-ticket-beige/30 rounded mb-2" />
                    <div className="h-5 w-24 bg-beige/20 rounded" />
                  </div>
                ))}
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
