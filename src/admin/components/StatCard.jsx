import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, trendValue, delay = 0 }) => {
  const isPositive = trend === 'up';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="bg-white border border-beige/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-charcoal/60 uppercase tracking-wider">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-champagne/10 flex items-center justify-center text-champagne">
          {icon}
        </div>
      </div>
      
      <div className="flex items-end gap-3">
        <span className="font-playfair text-3xl font-bold text-charcoal">{value}</span>
        {trendValue && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold mb-1 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
