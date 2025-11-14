# 📧 Quality App - Next.js API Server

## 🎯 Overview
This Next.js API server provides email alert functionality for the Quality App without requiring Firebase Blaze billing. It uses Gmail SMTP to send operator defect alerts.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd api-server
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the example file
copy .env.example .env.local

# Edit .env.local with your credentials:
GMAIL_USER=fatimzahraelhansali@gmail.com
GMAIL_PASS=zovc fdrx wqsj ugsb
ALERT_EMAIL_TO=feetyer53@gmail.com
```

### 3. Start Development Server
```bash
npm run dev
```
Server will start at: http://localhost:3001

### 4. Test Email Functionality
Visit: http://localhost:3001/api/test-email

## 📋 API Endpoints

### 🔥 Main Alert Endpoint
**POST** `/api/alert-operator`

**Request Body:**
```json
{
  "operateurNom": "John Doe",
  "nombreOccurrences": 4,
  "previousOccurrences": 2,
  "operatorId": "optional-id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert sent for operator John Doe",
  "emailId": "message-id",
  "operator": "John Doe",
  "defectCount": 4,
  "timestamp": "2024-11-14T08:30:00.000Z"
}
```

### 🧪 Test Email Endpoint
**GET** `/api/test-email`

Tests Gmail SMTP configuration and sends a test email.

## 🔗 Integration with React Native App

### Option 1: Use AlertService (Recommended)
```typescript
import { alertService } from '../services/alertService';

// Test email
await alertService.testEmail();

// Monitor specific operator
await alertService.monitorOperator({
  operateurNom: "John Doe",
  nombreOccurrences: 4
});

// Monitor all operators
await alertService.monitorAllOperators();
```

### Option 2: Direct API Calls
```typescript
// Send alert
const response = await fetch('http://localhost:3001/api/alert-operator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operateurNom: "John Doe",
    nombreOccurrences: 4,
    previousOccurrences: 2
  })
});
```

### Option 3: Use Custom Hook
```typescript
import { useOperatorAlert } from '../hooks/useOperatorAlert';

const { sendAlert, monitorOperators } = useOperatorAlert();

// Monitor operators periodically
useEffect(() => {
  const cleanup = setupOperatorMonitoring(5); // Check every 5 minutes
  return cleanup;
}, []);
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Free)
1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Option 2: Netlify
1. Build the app: `npm run build`
2. Deploy to Netlify
3. Configure environment variables

### Option 3: Railway
1. Connect GitHub repo to Railway
2. Add environment variables
3. Deploy

### Option 4: Self-hosted
```bash
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `GMAIL_USER` | Gmail sender address | ✅ |
| `GMAIL_PASS` | Gmail app password | ✅ |
| `ALERT_EMAIL_TO` | Alert recipient email | ✅ |
| `API_SECRET_KEY` | API security (optional) | ❌ |

### Gmail App Password Setup
1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account Settings → Security
3. Generate App Password for "Mail"
4. Use the generated password in `GMAIL_PASS`

## 🧪 Testing

### Test Email Functionality
```bash
curl http://localhost:3001/api/test-email
```

### Test Alert Endpoint
```bash
curl -X POST http://localhost:3001/api/alert-operator \
  -H "Content-Type: application/json" \
  -d '{
    "operateurNom": "Test Operator",
    "nombreOccurrences": 4,
    "previousOccurrences": 2
  }'
```

## 📊 Monitoring & Logs

### View Logs (Development)
```bash
npm run dev
# Logs appear in terminal
```

### View Logs (Production)
Check your hosting platform's logs:
- **Vercel**: Functions tab in dashboard
- **Netlify**: Functions logs
- **Railway**: Deployment logs

## 🔒 Security Notes

1. **Never commit `.env.local`** - it contains sensitive credentials
2. **Use App Passwords** - don't use your main Gmail password
3. **Consider rate limiting** for production use
4. **Add API authentication** if needed

## 🚨 Troubleshooting

### Email Not Sending
1. Check Gmail credentials in `.env.local`
2. Verify Gmail App Password is correct
3. Check server logs for errors
4. Test with `/api/test-email` endpoint

### CORS Issues
The API includes CORS headers. If issues persist, check your React Native app's network configuration.

### Server Not Starting
1. Check Node.js version (requires 18+)
2. Run `npm install` to ensure dependencies
3. Check port 3001 is available

## 📞 Support

### Debug Commands
```bash
# Check server status
curl http://localhost:3001/api/test-email

# View environment variables (without values)
npm run dev -- --help

# Check logs
tail -f .next/server.log
```

---

## 🎉 Your API server is ready!

1. ✅ **Email alerts** when operators exceed 3 defects
2. ✅ **No Firebase billing** required
3. ✅ **Easy deployment** to free platforms
4. ✅ **Full integration** with your React Native app
