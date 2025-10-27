import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../config/axios';

const EventsPage = () => {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data: eventsData, isLoading } = useQuery(
    ['events', category, search],
    async () => {
      const params = {};
      if (category) params.category = category;
      if (search) params.q = search;
      
      const response = await api.get('/events', { params });
      return response.data;
    }
  );

  const events = eventsData?.events || [];

  const categories = [
    'All',
    'Academic',
    'Cultural',
    'Sports',
    'Workshop',
    'Social',
    'Career'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Browse Events</h1>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search events..."
          className="input flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <select
          className="input md:w-48"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat === 'All' ? '' : cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event) => (
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
              <div className="flex items-center justify-between text-sm">
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded">
                  {event.category}
                </span>
                <span className="font-semibold text-primary-600">
                  RM {event.ticketPrice.toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No events found
        </div>
      )}
    </div>
  );
};

export default EventsPage;

