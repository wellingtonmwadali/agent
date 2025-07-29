/**
 * Web UI server for Kidanga Lead Generation Agent
 */

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const LeadGenerationAgent = require('./runner');
const WhatsAppService = require('./services/whatsappService');
const { getAllSearchTerms, businessTypes, locations } = require('./config/keywords');
const logger = require('./utils/logger');

class WebUIServer {
  constructor(port = 3000) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server);
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
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  setupRoutes() {
    // Serve main UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // API Routes
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = {
          server: {
            running: true,
            port: this.port,
            timestamp: new Date().toISOString()
          },
          agent: {
            running: this.isAgentRunning,
            stats: this.currentStats
          },
          services: {
            whatsapp: await this.whatsappService.getStatus(),
            email: await this.agent.emailService.verifyEmailConfiguration(),
            openai: await this.agent.openaiService.testConnection()
          },
          leads: await this.agent.leadLogger.getLeadStats()
        };
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/keywords', (req, res) => {
      res.json({
        businessTypes,
        locations,
        totalCombinations: businessTypes.length * locations.length,
        specificTerms: getAllSearchTerms().length
      });
    });

    this.app.post('/api/agent/start', async (req, res) => {
      try {
        if (this.isAgentRunning) {
          return res.status(400).json({ error: 'Agent is already running' });
        }

        const options = req.body;
        
        this.isAgentRunning = true;
        this.io.emit('agentStarted', { options, stats: this.currentStats });
        
        // Run in background
        this.runAgentWithUpdates(options);
        
        res.json({ message: 'Agent started successfully', options });
      } catch (error) {
        this.isAgentRunning = false;
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/agent/stop', (req, res) => {
      this.isAgentRunning = false;
      this.io.emit('agentStopped');
      res.json({ message: 'Agent stop requested' });
    });

    this.app.get('/api/leads/export', async (req, res) => {
      try {
        const format = req.query.format || 'csv';
        const result = await this.agent.leadLogger.exportLeads(format);
        
        if (result.error) {
          return res.status(400).json({ error: result.error });
        }

        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
          res.send(result.content);
        } else {
          res.json(result.data);
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/leads/stats', async (req, res) => {
      try {
        const stats = await this.agent.leadLogger.getLeadStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/email/test', async (req, res) => {
      try {
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: 'Email address is required' });
        }
        
        const emailService = this.agent.emailService;
        const template = emailService.generateColdEmailTemplate({ name: 'Test Business', address: 'Kenya' });
        await emailService.sendEmail(email, template.subject, template.htmlContent, template.textContent);
        res.json({ message: 'Test email sent successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/whatsapp/check', async (req, res) => {
      try {
        const { phoneNumber } = req.body;
        const isOnWhatsApp = await this.whatsappService.isNumberOnWhatsApp(phoneNumber);
        res.json({ phoneNumber, isOnWhatsApp });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/whatsapp/send', async (req, res) => {
      try {
        const { phoneNumber, message } = req.body;
        const result = await this.whatsappService.sendMessage(phoneNumber, message);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      // Send current status to new client
      socket.emit('status-update', {
        running: this.isAgentRunning,
        stats: this.currentStats
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      socket.on('request-status', async () => {
        try {
          const status = {
            agent: {
              running: this.isAgentRunning,
              stats: this.currentStats
            },
            whatsapp: await this.whatsappService.getStatus(),
            leads: await this.agent.leadLogger.getLeadStats()
          };
          socket.emit('status-update', status);
        } catch (error) {
          socket.emit('error', error.message);
        }
      });
    });
  }

  async runAgentWithUpdates(options = {}) {
    try {
      await this.agent.initialize();
      
      // Override agent methods to emit updates
      const originalProcessSingleBusiness = this.agent.processSingleBusiness.bind(this.agent);
      this.agent.processSingleBusiness = async (business) => {
        const result = await originalProcessSingleBusiness(business);
        
        // Update stats and emit
        this.currentStats = this.agent.stats;
        this.io.emit('statsUpdate', this.currentStats);
        this.io.emit('logEntry', {
          type: 'info',
          message: `Processed business: ${business.name} in ${business.address || 'Unknown location'}`
        });
        
        return result;
      };

      // Run the agent
      await this.agent.run(options);
      
    } catch (error) {
      logger.error('Agent run failed', error);
      this.io.emit('agentError', { error: error.message });
    } finally {
      this.isAgentRunning = false;
      this.io.emit('agentCompleted', { stats: this.currentStats });
    }
  }

  async start() {
    try {
      // Initialize WhatsApp service
      logger.info('Initializing WhatsApp service for UI...');
      await this.whatsappService.initialize();
      
      this.server.listen(this.port, () => {
        logger.success(`🌐 Web UI Server running on http://localhost:${this.port}`);
        logger.info('📱 Open your browser and navigate to the URL above');
      });
      
    } catch (error) {
      logger.error('Failed to start Web UI server', error);
      throw error;
    }
  }

  async stop() {
    this.isAgentRunning = false;
    if (this.whatsappService) {
      await this.whatsappService.disconnect();
    }
    this.server.close();
    logger.info('Web UI server stopped');
  }
}

module.exports = WebUIServer;

// Start server if run directly
if (require.main === module) {
  const server = new WebUIServer();
  server.start();
}
