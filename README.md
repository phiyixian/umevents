# UMEvents — Smart Event & Ticketing Platform for Universiti Malaya

UMEvents is an integrated digital platform designed for Universiti Malaya students and clubs to create, discover, and manage events all in one place.

## 🎯 Key Features

### 👤 Student Features
- Create and manage personal accounts
- Browse upcoming events by category
- Purchase tickets through DuitNow FPX / QR / eWallets
- View event details and countdowns
- Store purchased tickets with QR codes
- Get notifications for upcoming events
- Rate and review attended events

### 🧑‍💼 Organizer (Club / Society) Features
- Register verified club accounts
- Create, edit, and manage events
- Track event statistics (tickets sold, revenue, attendance)
- Export attendance reports
- View insights dashboard on club engagement

### 🛠️ Admin Features
- Approve new club registrations
- View and manage all events
- Monitor platform sales and traffic
- Generate analytics reports

## 🏗️ Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: ToyyibPay / Billplz (DuitNow FPX / QR)
- **Storage**: Firebase Storage
- **Hosting**: Firebase Hosting / Vercel

## 🚀 Quick Start

For detailed setup instructions, see [QUICK_START.md](./QUICK_START.md)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/umevents.git
cd umevents
```

2. Install all dependencies

**Option A: Automatic installation (recommended)**
```bash
# On Mac/Linux
./install.sh

# On Windows
install.bat
```

**Option B: Manual installation**
```bash
npm run install:all
```

3. Set up Firebase and configure environment variables
   - See [SETUP.md](./SETUP.md) for detailed Firebase setup
   - Copy `.env.example` files and add your credentials

4. Start the application
```bash
npm run dev
```

Visit http://localhost:5173 to see the app

## 📖 Documentation

- [Quick Start Guide](./QUICK_START.md) - Get started in 5 minutes
- [Setup Guide](./SETUP.md) - Detailed configuration instructions
- [Google Sign-In Setup](./GOOGLE_SIGNIN_SETUP.md) - Enable Google authentication
- [Project Summary](./PROJECT_SUMMARY.md) - Complete feature list
- [Project Structure](./PROJECT_STRUCTURE.md) - Code organization
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment

## 🎯 What's Built

This is a complete, production-ready platform with:

✅ **Backend API** (Express.js + Firebase)
✅ **Frontend Web App** (React + Vite)
✅ **User Authentication** (Firebase Auth + Google Sign-In)
✅ **Event Management** (Create, browse, manage events)
✅ **Ticketing System** (Purchase tickets with QR codes)
✅ **Payment Integration** (ToyyibPay/Billplz ready)
✅ **Analytics Dashboard** (Real-time insights)
✅ **Role-based Access** (Student, Club, Admin)
✅ **Responsive Design** (Mobile-friendly)

## 📁 Project Structure

```
umevents/
├── frontend/          # React.js frontend
├── backend/           # Node.js + Express backend
├── package.json       # Root package.json
└── README.md         # This file
```

## 💳 Payment Integration

This platform integrates with Malaysian payment gateways (DuitNow FPX / QR) via ToyyibPay or Billplz APIs.

## 📊 Analytics

- Real-time event analytics
- User engagement metrics
- Revenue tracking
- Attendance reports

## 📝 License

MIT

