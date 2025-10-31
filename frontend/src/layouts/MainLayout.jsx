import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProfileReminderBar from '../components/ProfileReminderBar';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ProfileReminderBar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;

