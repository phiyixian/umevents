import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import api from '../config/axios';
import toast from 'react-hot-toast';

const CreateEventPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Academic',
    startDate: '',
    endDate: '',
    location: '',
    venue: '',
    ticketPrice: '0',
    capacity: '',
    imageUrl: '',
    tags: ''
  });
  
  const navigate = useNavigate();

  const createEventMutation = useMutation(
    async (data) => {
      const response = await api.post('/events', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Event created successfully!');
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create event');
      }
    }
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createEventMutation.mutate({
      ...formData,
      ticketPrice: parseFloat(formData.ticketPrice),
      capacity: parseInt(formData.capacity),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Title *
          </label>
          <input
            type="text"
            name="title"
            required
            className="input"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter event title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            required
            rows={6}
            className="input"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your event..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              name="category"
              required
              className="input"
              value={formData.category}
              onChange={handleChange}
            >
              <option>Academic</option>
              <option>Cultural</option>
              <option>Sports</option>
              <option>Workshop</option>
              <option>Social</option>
              <option>Career</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Price (RM) *
            </label>
            <input
              type="number"
              name="ticketPrice"
              required
              step="0.01"
              min="0"
              className="input"
              value={formData.ticketPrice}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              name="startDate"
              required
              className="input"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              name="endDate"
              required
              className="input"
              value={formData.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              name="location"
              required
              className="input"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Universiti Malaya"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Venue *
            </label>
            <input
              type="text"
              name="venue"
              required
              className="input"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g., Dewan Tunku Canselor"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity *
          </label>
          <input
            type="number"
            name="capacity"
            required
            min="1"
            className="input"
            value={formData.capacity}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            type="url"
            name="imageUrl"
            className="input"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            className="input"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., networking, free, open-to-all"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={createEventMutation.isLoading}
            className="btn btn-primary flex-1"
          >
            {createEventMutation.isLoading ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;

