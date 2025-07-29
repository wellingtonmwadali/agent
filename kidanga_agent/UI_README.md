# Kidanga Lead Generation Agent - Web UI

A modern Vue.js web interface for controlling and monitoring the Kidanga Lead Generation Agent.

## Features

### 🎛️ Control Panel
- **Start/Stop Agent**: Real-time control of the lead generation process
- **Search Configuration**: Set limits, choose test mode, or run targeted searches
- **Mode Selection**: 
  - Full Run: Complete lead generation with all search terms
  - Test Mode: Limited search for testing (max 5 searches)
  - Targeted Search: Custom business types and locations

### 📊 Real-time Monitoring
- **Live Statistics**: Businesses found, websites checked, messages sent
- **System Status**: WhatsApp, Email, OpenAI, and Google Sheets connectivity
- **Activity Log**: Real-time logs with color-coded message types
- **Progress Tracking**: Visual feedback on agent progress

### 🔧 Service Testing
- **WhatsApp Test**: Check if phone numbers are registered on WhatsApp
- **Email Test**: Send test emails to verify email configuration
- **Service Health**: Monitor the status of all integrated services

### 💾 Data Management
- **Lead Export**: Download leads as CSV files
- **Lead Statistics**: View total leads and logging status
- **Google Sheets Integration**: Real-time sync with Google Sheets

## Getting Started

1. **Start the UI Server**
   ```bash
   npm run ui
   ```

2. **Open in Browser**
   Navigate to: `http://localhost:3002`

3. **Check System Status**
   - Green indicators = Service ready
   - Red indicators = Service not configured or offline
   - Yellow indicators = Service configured but not ready

## Interface Guide

### Dashboard Layout

**Header**: Shows agent status and current mode
**Status Cards**: Real-time service health indicators
**Control Panel**: Agent configuration and controls
**Metrics**: Live statistics and performance data
**Activity Log**: Real-time event logging

### Running the Agent

1. **Configure Search Parameters**
   - Set search limit (recommended: 10-50 for testing)
   - Choose mode (Test recommended for first run)
   - For targeted search: select business types and locations

2. **Start the Process**
   - Click "Start Agent"
   - Monitor real-time progress in the activity log
   - Watch statistics update as businesses are processed

3. **Monitor Progress**
   - Activity log shows each step in real-time
   - Statistics update automatically
   - Status indicators show system health

### Service Testing

**WhatsApp Test**:
- Enter a Kenyan phone number (e.g., 254790147060)
- Click "Test" to check WhatsApp registration
- Result shows if number is available on WhatsApp

**Email Test**:
- Enter any email address
- Click "Send Test" to send a sample email
- Verifies email service configuration

### Managing Leads

**Export Leads**:
- Click "Download Leads" to get CSV file
- File includes all scraped businesses and contact status
- Can be opened in Excel or Google Sheets

**Lead Statistics**:
- Shows total leads collected
- Displays CSV file location
- Google Sheets sync status

## Troubleshooting

### Common Issues

**Agent Won't Start**:
- Check if Google Places API key is configured
- Verify .env file has required credentials
- Check system status indicators

**WhatsApp Not Ready**:
- QR code needs to be scanned with your phone
- Keep phone connected to internet
- WhatsApp Web session may have expired

**Email Test Fails**:
- Check SendGrid API key in .env file
- Verify sender email is verified with SendGrid
- Try using Gmail/Nodemailer as fallback

**No Businesses Found**:
- Check Google Places API quota
- Verify API key has Places API enabled
- Try reducing search limit or different keywords

### WebSocket Connection Issues

If real-time updates stop working:
1. Refresh the browser page
2. Check browser console for errors
3. Restart the UI server: `npm run ui`

### Performance Tips

**For Best Performance**:
- Use search limits of 10-50 for regular use
- Run during off-peak hours for better API response
- Monitor API quotas to avoid hitting limits
- Use targeted searches for specific needs

**Resource Usage**:
- Each search query uses 1 Google Places API call
- Additional calls for business details
- WhatsApp and email services have their own limits

## Technical Details

### Architecture
- **Frontend**: Vue.js 3 with Composition API
- **Backend**: Express.js with Socket.IO
- **Real-time**: WebSocket connections for live updates
- **Styling**: Tailwind CSS with custom components

### API Endpoints
- `GET /api/status` - System status
- `GET /api/keywords` - Available search terms
- `POST /api/agent/start` - Start lead generation
- `POST /api/agent/stop` - Stop agent
- `POST /api/whatsapp/check` - Test WhatsApp number
- `POST /api/email/test` - Send test email
- `GET /api/leads/export` - Download leads CSV

### WebSocket Events
- `agentStarted` - Agent begins processing
- `agentCompleted` - Agent finishes successfully  
- `agentStopped` - Agent stopped by user
- `agentError` - Agent encountered an error
- `statsUpdate` - Real-time statistics
- `logEntry` - Activity log messages

## Browser Compatibility

**Supported Browsers**:
- Chrome 70+ (recommended)
- Firefox 65+
- Safari 12+
- Edge 79+

**Features Used**:
- ES6+ JavaScript
- WebSocket connections
- CSS Grid and Flexbox
- Modern DOM APIs

## Security Notes

- UI server runs on localhost only by default
- No sensitive data stored in browser
- API keys remain on server side
- WebSocket connections are local only

For production deployment, consider adding:
- HTTPS/TLS encryption
- Authentication middleware
- Rate limiting
- CORS configuration
