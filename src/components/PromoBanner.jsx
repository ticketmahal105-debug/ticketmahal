import { motion } from 'framer-motion';

const PromoBanner = () => {
  return (
    <section className="bg-ticket-cream pb-12 px-6 md:px-12 flex justify-center items-center">
      <div className="max-w-7xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl bg-[#1A2232] border border-slate-700/40 shadow-xl py-4 sm:py-5 px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8"
        >
          {/* Dark Cinematic Film Reel Overlay Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none" />
          <div 
            className="absolute inset-0 opacity-10 bg-repeat pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h2zm0-30V0h-2v4h2zm0 10v-4h-2v4h2zm0 10v-4h-2v4h2zm0 20v-4h-2v4h2zm0 10v-4h-2v4h2zM24 0h-2v4h2V0zm0 10h-2v4h2v-4zm0 10h-2v4h2v-4zm0 10h-2v4h2v-4zm0 20h-2v4h2v-4zm0 10h-2v4h2v-4z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Left Side: Ticket Mahal Official Logo */}
          <div className="flex items-center z-10 flex-shrink-0">
            <img
              src="https://res.cloudinary.com/tejjggbw/image/upload/Untitled_design_-_2026-08-21T182953.259"
              alt="Ticket Mahal Logo"
              className="h-16 sm:h-20 md:h-24 w-auto object-contain"
            />
          </div>

          {/* Center Text Slogan (Rephrased for Ticket Mahal) */}
          <div className="z-10 flex-1 text-center">
            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-[#FCD34D] tracking-wide leading-snug drop-shadow">
              Your Gateway to Extraordinary Live Events & Shows!
            </h3>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PromoBanner;
