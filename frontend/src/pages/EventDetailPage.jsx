import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: eventData, isLoading } = useQuery(
    ['event', id],
    async () => {
      const response = await api.get(`/events/${id}`);
      return response.data;
    }
  );

  const buyTicketMutation = useMutation(
    async () => {
      const response = await api.post('/tickets/purchase', {
        eventId: id,
        quantity: 1
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Ticket purchase initiated! Please complete payment.');
        navigate('/my-tickets');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to purchase ticket');
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const event = eventData?.event;

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Event not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Event Details */}
        <div>
          <div className="card mb-6">
            <div className="h-64 bg-gray-200 rounded-lg mb-4 overflow-hidden">
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(event.startDate), 'PPP p')}
              </div>
              
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location} - {event.venue}
              </div>
              
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {event.category}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Organizer</h3>
            <p className="text-gray-600">{event.organizerName}</p>
            <p className="text-sm text-gray-500">{event.organizerEmail}</p>
          </div>
        </div>

        {/* Ticket Purchase */}
        <div>
          <div className="card sticky top-4">
            <h2 className="text-2xl font-bold mb-6">Ticket Information</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Price per ticket</span>
                <span className="text-2xl font-bold text-primary-600">
                  RM {event.ticketPrice.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tickets sold</span>
                <span>{event.ticketsSold} / {event.capacity}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {event.status}
                </span>
              </div>
            </div>

            {user ? (
              <button
                onClick={() => buyTicketMutation.mutate()}
                disabled={event.status !== 'published' || buyTicketMutation.isLoading}
                className="w-full btn btn-primary"
              >
                {buyTicketMutation.isLoading ? 'Processing...' : 'Buy Ticket'}
              </button>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Please login to purchase tickets
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full btn btn-primary"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

