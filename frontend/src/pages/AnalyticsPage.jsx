import { useQuery } from 'react-query';
import api from '../config/axios';
import { useUserStore } from '../store/userStore';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const AnalyticsPage = () => {
  const { role } = useUserStore();
  const uid = useUserStore((state) => state.uid);

  const { data: analyticsData, isLoading } = useQuery(
    ['analytics', role, uid],
    async () => {
      if (role === 'club') {
        const response = await api.get(`/analytics/club/${uid}`);
        return response.data;
      } else if (role === 'admin') {
        const response = await api.get('/analytics/platform');
        return response.data;
      }
      return null;
    },
    { enabled: role === 'club' || role === 'admin' }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const { analytics } = analyticsData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Total Events</p>
          <p className="text-3xl font-bold">{analytics.totalEvents || analytics.totalEvents}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Tickets Sold</p>
          <p className="text-3xl font-bold">{analytics.totalTicketsSold || analytics.totalTicketsSold}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
          <p className="text-3xl font-bold">RM {(analytics.totalRevenue || analytics.totalRevenue || 0).toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Revenue After Fees</p>
          <p className="text-3xl font-bold">RM {(analytics.totalRevenueAfterFees || analytics.platformRevenue || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Categories Distribution</h3>
          {analytics.categoriesBreakdown && (
            <Doughnut
              data={{
                labels: Object.keys(analytics.categoriesBreakdown),
                datasets: [{
                  data: Object.values(analytics.categoriesBreakdown),
                  backgroundColor: [
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#ec4899'
                  ]
                }]
              }}
            />
          )}
        </div>

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Top Events</h3>
          <div className="space-y-4">
            {analytics.topEvents?.map((event, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-gray-300">#{index + 1}</span>
                  <div>
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.ticketsSold} tickets</p>
                  </div>
                </div>
                <span className="text-primary-600 font-bold">RM {event.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

