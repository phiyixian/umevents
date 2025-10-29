import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';
import api from '../config/axios';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';

const StudentProfilePage = () => {
  const { user } = useAuth();
  const { name, email, studentId, faculty, phoneNumber } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: (typeof name === 'string' ? name : '') || '',
    studentId: (typeof studentId === 'string' ? studentId : '') || '',
    faculty: (typeof faculty === 'string' ? faculty : '') || '',
    phoneNumber: (typeof phoneNumber === 'string' ? phoneNumber : '') || ''
  });

  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.error || 'Failed to update profile';
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to update profile');
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
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Student Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                className="input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                disabled
                className="input bg-gray-100"
                value={(typeof email === 'string' ? email : '') || ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                type="text"
                name="studentId"
                className="input"
                value={formData.studentId}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faculty
              </label>
              <input
                type="text"
                name="faculty"
                className="input"
                value={formData.faculty}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                className="input"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isLoading}
            className="btn btn-primary"
          >
            {updateProfileMutation.isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfilePage;
