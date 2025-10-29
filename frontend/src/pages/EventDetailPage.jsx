import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventDetailPage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserStore();

  const { data: eventData, isLoading } = useQuery(
    ['event', id],
    async () => {
      const response = await api.get(`/events/${id}`);
      return response.data;
    }
  );

  const buyTicketMutation = useMutation(
    async () => {
      // Call new payment endpoint that creates bill and returns payment URL
      const response = await api.post('/payments/tickets/purchase', {
        eventId: id,
        quantity: 1
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Open ToyyibPay hosted payment page
        if (data?.paymentUrl) {
          window.open(data.paymentUrl, '_blank', 'noopener');
        }
        // Navigate to payment status page to poll until completed
        if (data?.paymentId) {
          navigate(`/payment/status/${data.paymentId}`);
        } else {
          toast.success('Payment initiated.');
        }
      },
      onError: (error) => {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.error || 'Failed to initiate payment';
        const hint = errorData.hint || '';
        const reason = errorData.reason || '';
        
        let fullMessage = errorMsg;
        if (hint) fullMessage += ` ${hint}`;
        if (reason && typeof reason === 'string') fullMessage += ` Reason: ${reason}`;
        if (reason && typeof reason === 'object') fullMessage += ` Details: ${JSON.stringify(reason)}`;
        
        console.error('Payment initiation error:', errorData);
        toast.error(fullMessage, { duration: 6000 });
      }
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umblue-600"></div>
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

  // Safely format dates
  const formatDate = (dateInput) => {
    if (!dateInput) return 'Date TBD';
    
    try {
      let date;
      
      // Handle Firestore Timestamp object
      if (typeof dateInput === 'object' && dateInput.seconds) {
        date = new Date(dateInput.seconds * 1000);
      } 
      // Handle ISO string or timestamp number
      else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
      } 
      // Handle date-like objects (Firestore Timestamp can be serialized different ways)
      else if (dateInput instanceof Date) {
        date = dateInput;
      }
      // Handle Firestore Timestamp with toDate method
      else if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      }
      else {
        return 'Date TBD';
      }
      
      // Validate date
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Date TBD';
      }
      
      return format(date, 'PPP p');
    } catch (error) {
      console.error('Date formatting error:', error, 'Input:', dateInput);
      return 'Date TBD';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Event Details */}
        <div>
          <div className="card mb-6">
            {/* Image Carousel */}
            {event.imageUrls && event.imageUrls.length > 0 ? (
              <div className="relative h-96 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img 
                  src={event.imageUrls[currentImageIndex]} 
                  alt={`${event.title} - Image ${currentImageIndex + 1}`} 
                  className="w-full h-full object-cover" 
                />
                
                {/* Navigation arrows */}
                {event.imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === 0 ? event.imageUrls.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => 
                        prev === event.imageUrls.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Dots indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {event.imageUrls.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Image counter */}
                    <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {event.imageUrls.length}
                    </div>
                  </>
                )}
              </div>
            ) : event.imageUrl ? (
              <div className="h-96 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-96 bg-gray-200 rounded-lg mb-4 overflow-hidden flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
            
            <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.startDate)}
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

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>

            {/* Social Media Post Embed */}
            {event.socialMediaPostUrl && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Social Media Post</h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    📱 <a 
                      href={event.socialMediaPostUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-umblue-600 hover:text-umblue-700 underline"
                    >
                      View on Social Media →
                    </a>
                  </p>
                  {/* Facebook/Instagram Embed - using oEmbed */}
                  {event.socialMediaPostUrl.includes('facebook.com') && (
                    <iframe
                      src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(event.socialMediaPostUrl)}&show_text=true&width=500`}
                      width="100%"
                      height="600"
                      style={{ border: 'none', overflow: 'hidden' }}
                      scrolling="no"
                      frameBorder="0"
                      allowFullScreen={true}
                      title="Facebook Post"
                    ></iframe>
                  )}
                  {event.socialMediaPostUrl.includes('instagram.com') && (
                    <blockquote 
                      className="instagram-media" 
                      data-instgrm-permalink={event.socialMediaPostUrl}
                      data-instgrm-version="14"
                      style={{ background: '#FFF', border: 0, borderRadius: '3px', boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)', margin: '1px', maxWidth: '100%', minWidth: '326px', padding: 0, width: 'calc(100% - 2px)' }}
                    >
                      <div style={{ padding: '16px' }}>
                        <a 
                          href={event.socialMediaPostUrl}
                          style={{ color: '#000', fontFamily: 'Arial,sans-serif', fontSize: '14px', fontStyle: 'normal', fontWeight: 'normal', lineHeight: '17px', textDecoration: 'none', wordBreak: 'break-word' }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View this post on Instagram
                        </a>
                      </div>
                    </blockquote>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Organizer</h3>
            <Link to={`/clubs/${event.organizerId}`} className="flex items-center gap-3 mb-2 hover:opacity-90">
              {event.organizerLogoUrl ? (
                <img src={event.organizerLogoUrl} alt={event.organizerName} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200" />)
              }
              <div>
                <p className="text-gray-600 font-medium">{event.organizerName}</p>
                <p className="text-sm text-gray-500">{event.organizerEmail}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Ticket Purchase */}
        <div>
          <div className="card sticky top-4">
            <h2 className="text-2xl font-bold mb-6">Ticket Information</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Price per ticket</span>
                <span className="text-2xl font-bold text-umblue-600">
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
              role !== 'student' ? (
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Purchasing is only available to student accounts.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => buyTicketMutation.mutate()}
                  disabled={event.status !== 'published' || buyTicketMutation.isLoading}
                  className="w-full btn btn-primary"
                >
                  {buyTicketMutation.isLoading ? 'Processing...' : 'Buy Ticket'}
                </button>
              )
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

