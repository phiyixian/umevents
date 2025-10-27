import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../config/axios';

const HomePage = () => {
  const { data: eventsData } = useQuery('featuredEvents', async () => {
    const response = await api.get('/events?limit=6');
    return response.data;
  });

  const events = eventsData?.events || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome to UMEvents
          </h1>
          <p className="text-xl mb-8 text-primary-100">
            Discover, join, and create amazing events at Universiti Malaya
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events" className="btn bg-white text-primary-600 hover:bg-gray-100">
              Browse Events
            </Link>
            <Link to="/register" className="btn bg-primary-700 hover:bg-primary-900 border border-white">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose UMEvents?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Event Creation</h3>
              <p className="text-gray-600">
                Create and manage your events with just a few clicks
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Pay seamlessly with DuitNow FPX / QR integration
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-time Analytics</h3>
              <p className="text-gray-600">
                Track your event performance with detailed insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Events</h2>
            <Link to="/events" className="text-primary-600 hover:text-primary-700 font-semibold">
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
                    {event.imageUrl ? (
                      <img 
                        src={event.imageUrl} 
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
                    <span className="font-semibold text-primary-600">
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

