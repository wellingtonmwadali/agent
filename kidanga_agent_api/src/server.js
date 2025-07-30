/**
 * Main server for Kidanga Lead Generation Agent API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const LeadGenerationAgent = require('./runner');
const WhatsAppService = require('./services/whatsappService');
const { getAllSearchTerms, businessTypes, locations } = require('./config/keywords');
const logger = require('./utils/logger');

class KidangaAPIServer {
  constructor(port = process.env.PORT || 3001) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });
    this.port = port;
    this.agent = new LeadGenerationAgent();
    this.whatsappService = new WhatsAppService();
    this.isAgentRunning = false;
    this.currentStats = {};
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true
    }));
    
    // Logging
    this.app.use(morgan('combined'));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: require('../package.json').version
      });
    });

    // API Routes
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = {
          agentRunning: this.isAgentRunning,
          whatsappConnected: this.whatsappService.isConnected(),
          stats: this.currentStats,
          timestamp: new Date().toISOString()
        };
        res.json(status);
      } catch (error) {
        logger.error('Error getting status:', error);
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    this.app.get('/api/config', (req, res) => {
      try {
        res.json({
          businessTypes,
          locations,
          searchTerms: getAllSearchTerms()
        });
      } catch (error) {
        logger.error('Error getting config:', error);
        res.status(500).json({ error: 'Failed to get configuration' });
      }
    });

    this.app.post('/api/start-agent', async (req, res) => {
      try {
        if (this.isAgentRunning) {
          return res.status(400).json({ error: 'Agent is already running' });
        }

        const { businessType, location, maxResults } = req.body;
        
        if (!businessType || !location) {
          return res.status(400).json({ error: 'Business type and location are required' });
        }

        this.isAgentRunning = true;
        this.io.emit('agent-status', { running: true, message: 'Starting agent...' });

        // Start agent in background
        this.runAgent(businessType, location, maxResults || 50);

        res.json({ message: 'Agent started successfully' });
      } catch (error) {
        this.isAgentRunning = false;
        logger.error('Error starting agent:', error);
        res.status(500).json({ error: 'Failed to start agent' });
      }
    });

    this.app.post('/api/stop-agent', (req, res) => {
      try {
        this.isAgentRunning = false;
        this.io.emit('agent-status', { running: false, message: 'Agent stopped' });
        res.json({ message: 'Agent stopped successfully' });
      } catch (error) {
        logger.error('Error stopping agent:', error);
        res.status(500).json({ error: 'Failed to stop agent' });
      }
    });

    this.app.get('/api/whatsapp/qr', async (req, res) => {
      try {
        const qrCode = await this.whatsappService.getQRCode();
        if (qrCode) {
          res.json({ qrCode });
        } else {
          res.status(404).json({ error: 'QR code not available' });
        }
      } catch (error) {
        logger.error('Error getting QR code:', error);
        res.status(500).json({ error: 'Failed to get QR code' });
      }
    });

    this.app.post('/api/whatsapp/connect', async (req, res) => {
      try {
        await this.whatsappService.initialize();
        res.json({ message: 'WhatsApp connection initiated' });
      } catch (error) {
        logger.error('Error connecting to WhatsApp:', error);
        res.status(500).json({ error: 'Failed to connect to WhatsApp' });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });

    // Error handler
    this.app.use((error, req, res, next) => {
      logger.error('Server error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected:', socket.id);

      socket.emit('agent-status', { 
        running: this.isAgentRunning,
        stats: this.currentStats 
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
      });
    });
  }

  async runAgent(businessType, location, maxResults) {
    try {
      const results = await this.agent.searchAndProcess(businessType, location, {
        maxResults,
        onProgress: (stats) => {
          this.currentStats = stats;
          this.io.emit('progress', stats);
        }
      });

      this.isAgentRunning = false;
      this.io.emit('agent-status', { 
        running: false, 
        message: 'Agent completed successfully',
        results 
      });

    } catch (error) {
      this.isAgentRunning = false;
      logger.error('Agent error:', error);
      this.io.emit('agent-status', { 
        running: false, 
        message: 'Agent failed with error',
        error: error.message 
      });
    }
  }

  start() {
    this.server.listen(this.port, () => {
      logger.info(`Kidanga API Server running on port ${this.port}`);
      console.log(`🚀 API Server: http://localhost:${this.port}`);
      console.log(`📊 Health Check: http://localhost:${this.port}/health`);
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new KidangaAPIServer();
  server.start();
}

module.exports = KidangaAPIServer;
