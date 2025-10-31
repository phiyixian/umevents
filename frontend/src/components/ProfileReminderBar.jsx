import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const isStudentComplete = (user) => {
  const required = [user?.name, user?.email, user?.phoneNumber, user?.faculty];
  return required.every(Boolean);
};

const isClubComplete = (user) => {
  // Using common fields stored on user document; adapt as fields expand
  const required = [
    user?.name || user?.clubName,
    user?.email,
    user?.phoneNumber,
    user?.logoUrl,
    user?.clubDescription || user?.description
  ];
  return required.every(Boolean);
};

export default function ProfileReminderBar() {
  const user = useUserStore();
  const role = user?.role;

  if (!role) return null;

  const complete = role === 'club' ? isClubComplete(user) : isStudentComplete(user);
  if (complete) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3 text-yellow-900">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">
            Complete your profile to enable auto-fill during ticket purchase and forms.
          </span>
        </div>
        <Link to="/profile" className="text-sm font-semibold text-yellow-800 hover:text-yellow-900 underline">
          Go to Profile
        </Link>
      </div>
    </div>
  );
}


