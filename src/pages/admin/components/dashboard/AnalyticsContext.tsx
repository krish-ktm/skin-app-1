import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TimeRange, getTimeRangeDate } from './TimeRangeSelector';

interface AnalyticsContextType {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  startDate: Date;
  endDate: Date;
  refreshTrigger: number;
  refreshData: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const startDate = getTimeRangeDate(timeRange);
  const endDate = new Date();
  
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <AnalyticsContext.Provider 
      value={{ 
        timeRange, 
        setTimeRange, 
        startDate, 
        endDate,
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