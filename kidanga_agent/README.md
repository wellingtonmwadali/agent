# Kidanga Lead Generation Agent

A comprehensive Node.js application that automatically finds and contacts local businesses in Kenya that don't have websites, offering web development services.

## Features

- **Google Places API Integration**: Scrape businesses using 100+ keyword+location combinations
- **Website Detection**: Check if businesses already have websites
- **WhatsApp Verification**: Check if phone numbers are registered on WhatsApp
- **Multi-channel Outreach**: Send personalized messages via WhatsApp and email
- **Lead Logging**: Track all leads in Google Sheets or CSV format
- **AI-Powered Messaging**: Generate personalized messages using OpenAI
- **Error Handling**: Comprehensive retry logic and error handling

## Setup

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create a `.env` file with your API keys and configuration:
```bash
cp .env.example .env
```

3. Fill in your API credentials in the `.env` file

4. Run the application:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Configuration

### Required Environment Variables

- `GOOGLE_PLACES_API_KEY`: Your Google Places API key
- `SENDGRID_API_KEY`: SendGrid API key for email sending
- `OPENAI_API_KEY`: OpenAI API key for message generation
- `GOOGLE_SHEETS_PRIVATE_KEY`: Google Sheets service account private key
- `GOOGLE_SHEETS_CLIENT_EMAIL`: Google Sheets service account email
- `GOOGLE_SHEETS_SHEET_ID`: Google Sheets spreadsheet ID

### Optional Configuration

- `EMAIL_FROM`: Your email address (default: kidanga.agency@gmail.com)
- `PHONE_NUMBER`: Your WhatsApp number (default: 254790147060)
- `AGENCY_NAME`: Your agency name (default: Kidanga)

## Project Structure

```
src/
├── config/
│   ├── keywords.js          # Search terms and locations
│   └── config.js            # Application configuration
├── services/
│   ├── googleScraper.js     # Google Places API integration
│   ├── whatsappService.js   # WhatsApp messaging service
│   ├── emailService.js      # Email sending service
│   ├── leadLogger.js        # Lead tracking and logging
│   └── openaiService.js     # AI message generation
├── utils/
│   ├── phoneUtils.js        # Phone number utilities
│   └── logger.js            # Application logging
└── runner.js                # Main application entry point
```

## Usage

The application will:

1. Generate 100+ keyword+location combinations for Kenyan businesses
2. Search Google Places API for each combination
3. Filter out businesses that already have websites
4. Check if phone numbers are registered on WhatsApp
5. Send personalized outreach messages via WhatsApp and/or email
6. Log all interactions to Google Sheets or CSV

## License

ISC
