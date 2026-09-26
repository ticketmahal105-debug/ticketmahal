import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, Clock, Calendar, Globe, Award, Play, Film, User, 
  MapPin, Ticket, ChevronLeft, Share2, Heart, CheckCircle2, X 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dummyMovies, getMovieBySlug } from '../data/dummyMovies';
import WishlistButton from '../components/wishlist/WishlistButton';

export default function EventDetailsPage() {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [selectedShowtime, setSelectedShowtime] = useState('07:30 PM');
  const [ticketQuantity, setTicketQuantity] = useState(2);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const foundMovie = getMovieBySlug(slug) || dummyMovies[0];
    setMovie(foundMovie);

    // Update document SEO Title & Description dynamically
    if (foundMovie) {
      document.title = foundMovie.seoTitle || `${foundMovie.title} – Showtimes & Tickets | TicketMahal`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', foundMovie.seoDescription || foundMovie.shortDescription);
      }
    }
  }, [slug]);

  if (!movie) return null;

  const showtimes = ['04:15 PM', '07:30 PM', '09:45 PM', '11:15 PM'];

  const handleBookTickets = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
    }, 4000);
  };

  return (
    <div className="bg-ticket-ivory min-h-screen text-ticket-charcoal flex flex-col justify-between selection:bg-ticket-burgundy/20 selection:text-ticket-burgundy">
      <Navbar />

      <main className="flex-1 pt-36 sm:pt-40 md:pt-44 lg:pt-36 pb-16">
        {/* Breadcrumb Header */}
        <div className="max-w-7xl mx-auto px-6 mb-6 relative z-10">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-ticket-white/90 backdrop-blur-sm border border-ticket-beige rounded-full text-xs font-bold tracking-wider uppercase text-ticket-charcoal/80 hover:text-ticket-burgundy hover:bg-white hover:border-ticket-gold/50 shadow-xs transition-all duration-300"
          >
            <ChevronLeft size={16} /> Back to Browse
          </Link>
        </div>

        {/* HERO BANNER & MOVIE HEADER */}
        <div className="relative w-full overflow-hidden bg-ticket-charcoal text-white">
          {/* Backdrop Image with gradient overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src={movie.backdrop || movie.image} 
              alt={movie.title}
              className="w-full h-full object-cover opacity-25 filter blur-sm scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ticket-charcoal via-ticket-charcoal/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Poster Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-4 flex justify-center"
            >
              <div className="relative group w-64 sm:w-72 md:w-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src={movie.image} 
                  alt={movie.title}
                  className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badge Overlay */}
                <div className="absolute top-4 left-4 bg-ticket-burgundy text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full shadow-lg">
                  {movie.badge || "FEATURED"}
                </div>

                {/* Trailer Button Overlay */}
                <button 
                  onClick={() => setShowTrailerModal(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-ticket-gold/90 text-ticket-charcoal flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                    <Play size={28} className="fill-current ml-1" />
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Movie Details Summary */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-8 text-left space-y-6"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="bg-ticket-gold/20 text-ticket-gold px-3 py-1 rounded-full border border-ticket-gold/30">
                  {movie.year}
                </span>
                <span className="bg-white/10 text-white/90 px-3 py-1 rounded-full border border-white/10">
                  {movie.certificate}
                </span>
                <span className="bg-white/10 text-white/90 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                  <Clock size={13} /> {movie.runtime}
                </span>
                <span className="bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1.5">
                  <Star size={13} className="fill-amber-300 text-amber-300" /> IMDb {movie.imdbRating}
                </span>
              </div>

              <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                {movie.title}
              </h1>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genre.split(',').map((g) => (
                  <span key={g} className="text-xs uppercase tracking-wider px-3 py-1 bg-white/5 border border-white/10 rounded-md text-white/80 font-medium">
                    {g.trim()}
                  </span>
                ))}
              </div>

              {/* Short Description */}
              <p className="text-base sm:text-lg text-white/80 font-light leading-relaxed max-w-3xl">
                {movie.shortDescription}
              </p>

              {/* Quick Specs Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-b border-white/10 py-4 text-xs">
                <div>
                  <span className="text-white/40 block font-semibold uppercase tracking-wider mb-1">Release Date</span>
                  <span className="text-white font-medium">{movie.releaseDate}</span>
                </div>
                <div>
                  <span className="text-white/40 block font-semibold uppercase tracking-wider mb-1">Language</span>
                  <span className="text-white font-medium">{movie.language}</span>
                </div>
                <div>
                  <span className="text-white/40 block font-semibold uppercase tracking-wider mb-1">Country</span>
                  <span className="text-white font-medium">{movie.country}</span>
                </div>
                <div>
                  <span className="text-white/40 block font-semibold uppercase tracking-wider mb-1">Venue</span>
                  <span className="text-ticket-gold font-medium">{movie.venue}</span>
                </div>
              </div>

              {/* Trailer Action Button */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={() => setShowTrailerModal(true)}
                  className="px-6 py-3 bg-ticket-gold text-ticket-charcoal font-semibold rounded-xl shadow-lg hover:bg-amber-300 transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <Play size={18} className="fill-current" /> Watch Trailer
                </button>

                <WishlistButton 
                  eventId={event?.id || movie?.id}
                  className="bg-white/10 text-white hover:bg-white/20 p-3 rounded-xl border border-white/10"
                />
              </div>

            </motion.div>

          </div>
        </div>

        {/* MAIN CONTENT GRID (Specs & Showtimes) */}
        <div className="max-w-7xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
          
          {/* Left Column: Full Metadata Specs */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* Cast & Crew Section */}
            <div className="bg-ticket-white border border-ticket-beige/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="font-playfair text-2xl font-bold text-ticket-charcoal border-b border-ticket-beige/60 pb-3 flex items-center gap-2">
                <User size={22} className="text-ticket-burgundy" /> Cast & Key Crew
              </h3>

              {/* Director */}
              <div>
                <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-1">Director</span>
                <span className="text-base font-semibold text-ticket-charcoal">{movie.director}</span>
              </div>

              {/* Writers */}
              <div>
                <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-1">Writers</span>
                <span className="text-sm font-medium text-ticket-charcoal/90">{movie.writers}</span>
              </div>

              {/* Based On */}
              {movie.basedOn && (
                <div>
                  <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-1">Based On</span>
                  <span className="text-sm font-medium text-ticket-charcoal/80 italic">{movie.basedOn}</span>
                </div>
              )}

              {/* Cast List */}
              <div>
                <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-3">Starring Cast</span>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.split(',').map((actor) => (
                    <span 
                      key={actor}
                      className="px-3.5 py-1.5 bg-ticket-ivory border border-ticket-beige rounded-xl text-xs font-semibold text-ticket-charcoal hover:border-ticket-burgundy/40 transition-colors"
                    >
                      {actor.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Production & Distribution Info */}
            <div className="bg-ticket-white border border-ticket-beige/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <h3 className="font-playfair text-2xl font-bold text-ticket-charcoal border-b border-ticket-beige/60 pb-3 flex items-center gap-2">
                <Film size={22} className="text-ticket-burgundy" /> Production & Release Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-1">Production Company</span>
                  <span className="font-semibold text-ticket-charcoal">{movie.productionCompany}</span>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-1">Distributor</span>
                  <span className="font-semibold text-ticket-charcoal">{movie.distributor}</span>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-1">IMDb Reference</span>
                  <span className="font-mono text-xs text-ticket-burgundy bg-ticket-burgundy/5 px-2.5 py-1 rounded border border-ticket-burgundy/20 inline-block">
                    {movie.imdbId !== '—' ? movie.imdbId : 'tt33764258'}
                  </span>
                </div>

                <div>
                  <span className="text-xs uppercase tracking-wider text-ticket-charcoal/50 font-bold block mb-1">Age Rating</span>
                  <span className="font-semibold text-ticket-charcoal">{movie.certificate}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Showtime Selection & Instant Booking Card */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-ticket-white border border-ticket-beige rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-ticket-beige/60 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-ticket-burgundy font-bold block">Reserve Seats</span>
                  <h4 className="font-playfair text-2xl font-extrabold text-ticket-charcoal">Book Showtimes</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ticket-charcoal/50 block">From</span>
                  <span className="font-playfair text-2xl font-bold text-ticket-burgundy">
                    {movie.startingPrice} {movie.currency}
                  </span>
                </div>
              </div>

              {/* Location venue */}
              <div className="flex items-start gap-3 bg-ticket-ivory p-3.5 rounded-2xl border border-ticket-beige/60">
                <MapPin size={20} className="text-ticket-burgundy mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-ticket-charcoal block">{movie.venue}</span>
                  <span className="text-xs text-ticket-charcoal/60">{movie.city}, UAE</span>
                </div>
              </div>

              {/* Showtimes Picker */}
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-ticket-charcoal/60 block mb-3">
                  Select Showtime ({movie.releaseDate})
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {showtimes.map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedShowtime(st)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 ${
                        selectedShowtime === st
                          ? 'bg-ticket-burgundy text-white shadow-md'
                          : 'bg-ticket-ivory text-ticket-charcoal border border-ticket-beige hover:border-ticket-burgundy/40'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Picker */}
              <div>
                <label className="text-xs uppercase tracking-wider font-bold text-ticket-charcoal/60 block mb-3">
                  Number of Tickets
                </label>
                <div className="flex items-center justify-between bg-ticket-ivory border border-ticket-beige rounded-xl p-2">
                  <button 
                    onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                    className="w-10 h-10 rounded-lg bg-ticket-white text-ticket-charcoal font-bold text-lg hover:bg-ticket-beige/50 transition-colors flex items-center justify-center shadow-sm"
                  >
                    -
                  </button>
                  <span className="font-bold text-ticket-charcoal text-base">{ticketQuantity} Tickets</span>
                  <button 
                    onClick={() => setTicketQuantity(ticketQuantity + 1)}
                    className="w-10 h-10 rounded-lg bg-ticket-white text-ticket-charcoal font-bold text-lg hover:bg-ticket-beige/50 transition-colors flex items-center justify-center shadow-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-ticket-ivory/80 p-4 rounded-2xl border border-ticket-beige/60 flex items-center justify-between text-sm">
                <span className="font-medium text-ticket-charcoal/70">Total Amount</span>
                <span className="font-playfair text-xl font-bold text-ticket-burgundy">
                  {movie.startingPrice * ticketQuantity} {movie.currency}
                </span>
              </div>

              {/* Book Button */}
              <button
                onClick={handleBookTickets}
                className="w-full py-4 bg-ticket-burgundy text-white font-bold rounded-2xl shadow-lg hover:bg-ticket-burgundy/90 transition-all duration-300 flex items-center justify-center gap-2 text-base tracking-wide"
              >
                <Ticket size={20} /> Reserve Tickets Now
              </button>

              {/* Success Alert */}
              <AnimatePresence>
                {bookingSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                    Seats selected! {ticketQuantity} tickets reserved for {selectedShowtime}.
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>

      </main>

      {/* TRAILER MODAL */}
      <AnimatePresence>
        {showTrailerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-ticket-charcoal rounded-3xl overflow-hidden shadow-2xl p-6 text-white border border-white/10"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-widest text-ticket-gold font-semibold">Official Trailer</span>
                  <h3 className="font-playfair text-2xl font-bold">{movie.title}</h3>
                </div>
                <button 
                  onClick={() => setShowTrailerModal(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video placeholder display */}
              <div className="relative aspect-video bg-black rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-white/5">
                <Play size={48} className="text-ticket-gold mb-4 animate-pulse" />
                <h4 className="text-lg font-bold mb-2">{movie.trailer}</h4>
                <p className="text-xs text-white/60 max-w-md">
                  Demonstration stream for {movie.title} ({movie.year}). Direct trailer stream from {movie.distributor}.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
