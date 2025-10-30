import React, { useState, useEffect } from 'react';
import { buildApi1Url } from '../../config/api.config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
);

/**
 * SlideInsights
 * @param {Object} props
 * @param {string} props.customerId
 * @param {Object[]} props.slideTimes - Array of { slideId, slideTitle, seconds } (fallback)
 * @param {Object[]} props.sessions - Array of { sessionStart, sessionEnd, durationSeconds } (fallback)
 */
export default function SlideInsights({ customerId, slideTimes = [], sessions = [] }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  // Load data from localStorage as fallback
  const loadLocalStorageData = () => {
    if (!customerId) return;
    
    try {
      const localSessions = JSON.parse(localStorage.getItem(`slideSessions_${customerId}`) || '[]');
      const localSlideTimes = JSON.parse(localStorage.getItem(`slideTimes_${customerId}`) || '[]');
      
      if (localSessions.length > 0 || localSlideTimes.length > 0) {
        setAnalyticsData({
          sessions: localSessions,
          slideTimes: localSlideTimes
        });
      }
    } catch (err) {
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await fetch(buildApi1Url(`/client/user/slide_shows/analytics?customerId=${customerId}`));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err.message);
        if (typeof loadLocalStorageData === 'function') loadLocalStorageData();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Use API data if available, otherwise fallback to props
  // If analyticsData is an array, treat as sessions array (API response format)
  const currentSessions = Array.isArray(analyticsData)
    ? analyticsData
    : (analyticsData?.sessions || sessions);

  // Aggregate slide times across all sessions
  const slideTimesMap = {};
  currentSessions.forEach(session => {
    (session.slides || []).forEach(slide => {
      if (!slideTimesMap[slide.slideId]) {
        slideTimesMap[slide.slideId] = { ...slide, seconds: 0 };
      }
      slideTimesMap[slide.slideId].seconds += slide.seconds || 0;
    });
  });
  const currentSlideTimes = Object.values(slideTimesMap).length > 0
    ? Object.values(slideTimesMap)
    : slideTimes;

  // Color palette for bars
  const colorPalette = [
    'rgba(84, 187, 116, 0.8)',    // Primary green
    'rgba(147, 207, 162, 0.8)',   // Light green
    'rgba(22, 163, 74, 0.8)',     // Dark green
    'rgba(21, 128, 61, 0.8)',     // Darker green
    'rgba(22, 101, 52, 0.8)',     // Deep green
    'rgba(74, 222, 128, 0.8)',    // Bright green
    'rgba(34, 197, 94, 0.8)',     // Lighter green
  ];

  // Calculate session statistics
  const sessionStats = {
    totalSessions: currentSessions.length,
    totalTime: currentSessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0),
    averageSessionTime: currentSessions.length > 0 ? 
      currentSessions.reduce((sum, session) => sum + (session.durationSeconds || 0), 0) / currentSessions.length : 0,
    longestSession: currentSessions.length > 0 ? 
      Math.max(...currentSessions.map(s => s.durationSeconds || 0)) : 0
  };

  // Get engagement events from latest session
  const latestSession = currentSessions.length > 0 ? currentSessions[currentSessions.length - 1] : null;
  const engagementEvents = latestSession?.engagementEvents || [];

  // Process device analytics
  const deviceAnalytics = currentSessions.reduce((acc, session) => {
    if (session.deviceInfo) {
      const { isMobile, screenWidth, screenHeight, userAgent } = session.deviceInfo;
      
      // Device type 
      const deviceType = isMobile ? 'Mobile' : 
                        screenWidth > 1024 ? 'Desktop' : 'Tablet';
      acc.deviceTypes[deviceType] = (acc.deviceTypes[deviceType] || 0) + 1;
      
      // Screen sizes
      const screenCategory = screenWidth < 768 ? 'Small (<768px)' :
                           screenWidth < 1024 ? 'Medium (768-1024px)' :
                           screenWidth < 1440 ? 'Large (1024-1440px)' :
                           'XLarge (>1440px)';
      acc.screenSizes[screenCategory] = (acc.screenSizes[screenCategory] || 0) + 1;
      
      // Browser detection (basic)
      const browser = userAgent?.includes('Chrome') ? 'Chrome' :
                     userAgent?.includes('Firefox') ? 'Firefox' :
                     userAgent?.includes('Safari') ? 'Safari' :
                     userAgent?.includes('Edge') ? 'Edge' : 'Other';
      acc.browsers[browser] = (acc.browsers[browser] || 0) + 1;
    }
    return acc;
  }, { deviceTypes: {}, screenSizes: {}, browsers: {} });

  // Format time in minutes and seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  // Prepare data for Chart.js
  const chartData = {
    labels: currentSlideTimes.map(slide => slide.slideTitle),
    datasets: [
      {
        label: 'Time Spent (seconds)',
        data: currentSlideTimes.map(slide => slide.seconds),
        backgroundColor: currentSlideTimes.map((_, index) => {
          return colorPalette[index % colorPalette.length];
        }),
        borderColor: currentSlideTimes.map((_, index) => {
          // Slightly darker version of each color for the border
          const baseColor = colorPalette[index % colorPalette.length];
          return baseColor.replace('0.8)', '1)').replace(', 0.8', '');
        }),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#93cfa2',
        bodyColor: '#93cfa2',
        borderColor: '#54bb74',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `Time: ${context.parsed.y.toFixed(1)}s`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#93cfa2',
          font: {
            size: 12,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        grid: {
          color: 'rgba(64, 64, 64, 0.3)',
          drawBorder: false,
        },
        border: {
          color: '#54bb74',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#93cfa2',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(64, 64, 64, 0.3)',
          drawBorder: false,
        },
        border: {
          color: '#54bb74',
        },
        title: {
          display: true,
          text: 'Time (seconds)',
          color: '#93cfa2',
          font: {
            size: 14,
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  // Session duration chart data
  const sessionChartData = {
    labels: currentSessions.map((_, index) => `Session ${index + 1}`),
    datasets: [
      {
        label: 'Session Duration (seconds)',
        data: currentSessions.map(session => session.durationSeconds || 0),
        backgroundColor: currentSessions.map((_, index) => {
          return colorPalette[index % colorPalette.length];
        }),
        borderColor: currentSessions.map((_, index) => {
          const baseColor = colorPalette[index % colorPalette.length];
          return baseColor.replace('0.8)', '1)').replace(', 0.8', '');
        }),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const sessionOptions = {
    ...options,
    scales: {
      ...options.scales,
      y: {
        ...options.scales.y,
        title: {
          display: true,
          text: 'Duration (seconds)',
          color: '#93cfa2',
          font: {
            size: 14,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-[#1e1e1e] rounded-lg">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-[#54bb74] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span className="text-[#93cfa2] text-lg font-semibold">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e1e1e] rounded-lg p-6 space-y-6">
      {error && (
        <div className="bg-red-800 text-red-200 px-4 py-2 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      <h2 className="text-2xl font-bold text-[#93cfa2] mb-6">Slide Analytics Dashboard</h2>
      
      {/* Session Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-sm text-gray-400 mb-1">Total Sessions</h3>
          <p className="text-2xl font-bold text-[#54bb74]">{sessionStats.totalSessions}</p>
        </div>
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-sm text-gray-400 mb-1">Total Time</h3>
          <p className="text-2xl font-bold text-[#54bb74]">{formatTime(sessionStats.totalTime)}</p>
        </div>
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-sm text-gray-400 mb-1">Avg Session</h3>
          <p className="text-2xl font-bold text-[#54bb74]">{formatTime(sessionStats.averageSessionTime)}</p>
        </div>
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-sm text-gray-400 mb-1">Longest Session</h3>
          <p className="text-2xl font-bold text-[#54bb74]">{formatTime(sessionStats.longestSession)}</p>
        </div>
      </div>

      {/* Charts Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slide Time Chart */}
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#93cfa2] mb-4">Time Spent Per Slide</h3>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={options} />
          </div>
        </div>

        {/* Session Duration Chart */}
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#93cfa2] mb-4">Session Durations</h3>
          <div style={{ height: '300px' }}>
            {currentSessions.length > 0 ? (
              <Bar data={sessionChartData} options={sessionOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No session data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Events Table */}
      {engagementEvents.length > 0 && (
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#93cfa2] mb-4">Recent Engagement Events</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 text-gray-400">Time</th>
                  <th className="text-left py-2 text-gray-400">Event Type</th>
                  <th className="text-left py-2 text-gray-400">Slide</th>
                  <th className="text-left py-2 text-gray-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {engagementEvents.slice(-10).map((event, index) => (
                  <tr key={`${event.id || ''}_${index}`} className="border-b border-gray-700">
                    <td className="py-2 text-gray-300">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.type === 'click' ? 'bg-blue-600 text-blue-100' :
                        event.type === 'slide_change' ? 'bg-green-600 text-green-100' :
                        event.type === 'user_idle' ? 'bg-yellow-600 text-yellow-100' :
                        event.type === 'activity_resumed' ? 'bg-purple-600 text-purple-100' :
                        'bg-gray-600 text-gray-100'
                      }`}>
                        {event.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 text-gray-300">
                      {event.slideId || 'N/A'}
                    </td>
                    <td className="py-2 text-gray-300">
                      {event.type === 'click' && event.data?.target ? `${event.data.target} element` :
                       event.type === 'keypress' && event.data?.key ? `Key: ${event.data.key}` :
                       event.type === 'slide_change' ? `To slide ${event.data?.slideIndex + 1}` :
                       'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Device Analytics */}
      {currentSessions.length > 0 && Object.keys(deviceAnalytics.deviceTypes).length > 0 && (
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#93cfa2] mb-4">Device Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Device Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Device Types</h4>
              <div className="space-y-2">
                {Object.entries(deviceAnalytics.deviceTypes).map(([type, count]) => {
                  const percentage = ((count / currentSessions.length) * 100).toFixed(1);
                  return (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-gray-300">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#54bb74] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[#54bb74] text-sm font-medium">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Screen Sizes */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Screen Sizes</h4>
              <div className="space-y-2">
                {Object.entries(deviceAnalytics.screenSizes).map(([size, count]) => {
                  const percentage = ((count / currentSessions.length) * 100).toFixed(1);
                  return (
                    <div key={size} className="flex justify-between items-center">
                      <span className="text-gray-300 text-xs">{size}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#93cfa2] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[#93cfa2] text-sm font-medium">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Browsers */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-3">Browsers</h4>
              <div className="space-y-2">
                {Object.entries(deviceAnalytics.browsers).map(([browser, count]) => {
                  const percentage = ((count / currentSessions.length) * 100).toFixed(1);
                  return (
                    <div key={browser} className="flex justify-between items-center">
                      <span className="text-gray-300">{browser}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#74bb54] rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[#74bb54] text-sm font-medium">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Details */}
      {currentSessions.length > 0 && (
        <div className="bg-[#2a2a2a] p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-[#93cfa2] mb-4">Session History</h3>
          <div className="space-y-2">
            {currentSessions.slice(-5).map((session, index) => (
              <div key={session._id || `${session.sessionId}_${index}` } className="flex justify-between items-center p-3 bg-[#1e1e1e] rounded">
                <div>
                  <p className="text-white font-medium">
                    Session {session.sessionId ? session.sessionId.split('_')[1] : index + 1}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(session.sessionStart).toLocaleString()}
                    {session.deviceInfo && (
                      <span className="ml-2 px-2 py-1 bg-gray-700 rounded text-xs">
                        {session.deviceInfo.isMobile ? '📱 Mobile' : '💻 Desktop'}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#54bb74] font-medium">
                    {formatTime(session.durationSeconds || 0)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {session.slides?.length || 0} slides viewed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
