import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../config/axios';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TicketDetailPage = () => {
  const { id } = useParams();

  const { data: ticketData, isLoading } = useQuery(
    ['ticket', id],
    async () => {
      const response = await api.get(`/tickets/${id}`);
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const ticket = ticketData?.ticket;
  const event = ticket?.event;

  if (!ticket) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Ticket not found</p>
      </div>
    );
  }

  const downloadQR = () => {
    const canvas = document.querySelector('#qrcode');
    if (canvas) {
      const url = canvas.toDataURL();
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${id}.png`;
      a.click();
      toast.success('QR code downloaded!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Event Info */}
            <div>
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
                  </svg>
                  {event.location} - {event.venue}
                </div>

                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  RM {ticket.price.toFixed(2)}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Ticket ID</p>
                <p className="font-mono text-sm">{ticket.id}</p>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className={`px-3 py-1 rounded-full text-sm inline-block ${
                  ticket.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {ticket.status}
                </span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
                {ticket.qrCode ? (
                  <img src={ticket.qrCode} alt="QR Code" className="w-64 h-64" />
                ) : (
                  <QRCodeSVG 
                    id="qrcode"
                    value={JSON.stringify({
                      ticketId: ticket.id,
                      eventId: ticket.eventId,
                      userId: ticket.userId
                    })}
                    size={256}
                  />
                )}
              </div>
              
              <button 
                onClick={downloadQR}
                className="btn btn-primary"
              >
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;

