import { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseApp from '../config/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/userStore';

const EditEventPage = () => {
  const { id } = useParams();
  const { verificationStatus } = useUserStore();
  const navigate = useNavigate();

  // Fetch event data
  const { data: eventData, isLoading: isLoadingEvent } = useQuery(
    ['event', id],
    async () => {
      const response = await api.get(`/events/${id}`);
      return response.data.event;
    },
    { enabled: !!id }
  );

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
    tags: '',
    socialMediaPostUrl: '',
    paymentMethod: 'toyyibpay',
    organizerQRCode: '',
    paymentInstructions: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);

  // Populate form when event data loads
  useEffect(() => {
    if (eventData) {
      // Convert Firestore Timestamp to datetime-local format
      const formatDateForInput = (timestamp) => {
        if (!timestamp) {
          console.log('No timestamp provided');
          return '';
        }
        
        console.log('Formatting date:', timestamp);
        
        try {
          let date;
          
          // Handle Firestore Timestamp with seconds property
          if (typeof timestamp === 'object' && timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
          }
          // Handle Firestore Timestamp with toDate method
          else if (timestamp && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
          }
          // Handle ISO string or timestamp number
          else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            date = new Date(timestamp);
          }
          // Handle Date objects
          else if (timestamp instanceof Date) {
            date = timestamp;
          }
          // Handle _seconds format from Firestore
          else if (timestamp._seconds) {
            date = new Date(timestamp._seconds * 1000);
          }
          else {
            console.log('Unknown timestamp format:', timestamp);
            return '';
          }
          
          // Validate date
          if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Invalid date:', timestamp);
            return '';
          }
          
          const formatted = date.toISOString().slice(0, 16);
          console.log('Formatted date:', formatted);
          return formatted;
        } catch (error) {
          console.error('Date formatting error:', error, 'Input:', timestamp);
          return '';
        }
      };

      console.log('Setting form data from eventData:', eventData);
      setFormData({
        title: eventData.title || '',
        description: eventData.description || '',
        category: eventData.category || 'Academic',
        startDate: formatDateForInput(eventData.startDate),
        endDate: formatDateForInput(eventData.endDate),
        location: eventData.location || '',
        venue: eventData.venue || '',
        ticketPrice: eventData.ticketPrice?.toString() || '0',
        capacity: eventData.capacity?.toString() || '',
        imageUrl: eventData.imageUrl || '',
        tags: (eventData.tags || []).join(', '),
        socialMediaPostUrl: eventData.socialMediaPostUrl || '',
        paymentMethod: eventData.paymentMethod || 'toyyibpay',
        organizerQRCode: eventData.organizerQRCode || '',
        paymentInstructions: eventData.paymentInstructions || ''
      });
      
      // Set image URLs if they exist
      if (eventData.imageUrls && eventData.imageUrls.length > 0) {
        setImageUrls(eventData.imageUrls);
      } else if (eventData.imageUrl) {
        setImageUrls([eventData.imageUrl]);
      }
    }
  }, [eventData]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    // Create preview URLs for selected files
    const urls = files.map(file => URL.createObjectURL(file));
    setImageUrls(prevUrls => [...prevUrls, ...urls]);
  };

  const removeImage = (index) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    
    // Revoke object URLs if it's a blob URL
    if (imageUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(imageUrls[index]);
    }
    
    setImageUrls(newUrls);
  };

  const updateEventMutation = useMutation(
    async (data) => {
      const response = await api.put(`/events/${id}`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('Event updated successfully!');
        // Navigate to the updated event detail page to show latest info
        navigate(`/events/${id}`);
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.error || 'Failed to update event';
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to update event');
      }
    }
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Upload any newly selected images to Firebase Storage
    let downloadUrls = [];
    try {
      if (imageFiles.length > 0) {
        const storage = getStorage(firebaseApp);
        const uploads = imageFiles.map(async (file) => {
          const fileRef = ref(storage, `events/${Date.now()}_${file.name}`);
          await uploadBytes(fileRef, file);
          return await getDownloadURL(fileRef);
        });
        downloadUrls = await Promise.all(uploads);
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      return toast.error('Failed to upload images');
    }

    // Merge existing URLs with newly uploaded ones, ignore blob previews
    const mergedUrls = [...imageUrls.filter(u => !u.startsWith('blob:')), ...downloadUrls];

    updateEventMutation.mutate({
      ...formData,
      ticketPrice: parseFloat(formData.ticketPrice),
      capacity: parseInt(formData.capacity),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      imageUrls: mergedUrls,
      socialMediaPostUrl: formData.socialMediaPostUrl,
      paymentMethod: formData.paymentMethod,
      organizerQRCode: formData.organizerQRCode,
      paymentInstructions: formData.paymentInstructions
    });
  };

  // Loading state
  if (isLoadingEvent) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umblue-600"></div>
      </div>
    );
  }

  // Check if club is verified
  if (verificationStatus !== 'approved') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h2 className="text-2xl font-bold text-yellow-800 mb-2">Account Verification Required</h2>
              <p className="text-yellow-700 mb-4">
                Your club account is currently awaiting admin verification. Once your account is verified, you'll be able to edit and manage events.
              </p>
              <p className="text-sm text-yellow-600">
                Please wait for admin approval to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Edit Event</h1>

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
            Event Images (Multiple images supported)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can select multiple images to create a promotional gallery
          </p>
          
          {/* Image Preview */}
          {imageUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Social Media Post URL (Optional)
          </label>
          <input
            type="url"
            name="socialMediaPostUrl"
            className="input"
            value={formData.socialMediaPostUrl}
            onChange={handleChange}
            placeholder="https://www.facebook.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Share link to Facebook, Instagram, or other social media posts
          </p>
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
            disabled={updateEventMutation.isLoading}
            className="btn btn-primary flex-1"
          >
            {updateEventMutation.isLoading ? 'Updating...' : 'Update Event'}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
              try {
                await api.delete(`/events/${id}`);
                toast.success('Event deleted');
                navigate('/events');
              } catch (e) {
                const msg = e.response?.data?.error || 'Failed to delete event';
                toast.error(typeof msg === 'string' ? msg : 'Failed to delete event');
              }
            }}
            className="btn btn-danger"
          >
            Delete Event
          </button>
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEventPage;

