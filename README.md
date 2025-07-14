# NGO Admin Panel Backend

A comprehensive Node.js Express backend for NGO administration with user management, project moderation, and donation tracking.

## Features

### 🔐 Authentication
- JWT-based admin authentication
- Token refresh mechanism
- Protected admin routes

### 👥 User Management
- List all registered users with pagination and search
- View detailed user information
- Update user data and status
- Deactivate users

### 📋 Project Moderation
- View all submitted projects with filtering
- Approve or reject projects with reasons
- Track project status and review history

### 💰 Donation Management
- List donations with advanced filtering
- View donation summaries by project
- Track payment methods and transaction details

### 📊 Financial Reports
- Export donation data in JSON or CSV format
- Filter exports by project, donor, or date range
- Generate comprehensive financial summaries

### 📈 Dashboard Analytics
- Overview of users, projects, and donations
- Monthly donation trends
- Recent activity tracking
- Top-performing projects

## Quick Start

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### User Management
- `GET /api/admin/users` - List users
- `GET /api/admin/users/:id` - Get user details
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user

### Project Moderation
- `GET /api/admin/projects` - List projects
- `GET /api/admin/projects/:id` - Get project details
- `PATCH /api/admin/projects/:id/status` - Update project status

### Donation Management
- `GET /api/admin/donations` - List donations
- `GET /api/admin/donations/summary` - Donation summary

### Reports
- `GET /api/admin/reports/donations` - Export donations

### Dashboard
- `GET /api/admin/overview` - Dashboard overview

## Default Admin Credentials

**Email:** admin@ngo.org  
**Password:** password123

⚠️ **Important:** Change these credentials in production!

## Project Structure

```
src/
├── controllers/          # Request handlers
├── middleware/          # Custom middleware
├── routes/             # API routes
├── services/           # Business logic
├── utils/              # Utility functions
├── app.js              # Express app setup
└── server.js           # Server entry point
```

## Security Features

- Helmet.js for security headers
- Rate limiting
- CORS configuration
- JWT token validation
- Input validation with express-validator
- Password hashing with bcryptjs

## Development Notes

This is a scaffolded backend with mock data. To use in production:

1. Replace mock services with actual database integration
2. Add email notification services
3. Implement file upload for project documents
4. Add comprehensive logging
5. Set up proper error monitoring
6. Configure production environment variables

## Environment Variables

See `.env.example` for all required environment variables.

## License

This project is for NGO administration purposes.