const BookingSkeleton = () => (
  <div className="flex flex-col gap-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-ticket-white border border-ticket-beige/60 rounded-2xl p-4 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className="w-full md:w-[200px] h-36 md:h-auto bg-beige/40 rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col justify-between gap-3 py-1">
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 bg-beige/40 rounded-full" />
            <div className="h-6 w-56 bg-beige/50 rounded-lg" />
            <div className="h-4 w-40 bg-ticket-beige/30 rounded-md" />
            <div className="h-4 w-32 bg-ticket-beige/30 rounded-md" />
          </div>
          <div className="flex gap-3">
            <div className="h-4 w-28 bg-ticket-beige/30 rounded-md" />
            <div className="h-4 w-20 bg-beige/20 rounded-md" />
          </div>
        </div>
        <div className="flex flex-col items-end justify-between gap-3 shrink-0">
          <div className="h-6 w-20 bg-beige/40 rounded-full" />
          <div className="h-5 w-24 bg-ticket-beige/30 rounded-md" />
          <div className="h-9 w-28 bg-beige/40 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export default BookingSkeleton;
