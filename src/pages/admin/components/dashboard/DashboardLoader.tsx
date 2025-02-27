import React from 'react';
import { PulseLoader } from 'react-spinners';

export function DashboardLoader() {
  return (
    <div className="flex justify-center items-center h-64">
      <PulseLoader color="#3B82F6" />
    </div>
  );
}