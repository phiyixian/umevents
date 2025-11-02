import { useState } from 'react';
import { useQuery } from 'react-query';
import api from '../config/axios';
import { useUserStore } from '../store/userStore';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const AnalyticsPage = () => {
  const { role } = useUserStore();
  const uid = useUserStore((state) => state.uid);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // Safe date utilities
  const toSafeDate = (dateInput) => {
    if (!dateInput) return 'N/A';
    try {
      let date;
      if (typeof dateInput === 'object' && dateInput.seconds) {
        date = new Date(dateInput.seconds * 1000);
      } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput instanceof Date) {
        date = dateInput;
      } else if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
      } else {
        return null;
      }
      
      if (!(date instanceof Date) || isNaN(date.getTime())) return null;
      return date;
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };

  const formatDateSafe = (dateInput) => {
    const d = toSafeDate(dateInput);
    return d ? format(d, 'PPP') : 'N/A';
  };

  const formatDateTimeSafe = (dateInput) => {
    const d = toSafeDate(dateInput);
    return d ? format(d, 'PPP p') : 'N/A';
  };

  const { data: analyticsData, isLoading } = useQuery(
    ['analytics', role, uid],
    async () => {
      if (role === 'club') {
        const response = await api.get(`/analytics/club/${uid}`);
        return response.data;
      } else if (role === 'admin') {
        const response = await api.get('/analytics/platform');
        return response.data;
      }
      return null;
    },
    { enabled: role === 'club' || role === 'admin' }
  );

  const { data: participantsData, isLoading: isLoadingParticipants } = useQuery(
    ['participants', selectedEventId],
    async () => {
      if (!selectedEventId) return null;
      const response = await api.get(`/analytics/event/${selectedEventId}/participants`);
      return response.data;
    },
    { enabled: !!selectedEventId }
  );

  const exportToExcel = () => {
    if (!participantsData?.participants) return;

    const ws = XLSX.utils.json_to_sheet(
      participantsData.participants.map(p => ({
        'Student Name': p.studentName,
        'Student ID': p.studentId,
        'Faculty': p.faculty,
        'Email': p.email,
        'Phone Number': p.phoneNumber,
        'Major/Degree Program': p.major || 'N/A',
        'Degree Level': p.degree || 'N/A',
        'Current Semester': p.currentSemester || 'N/A',
        'Dietary Requirements': p.dietaryRequirement || 'N/A',
        'Purchase Date': formatDateTimeSafe(p.purchaseDate),
        'Status': p.status
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participants');
    XLSX.writeFile(wb, `${participantsData.eventTitle}_participants.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const { analytics, events } = analyticsData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Total Events</p>
          <p className="text-3xl font-bold">{analytics.totalEvents || 0}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Tickets Sold</p>
          <p className="text-3xl font-bold">{analytics.totalTicketsSold || 0}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
          <p className="text-3xl font-bold">RM {analytics.totalRevenue?.toFixed(2) || 0}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Revenue After Fees</p>
          <p className="text-3xl font-bold">RM {analytics.totalRevenueAfterFees?.toFixed(2) || 0}</p>
        </div>
      </div>

      {/* Event Selection */}
      {events && events.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Select an Event to View Participants</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`p-4 rounded-lg border-2 text-left transition ${
                  selectedEventId === event.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-semibold mb-2">{event.title}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Sold:</span> {event.ticketsSold || 0}
                  </div>
                  <div>
                    <span className="font-medium">Capacity:</span> {event.capacity || 0}
                  </div>
                  <div>
                    <span className="font-medium">Available:</span> {(event.capacity || 0) - (event.ticketsSold || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Revenue:</span> RM {event.revenue?.toFixed(2) || 0}
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Date: {formatDateSafe(event.startDate)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Participants List */}
      {selectedEventId && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Participants
              {participantsData?.eventTitle && ` - ${participantsData.eventTitle}`}
            </h2>
            {participantsData?.participants && participantsData.participants.length > 0 && (
              <button
                onClick={exportToExcel}
                className="btn btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0-6l3 3m-3-3l-3 3m3-3h6m-9-3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-4" />
                </svg>
                Export to Excel
              </button>
            )}
          </div>

          {isLoadingParticipants ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : participantsData?.participants && participantsData.participants.length > 0 ? (
            <>
              <p className="text-gray-600 mb-4">
                Total Participants: {participantsData.totalParticipants}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Student Name</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Student ID</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Faculty</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Phone</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Major/Degree</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Degree Level</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Semester</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Dietary Req.</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Purchase Date</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {participantsData.participants.map((participant, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{participant.studentName}</td>
                        <td className="px-4 py-2">{participant.studentId}</td>
                        <td className="px-4 py-2">{participant.faculty}</td>
                        <td className="px-4 py-2">{participant.email}</td>
                        <td className="px-4 py-2">{participant.phoneNumber}</td>
                        <td className="px-4 py-2">{participant.major || 'N/A'}</td>
                        <td className="px-4 py-2">{participant.degree || 'N/A'}</td>
                        <td className="px-4 py-2">{participant.currentSemester || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm max-w-xs truncate" title={participant.dietaryRequirement || 'N/A'}>
                          {participant.dietaryRequirement || 'N/A'}
                        </td>
                        <td className="px-4 py-2">{formatDateTimeSafe(participant.purchaseDate)}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            participant.status === 'confirmed' || participant.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {participant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">No participants yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
