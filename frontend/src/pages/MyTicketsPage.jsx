import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../config/axios';
import { format } from 'date-fns';

const MyTicketsPage = () => {
  const { data: ticketsData, isLoading } = useQuery('myTickets', async () => {
    const response = await api.get('/tickets/my');
    return response.data;
  });

  const tickets = ticketsData?.tickets || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">No tickets yet</h2>
          <p className="text-gray-600 mb-4">Start exploring events to purchase tickets</p>
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="card hover:shadow-lg transition-shadow">
              {ticket.event && (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{ticket.event.title}</h3>
                      <p className="text-sm text-gray-600">{ticket.event.category}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      ticket.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                      ticket.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(new Date(ticket.event.startDate), 'PPP')}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {ticket.event.location}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-600">
                      Purchased: {format(new Date(ticket.purchaseDate), 'PPp')}
                    </span>
                    <span className="font-semibold text-primary-600">
                      RM {ticket.price.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;

