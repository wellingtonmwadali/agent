/**
 * WhatsApp service using whatsapp-web.js
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const config = require('../config/config');
const logger = require('../utils/logger');
const { normalizeForWhatsApp } = require('../utils/phoneUtils');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.app = express();
    this.port = config.whatsapp.port;
    this.setupExpress();
  }

  setupExpress() {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: this.isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString()
      });
    });

    // Check if number is on WhatsApp
    this.app.post('/check-whatsapp', async (req, res) => {
      try {
        const { phoneNumber } = req.body;
        const isOnWhatsApp = await this.isNumberOnWhatsApp(phoneNumber);
        res.json({ phoneNumber, isOnWhatsApp });
      } catch (error) {
        logger.error('Error checking WhatsApp number', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Send message endpoint
    this.app.post('/send-message', async (req, res) => {
      try {
        const { phoneNumber, message } = req.body;
        const result = await this.sendMessage(phoneNumber, message);
        res.json(result);
      } catch (error) {
        logger.error('Error sending WhatsApp message', error);
        res.status(500).json({ error: error.message });
      }
    });
  }

  async initialize() {
    try {
      logger.info('Initializing WhatsApp client...');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: './session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        }
      });

      this.client.on('qr', (qr) => {
        logger.info('WhatsApp QR Code generated. Scan it with your phone:');
        qrcode.generate(qr, { small: true });
      });

      this.client.on('ready', () => {
        logger.success('WhatsApp client is ready!');
        this.isReady = true;
      });

      this.client.on('authenticated', () => {
        logger.success('WhatsApp client authenticated');
      });

      this.client.on('auth_failure', (msg) => {
        logger.error('WhatsApp authentication failed', new Error(msg));
      });

      this.client.on('disconnected', (reason) => {
        logger.warn(`WhatsApp client disconnected: ${reason}`);
        this.isReady = false;
      });

      await this.client.initialize();
      
      // Start the express server
      this.app.listen(this.port, () => {
        logger.info(`WhatsApp service API running on port ${this.port}`);
      });

    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', error);
      throw error;
    }
  }

  async isNumberOnWhatsApp(phoneNumber) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const normalizedNumber = normalizeForWhatsApp(phoneNumber);
      if (!normalizedNumber) {
        return false;
      }

      const numberId = `${normalizedNumber}@c.us`;
      const isRegistered = await this.client.isRegisteredUser(numberId);
      
      logger.debug(`Checked WhatsApp status for ${phoneNumber}: ${isRegistered}`);
      return isRegistered;

    } catch (error) {
      logger.error(`Failed to check WhatsApp status for ${phoneNumber}`, error);
      return false;
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      const normalizedNumber = normalizeForWhatsApp(phoneNumber);
      if (!normalizedNumber) {
        throw new Error('Invalid phone number format');
      }

      const numberId = `${normalizedNumber}@c.us`;
      
      // Check if number is on WhatsApp first
      const isOnWhatsApp = await this.isNumberOnWhatsApp(phoneNumber);
      if (!isOnWhatsApp) {
        throw new Error('Number is not on WhatsApp');
      }

      await this.client.sendMessage(numberId, message);
      
      logger.success(`WhatsApp message sent to ${phoneNumber}`);
      return {
        success: true,
        phoneNumber,
        message: 'Message sent successfully',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Failed to send WhatsApp message to ${phoneNumber}`, error);
      throw error;
    }
  }

  async sendBulkMessages(contacts, messageTemplate) {
    const results = [];
    
    for (const contact of contacts) {
      try {
        // Add delay between messages to avoid spam detection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const personalizedMessage = this.personalizeMessage(messageTemplate, contact);
        const result = await this.sendMessage(contact.phoneNumber, personalizedMessage);
        
        results.push({
          contact,
          success: true,
          result
        });

      } catch (error) {
        results.push({
          contact,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  personalizeMessage(template, contact) {
    return template
      .replace('{businessName}', contact.businessName || 'Business')
      .replace('{location}', contact.location || 'your area')
      .replace('{agencyName}', config.personal.agencyName)
      .replace('{agencyPhone}', config.personal.phoneNumber)
      .replace('{agencyEmail}', config.personal.email);
  }

  async getStatus() {
    return {
      isReady: this.isReady,
      clientState: this.client ? this.client.info : null,
      timestamp: new Date().toISOString()
    };
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      logger.info('WhatsApp client disconnected');
    }
  }
}

module.exports = WhatsAppService;
