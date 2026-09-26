import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, ChevronRight, Film, Search, Filter } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dummyMovies } from '../data/dummyMovies';
import WishlistButton from '../components/wishlist/WishlistButton';

const allCategoriesList = [
  { id: 'movies-cinema', name: 'Movies & Cinema' },
  { id: 'concerts', name: 'Concerts' },
  { id: 'theatre-shows', name: 'Theatre & Shows' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'sports', name: 'Sports' },
  { id: 'family-attractions', name: 'Family Attractions' },
  { id: 'dining-experiences', name: 'Dining Experiences' },
  { id: 'festivals', name: 'Festivals' },
];

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [activeTab, setActiveTab] = useState(categorySlug || 'movies-cinema');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    if (categorySlug) {
      setActiveTab(categorySlug);
    }
  }, [categorySlug]);

  const activeCategoryObj = allCategoriesList.find(c => c.id === activeTab) || allCategoriesList[0];

  // All 5 dummy movies are present under every category as requested!
  const filteredMovies = dummyMovies.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.cast.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-ticket-ivory min-h-screen text-ticket-charcoal flex flex-col justify-between selection:bg-ticket-burgundy/20 selection:text-ticket-burgundy">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        
        {/* Category Hero Header */}
        <div className="max-w-7xl mx-auto px-6 mb-10 text-left">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-ticket-burgundy mb-2 block">
            Category Showcase
          </span>
          <h1 className="font-playfair text-4xl sm:text-5xl font-extrabold text-ticket-charcoal tracking-tight">
            {activeCategoryObj.name}
          </h1>
          <p className="text-sm sm:text-base text-ticket-charcoal/60 mt-2 max-w-2xl font-light">
            Explore feature movies, showtimes, and live premiering experiences in {activeCategoryObj.name}.
          </p>
        </div>

        {/* Category Tabs & Search Bar */}
        <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Scrollable Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 w-full md:w-auto">
            {allCategoriesList.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                  activeTab === cat.id
                    ? 'bg-ticket-burgundy text-white shadow-md'
                    : 'bg-ticket-white text-ticket-charcoal/70 border border-ticket-beige hover:border-ticket-burgundy/40'
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Search Filter Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ticket-charcoal/40" size={16} />
            <input 
              type="text"
              placeholder="Search category movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-ticket-white border border-ticket-beige rounded-2xl text-xs font-medium outline-none focus:border-ticket-burgundy transition-colors"
            />
          </div>
        </div>

        {/* MOVIES & EVENTS GRID */}
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {filteredMovies.map((movie, idx) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group bg-ticket-white rounded-2xl overflow-hidden border border-ticket-beige/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Poster Container - 3:4 Ratio with Uncropped Fit */}
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                <img
                  src={movie.image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40 pointer-events-none select-none"
                />
                <img 
                  src={movie.image} 
                  alt={movie.title}
                  className="relative z-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                
                {/* Badge */}
                <span className="absolute top-3 left-3 bg-ticket-burgundy text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                  {movie.badge || 'FEATURED'}
                </span>

                {/* Wishlist Button */}
                <div className="absolute top-3 right-3">
                  <WishlistButton eventId={movie.id} className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60" />
                </div>

                {/* Rating */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                  <Star size={13} className="fill-amber-300" /> IMDb {movie.imdbRating}
                </div>

                {/* Runtime */}
                <div className="absolute bottom-3 right-3 text-[11px] text-white/90 font-medium bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
                  {movie.runtime}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-ticket-burgundy uppercase tracking-wider mb-1">
                    <span>{movie.certificate}</span>
                    <span>•</span>
                    <span>{movie.year}</span>
                  </div>

                  <h3 className="font-playfair text-xl font-bold text-ticket-charcoal group-hover:text-ticket-burgundy transition-colors leading-snug">
                    {movie.title}
                  </h3>

                  <p className="text-xs text-ticket-charcoal/60 mt-2 line-clamp-2 leading-relaxed">
                    {movie.shortDescription}
                  </p>
                </div>

                {/* Director & Cast Snip */}
                <div className="border-t border-ticket-beige/60 pt-3 text-xs space-y-1 text-ticket-charcoal/70">
                  <div><strong className="text-ticket-charcoal">Director:</strong> {movie.director}</div>
                  <div className="truncate"><strong className="text-ticket-charcoal">Cast:</strong> {movie.cast}</div>
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-ticket-beige/40">
                  <div>
                    <span className="text-[10px] text-ticket-charcoal/50 block font-semibold uppercase">Tickets From</span>
                    <span className="font-playfair text-lg font-bold text-ticket-burgundy">
                      {movie.startingPrice} {movie.currency}
                    </span>
                  </div>

                  <Link
                    to={`/events/${movie.slug}`}
                    className="px-4 py-2 bg-ticket-ivory hover:bg-ticket-burgundy text-ticket-charcoal hover:text-white text-xs font-bold rounded-xl border border-ticket-beige transition-all duration-300 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>View Movie</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </main>

      <Footer />
    </div>
  );
}
