import { useQuery } from 'react-query';
import api from '../config/axios';

const AdminAnalyticsPage = () => {
  const { data: platformData, isLoading: loadingPlatform } = useQuery(
    ['platformStats'],
    async () => {
      const res = await api.get('/analytics/platform');
      return res.data;
    }
  );

  const { data: topEventsData, isLoading: loadingTop } = useQuery(
    ['topEvents'],
    async () => {
      const res = await api.get('/analytics/platform/top-events');
      return res.data;
    }
  );

  if (loadingPlatform || loadingTop) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umblue-600"></div>
      </div>
    );
  }

  const stats = platformData || {};
  const topEvents = topEventsData?.topEvents || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 font-heading">Platform Analytics</h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-3xl font-bold">{stats.totalUsers ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Clubs</div>
          <div className="text-3xl font-bold">{stats.totalClubs ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Events</div>
          <div className="text-3xl font-bold">{stats.totalEvents ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Tickets Sold</div>
          <div className="text-3xl font-bold">{stats.totalTicketsSold ?? 0}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Top Events</h2>
        {topEvents.length === 0 ? (
          <div className="text-gray-500">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue (RM)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topEvents.map(ev => (
                  <tr key={ev.id}>
                    <td className="px-6 py-3">{ev.title}</td>
                    <td className="px-6 py-3">{ev.organizerName || '-'}</td>
                    <td className="px-6 py-3">{ev.ticketsSold ?? 0}</td>
                    <td className="px-6 py-3">{(ev.revenue ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;


