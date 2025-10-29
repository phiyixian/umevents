import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../config/axios';

const ClubIntroPage = () => {
  const { clubId } = useParams();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const clubRes = await api.get(`/auth/public/club/${clubId}`);
        setClub(clubRes.data.club);
        const evRes = await api.get(`/events/by-organizer/${clubId}`);
        setEvents(evRes.data.events || []);
      } catch (e) {
        console.error('Failed to load club intro', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clubId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umblue-600"></div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="container mx-auto px-4 py-12 text-center text-gray-600">Club not found</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-6 mb-8">
        {club.logoUrl ? (
          <img src={club.logoUrl} alt={club.clubName || club.name} className="w-24 h-24 rounded-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gray-200" />
        )}
        <div>
          <h1 className="text-3xl font-bold font-heading">{club.clubName || club.name}</h1>
          <p className="text-gray-600">{club.clubDescription || 'No description provided.'}</p>
          <div className="text-sm text-gray-700 mt-2">
            <div><span className="font-medium">Email:</span> {club.email || '-'}</div>
            <div><span className="font-medium">Phone:</span> {club.phoneNumber || '-'}</div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4 font-heading">Events</h2>
      {events.length === 0 ? (
        <div className="text-gray-500">No events yet.</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {events.map(ev => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="card hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gray-200 rounded-lg mb-3 overflow-hidden">
                {ev.imageUrl ? (
                  <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <h3 className="text-lg font-semibold">{ev.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{ev.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubIntroPage;


