import { motion } from 'framer-motion';
import { FaHome, FaChevronRight } from 'react-icons/fa';

export const Breadcrumb = ({ 
  path = [], 
  onNavigate 
}) => {

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {/* Always show home button first */}
    
      
      {path.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <span><FaChevronRight size={12} className="text-black" /></span>}
          <motion.button
            onClick={() => onNavigate(item.id)}
            className={`px-1.5 py-0.5 rounded text-[11px] transition-colors duration-150
              ${index === path.length - 1
                ? 'text-emerald-500 font-medium cursor-default'
                : 'text-black hover:bg-emerald-900/70 hover:text-emerald-300 hover:shadow-md hover:scale-105 cursor-pointer'}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
           {/* <span><FaChevronRight size={12} /></span>  */}
            {item.name === 'icon-home' ? <FaHome size={13}  /> : item.name}
          </motion.button>
        </div>
      ))}
    </div>
  );
};
