import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../config/axios';

const DashboardPage = () => {
  const { user } = useAuth();
  const { name, role, faculty, studentId } = useUserStore();

  const { data: myTicketsData } = useQuery('myTickets', async () => {
    const response = await api.get('/tickets/my');
    return response.data;
  });

  const { data: myEventsData } = useQuery(
    'myEvents',
    async () => {
      const response = await api.get('/events/my/events');
      return response.data;
    },
    { enabled: role === 'club' || role === 'admin' }
  );

  const tickets = myTicketsData?.tickets || [];
  const events = myEventsData?.events || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Welcome Card */}
      <div className="card mb-8 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back, {name || 'User'}!</h2>
        <p className="text-primary-100">
          {role === 'student' && `Faculty: ${faculty || 'Not set'}`}
          {role === 'club' && 'Manage your events and track performance'}
          {role === 'admin' && 'Monitor platform activity'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">My Tickets</p>
              <p className="text-3xl font-bold">{tickets.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        {(role === 'club' || role === 'admin') && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">My Events</p>
                <p className="text-3xl font-bold">{events.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Role</p>
              <p className="text-xl font-bold capitalize">{role}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link to="/my-tickets" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">My Tickets</h3>
              <p className="text-gray-600 text-sm">View and manage your tickets</p>
            </div>
          </div>
        </Link>

        {(role === 'club' || role === 'admin') && (
          <>
            <Link to="/create-event" className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Create Event</h3>
                  <p className="text-gray-600 text-sm">Organize a new event</p>
                </div>
              </div>
            </Link>

            <Link to="/analytics" className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Analytics</h3>
                  <p className="text-gray-600 text-sm">View event insights</p>
                </div>
              </div>
            </Link>
          </>
        )}

        <Link to="/events" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Browse Events</h3>
              <p className="text-gray-600 text-sm">Discover new events</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Tickets */}
      {tickets.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Tickets</h2>
          <div className="space-y-4">
            {tickets.slice(0, 3).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">{ticket.event?.title || 'Event'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(ticket.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  ticket.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {ticket.status}
                </span>
              </div>
            ))}
          </div>
          <Link to="/my-tickets" className="text-primary-600 hover:text-primary-700 text-sm mt-4 inline-block">
            View all tickets →
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

