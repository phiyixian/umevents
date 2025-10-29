import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config/axios';

const POLL_INTERVAL_MS = 1500;

const PaymentStatusPage = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending');
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let timer;
    const poll = async () => {
      try {
        const res = await api.get(`/payments/status/${paymentId}`);
        const s = res.data?.payment?.status || 'pending';
        setStatus(s);
        if (s === 'completed') {
          // Success: go to tickets
          navigate('/my-tickets');
          return;
        }
      } catch (e) {
        // Ignore transient errors and keep polling for a short while
      }
      setTries((t) => t + 1);
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
    return () => clearTimeout(timer);
  }, [paymentId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Processing Payment</h2>
        <p className="text-gray-600">Status: {status}</p>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
        <p className="text-xs text-gray-500">You can close this tab after payment. We'll redirect when completed.</p>
      </div>
    </div>
  );
};

export default PaymentStatusPage;


