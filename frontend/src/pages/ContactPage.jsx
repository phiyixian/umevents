import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';

const ContactPage = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/auth/public/clubs');
        setClubs(response.data.clubs || []);
      } catch (e) {
        console.error('Failed to load clubs', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umblue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 font-heading">Contact Us</h1>
      <p className="text-gray-600 mb-8">Reach out to the UMEvents team or contact clubs directly below.</p>

      <div className="grid md:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <Link key={club.id} to={`/clubs/${club.id}`} className="card block hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.clubName || club.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200" />
              )}
              <div>
                <h3 className="text-xl font-semibold font-heading">{club.clubName || club.name || 'Club'}</h3>
                <p className="text-gray-600">{club.clubDescription || 'No description provided.'}</p>
              </div>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div><span className="font-medium">Email:</span> {club.email || '-'}</div>
              <div><span className="font-medium">Phone:</span> {club.phoneNumber || '-'}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContactPage;


