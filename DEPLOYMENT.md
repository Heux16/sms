# 🚀 Render.com Deployment Guide

## Step-by-Step Deployment Instructions

### 1. Prerequisites
- GitHub account
- Render.com account (free)
- Your School Management System code

### 2. Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - School Management System"
   git branch -M main
   git remote add origin https://github.com/yourusername/school-management-system.git
   git push -u origin main
   ```

### 3. Deploy to Render.com

#### Option A: Automatic Deployment (Recommended)

1. **Fork/Clone this repository** to your GitHub account
2. **Visit Render.com** and sign up/login
3. **Click "New"** and select "Web Service"
4. **Connect your GitHub repository**
5. **Configure the service**:
   - **Name**: `school-management-system`
   - **Root Directory**: Leave empty
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### Option B: Using Blueprint (render.yaml)

1. **Upload the included `render.yaml`** file to your repository
2. **Go to Render Dashboard** → Blueprints
3. **Click "New Blueprint Instance"**
4. **Connect your repository**
5. **Render will automatically**:
   - Create the web service
   - Create the PostgreSQL database
   - Set up environment variables
   - Deploy your application

### 4. Database Setup

#### Automatic (via render.yaml)
The blueprint will automatically create a PostgreSQL database and connect it.

#### Manual Setup
1. **Create PostgreSQL Database**:
   - Go to Render Dashboard
   - Click "New" → "PostgreSQL"
   - Choose "Free" plan
   - Name: `school-management-db`
   - Note the connection details

2. **Get Database URL**:
   - Go to your database dashboard
   - Copy the "External Database URL"

### 5. Environment Variables

Set these in your Render web service settings:

| Variable | Value | Notes |
|----------|--------|-------|
| `NODE_ENV` | `production` | Required |
| `DATABASE_URL` | `postgresql://...` | From your Render PostgreSQL |
| `SESSION_SECRET` | `[generate-random-string]` | 32+ characters |
| `ENCRYPTION_KEY` | `[generate-32-char-string]` | Exactly 32 characters |

**Generate secure values**:
```bash
# For SESSION_SECRET (any length, 32+ recommended)
openssl rand -hex 32

# For ENCRYPTION_KEY (exactly 32 characters)
openssl rand -hex 16
```

### 6. Deploy and Test

1. **Trigger Deployment**:
   - Push code changes to GitHub
   - Or manually deploy from Render dashboard

2. **Monitor Deployment**:
   - Watch the build logs in Render dashboard
   - Deployment typically takes 2-5 minutes

3. **Access Your Application**:
   - Use the provided Render URL (e.g., `https://your-app.onrender.com`)
   - Your app will be automatically assigned a domain

### 7. Post-Deployment Setup

1. **Create Admin User**:
   - Access your application URL
   - The database tables will be created automatically
   - Create your first admin user through the application

2. **Test All Features**:
   - Login with different roles
   - Create test data
   - Verify all functionality works

### 8. Custom Domain (Optional)

1. **Go to your web service settings**
2. **Click "Custom Domains"**
3. **Add your domain**
4. **Configure DNS** according to Render's instructions

## 🔧 Troubleshooting

### Common Issues

#### Build Failures
- **Check Node.js version**: Ensure your app supports Node 18+
- **Verify package.json**: Make sure start script points to correct file
- **Check logs**: View detailed build logs in Render dashboard

#### Database Connection Issues
- **Verify DATABASE_URL**: Ensure it's correctly set
- **Check database status**: Ensure PostgreSQL service is running
- **SSL Configuration**: Production databases require SSL

#### Application Errors
- **Check environment variables**: All required vars must be set
- **View application logs**: Monitor runtime logs in Render
- **Test locally**: Ensure app works with production environment variables

### Environment Variable Issues
```bash
# Test locally with production-like settings
NODE_ENV=production npm start
```

### Database Migration Issues
- Tables are created automatically on first run
- Check logs for any database initialization errors
- Ensure DATABASE_URL has proper permissions

## 📊 Monitoring

### Built-in Monitoring
- **Render Dashboard**: View logs, metrics, and deployment history
- **Health Checks**: Automatic monitoring at `/health` endpoint
- **Uptime Monitoring**: Built-into Render platform

### Custom Monitoring
Add these endpoints for additional monitoring:
- `/health` - Application health status
- View logs in Render dashboard for debugging

## 🔄 Updates and Maintenance

### Automatic Deployments
- **GitHub Integration**: Automatic deploys on push to main branch
- **Manual Deployments**: Trigger from Render dashboard
- **Rollback**: Easy rollback to previous versions

### Database Backups
- **Automatic Backups**: Render provides automatic PostgreSQL backups
- **Manual Backups**: Available through Render dashboard
- **Restore Options**: Point-in-time recovery available

## 💰 Cost Considerations

### Free Tier Limits
- **Web Service**: 750 hours/month (sufficient for small apps)
- **PostgreSQL**: 1GB storage, 97 hours/month
- **Bandwidth**: 100GB/month
- **Sleep Mode**: App sleeps after 15 minutes of inactivity

### Upgrading
- **Paid Plans**: Start at $7/month for web services
- **Always-On**: Prevents sleep mode
- **More Resources**: Increased CPU, memory, and storage

## 🔐 Security Best Practices

### Production Security
- **Environment Variables**: Never commit secrets to Git
- **HTTPS**: Automatic SSL certificates from Render
- **Database Security**: Use connection strings, not individual credentials
- **Session Security**: Secure cookies enabled in production

### Regular Updates
- **Dependencies**: Keep npm packages updated
- **Security Patches**: Monitor for security advisories
- **Database Updates**: Render handles PostgreSQL updates

---

## 🆘 Support Resources

- **Render Documentation**: https://render.com/docs
- **Community Forum**: Render community discussions
- **GitHub Issues**: Report issues in this repository
- **Render Support**: Available for paid plans

Your School Management System should now be successfully deployed on Render.com! 🎉