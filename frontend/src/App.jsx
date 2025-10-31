import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useUserStore } from './store/userStore';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import LoginPage from './pages/LoginPage';
import UserRegisterPage from './pages/UserRegisterPage';
import ClubRegisterPage from './pages/ClubRegisterPage';
import RoleSelectPage from './pages/RoleSelectPage';
import AdminVerificationPage from './pages/AdminVerificationPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import DashboardPage from './pages/DashboardPage';
import MyTicketsPage from './pages/MyTicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import ClubIntroPage from './pages/ClubIntroPage';
import ProfilePage from './pages/ProfilePage';
import StudentProfilePage from './pages/StudentProfilePage';
import ClubProfilePage from './pages/ClubProfilePage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';

// Create a client
const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole, excludeRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-umblue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = useUserStore.getState().role;

  // Check if route requires specific role
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Check if route excludes specific role(s)
  if (excludeRole) {
    if (Array.isArray(excludeRole)) {
      if (excludeRole.includes(userRole)) {
        return <Navigate to="/" replace />;
      }
    } else if (userRole === excludeRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Profile Page Wrapper - Shows different profile based on role
const ProfilePageWrapper = () => {
  const { role } = useUserStore();
  
  if (role === 'club') {
    return <ClubProfilePage />;
  } else {
    return <StudentProfilePage />;
  }
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/start" element={<RoleSelectPage />} />
      <Route path="/student-register" element={<UserRegisterPage />} />
      <Route path="/club-register" element={<ClubRegisterPage />} />
      <Route path="/payment/status/:paymentId" element={<PaymentStatusPage />} />
      <Route path="/payment/success" element={<PaymentSuccessPage />} />
      
      {/* Main Routes with Layout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="clubs/:clubId" element={<ClubIntroPage />} />
        
        {/* Protected Student Routes */}
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute requiredRole="student">
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="my-tickets" 
          element={
            <ProtectedRoute requiredRole="student">
              <MyTicketsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="tickets/:id" 
          element={
            <ProtectedRoute requiredRole="student">
              <TicketDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="transactions" 
          element={
            <ProtectedRoute excludeRole={['admin', 'club']}>
              <TransactionHistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="profile" 
          element={
            <ProtectedRoute>
              <ProfilePageWrapper />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected Club Routes */}
        <Route 
          path="create-event" 
          element={
            <ProtectedRoute requiredRole="club">
              <CreateEventPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="edit-event/:id" 
          element={
            <ProtectedRoute requiredRole="club">
              <EditEventPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="analytics" 
          element={
            <ProtectedRoute requiredRole="club">
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admin Routes */}
        <Route 
          path="admin/verifications" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminVerificationPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/analytics" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminAnalyticsPage />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

