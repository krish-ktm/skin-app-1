import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TimeRange, getTimeRangeDate } from './TimeRangeSelector';

interface AnalyticsContextType {
  refreshTrigger: number;
  refreshData: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <AnalyticsContext.Provider 
      value={{ 
        refreshTrigger,
        refreshData
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}