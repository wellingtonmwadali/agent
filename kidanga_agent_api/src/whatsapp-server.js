/**
 * Standalone WhatsApp API server
 * Run this separately to provide WhatsApp services via HTTP API
 */

const express = require('express');
const WhatsAppService = require('./services/whatsappService');
const logger = require('./utils/logger');

class WhatsAppAPIServer {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.whatsappService = new WhatsAppService();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, { ip: req.ip });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/', (req, res) => {
      res.json({
        service: 'Kidanga WhatsApp API',
        status: 'running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });

    // WhatsApp status
    this.app.get('/status', async (req, res) => {
      try {
        const status = await this.whatsappService.getStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Check if number is on WhatsApp
    this.app.post('/check', async (req, res) => {
      try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
          return res.status(400).json({ error: 'Phone number is required' });
        }

        const isOnWhatsApp = await this.whatsappService.isNumberOnWhatsApp(phoneNumber);
        res.json({ phoneNumber, isOnWhatsApp });
        
      } catch (error) {
        logger.error('Error checking WhatsApp number', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Send message
    this.app.post('/send', async (req, res) => {
      try {
        const { phoneNumber, message } = req.body;
        
        if (!phoneNumber || !message) {
          return res.status(400).json({ error: 'Phone number and message are required' });
        }

        const result = await this.whatsappService.sendMessage(phoneNumber, message);
        res.json(result);
        
      } catch (error) {
        logger.error('Error sending WhatsApp message', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Send bulk messages
    this.app.post('/send-bulk', async (req, res) => {
      try {
        const { contacts, messageTemplate } = req.body;
        
        if (!contacts || !Array.isArray(contacts) || !messageTemplate) {
          return res.status(400).json({ error: 'Contacts array and messageTemplate are required' });
        }

        const results = await this.whatsappService.sendBulkMessages(contacts, messageTemplate);
        res.json({ results, total: contacts.length });
        
      } catch (error) {
        logger.error('Error sending bulk WhatsApp messages', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      logger.error('API Error', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async start() {
    try {
      // Initialize WhatsApp service
      logger.info('Initializing WhatsApp service...');
      await this.whatsappService.initialize();
      
      // Start server
      this.app.listen(this.port, () => {
        logger.success(`🚀 WhatsApp API Server running on port ${this.port}`);
        logger.info(`📱 WhatsApp Web QR code will appear above when ready`);
        logger.info(`🌐 API endpoints:`);
        logger.info(`   GET  / - Service info`);
        logger.info(`   GET  /status - WhatsApp status`);
        logger.info(`   POST /check - Check if number is on WhatsApp`);
        logger.info(`   POST /send - Send single message`);
        logger.info(`   POST /send-bulk - Send bulk messages`);
      });
      
    } catch (error) {
      logger.error('Failed to start WhatsApp API server', error);
      process.exit(1);
    }
  }

  async stop() {
    if (this.whatsappService) {
      await this.whatsappService.disconnect();
    }
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start server if run directly
if (require.main === module) {
  const port = process.env.WHATSAPP_PORT || 3001;
  const server = new WhatsAppAPIServer(port);
  server.start();
}

module.exports = WhatsAppAPIServer;
