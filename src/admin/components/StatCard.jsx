import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, trendValue, delay = 0 }) => {
  const isPositive = trend === 'up';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-ticket-white border border-ticket-beige/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-ticket-charcoal/60 uppercase tracking-wider">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-ticket-burgundy/10 flex items-center justify-center text-ticket-burgundy">
          {icon}
        </div>
      </div>
      
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <span className="font-playfair text-2xl sm:text-3xl font-bold text-ticket-charcoal whitespace-nowrap">{value}</span>
        {trendValue && (
          <div className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {isPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
