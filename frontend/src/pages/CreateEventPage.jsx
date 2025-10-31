import { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseApp from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import api from '../config/axios';
import toast from 'react-hot-toast';
import { useUserStore } from '../store/userStore';

const CreateEventPage = () => {
  const { verificationStatus } = useUserStore();
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
    whatsappGroupLink: ''
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  
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
        const errorMsg = error.response?.data?.error || 'Failed to create event';
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to create event');
      }
    }
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    // Create preview URLs for selected files
    const urls = files.map(file => URL.createObjectURL(file));
    setImageUrls(urls);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    
    // Revoke object URLs
    URL.revokeObjectURL(imageUrls[index]);
    
    setImageFiles(newFiles);
    setImageUrls(newUrls);
  };

  const addCustomField = () => {
    setCustomFields([...customFields, {
      id: Date.now(),
      label: '',
      type: 'text', // text, textarea, file, single-select, multiple-select
      required: false,
      options: [] // For select types
    }]);
  };

  const updateCustomField = (id, updates) => {
    setCustomFields(customFields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const addOptionToField = (fieldId) => {
    setCustomFields(customFields.map(field => 
      field.id === fieldId 
        ? { ...field, options: [...(field.options || []), { id: Date.now(), value: '' }] }
        : field
    ));
  };

  const updateOptionInField = (fieldId, optionId, value) => {
    setCustomFields(customFields.map(field => 
      field.id === fieldId
        ? {
            ...field,
            options: field.options.map(opt => 
              opt.id === optionId ? { ...opt, value } : opt
            )
          }
        : field
    ));
  };

  const removeOptionFromField = (fieldId, optionId) => {
    setCustomFields(customFields.map(field => 
      field.id === fieldId
        ? {
            ...field,
            options: field.options.filter(opt => opt.id !== optionId)
          }
        : field
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Upload images to Firebase Storage and collect download URLs
    let downloadUrls = [];
    try {
      if (imageFiles.length > 0) {
        const storage = getStorage(firebaseApp);
        const uploads = imageFiles.map(async (file, idx) => {
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

    // All images go into imageUrls array (no separate imageUrl field)
    const imageUrlList = downloadUrls.length > 0
      ? downloadUrls
      : [];
    
    // Validate custom fields before submission
    const validatedCustomFields = customFields
      .filter(field => field.label.trim()) // Only include fields with labels
      .map(field => ({
        label: field.label.trim(),
        type: field.type,
        required: field.required || false,
        options: field.options && field.options.length > 0 
          ? field.options.map(opt => opt.value).filter(opt => opt.trim())
          : []
      }));

    createEventMutation.mutate({
      ...formData,
      ticketPrice: parseFloat(formData.ticketPrice),
      capacity: parseInt(formData.capacity),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      imageUrls: imageUrlList, // Array of image URLs
      socialMediaPostUrl: formData.socialMediaPostUrl,
      whatsappGroupLink: formData.whatsappGroupLink || '',
      customFields: validatedCustomFields
    });
  };

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
                Your club account is currently awaiting admin verification. Once your account is verified, you'll be able to create and manage events.
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Group Link (Optional)
          </label>
          <input
            type="url"
            name="whatsappGroupLink"
            className="input"
            value={formData.whatsappGroupLink}
            onChange={handleChange}
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Share the WhatsApp group invite link. This will be displayed on purchased tickets.
          </p>
        </div>

        {/* Custom Form Fields Builder */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Additional Form Fields</h3>
              <p className="text-xs text-gray-500 mt-1">
                Add custom questions or fields that attendees need to fill when purchasing tickets
              </p>
            </div>
            <button
              type="button"
              onClick={addCustomField}
              className="btn btn-secondary text-sm"
            >
              + Add Field
            </button>
          </div>

          {customFields.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-sm">No custom fields added yet</p>
              <p className="text-gray-400 text-xs mt-1">Click "Add Field" to create a custom question</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customFields.map((field, index) => (
                <div key={field.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Field Label *
                      </label>
                      <input
                        type="text"
                        className="input text-sm"
                        value={field.label}
                        onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                        placeholder="e.g., Dietary Requirements"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Field Type *
                      </label>
                      <select
                        className="input text-sm"
                        value={field.type}
                        onChange={(e) => updateCustomField(field.id, { type: e.target.value })}
                      >
                        <option value="text">Text Input</option>
                        <option value="textarea">Text Area</option>
                        <option value="file">File Upload</option>
                        <option value="single-select">Single Selection</option>
                        <option value="multiple-select">Multiple Selection</option>
                      </select>
                    </div>
                  </div>

                  {/* Options for select types */}
                  {(field.type === 'single-select' || field.type === 'multiple-select') && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-medium text-gray-700">
                          Options
                        </label>
                        <button
                          type="button"
                          onClick={() => addOptionToField(field.id)}
                          className="text-xs text-umblue-600 hover:text-umblue-700"
                        >
                          + Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(field.options || []).map((option) => (
                          <div key={option.id} className="flex gap-2">
                            <input
                              type="text"
                              className="input text-sm flex-1"
                              value={option.value}
                              onChange={(e) => updateOptionInField(field.id, option.id, e.target.value)}
                              placeholder="Option value"
                            />
                            <button
                              type="button"
                              onClick={() => removeOptionFromField(field.id, option.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      Required field
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove Field
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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

