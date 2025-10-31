import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../config/axios';
import { useUserStore } from '../store/userStore';

const EventsPage = () => {
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'my'
  const { uid, role } = useUserStore();

  // Fetch all events
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

  // Fetch my events (for clubs)
  const { data: myEventsData, isLoading: isLoadingMyEvents } = useQuery(
    ['myEvents', uid],
    async () => {
      if (!uid || role !== 'club') return { events: [] };
      const response = await api.get('/events/my/events');
      return response.data;
    },
    { enabled: role === 'club' }
  );

  const allEvents = eventsData?.events || [];
  const myEvents = myEventsData?.events || [];
  // Apply client-side filtering as a safety net (normalize case/whitespace)
  const normalize = (s) => (s ?? '').toString().trim().toLowerCase();
  const baseEvents = viewMode === 'all' ? allEvents : myEvents;
  const events = baseEvents.filter((e) => {
    const eventCat = normalize(e.category);
    const selectedCat = normalize(category);
    const catOk = !selectedCat || eventCat === selectedCat;

    const q = normalize(search);
    const inTitle = q === '' || (typeof e.title === 'string' && e.title.toLowerCase().includes(q));
    const inDesc = q === '' || (typeof e.description === 'string' && e.description.toLowerCase().includes(q));
    const searchOk = inTitle || inDesc;

    return catOk && searchOk;
  });
  const isLoadingData = viewMode === 'all' ? isLoading : isLoadingMyEvents;

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Browse Events</h1>
        {role === 'club' && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Events
            </button>
            <button
              onClick={() => setViewMode('my')}
              className={`btn ${viewMode === 'my' ? 'btn-primary' : 'btn-secondary'}`}
            >
              My Events
            </button>
          </div>
        )}
      </div>

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
      {isLoadingData ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umblue-600"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="card hover:shadow-lg transition-shadow">
              <Link to={`/events/${event.id}`}>
                <div className="h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                  {(event.imageUrl || (event.imageUrls && event.imageUrls.length > 0)) ? (
                    <img 
                      src={event.imageUrl || event.imageUrls[0]} 
                      alt={event.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="px-2 py-1 bg-umblue-100 text-umblue-700 rounded">
                    {event.category}
                  </span>
                  <span className="font-semibold text-umblue-600">
                    RM {event.ticketPrice.toFixed(2)}
                  </span>
                </div>
              </Link>
              {/* Show Edit button if user is club and owns this event OR if viewing "My Events" */}
              {role === 'club' && (viewMode === 'my' || event.organizerId === uid) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to={`/edit-event/${event.id}`}
                    className="btn btn-secondary w-full"
                  >
                    Edit Event
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {viewMode === 'my' ? 'You have not created any events yet' : 'No events found'}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
