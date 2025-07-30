# Kidanga Lead Generation Agent

A full-stack lead generation automation system with a React frontend and Express.js backend.

## Project Structure

```
kidanga-agent-workspace/
├── package.json                    # Root workspace configuration
├── README.md                       # This file
├── kidanga_agent_api/             # Backend API server
│   ├── src/                       # Source code
│   │   ├── server.js             # Main server file
│   │   ├── runner.js             # Lead generation logic
│   │   ├── config/               # Configuration files
│   │   ├── services/             # Business logic services
│   │   └── utils/                # Utility functions
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Environment variables template
│   └── README.md                 # Backend documentation
└── kidanga_agent_admin/          # Frontend admin dashboard
    ├── src/                      # React source code
    ├── public/                   # Static assets
    ├── package.json              # Frontend dependencies
    ├── .env.example              # Frontend environment template
    └── README.md                 # Frontend documentation
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Google Places API key
- OpenAI API key
- SendGrid API key (for email)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies and all workspace dependencies
npm run install:all
```

### 2. Environment Setup

```bash
# Backend environment
cp kidanga_agent_api/.env.example kidanga_agent_api/.env
# Edit kidanga_agent_api/.env with your API keys

# Frontend environment
cp kidanga_agent_admin/.env.example kidanga_agent_admin/.env
# Edit if needed (optional for development)
```

### 3. Development Mode

Run both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Backend API server on http://localhost:3001
- Frontend React app on http://localhost:3000

### 4. Production Mode

```bash
# Build frontend
npm run build

# Start production servers
npm run start
```

## Available Scripts

### Root Commands

- `npm run dev` - Start both frontend and backend in development mode
- `npm run start` - Start both in production mode
- `npm run build` - Build frontend for production
- `npm run test` - Run tests for both projects
- `npm run clean` - Clean node_modules from both projects

### Backend Only

```bash
cd kidanga_agent_api
npm run dev      # Development with nodemon
npm start        # Production
npm run cli      # CLI interface
npm run whatsapp # WhatsApp server only
```

### Frontend Only

```bash
cd kidanga_agent_admin
npm start        # Development server
npm run build    # Production build
npm test         # Run tests
```

## API Endpoints

### Health & Status
- `GET /health` - Server health check
- `GET /api/status` - Agent and system status

### Configuration
- `GET /api/config` - Get business types, locations, and search terms

### Agent Control
- `POST /api/start-agent` - Start lead generation
- `POST /api/stop-agent` - Stop lead generation

### WhatsApp
- `GET /api/whatsapp/qr` - Get QR code for WhatsApp connection
- `POST /api/whatsapp/connect` - Initialize WhatsApp connection

## WebSocket Events

The API provides real-time updates via Socket.IO:

- `agent-status` - Agent running status
- `progress` - Lead generation progress
- `whatsapp-status` - WhatsApp connection status

## Environment Variables

### Backend (.env)

```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
GOOGLE_PLACES_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
SENDGRID_API_KEY=your_key_here
FROM_EMAIL=your_email@domain.com
```

### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=http://localhost:3001
```

## Features

### Backend Features
- ✅ Express.js API server
- ✅ Google Places API integration
- ✅ WhatsApp automation
- ✅ Email outreach via SendGrid
- ✅ Real-time updates via Socket.IO
- ✅ Lead data logging and export
- ✅ CLI interface
- ✅ Security middleware (helmet, cors)
- ✅ Request logging
- ✅ Error handling

### Frontend Features
- ✅ React with TypeScript
- ✅ Material-UI components
- ✅ Real-time dashboard
- ✅ Lead generation controls
- ✅ Progress monitoring
- ✅ WhatsApp QR code display
- ✅ Data visualization with Recharts
- ✅ Responsive design

## Development Guidelines

### Code Structure
- Use TypeScript for new frontend code
- Follow REST API conventions for backend endpoints
- Implement proper error handling and logging
- Use environment variables for configuration

### Security
- API keys should never be committed to version control
- Use CORS properly in production
- Implement rate limiting for production use
- Validate all input data

### Testing
- Write unit tests for business logic
- Test API endpoints with proper status codes
- Test React components with React Testing Library

## Deployment

### Frontend (Static Hosting)
```bash
npm run build
# Deploy the build/ folder to your static hosting service
```

### Backend (Server/Container)
```bash
# Use PM2 for production process management
npm install -g pm2
cd kidanga_agent_api
pm2 start src/server.js --name "kidanga-api"
```

### Docker (Optional)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill process on port 3001
   npx kill-port 3001
   ```

2. **API connection errors**
   - Check if backend is running on correct port
   - Verify CORS settings
   - Check environment variables

3. **WhatsApp connection issues**
   - Clear WhatsApp session data
   - Ensure phone has internet connection
   - Check QR code expiration

## Support

For support, please create an issue in the repository or contact the development team.

## License

ISC License - see LICENSE file for details.
