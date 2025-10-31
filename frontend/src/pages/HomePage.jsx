import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';

const HomePage = () => {
  const { user } = useAuth();
  const { role, verificationStatus } = useUserStore();
  const { data: eventsData } = useQuery('featuredEvents', async () => {
    const response = await api.get('/events?limit=6');
    return response.data;
  });

  const events = eventsData?.events || [];

  return (
    <div>
      {/* Verification Banner for Clubs */}
      {user && role === 'club' && verificationStatus === 'pending' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-semibold">Account Verification Pending</h3>
                <p className="text-yellow-700 text-sm">Your club account is awaiting admin verification. Once approved, you'll be able to create and manage events.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-umblue-600 to-umblue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 heading">
            Welcome to UMEvents
          </h1>
          <p className="text-xl mb-8 text-white/90">
            Discover, join, and create amazing events at Universiti Malaya
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events" className="btn bg-white text-umblue-600 hover:bg-gray-100">
              Browse Events
            </Link>
            {!user && (
              <Link to="/start" className="btn bg-umblue-700 hover:bg-umblue-900 border border-white">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Why Choose moved to About page */}

      {/* Featured Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold font-heading">Featured Events</h2>
            <Link to="/events" className="text-umblue-600 hover:text-umblue-700 font-semibold">
              View All →
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {events.length > 0 ? (
              events.map((event) => (
                <Link 
                  key={event.id} 
                  to={`/events/${event.id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                    {(event.imageUrl || (event.imageUrls && event.imageUrls.length > 0)) ? (
                      <img 
                        src={event.imageUrl || event.imageUrls[0]} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{event.category}</span>
                    <span className="font-semibold text-umblue-600">
                      RM {event.ticketPrice.toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500 py-12">
                No events available at the moment
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

