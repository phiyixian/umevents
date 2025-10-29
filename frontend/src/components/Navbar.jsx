import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { name, role } = useUserStore();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-umblue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <span className="text-xl font-bold text-gray-900">UMEvents</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-umblue-600 transition">
              Home
            </Link>
            <Link to="/events" className="text-gray-700 hover:text-umblue-600 transition">
              Events
            </Link>
            
            {user ? (
              <>
                {role === 'student' && (
                  <Link to="/my-tickets" className="text-gray-700 hover:text-umblue-600 transition">
                    My Tickets
                  </Link>
                )}
                
                {role === 'club' && (
                  <>
                    <Link to="/create-event" className="text-gray-700 hover:text-umblue-600 transition">
                      Create Event
                    </Link>
                    <Link to="/analytics" className="text-gray-700 hover:text-umblue-600 transition">
                      Analytics
                    </Link>
                  </>
                )}

                {role === 'admin' && (
                  <>
                    <Link to="/admin/verifications" className="text-gray-700 hover:text-umblue-600 transition">
                      Verify Clubs
                    </Link>
                    <Link to="/admin/analytics" className="text-gray-700 hover:text-umblue-600 transition">
                      Platform Analytics
                    </Link>
                  </>
                )}
                
                <Link to="/profile" className="text-gray-700 hover:text-umblue-600 transition">
                  {name || 'Profile'}
                </Link>
                
                <button
                  onClick={signOut}
                  className="btn btn-secondary"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-umblue-600 transition">
                  Login
                </Link>
                <Link to="/start" className="btn btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

