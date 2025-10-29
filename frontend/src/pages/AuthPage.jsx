import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(new URLSearchParams(window.location.search).get('role') || 'student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    studentId: '',
    faculty: '',
    phoneNumber: '',
    clubName: '',
    clubDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const { login, register, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/events');
      toast.success('Welcome back!');
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, {
        name: formData.name,
        role: role === 'club' ? 'club' : 'student',
        studentId: formData.studentId,
        faculty: formData.faculty,
        phoneNumber: formData.phoneNumber,
        clubName: role === 'club' ? formData.clubName : undefined,
        clubDescription: role === 'club' ? formData.clubDescription : undefined
      });

      if (role === 'club') {
        toast.success('Registration successful! Awaiting admin verification.');
        navigate('/dashboard');
      } else {
        toast.success('Registration successful!');
        navigate('/events');
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      const targetRoute = role === 'club' ? '/create-event' : '/events';
      navigate(targetRoute);
    } catch (error) {
      const errorMessage = error.message || 'Authentication failed';
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Sign in to UMEvents' : 'Join UMEvents'}
          </h2>
          
          {/* Role indicator */}
          <div className="mt-4 text-sm text-gray-600">
            Signing in as: <span className="font-medium">{role === 'club' ? 'Club / Organizer' : 'Student'}</span>
          </div>

          {/* Toggle Login/Register */}
          <p className="mt-4 text-center text-sm text-gray-600">
            {isLogin ? 'New to UMEvents? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              {isLogin ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={isLogin ? handleLogin : handleRegister}>
          {/* Login Form */}
          {isLogin && (
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Register Form */}
          {!isLogin && (
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
                  Email
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

              {/* Student-specific fields */}
              {role === 'student' && (
                <>
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
                </>
              )}

              {/* Club-specific fields */}
              {role === 'club' && (
                <>
                  <div>
                    <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 mb-1">
                      Club Name
                    </label>
                    <input
                      id="clubName"
                      name="clubName"
                      type="text"
                      required
                      className="input"
                      value={formData.clubName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="clubDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Club Description
                    </label>
                    <textarea
                      id="clubDescription"
                      name="clubDescription"
                      required
                      className="input"
                      rows="3"
                      value={formData.clubDescription}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary"
          >
            {loading 
              ? (isLogin ? 'Signing in...' : 'Creating account...') 
              : (isLogin ? 'Sign in' : 'Create account')
            }
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          {role === 'club' && !isLogin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ⏳ Club accounts require admin verification. You'll be notified once approved.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthPage;

