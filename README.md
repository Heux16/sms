# 🎓 School Management System

A comprehensive school management system built with Node.js, Express, PostgreSQL, and EJS. Features role-based access for administrators, teachers, and students with exam management, grade tracking, and user administration.

## ✨ Features

- **Multi-Role Authentication**: Admin, Teacher, and Student access levels
- **Exam Management**: Create and manage exams with multiple subjects
- **Grade Tracking**: Theory and practical marks with automatic calculations
- **Student Management**: Add and manage student records
- **Teacher Dashboard**: Comprehensive tools for educators
- **Professional UI**: Modern, responsive design with glass-morphism effects
- **Mobile Optimized**: Full mobile responsiveness across all interfaces

## 🚀 Quick Deploy to Render.com

### Option 1: One-Click Deploy (Recommended)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 2: Manual Deployment

1. **Fork this repository** to your GitHub account

2. **Create a new Web Service** on Render.com:
   - Connect your GitHub repository
   - Use the following settings:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Node Version**: 18 or higher

3. **Create a PostgreSQL database** on Render.com:
   - Go to Dashboard → New → PostgreSQL
   - Choose the free plan
   - Note the database connection details

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   DATABASE_URL=<your_render_postgresql_connection_string>
   SESSION_SECRET=<generate_a_secure_random_string>
   ENCRYPTION_KEY=<generate_a_32_character_string>
   ```

5. **Deploy**: Render will automatically build and deploy your application

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd sms
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env file with your local database credentials
   ```

4. **Create local database**:
   ```sql
   CREATE DATABASE mummy;
   ```

5. **Start the application**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Open http://localhost:3000
   - Default admin login will be created automatically

## 🔐 Default Credentials

After first deployment, create an admin user through the database or use the application's built-in user creation system.

## 📱 User Roles & Features

### 👨‍💼 Administrator
- Manage teachers and students
- Create and publish exams
- View all system data
- System configuration

### 👩‍🏫 Teacher
- Add students to classes
- Create tests for exams
- Grade student submissions
- View student progress

### 👨‍🎓 Student
- View assigned exams
- Check grades and results
- Access academic records

## 🏗️ Technical Architecture

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL with pg client
- **Authentication**: Passport.js with local strategy
- **Password Security**: bcrypt hashing
- **Session Management**: express-session

### Frontend
- **Template Engine**: EJS
- **Styling**: TailwindCSS with custom glass-morphism design
- **Responsive Design**: Mobile-first approach
- **Interactive Elements**: Vanilla JavaScript

### Database Schema
- **Users**: Multi-role user management
- **Exams**: Exam definitions and metadata
- **Tests**: Subject-specific tests within exams
- **Student Scores**: Grade tracking with theory/practical separation

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `SESSION_SECRET` | Session encryption key | `your-secret-key` |
| `ENCRYPTION_KEY` | Data encryption key | `32-character-string` |

## 📦 Dependencies

### Production Dependencies
- **express**: Web application framework
- **pg**: PostgreSQL client
- **passport**: Authentication middleware
- **bcrypt**: Password hashing
- **ejs**: Template engine
- **dotenv**: Environment variable loader

### Development Dependencies
- **nodemon**: Development server with auto-reload

## 🚀 Deployment Notes

### Render.com Specific
- Uses `DATABASE_URL` for PostgreSQL connection
- Automatic SSL certificate provisioning
- Built-in health checks
- Zero-downtime deployments

### Security Considerations
- All passwords are bcrypt hashed
- Session-based authentication
- Environment variable protection
- SQL injection prevention with parameterized queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For deployment issues or questions:
1. Check the Render.com deployment logs
2. Verify all environment variables are set
3. Ensure PostgreSQL database is accessible
4. Review the application logs for specific errors

---

Built with ❤️ for educational institutions worldwide.