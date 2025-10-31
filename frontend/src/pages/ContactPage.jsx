import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/userStore';

const ContactPage = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    rating: null,
    type: 'general'
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const { name, email } = useUserStore();

  // Auto-fill form if user is logged in
  useEffect(() => {
    if (name && email) {
      setFeedbackForm(prev => ({
        ...prev,
        name: prev.name || name,
        email: prev.email || email
      }));
    }
  }, [name, email]);

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

      {/* Feedback Section */}
      <div className="mt-16 mb-8">
        <div className="card max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 font-heading">Send Us Feedback</h2>
          <p className="text-gray-600 mb-6">
            We'd love to hear from you! Share your thoughts, suggestions, or report any issues.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setSubmittingFeedback(true);

            try {
              await api.post('/feedback', feedbackForm);
              toast.success('Thank you for your feedback! We appreciate your input.');
              setFeedbackForm({
                name: name || '',
                email: email || '',
                subject: '',
                message: '',
                rating: null,
                type: 'general'
              });
            } catch (error) {
              const errorMsg = error.response?.data?.error || 'Failed to submit feedback. Please try again.';
              toast.error(errorMsg);
            } finally {
              setSubmittingFeedback(false);
            }
          }}>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="feedback-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    required
                    className="input"
                    placeholder="Your name"
                    value={feedbackForm.name}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="feedback-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    className="input"
                    placeholder="your.email@example.com"
                    value={feedbackForm.email}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback Type
                </label>
                <select
                  id="feedback-type"
                  className="input"
                  value={feedbackForm.type}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, type: e.target.value })}
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="complaint">Complaint</option>
                  <option value="praise">Praise</option>
                </select>
              </div>

              <div>
                <label htmlFor="feedback-subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  id="feedback-subject"
                  type="text"
                  className="input"
                  placeholder="Brief summary of your feedback"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="feedback-rating" className="block text-sm font-medium text-gray-700 mb-1">
                  Rating (Optional)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className={`text-2xl transition ${feedbackForm.rating >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                    >
                      ★
                    </button>
                  ))}
                  {feedbackForm.rating && (
                    <button
                      type="button"
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: null })}
                      className="text-sm text-gray-500 hover:text-gray-700 ml-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  required
                  rows={6}
                  className="input"
                  placeholder="Tell us what's on your mind..."
                  value={feedbackForm.message}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="btn btn-primary w-full md:w-auto"
                >
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;


