# Setup Guide for Kidanga Lead Generation Agent

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your API keys and credentials.

3. **Test the Setup**
   ```bash
   npm run status
   ```

4. **Run a Quick Test**
   ```bash
   npm run test
   ```

## Required API Keys & Setup

### 1. Google Places API
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable the Places API
- Create API key and add to `.env` as `GOOGLE_PLACES_API_KEY`

### 2. SendGrid Email (Optional but Recommended)
- Sign up at [SendGrid](https://sendgrid.com/)
- Create API key and add to `.env` as `SENDGRID_API_KEY`
- Verify your sender email address

### 3. OpenAI API (Optional)
- Get API key from [OpenAI](https://platform.openai.com/)
- Add to `.env` as `OPENAI_API_KEY`

### 4. Google Sheets (Optional)
- Create a Google Cloud service account
- Download JSON credentials
- Extract `private_key` and `client_email` to `.env`
- Create a Google Sheet and add the sheet ID to `.env`

### 5. WhatsApp Web
- No API key needed
- The app will show a QR code to scan with your phone
- Keep your phone connected to internet

## Usage Examples

### Basic Commands

```bash
# Run full lead generation
npm start

# Run in test mode (5 searches only)
npm test

# Check service status
npm run status

# See all available keywords
npm run keywords

# Run WhatsApp server separately
npm run whatsapp
```

### CLI Commands

```bash
# Run with limit
node src/cli.js run --limit 10

# Targeted search
node src/cli.js targeted -b "restaurant" "salon" -l "Nairobi" "Mombasa"

# Test mode
node src/cli.js test
```

### API Usage (WhatsApp Server)

Start the WhatsApp server:
```bash
npm run whatsapp
```

Then use HTTP requests:
```bash
# Check if number is on WhatsApp
curl -X POST http://localhost:3001/check \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "254790147060"}'

# Send message
curl -X POST http://localhost:3001/send \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "254790147060", "message": "Hello from Kidanga!"}'
```

## Configuration Options

### Search Customization
Edit `src/config/keywords.js` to:
- Add new business types
- Add new locations
- Modify search combinations

### Message Templates
Edit the message generation in:
- `src/services/openaiService.js` for AI-generated messages
- `src/services/emailService.js` for email templates
- `src/services/whatsappService.js` for WhatsApp templates

### Rate Limiting
Adjust in `src/config/config.js`:
- `MAX_CONCURRENT_REQUESTS`: Parallel API calls
- `DELAY_BETWEEN_REQUESTS`: Delay between requests (ms)
- `RETRY_ATTEMPTS`: Number of retries for failed requests

## File Outputs

### CSV Export
- Location: `./leads.csv`
- Contains all scraped leads with contact status
- Opens in Excel/Google Sheets

### Logs
- Location: `./logs/YYYY-MM-DD.log`
- Detailed application logs
- Useful for debugging

### Google Sheets
- Real-time updates if configured
- Shareable with team members
- Better for collaboration

## Troubleshooting

### WhatsApp Issues
- Make sure your phone is connected to internet
- Scan the QR code when prompted
- Don't log out of WhatsApp Web on your phone

### Google Places API Issues
- Check API quota and billing
- Ensure Places API is enabled
- Verify API key permissions

### Email Issues
- Verify sender email with SendGrid
- Check spam folder for test emails
- Ensure SMTP credentials are correct

### Rate Limiting
- Google Places: 1000 requests/day (free tier)
- WhatsApp: Manual rate limiting implemented
- OpenAI: Depends on your plan

## Best Practices

1. **Start Small**: Use test mode first
2. **Monitor Quotas**: Watch API usage
3. **Respect Rate Limits**: Don't spam
4. **Personalize Messages**: Better response rates
5. **Track Results**: Review logs and CSV data
6. **Follow Up**: Use the logged data for follow-ups

## Legal Considerations

- Comply with local anti-spam laws
- Include opt-out options in messages
- Respect business hours
- Don't send duplicate messages
- Follow WhatsApp Terms of Service
