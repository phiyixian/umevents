import { useState, useEffect } from 'react';
import api from '../config/axios';
import toast from 'react-hot-toast';

const AdminVerificationPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/auth/club-verification-requests');
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api.put(`/auth/club-verification-requests/${requestId}/approve`);
      toast.success('Club verified successfully!');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to approve club');
    }
  };

  const handleApproveWithToyyib = async (request) => {
    try {
      // Approve club verification first
      await api.put(`/auth/club-verification-requests/${request.id}/approve`);

      // Then provision ToyyibPay category for this club (requires admin)
      if (request.clubId) {
        await api.post(`/payments/toyyibpay/approve/${request.clubId}`);
        toast.success('Club verified and ToyyibPay enabled');
      } else {
        toast.success('Club verified. Missing clubId to enable ToyyibPay');
      }

      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      const msg = error.response?.data?.error || 'Failed to approve with ToyyibPay';
      toast.error(typeof msg === 'string' ? msg : 'Failed to approve with ToyyibPay');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.put(`/auth/club-verification-requests/${requestId}/reject`);
      toast.success('Verification rejected');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to reject verification');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const reviewedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Club Verification</h1>
        <p className="text-gray-600 mt-2">Review and approve club registration requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">{pendingRequests.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-3xl font-bold text-green-600">
            {requests.filter(r => r.status === 'approved').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-3xl font-bold text-red-600">
            {requests.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pending Requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No pending verification requests
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{request.clubName}</h3>
                    <p className="text-gray-600 mt-1">{request.clubDescription}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Email:</span> {request.clubEmail}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span>{' '}
                        {new Date(request.submittedAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="btn btn-primary"
                    >
                      ✓ Approve
                    </button>
                  <button
                    onClick={() => handleApproveWithToyyib(request)}
                    className="btn btn-secondary"
                  >
                    ✓ Approve + Enable ToyyibPay
                  </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="btn btn-danger"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Review History ({reviewedRequests.length})
          </h2>
          <div className="space-y-4">
            {reviewedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{request.clubName}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{request.clubDescription}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Reviewed:</span>{' '}
                        {new Date(request.reviewedAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                      {request.reviewedBy && (
                        <div>
                          <span className="font-medium">By:</span> Admin
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationPage;

