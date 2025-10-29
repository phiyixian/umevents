import { useNavigate } from 'react-router-dom';

const RoleSelectPage = () => {
  const navigate = useNavigate();

  const goToRegister = (role) => {
    // Navigate to role-specific registration page
    if (role === 'student') {
      navigate('/student-register');
    } else if (role === 'club') {
      navigate('/club-register');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome to UMEvents</h2>
        <p className="text-gray-600">Choose how you want to use the platform</p>
        <div className="grid grid-cols-1 gap-4 mt-6">
          <button
            type="button"
            className="w-full btn btn-primary p-6"
            onClick={() => goToRegister('student')}
          >
            <div className="text-left">
              <div className="text-2xl mb-2">🎓</div>
              <div className="font-bold text-lg">Student</div>
              <div className="text-sm opacity-90">Browse and join events</div>
            </div>
          </button>
          <button
            type="button"
            className="w-full btn btn-secondary p-6"
            onClick={() => goToRegister('club')}
          >
            <div className="text-left">
              <div className="text-2xl mb-2">🎪</div>
              <div className="font-bold text-lg">Club / Organizer</div>
              <div className="text-sm opacity-90">Create and manage events</div>
            </div>
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default RoleSelectPage;