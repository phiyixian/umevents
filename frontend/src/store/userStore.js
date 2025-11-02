import { create } from 'zustand';

export const useUserStore = create((set) => ({
  uid: null,
  email: null,
  name: null,
  role: null,
  studentId: null,
  faculty: null,
  phoneNumber: null,
  major: null,
  degree: null,
  currentSemester: null,
  dietaryRequirement: null,
  isClubVerified: false,
  verificationStatus: null, // 'pending', 'approved', 'rejected'
  // Payment settings for clubs
  toyyibpayEnabled: false,
  toyyibpayApplicationStatus: null, // 'pending', 'approved', 'rejected'
  categoryCode: null,
  qrCodeImageUrl: null,
  paymentMethod: null,
  
  setUserStore: (userData) => set((state) => ({
    ...state,
    ...userData
  })),
  
  clearUser: () => set({
    uid: null,
    email: null,
    name: null,
    role: null,
    studentId: null,
    faculty: null,
    phoneNumber: null,
    major: null,
    degree: null,
    currentSemester: null,
    dietaryRequirement: null,
    isClubVerified: false,
    verificationStatus: null,
    toyyibpayEnabled: false,
    toyyibpayApplicationStatus: null,
    categoryCode: null,
    qrCodeImageUrl: null,
    paymentMethod: null
  })
}));

