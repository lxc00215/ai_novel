import { AnimatePresence, motion } from "framer-motion";


interface LogoProps {
  isCollapsed: boolean;
}

export default function Logo({ isCollapsed }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
          <div className="relative h-6 w-6 flex-shrink-0">
            <div className="absolute h-4 w-4 rounded-full bg-blue-600 left-0 top-1"></div>
            <div className="absolute h-4 w-4 rounded-full bg-red-600 left-2 top-1"></div>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center overflow-hidden"
              >
                <span className="text-xl text-foreground font-semibold tracking-tight ">NonReal</span>
                <span className="text-xs text-foreground align-top">ML</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
  );
}
