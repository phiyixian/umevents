import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';
import api from '../config/axios';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseApp from '../config/firebase';

const ClubProfilePage = () => {
  const { user } = useAuth();
  const { name, email, clubName, clubDescription, phoneNumber, verificationStatus } = useUserStore();
  
  const [formData, setFormData] = useState({
    clubName: '',
    clubDescription: '',
    contactPerson: '',
    phoneNumber: ''
  });

  // Load user data from store into form
  useEffect(() => {
    setFormData({
      clubName: (typeof clubName === 'string' ? clubName : '') || '',
      clubDescription: (typeof clubDescription === 'string' ? clubDescription : '') || '',
      contactPerson: (typeof name === 'string' ? name : '') || '',
      phoneNumber: (typeof phoneNumber === 'string' ? phoneNumber : '') || ''
    });
  }, [clubName, clubDescription, name, phoneNumber]);

  const [paymentSettings, setPaymentSettings] = useState({
    categoryCode: '',
    toyyibpayEnabled: false,
    paymentMethod: 'toyyibpay',
    qrCodeImageUrl: ''
  });

  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [qrCodePreview, setQrCodePreview] = useState('');
  const [clubLogoFile, setClubLogoFile] = useState(null);
  const [clubLogoPreview, setClubLogoPreview] = useState('');

  const { data: paymentData } = useQuery(
    ['paymentSettings'],
    async () => {
      const response = await api.get('/auth/profile');
      return response.data;
    },
    {
      enabled: !!user,
      onSuccess: (data) => {
        if (data.user) {
          setPaymentSettings({
            categoryCode: data.user.categoryCode || '',
            toyyibpayEnabled: data.user.toyyibpayEnabled || false,
            paymentMethod: data.user.paymentMethod || 'toyyibpay',
            qrCodeImageUrl: data.user.qrCodeImageUrl || ''
          });
          if (data.user.logoUrl) {
            setClubLogoPreview(data.user.logoUrl);
          }
        }
      }
    }
  );

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

  const updatePaymentMutation = useMutation(
    async (data) => {
      const response = await api.put('/payments/settings', data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Payment settings updated successfully!');
      },
      onError: (error) => {
        const errorMsg = error.response?.data?.error || 'Failed to update payment settings';
        toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to update payment settings');
      }
    }
  );

  const handleProfileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentChange = (e) => {
    setPaymentSettings({
      ...paymentSettings,
      [e.target.name]: e.target.value
    });
  };

  const handleQRCodeImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setQrCodeImage(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setQrCodePreview(url);
      setPaymentSettings({
        ...paymentSettings,
        qrCodeImageUrl: url // Use preview URL for now
      });
    }
  };

  const removeQRCodeImage = () => {
    if (qrCodePreview) {
      URL.revokeObjectURL(qrCodePreview);
    }
    setQrCodeImage(null);
    setQrCodePreview('');
    setPaymentSettings({
      ...paymentSettings,
      qrCodeImageUrl: ''
    });
  };

  const handleClubLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setClubLogoFile(file);
      const url = URL.createObjectURL(file);
      setClubLogoPreview(url);
    }
  };

  const removeClubLogo = () => {
    if (clubLogoPreview && clubLogoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(clubLogoPreview);
    }
    setClubLogoFile(null);
    setClubLogoPreview('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      let logoUrl = paymentData?.user?.logoUrl; // Keep existing logo
      
      // Upload new logo if one was selected
      if (clubLogoFile) {
        const storage = getStorage(firebaseApp);
        const storageRef = ref(storage, `club_logos/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, clubLogoFile);
        logoUrl = await getDownloadURL(storageRef);
      }
      
      updateProfileMutation.mutate({
        clubName: formData.clubName,
        clubDescription: formData.clubDescription,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
        logoUrl
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    }
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    updatePaymentMutation.mutate(paymentSettings);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Club Profile</h1>

      {/* Verification Status */}
      {verificationStatus === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-semibold">Account Pending Verification</h3>
                <p className="text-yellow-700 text-sm">Your account is awaiting admin verification. Once verified, you can create and manage events.</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const subject = encodeURIComponent('Club Verification Request - ' + formData.clubName);
              const body = encodeURIComponent(`Hello,\n\nI am requesting verification for my club account:\n\nClub Name: ${formData.clubName}\nContact Person: ${formData.contactPerson}\nEmail: ${email}\nPhone: ${formData.phoneNumber}\n\nDescription: ${formData.clubDescription || 'N/A'}\n\nPlease verify my account so I can start creating events.\n\nThank you!`);
              window.location.href = `mailto:admin@umevents.com?subject=${subject}&body=${body}`;
            }}
            className="mt-3 w-full btn btn-secondary flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Admin to Request Verification
          </button>
        </div>
      )}

      {verificationStatus === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-green-800 font-semibold">Account Verified</h3>
              <p className="text-green-700 text-sm">Your account is verified and you can create events</p>
            </div>
          </div>
        </div>
      )}

      {/* Club Information */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Club Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Club Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleClubLogoChange}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your club logo (will be displayed on events and profile)
              </p>

              {clubLogoPreview && (
                <div className="mt-4 relative inline-block">
                  <img 
                    src={clubLogoPreview} 
                    alt="Club Logo Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeClubLogo}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Club Name
              </label>
              <input
                type="text"
                name="clubName"
                className="input"
                value={formData.clubName}
                onChange={handleProfileChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                className="input"
                value={formData.contactPerson}
                onChange={handleProfileChange}
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
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                className="input"
                value={formData.phoneNumber}
                onChange={handleProfileChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Club Description
              </label>
              <textarea
                name="clubDescription"
                rows="4"
                className="input"
                value={formData.clubDescription}
                onChange={handleProfileChange}
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

      {/* Payment Settings - Only shown if verified */}
      {verificationStatus === 'approved' && (
        <form onSubmit={handlePaymentSubmit} className="space-y-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  className="input"
                  value={paymentSettings.paymentMethod}
                  onChange={handlePaymentChange}
                >
                  <option value="toyyibpay">ToyyibPay</option>
                  <option value="manual">Manual QR Code</option>
                </select>
              </div>

              {paymentSettings.paymentMethod === 'toyyibpay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ToyyibPay (Admin managed)
                  </label>
                  {paymentData?.user?.toyyibpayApplicationStatus === 'approved' && paymentData?.user?.categoryCode ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                      ToyyibPay enabled. Category: <span className="font-semibold">{paymentData.user.categoryCode}</span>
                    </div>
                  ) : paymentData?.user?.toyyibpayApplicationStatus === 'pending' ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                      Application pending admin approval.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.post('/payments/toyyibpay/apply');
                          toast.success('Application submitted. Await admin approval.');
                        } catch (e) {
                          const msg = e.response?.data?.error || 'Failed to submit application';
                          toast.error(typeof msg === 'string' ? msg : 'Failed to submit application');
                        }
                      }}
                      className="btn btn-secondary"
                    >
                      Apply for ToyyibPay
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Clubs do not need a ToyyibPay account. Admin will provision access.
                  </p>
                </div>
              )}

              {paymentSettings.paymentMethod === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRCodeImageChange}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your QR code image file
                  </p>

                  {/* QR Code Preview */}
                  {qrCodePreview && (
                    <div className="mt-4 relative inline-block">
                      <img 
                        src={qrCodePreview} 
                        alt="QR Code Preview"
                        className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeQRCodeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {/* Or use URL input as alternative */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or enter QR Code Image URL
                    </label>
                    <input
                      type="text"
                      name="qrCodeImageUrl"
                      className="input"
                      placeholder="https://example.com/qrcode.png"
                      value={!qrCodeImage ? paymentSettings.qrCodeImageUrl : ''}
                      onChange={handlePaymentChange}
                      disabled={!!qrCodeImage}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {qrCodeImage ? 'Remove uploaded image to use URL' : 'Paste QR code image URL here'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updatePaymentMutation.isLoading}
              className="btn btn-primary"
            >
              {updatePaymentMutation.isLoading ? 'Updating...' : 'Update Payment Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ClubProfilePage;
