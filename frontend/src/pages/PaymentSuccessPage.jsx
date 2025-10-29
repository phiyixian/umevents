import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import api from '../config/axios';
import toast from 'react-hot-toast';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [eventId, setEventId] = useState(null);
  const verificationAttemptsRef = useRef(0);
  
  // Get parameters from URL
  // ToyyibPay returns: status_id, billcode, order_id, msg, transaction_id
  const billcode = searchParams.get('billcode');
  const statusId = searchParams.get('status_id');
  const orderId = searchParams.get('order_id');
  const msg = searchParams.get('msg');
  const eventIdParam = searchParams.get('eventId');

  // Define verifyPaymentStatus before it's used in useEffect
  const verifyPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setStatus('processing');
      return;
    }
    
    verificationAttemptsRef.current += 1;
    
    try {
      // Get payment status from backend
      // This ensures the callback has been processed
      const response = await api.get(`/payments/status/${orderId}`);
      const paymentData = response.data?.payment;
      const paymentStatus = paymentData?.status;
      
      if (paymentStatus === 'completed') {
        setStatus('success');
        
        // Get eventId from payment data to invalidate event query
        const paymentEventId = paymentData?.eventId || eventIdParam;
        
        // Invalidate event queries to refresh ticketsSold
        if (paymentEventId) {
          queryClient.invalidateQueries(['event', paymentEventId]);
        }
        queryClient.invalidateQueries(['events']);
        queryClient.invalidateQueries(['myTickets']); // Refresh tickets list
        
        toast.success('Payment successful! Your ticket has been purchased.', { duration: 5000 });
      } else if (paymentStatus === 'pending') {
        // If URL shows success but backend is still pending, trust URL and show success
        // Callback may still be processing
        if (statusId === '1') {
          setStatus('success');
          toast.success('Payment successful! Your ticket has been purchased.', { duration: 5000 });
          
          // Invalidate queries anyway
          const paymentEventId = paymentData?.eventId || eventIdParam;
          if (paymentEventId) {
            queryClient.invalidateQueries(['event', paymentEventId]);
          }
          queryClient.invalidateQueries(['events']);
          queryClient.invalidateQueries(['myTickets']);
        } else {
          // If no URL success indicator, show pending but don't retry indefinitely
          setStatus('pending');
          toast.loading('Payment is being processed...');
        }
      } else if (paymentStatus === 'failed') {
        setStatus('failed');
        toast.error('Payment failed. Please try again.');
      } else {
        setStatus('failed');
        toast.error('Payment verification failed.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      // If URL shows success but backend verification fails, still show success
      // The callback will be processed eventually
      if (statusId === '1') {
        setStatus('success');
        toast.success('Payment appears successful. Please check your tickets.', { duration: 5000 });
      } else if (billcode) {
        // If we have billcode, assume success (fallback will redirect)
        setStatus('success');
        toast.success('Payment appears successful. Please check your tickets.', { duration: 5000 });
      } else {
        // No indicators, stay in processing (fallback will redirect)
        setStatus('processing');
      }
    }
  }, [orderId, statusId, eventIdParam, billcode, queryClient]);

  useEffect(() => {
    setEventId(eventIdParam);
    
    // If URL shows success (status_id = '1'), trust it and show success immediately
    // The backend callback will process eventually
    if (statusId === '1') {
      setStatus('success');
      toast.success('Payment successful! Your ticket has been purchased.', { duration: 5000 });
      
      // Still verify in background, but don't wait for it
      if (orderId) {
        verifyPaymentStatus(); // Verify in background to invalidate queries
      }
      
      // Set a fallback timeout to redirect even if verification takes too long
      const timeout = setTimeout(() => {
        if (eventIdParam) {
          queryClient.invalidateQueries(['event', eventIdParam]);
        }
        queryClient.invalidateQueries(['events']);
        queryClient.invalidateQueries(['myTickets']);
      }, 3000);
      
      return () => clearTimeout(timeout);
    } else if (statusId === '3') {
      // Failed - no need to verify
      setStatus('failed');
      toast.error(msg || 'Payment failed. Please try again.');
    } else if (orderId) {
      // No status_id but have orderId - verify from backend
      verifyPaymentStatus();
    } else {
      // No orderId and no status_id - can't verify, assume success if billcode exists
      if (billcode) {
        setStatus('success');
        toast.success('Payment appears successful. Please check your tickets.', { duration: 5000 });
      } else {
        setStatus('processing');
      }
    }
  }, [statusId, orderId, msg, eventIdParam, billcode, queryClient, verifyPaymentStatus]);

  useEffect(() => {
    // Redirect to My Tickets after successful payment, or events on failure
    if (status === 'success') {
      const timer = setTimeout(() => {
        // Ensure queries are invalidated before redirect
        if (eventId) {
          queryClient.invalidateQueries(['event', eventId]);
        }
        queryClient.invalidateQueries(['events']);
        queryClient.invalidateQueries(['myTickets']);
        
        navigate('/my-tickets', { 
          replace: true,
          state: { 
            paymentSuccess: true,
            message: 'Payment successful! Your ticket has been purchased.'
          }
        });
      }, 1500); // Short delay to show success message

      return () => clearTimeout(timer);
    } else if (status === 'failed') {
      const timer = setTimeout(() => {
        if (eventId) {
          navigate(`/events/${eventId}`, { 
            replace: true,
            state: { 
              paymentFailed: true,
              message: 'Payment failed. Please try again.'
            }
          });
        } else {
          navigate('/events', { replace: true });
        }
      }, 3000);

      return () => clearTimeout(timer);
    } else if (status === 'processing' || status === 'pending') {
      // Fallback: If stuck in processing/pending for too long, redirect anyway
      // This handles cases where callback is delayed
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback redirect: Payment verification taking too long');
        if (statusId === '1' || billcode) {
          // Likely successful, redirect to tickets
          if (eventId) {
            queryClient.invalidateQueries(['event', eventId]);
          }
          queryClient.invalidateQueries(['events']);
          queryClient.invalidateQueries(['myTickets']);
          
          navigate('/my-tickets', { 
            replace: true,
            state: { 
              paymentSuccess: true,
              message: 'Payment processing. Please check your tickets.'
            }
          });
        } else {
          // Unknown status, go to events
          if (eventId) {
            navigate(`/events/${eventId}`, { replace: true });
          } else {
            navigate('/events', { replace: true });
          }
        }
      }, 10000); // 10 second fallback

      return () => clearTimeout(fallbackTimer);
    }
  }, [status, eventId, navigate, statusId, billcode, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 text-center">
        {status === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="text-gray-600">
              Your ticket has been successfully purchased. You will be redirected to My Tickets shortly.
            </p>
            {billcode && (
              <p className="text-sm text-gray-500">
                Bill Code: {billcode}
              </p>
            )}
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600"></div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Processing Payment</h2>
            <p className="text-gray-600">
              Your payment is being processed. Please wait...
            </p>
            {msg && (
              <p className="text-sm text-yellow-600">
                {msg}
              </p>
            )}
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Payment Failed</h2>
            <p className="text-gray-600">
              Your payment could not be processed. Please try again.
            </p>
            {msg && (
              <p className="text-sm text-red-600">
                {msg}
              </p>
            )}
            <button
              onClick={() => eventId ? navigate(`/events/${eventId}`) : navigate('/events')}
              className="btn btn-primary mt-4"
            >
              Return to Event
            </button>
          </>
        )}

        {status === 'processing' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Verifying Payment</h2>
            <p className="text-gray-600">
              Please wait while we verify your payment...
            </p>
          </>
        )}

        <p className="text-xs text-gray-500 mt-4">
          Redirecting you back in a few seconds...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

