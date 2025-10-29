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

  // Safe date formatter (handles Firestore Timestamp/ISO/Date)
  const formatDate = (dateInput) => {
    if (!dateInput) return 'Date TBD';
    try {
      let date;
      if (typeof dateInput === 'object' && dateInput?.seconds) {
        date = new Date(dateInput.seconds * 1000);
      } else if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
      } else if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        return 'Date TBD';
      }
      if (!(date instanceof Date) || isNaN(date.getTime())) return 'Date TBD';
      return format(date, 'PPP p');
    } catch (e) {
      return 'Date TBD';
    }
  };

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
              <h1 className="text-3xl font-bold mb-4">{event?.title || 'Event'}</h1>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(event?.startDate)}
                </div>

                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {(event?.location || '') + (event?.venue ? ` - ${event.venue}` : '')}
                </div>

                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  RM {Number(ticket?.price || 0).toFixed(2)}
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Ticket ID</p>
                <p className="font-mono text-sm">{ticket.id}</p>
              </div>

              <div className="mt-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Ticket Status</p>
                <span className={`px-3 py-1 rounded-full text-sm inline-block ${
                  ticket.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                  ticket.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                  ticket.status === 'used' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {ticket.status === 'paid' ? 'Paid (Pending Confirmation)' : 
                   ticket.status === 'confirmed' ? 'Confirmed' :
                   ticket.status === 'used' ? 'Used' :
                   ticket.status.replace('_', ' ')}
                </span>
              </div>

              {/* Payment/Transaction Information */}
              {ticket.payment && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Transaction Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`font-medium ${
                        ticket.payment.status === 'completed' ? 'text-green-600' : 
                        ticket.payment.status === 'pending' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {ticket.payment.status === 'completed' ? 'Paid ✓' : ticket.payment.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium capitalize">{ticket.payment.method || 'ToyyibPay'}</span>
                    </div>
                    {ticket.payment.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono text-xs">{ticket.payment.transactionId}</span>
                      </div>
                    )}
                    {ticket.payment.billcode && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bill Code:</span>
                        <span className="font-mono text-xs">{ticket.payment.billcode}</span>
                      </div>
                    )}
                    {ticket.payment.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paid At:</span>
                        <span className="font-medium">{formatDate(ticket.payment.completedAt)}</span>
                      </div>
                    )}
                    {ticket.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ticket Paid At:</span>
                        <span className="font-medium">{formatDate(ticket.paidAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ticket.purchaseDate && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-600">Purchased: {formatDate(ticket.purchaseDate)}</p>
                </div>
              )}
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

