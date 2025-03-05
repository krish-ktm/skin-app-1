import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PulseLoader } from 'react-spinners';

interface LoadingOverlayProps {
  isLoading: boolean;
  actionInProgress: {
    type: 'fetch' | 'delete' | 'update' | 'create';
    message: string;
  } | null;
}

export function LoadingOverlay({ isLoading, actionInProgress }: LoadingOverlayProps) {
  if (!isLoading || !actionInProgress) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-0 left-0 right-0 z-20 bg-white bg-opacity-90 border-b border-blue-100 p-2"
        style={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      >
        <div className="flex items-center gap-3 px-4">
          <div className="w-5 h-5 flex items-center justify-center">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">{actionInProgress.message}</p>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ 
                  width: ["0%", "50%", "90%", "95%"],
                }}
                transition={{ 
                  times: [0, 0.4, 0.8, 1],
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}