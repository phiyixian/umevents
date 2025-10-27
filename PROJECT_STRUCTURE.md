# UMEvents - Project Structure

This document explains the project structure and architecture.

## Directory Structure

```
umevents/
├── frontend/                    # React.js frontend application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── Navbar.jsx      # Navigation bar
│   │   │   ├── Footer.jsx      # Footer component
│   │   │   └── ...
│   │   ├── contexts/           # React Context providers
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── layouts/            # Page layouts
│   │   │   └── MainLayout.jsx  # Main app layout
│   │   ├── pages/              # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── EventsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── ...
│   │   ├── store/              # State management (Zustand)
│   │   │   └── userStore.js
│   │   ├── config/             # Configuration files
│   │   │   ├── firebase.js     # Firebase initialization
│   │   │   └── axios.js        # API client setup
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                     # Node.js/Express backend
│   ├── config/                 # Configuration files
│   │   └── firebase.js         # Firebase Admin SDK
│   ├── controllers/            # Business logic
│   │   ├── auth.controller.js
│   │   ├── event.controller.js
│   │   ├── ticket.controller.js
│   │   ├── payment.controller.js
│   │   ├── analytics.controller.js
│   │   └── user.controller.js
│   ├── middleware/            # Middleware functions
│   │   ├── auth.js            # Authentication middleware
│   │   ├── errorHandler.js    # Error handling
│   │   └── rateLimiter.js     # Rate limiting
│   ├── routes/                # API routes
│   │   ├── auth.routes.js
│   │   ├── event.routes.js
│   │   ├── ticket.routes.js
│   │   ├── payment.routes.js
│   │   ├── analytics.routes.js
│   │   └── user.routes.js
│   ├── server.js              # Express server setup
│   ├── package.json
│   └── .env                    # Environment variables
│
├── package.json               # Root package.json (workspace)
├── README.md                  # Project overview
├── SETUP.md                   # Setup instructions
├── QUICK_START.md             # Quick start guide
└── .gitignore                 # Git ignore rules
```

## Architecture Overview

### Frontend (React.js)

**Technology Stack:**
- React 18
- React Router for routing
- Tailwind CSS for styling
- Zustand for state management
- React Query for data fetching
- Axios for HTTP requests
- Firebase for authentication
- React Hot Toast for notifications
- QRCode.react for QR code display

**Key Features:**
- Single Page Application (SPA)
- Responsive design
- Protected routes based on user role
- Real-time updates via Firebase

### Backend (Node.js/Express)

**Technology Stack:**
- Express.js web framework
- Firebase Admin SDK
- MongoDB/Firestore for database
- Middleware for security (helmet, cors, rate limiting)
- QR code generation library
- Payment gateway integration (ToyyibPay/Billplz)

**API Structure:**
```
/api
├── /auth        # Authentication endpoints
├── /events      # Event management
├── /tickets     # Ticket operations
├── /payments    # Payment processing
├── /analytics   # Analytics and statistics
└── /users       # User management
```

## Data Flow

1. **User Registration/Login:**
   - Frontend → Firebase Auth → Backend validation → Firestore user doc

2. **Event Creation:**
   - User → Create event form → API request → Validation → Firestore

3. **Ticket Purchase:**
   - User selects event → Click buy ticket → Create ticket doc
   - Initiate payment → Payment gateway → Webhook callback
   - Update ticket status → Generate QR code

4. **Analytics:**
   - Fetch event/user data → Calculate metrics → Return charts data

## Database Schema (Firestore)

### Collections

1. **users**
   - uid, email, name, role, studentId, faculty, phoneNumber, createdAt

2. **events**
   - title, description, category, startDate, endDate, location, venue
   - ticketPrice, capacity, ticketsSold, revenue
   - organizerId, organizerName, status, createdAt

3. **tickets**
   - eventId, userId, status, purchaseDate, price, qrCode
   - checkedIn, checkedInAt

4. **payments**
   - userId, ticketIds, amount, platformFee, status
   - paymentMethod, createdAt, processedAt

5. **clubVerificationRequests**
   - userId, clubName, status, submittedAt, reviewedAt

## Security

- Firebase Authentication for user auth
- JWT token verification middleware
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- CORS configuration
- Helmet for security headers
- Input validation

## Deployment

### Frontend
- Build: `npm run build`
- Deploy to: Vercel, Netlify, or Firebase Hosting

### Backend
- Deploy to: Railway, Heroku, or Digital Ocean
- Environment variables configuration required
- Firebase credentials setup

## Development Workflow

1. Clone repository
2. Install dependencies
3. Set up Firebase project
4. Configure environment variables
5. Run development servers
6. Make changes
7. Test locally
8. Deploy to production

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Event Endpoints
- `GET /api/events` - List all events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Ticket Endpoints
- `POST /api/tickets/purchase` - Purchase ticket
- `GET /api/tickets/my` - Get user tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/validate` - Validate ticket

### Payment Endpoints
- `POST /api/payments/initiate` - Start payment
- `GET /api/payments/status/:paymentId` - Check payment status
- `POST /api/payments/callback` - Payment webhook

### Analytics Endpoints
- `GET /api/analytics/club/:clubId` - Club analytics
- `GET /api/analytics/event/:eventId` - Event analytics
- `GET /api/analytics/platform` - Platform-wide analytics

## Contributing

See contribution guidelines in the repository.

## License

MIT License

