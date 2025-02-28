import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Doughnut, Bar } from 'react-chartjs-2';
import { supabase } from '../../../../lib/supabase';
import { PulseLoader } from 'react-spinners';
import { Users, MapPin, Calendar, Filter } from 'lucide-react';

interface DemographicsData {
  ageGroups: {
    labels: string[];
    data: number[];
  };
  locations: {
    labels: string[];
    data: number[];
  };
  patientHistory: {
    labels: string[];
    data: number[];
  };
}

export function PatientDemographics() {
  const [data, setData] = useState<DemographicsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'age' | 'location' | 'history'>('age');

  useEffect(() => {
    fetchDemographicsData();
  }, []);

  const fetchDemographicsData = async () => {
    setIsLoading(true);
    try {
      // In a real application, you would fetch actual demographic data
      // For this demo, we'll generate simulated data
      
      // Try to get real age distribution if available
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('age');
      
      let ageGroups;
      
      if (!error && appointments && appointments.length > 0) {
        // Process real age data
        const ageRanges = {
          '0-18': 0,
          '19-30': 0,
          '31-45': 0,
          '46-60': 0,
          '61+': 0
        };
        
        appointments.forEach(appointment => {
          const age = appointment.age || 0;
          if (age <= 18) ageRanges['0-18']++;
          else if (age <= 30) ageRanges['19-30']++;
          else if (age <= 45) ageRanges['31-45']++;
          else if (age <= 60) ageRanges['46-60']++;
          else ageRanges['61+']++;
        });
        
        ageGroups = {
          labels: Object.keys(ageRanges),
          data: Object.values(ageRanges)
        };
      } else {
        // Fallback to simulated data
        ageGroups = {
          labels: ['0-18', '19-30', '31-45', '46-60', '61+'],
          data: [10, 25, 35, 20, 10]
        };
      }
      
      // Simulate location distribution
      const locations = {
        labels: ['North', 'South', 'East', 'West', 'Central'],
        data: [22, 18, 25, 20, 15]
      };
      
      // Simulate patient history (new vs returning)
      const patientHistory = {
        labels: ['First Visit', '2-5 Visits', '6-10 Visits', '10+ Visits'],
        data: [45, 30, 15, 10]
      };
      
      setData({
        ageGroups,
        locations,
        patientHistory
      });
    } catch (error) {
      console.error('Error fetching demographics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const renderAgeGroupChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: data.ageGroups.labels,
      datasets: [
        {
          data: data.ageGroups.data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // Blue
            'rgba(16, 185, 129, 0.8)', // Green
            'rgba(139, 92, 246, 0.8)', // Purple
            'rgba(245, 158, 11, 0.8)', // Amber
            'rgba(236, 72, 153, 0.8)', // Pink
          ],
          borderColor: [
            'rgb(37, 99, 235)',
            'rgb(5, 150, 105)',
            'rgb(124, 58, 237)',
            'rgb(217, 119, 6)',
            'rgb(219, 39, 119)',
          ],
          borderWidth: 1,
          hoverOffset: 4
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            font: {
              size: 12
            },
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = data.ageGroups.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%',
      maintainAspectRatio: false,
    };
    
    return <Doughnut data={chartData} options={chartOptions} height={300} />;
  };

  const renderLocationChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: data.locations.labels,
      datasets: [
        {
          label: 'Patients by Location',
          data: data.locations.data,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              const total = data.locations.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      maintainAspectRatio: false,
    };
    
    return <Bar data={chartData} options={chartOptions} height={300} />;
  };

  const renderPatientHistoryChart = () => {
    if (!data) return null;
    
    const chartData = {
      labels: data.patientHistory.labels,
      datasets: [
        {
          data: data.patientHistory.data,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)', // Blue
            'rgba(16, 185, 129, 0.8)', // Green
            'rgba(139, 92, 246, 0.8)', // Purple
            'rgba(245, 158, 11, 0.8)', // Amber
          ],
          borderColor: [
            'rgb(37, 99, 235)',
            'rgb(5, 150, 105)',
            'rgb(124, 58, 237)',
            'rgb(217, 119, 6)',
          ],
          borderWidth: 1,
          hoverOffset: 4
        }
      ]
    };
    
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'right' as const,
          labels: {
            font: {
              size: 12
            },
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = data.patientHistory.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%',
      maintainAspectRatio: false,
    };
    
    return <Doughnut data={chartData} options={chartOptions} height={300} />;
  };

  if (isLoading) {
    return (
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-md border border-gray-100"
        variants={cardVariants}
      >
        <h3 className="text-lg font-medium text-gray-800 mb-4">Patient Demographics</h3>
        <div className="flex justify-center py-8">
          <PulseLoader color="#3B82F6" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300"
      variants={cardVariants}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-lg font-medium text-gray-800">Patient Demographics</h3>
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('age')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'age' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Age</span>
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'location' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Location</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'history' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>
      
      {data && (
        <>
          <div className="h-[300px] mb-6">
            {activeTab === 'age' && renderAgeGroupChart()}
            {activeTab === 'location' && renderLocationChart()}
            {activeTab === 'history' && renderPatientHistoryChart()}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activeTab === 'age' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Largest Group</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.ageGroups.labels[data.ageGroups.data.indexOf(Math.max(...data.ageGroups.data))]}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Average Age</p>
                  <p className="text-xl font-bold text-green-600">38</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Senior Patients</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.ageGroups.data[4]}
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Youth Patients</p>
                  <p className="text-xl font-bold text-amber-600">
                    {data.ageGroups.data[0]}
                  </p>
                </div>
              </>
            )}
            
            {activeTab === 'location' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Top Location</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.locations.labels[data.locations.data.indexOf(Math.max(...data.locations.data))]}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Location Spread</p>
                  <p className="text-xl font-bold text-green-600">5 Regions</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Rural Patients</p>
                  <p className="text-xl font-bold text-purple-600">32%</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Urban Patients</p>
                  <p className="text-xl font-bold text-amber-600">68%</p>
                </div>
              </>
            )}
            
            {activeTab === 'history' && (
              <>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">New Patients</p>
                  <p className="text-xl font-bold text-blue-600">
                    {data.patientHistory.data[0]}%
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Returning</p>
                  <p className="text-xl font-bold text-green-600">
                    {data.patientHistory.data.slice(1).reduce((a, b) => a + b, 0)}%
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Loyal Patients</p>
                  <p className="text-xl font-bold text-purple-600">
                    {data.patientHistory.data[3]}%
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Avg. Visits</p>
                  <p className="text-xl font-bold text-amber-600">3.2</p>
                </div>
              </>
            )}
          </div>
        </>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter className="h-5 w-5 text-blue-500" />
          <p className="text-sm">
            <span className="font-medium">Note:</span> This is simulated demographic data for demonstration purposes.
          </p>
        </div>
      </div>
    </motion.div>
  );
}