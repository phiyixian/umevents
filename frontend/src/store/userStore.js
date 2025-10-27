import { create } from 'zustand';

export const useUserStore = create((set) => ({
  uid: null,
  email: null,
  name: null,
  role: null,
  studentId: null,
  faculty: null,
  phoneNumber: null,
  isClubVerified: false,
  
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
    isClubVerified: false
  })
}));

