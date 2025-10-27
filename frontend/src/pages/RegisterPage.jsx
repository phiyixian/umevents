import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    studentId: '',
    faculty: '',
    phoneNumber: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Register with Firebase
      const userCredential = await register(
        formData.email,
        formData.password,
        formData
      );

      // Save additional user data to backend
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        studentId: formData.studentId,
        faculty: formData.faculty,
        phoneNumber: formData.phoneNumber
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email (UM Email Required)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="your.email@siswa.um.edu.my"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-1">
                Student ID
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                required
                className="input"
                value={formData.studentId}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1">
                Faculty
              </label>
              <input
                id="faculty"
                name="faculty"
                type="text"
                required
                className="input"
                value={formData.faculty}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="input"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

