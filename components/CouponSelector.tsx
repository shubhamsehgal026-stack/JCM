import { useApp } from '../context/AppContext';
import { COUPON_CONFIGS } from '../constants';

const CouponSelector = () => {
  const { selectedCoupon, setSelectedCoupon } = useApp();
  
  return (
    <div className="flex flex-col">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Select Coupon to Transact</h3>
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {COUPON_CONFIGS.map((config) => (
            <button
              key={config.label}
              onClick={() => setSelectedCoupon(config.label)}
              style={{ backgroundColor: config.color, color: config.textColor }}
              className={`
                px-4 py-3 sm:py-2 rounded-lg font-bold text-sm shadow-sm transition-all flex-grow sm:flex-grow-0
                ${selectedCoupon === config.label 
                  ? 'ring-4 ring-rose-500 ring-offset-2 scale-105 z-10' 
                  : 'hover:opacity-90 hover:scale-105 border border-slate-300'
                }
              `}
            >
              {config.label}
            </button>
          ))}
      </div>
    </div>
  );
};

export default CouponSelector;