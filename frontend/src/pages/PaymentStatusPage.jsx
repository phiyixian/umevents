import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient, useQuery } from 'react-query';
import api from '../config/axios';

const POLL_INTERVAL_MS = 3000; // Increased interval to reduce rate limiting
const MAX_RETRIES = 20; // Max 20 retries = ~60 seconds
const BACKOFF_MULTIPLIER = 1.5; // Exponential backoff for rate limiting

const PaymentStatusPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [paymentData, setPaymentData] = useState(null);
  const triesRef = useRef(0);
  const intervalRef = useRef(POLL_INTERVAL_MS);
  const isMountedRef = useRef(true);
  
  // Extract eventId from location state if available
  const eventId = location.state?.eventId;

  // Fetch payment details
  const { data: paymentResponse } = useQuery(
    ['paymentStatus', paymentId],
    async () => {
      const response = await api.get(`/payments/status/${paymentId}`);
      return response.data;
    },
    {
      refetchInterval: 3000,
      enabled: !!paymentId && status === 'pending'
    }
  );

  useEffect(() => {
    if (paymentResponse?.payment) {
      setPaymentData(paymentResponse.payment);
      setStatus(paymentResponse.payment.status || 'pending');
    }
  }, [paymentResponse]);

  useEffect(() => {
    isMountedRef.current = true;
    let timer;

    const poll = async () => {
      // Stop if component unmounted
      if (!isMountedRef.current) return;

      // Stop if max retries reached
      if (triesRef.current >= MAX_RETRIES) {
        console.log('Max retries reached, stopping polling');
        // Redirect to my-tickets even if status unclear
        navigate('/my-tickets', { replace: true });
        return;
      }

      try {
        const res = await api.get(`/payments/status/${paymentId}`);
        const paymentData = res.data?.payment;
        const paymentStatus = paymentData?.status || 'pending';
        const paymentEventId = paymentData?.eventId || eventId; // Use eventId from payment or location state
        
        if (isMountedRef.current) {
          setStatus(paymentStatus);
          
          if (paymentStatus === 'completed') {
            // Invalidate ALL queries to ensure fresh data
            if (paymentEventId) {
              queryClient.invalidateQueries(['event', paymentEventId], { refetchActive: true });
            }
            // Also invalidate all events to refresh list views
            queryClient.invalidateQueries(['events'], { refetchActive: true });
            // Refresh tickets list as well
            queryClient.invalidateQueries(['myTickets'], { refetchActive: true });
            
            // Add a small delay to ensure backend has processed the callback
            setTimeout(() => {
              navigate('/my-tickets', { 
                replace: true,
                state: { 
                  // Don't pass paymentSuccess - let MyTicketsPage handle silently
                }
              });
            }, 1000);
            return;
          } else if (paymentStatus === 'failed') {
            // Failed: stop polling and redirect
            console.log('Payment failed, redirecting...');
            navigate('/events', { replace: true, state: { paymentFailed: true } });
            return;
          }
        }

        // Reset backoff on successful request
        intervalRef.current = POLL_INTERVAL_MS;
      } catch (error) {
        // Handle rate limiting (429) with exponential backoff
        if (error.response?.status === 429) {
          console.log('Rate limited, backing off');
          intervalRef.current = Math.min(intervalRef.current * BACKOFF_MULTIPLIER, 30000); // Max 30 seconds
        } else if (error.response?.status >= 500) {
          // Server errors: back off slightly
          intervalRef.current = Math.min(intervalRef.current * 1.2, 15000);
        } else if (error.response?.status === 404) {
          // Payment not found: stop polling
          console.log('Payment not found, stopping polling');
          if (isMountedRef.current) {
            setStatus('error');
          }
          return;
        }
      }

      triesRef.current += 1;
      
      // Only continue polling if still mounted
      if (isMountedRef.current) {
        timer = setTimeout(poll, intervalRef.current);
      }
    };

    poll();

    return () => {
      isMountedRef.current = false;
      if (timer) clearTimeout(timer);
    };
  }, [paymentId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 text-center">
        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">Payment Not Found</h2>
            <p className="text-gray-600">The payment record could not be found.</p>
            <button
              onClick={() => navigate('/events', { replace: true })}
              className="btn btn-primary mt-4"
            >
              Return to Events
            </button>
          </>
        )}
        {(status === 'pending' || status === 'processing') && (
          <>
            {paymentData?.paymentMethod === 'manual_qr' && paymentData?.qrCodeImageUrl ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
                <p className="text-gray-600 mb-4">Please scan the QR code below to make payment</p>
                
                {/* QR Code Display */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                  <img 
                    src={paymentData.qrCodeImageUrl} 
                    alt="Payment QR Code" 
                    className="w-64 h-64 mx-auto object-contain"
                  />
                </div>
                
                {paymentData.paymentInstructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800 font-semibold mb-1">Payment Instructions:</p>
                    <p className="text-sm text-blue-700 whitespace-pre-line">{paymentData.paymentInstructions}</p>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Amount to Pay:</span>
                    <span className="text-xl font-bold text-gray-900">RM {paymentData.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-4">
                  After making payment, please contact the organizer to confirm. Your ticket will be updated once payment is verified.
                </p>
                
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Waiting for payment confirmation...</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Processing Payment</h2>
                <p className="text-gray-600">Status: {status}</p>
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
                <p className="text-xs text-gray-500">You can close this tab after payment. We'll redirect when completed.</p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;


