import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const isStudentComplete = (user) => {
  const required = [user?.name, user?.email, user?.studentId, user?.phoneNumber, user?.faculty];
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

// Check if club has payment method set up
const isPaymentSetupComplete = (user) => {
  if (user?.role !== 'club') return true; // Not applicable to non-clubs
  
  // Check for ToyyibPay approval
  const toyyibpayApproved = user?.toyyibpayEnabled || 
                            user?.toyyibpayApplicationStatus === 'approved' || 
                            !!user?.categoryCode;
  
  // Check for manual QR code - must have paymentMethod='manual' AND qrCodeImageUrl
  const hasManualQRUrl = !!user?.qrCodeImageUrl && user.qrCodeImageUrl.trim() !== '';
  const manualQRConfigured = (user?.paymentMethod === 'manual' || user?.paymentMethod === 'manual_qr') && hasManualQRUrl;
  
  // At least one payment method must be set up
  return toyyibpayApproved || manualQRConfigured;
};

export default function ProfileReminderBar() {
  const user = useUserStore();
  const role = user?.role;

  if (!role) return null;

  const profileComplete = role === 'club' ? isClubComplete(user) : isStudentComplete(user);
  const paymentSetupComplete = isPaymentSetupComplete(user);

  // Show profile reminder if profile incomplete
  if (!profileComplete) {
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

  // Show payment setup reminder if club profile is complete but payment not set up
  if (role === 'club' && !paymentSetupComplete) {
    return (
      <div className="bg-orange-50 border-b border-orange-200">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-3 text-orange-900">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              Set up a payment method (ToyyibPay or manual QR code) to enable paid events. Go to your profile to configure.
            </span>
          </div>
          <Link to="/profile" className="text-sm font-semibold text-orange-800 hover:text-orange-900 underline">
            Set Up Payment
          </Link>
        </div>
      </div>
    );
  }

  return null;
}


