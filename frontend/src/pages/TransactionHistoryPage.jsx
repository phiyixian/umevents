import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import { format } from 'date-fns';

const TransactionHistoryPage = () => {
  const { data: transactionsData, isLoading } = useQuery('myTransactions', async () => {
    const response = await api.get('/payments/transactions/my');
    return response.data;
  });

  const transactions = transactionsData?.transactions || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Transaction History</h1>

      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2">No transactions yet</h2>
          <p className="text-gray-600 mb-4">Your payment history will appear here</p>
          <Link to="/events" className="btn btn-primary">
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">
                    {transaction.event?.title || 'Event Ticket Purchase'}
                  </h3>
                  {transaction.event && (
                    <p className="text-sm text-gray-600">
                      {transaction.event.startDate && format(new Date(transaction.event.startDate), 'PPP')}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {transaction.status === 'completed' ? 'Paid' : transaction.status}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-primary-600">
                      RM {Number(transaction.totalAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{transaction.method || 'ToyyibPay'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tickets:</span>
                    <span className="font-medium">{transaction.ticketCount || 0} ticket(s)</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {transaction.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-xs break-all">{transaction.transactionId}</span>
                    </div>
                  )}
                  {transaction.billcode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bill Code:</span>
                      <span className="font-mono text-xs">{transaction.billcode}</span>
                    </div>
                  )}
                  {transaction.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">{format(new Date(transaction.completedAt), 'PPp')}</span>
                    </div>
                  )}
                  {!transaction.completedAt && transaction.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{format(new Date(transaction.createdAt), 'PPp')}</span>
                    </div>
                  )}
                </div>
              </div>

              {transaction.ticketIds && transaction.ticketIds.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">Related Tickets:</p>
                  <div className="flex flex-wrap gap-2">
                    {transaction.ticketIds.slice(0, 3).map((ticketId) => (
                      <Link
                        key={ticketId}
                        to={`/tickets/${ticketId}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        View Ticket #{ticketId.slice(0, 8)}
                      </Link>
                    ))}
                    {transaction.ticketIds.length > 3 && (
                      <span className="text-sm text-gray-500">
                        +{transaction.ticketIds.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;

