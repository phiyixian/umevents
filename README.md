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

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase account
- ToyyibPay/Billplz API keys

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/umevents.git
cd umevents
```

2. Install dependencies
```bash
npm run install:all
```

3. Configure environment variables
- Create `.env` files in both `frontend/` and `backend/` directories
- Add your Firebase and ToyyibPay/Billplz credentials

4. Start development servers
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`
The backend will be available at `http://localhost:5000`

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

