import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserStore } from '../store/userStore';
import api from '../config/axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';

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

  const { setUserStore } = useUserStore();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await api.put('/auth/profile', data);
      return response.data;
    },
    {
      onSuccess: async () => {
        // Refetch profile from backend to get all updated fields
        try {
          const response = await api.get('/auth/profile');
          if (response.data?.user) {
            // Update userStore with complete profile data from backend
            setUserStore({
              uid: response.data.user.uid || useUserStore.getState().uid,
              email: response.data.user.email || useUserStore.getState().email,
              role: response.data.user.role || useUserStore.getState().role,
              ...response.data.user
            });
          }
        } catch (error) {
          console.error('Error refetching profile:', error);
        }
        
        // Invalidate profile query cache
        queryClient.invalidateQueries(['profile']);
        queryClient.invalidateQueries(['paymentSettings']);
        
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
      onSuccess: async () => {
        // Refetch profile to get updated logoUrl and payment settings
        try {
          const response = await api.get('/auth/profile');
          if (response.data?.user) {
            // Update userStore with complete profile data from backend
            setUserStore({
              uid: response.data.user.uid || useUserStore.getState().uid,
              email: response.data.user.email || useUserStore.getState().email,
              role: response.data.user.role || useUserStore.getState().role,
              ...response.data.user
            });
          }
        } catch (error) {
          console.error('Error refetching profile:', error);
        }
        
        // Invalidate profile query cache
        queryClient.invalidateQueries(['profile']);
        queryClient.invalidateQueries(['paymentSettings']);
        
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
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files[0];
    if (file) {
      console.log('QR code file selected:', file.name, file.size, 'bytes');
      setQrCodeImage(file);
      // Create preview URL for display
      const url = URL.createObjectURL(file);
      setQrCodePreview(url);
      // Don't submit form - just store the file for later upload
    } else {
      setQrCodeImage(null);
      setQrCodePreview('');
    }
  };

  const removeQRCodeImage = () => {
    if (qrCodePreview && qrCodePreview.startsWith('blob:')) {
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
        const formDataUpload = new FormData();
        formDataUpload.append('image', clubLogoFile);
        
        const uploadResponse = await api.post('/upload/club-logo', formDataUpload);
        
        logoUrl = uploadResponse.data.imageUrl;
        // Update preview with the new URL
        setClubLogoPreview(logoUrl);
        setClubLogoFile(null); // Clear file after successful upload
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

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    // Validate: if manual payment selected, QR code must be uploaded or already exist
    if (paymentSettings.paymentMethod === 'manual') {
      const hasQRCode = qrCodeImage || paymentSettings.qrCodeImageUrl;
      if (!hasQRCode) {
        toast.error('Please upload a QR code image for manual payment method');
        return;
      }
    }
    
    try {
      let qrCodeUrl = paymentSettings.qrCodeImageUrl; // Keep existing QR code URL
      
      // Upload QR code file if one was selected
      if (qrCodeImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', qrCodeImage);
        
        try {
          console.log('Uploading QR code...', qrCodeImage.name);
          console.log('API base URL:', api.defaults.baseURL);
          console.log('Full URL will be:', `${api.defaults.baseURL}/upload/qr-code`);
          const uploadResponse = await api.post('/upload/qr-code', formDataUpload);
          console.log('Upload response:', uploadResponse.data);
          
          if (!uploadResponse.data?.imageUrl) {
            throw new Error('No image URL returned from server');
          }
          
          qrCodeUrl = uploadResponse.data.imageUrl;
          
          // Update preview with the new URL
          if (qrCodePreview && qrCodePreview.startsWith('blob:')) {
            URL.revokeObjectURL(qrCodePreview);
          }
          setQrCodePreview(qrCodeUrl);
          setQrCodeImage(null); // Clear file after successful upload
          
          toast.success('QR code uploaded successfully!');
        } catch (uploadError) {
          console.error('Error uploading QR code:', uploadError);
          const errorMsg = uploadError.response?.data?.error || uploadError.message || 'Failed to upload QR code image';
          toast.error(`Failed to upload QR code: ${errorMsg}`);
          return; // Don't proceed if upload fails
        }
      }
      
      // Submit payment settings with the uploaded QR code URL
      updatePaymentMutation.mutate({
        ...paymentSettings,
        qrCodeImageUrl: qrCodeUrl
      });
    } catch (error) {
      console.error('Error in payment submit:', error);
      toast.error('Failed to update payment settings');
    }
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
                    QR Code Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRCodeImageChange}
                    className="input"
                    key={`qr-input-${qrCodeImage ? 'has-file' : 'no-file'}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {qrCodeImage && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ File selected: {qrCodeImage.name} ({(qrCodeImage.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                  {!qrCodeImage && (
                    <p className="text-xs text-gray-500 mt-1">
                      Upload your QR code image file. This QR code will be displayed to students when they purchase tickets for your paid events.
                    </p>
                  )}

                  {/* QR Code Preview for newly selected file */}
                  {qrCodeImage && qrCodePreview && (
                    <div className="mt-4 relative inline-block">
                      <p className="text-sm text-gray-600 mb-2">New QR Code Preview:</p>
                      <img 
                        src={qrCodePreview} 
                        alt="QR Code Preview"
                        className="w-48 h-48 object-contain rounded-lg border border-gray-300"
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

                  {/* Show existing QR code if available and no new file selected */}
                  {paymentSettings.qrCodeImageUrl && !qrCodeImage && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Current QR Code:</p>
                      <div className="relative inline-block">
                        <img 
                          src={paymentSettings.qrCodeImageUrl} 
                          alt="Current QR Code"
                          className="w-48 h-48 object-contain rounded-lg border border-gray-300"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Upload a new file to replace the current QR code
                      </p>
                    </div>
                  )}
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
