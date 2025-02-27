import React from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertTriangle } from 'lucide-react';

export function SystemStatus() {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
      }
    }
  };

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
      variants={cardVariants}
    >
      <h3 className="text-lg font-medium text-gray-800 mb-4">System Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100 hover:shadow-md transition-shadow duration-300">
          <div className="mr-4 bg-green-100 p-2 rounded-full">
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">System Online</p>
            <p className="text-xs text-green-600">All services operational</p>
          </div>
        </div>
        
        <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow duration-300">
          <div className="mr-4 bg-blue-100 p-2 rounded-full">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-800">Performance</p>
            <p className="text-xs text-blue-600">Response time: 120ms</p>
          </div>
        </div>
        
        <div className="flex items-center p-4 bg-yellow-50 rounded-lg border border-yellow-100 hover:shadow-md transition-shadow duration-300">
          <div className="mr-4 bg-yellow-100 p-2 rounded-full">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800">Notifications</p>
            <p className="text-xs text-yellow-600">0 pending alerts</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}