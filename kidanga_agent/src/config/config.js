require('dotenv').config();

module.exports = {
  google: {
    placesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  googleSheets: {
    privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    sheetId: process.env.GOOGLE_SHEETS_SHEET_ID,
  },
  personal: {
    email: process.env.EMAIL_FROM || 'kidanga.agency@gmail.com',
    phoneNumber: process.env.PHONE_NUMBER || '254790147060',
    agencyName: process.env.AGENCY_NAME || 'Kidanga',
  },
  whatsapp: {
    port: process.env.WHATSAPP_PORT || 3001,
  },
  app: {
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 5,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
    delayBetweenRequests: parseInt(process.env.DELAY_BETWEEN_REQUESTS) || 1000,
  },
};
