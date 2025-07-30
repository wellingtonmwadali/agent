/**
 * Main runner for the Kidanga Lead Generation Agent
 */

const GoogleScraper = require('./services/googleScraper');
const WhatsAppService = require('./services/whatsappService');
const EmailService = require('./services/emailService');
const LeadLogger = require('./services/leadLogger');
const OpenAIService = require('./services/openaiService');
const { getAllSearchTerms } = require('./config/keywords');
const config = require('./config/config');
const logger = require('./utils/logger');

class LeadGenerationAgent {
  constructor() {
    this.googleScraper = new GoogleScraper();
    this.whatsappService = new WhatsAppService();
    this.emailService = new EmailService();
    this.leadLogger = new LeadLogger();
    this.openaiService = new OpenAIService();
    this.isRunning = false;
    this.stats = {
      totalSearches: 0,
      totalBusinessesFound: 0,
      businessesWithoutWebsites: 0,
      whatsappMessages: 0,
      emailsSent: 0,
      skipped: 0,
      errors: 0
    };
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing Kidanga Lead Generation Agent...');
      
      // Initialize WhatsApp service
      logger.info('📱 Setting up WhatsApp service...');
      await this.whatsappService.initialize();
      
      // Verify email configuration
      logger.info('📧 Verifying email configuration...');
      const emailVerification = await this.emailService.verifyEmailConfiguration();
      logger.info('Email verification result:', emailVerification);
      
      // Test OpenAI connection
      logger.info('🤖 Testing OpenAI connection...');
      const openaiTest = await this.openaiService.testConnection();
      logger.info('OpenAI test result:', openaiTest);
      
      logger.success('✅ Agent initialization complete!');
      
    } catch (error) {
      logger.error('❌ Failed to initialize agent', error);
      throw error;
    }
  }

  async run(options = {}) {
    if (this.isRunning) {
      logger.warn('Agent is already running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('🎯 Starting lead generation process...');
      
      // Get search terms
      const searchTerms = options.searchTerms || getAllSearchTerms();
      const limitedSearchTerms = options.limit ? searchTerms.slice(0, options.limit) : searchTerms;
      
      logger.info(`📊 Will process ${limitedSearchTerms.length} search queries`);
      this.stats.totalSearches = limitedSearchTerms.length;

      // Step 1: Scrape businesses from Google Places
      logger.info('🔍 Step 1: Scraping businesses from Google Places...');
      const allBusinesses = await this.googleScraper.batchSearch(
        limitedSearchTerms, 
        config.app.maxConcurrentRequests
      );
      this.stats.totalBusinessesFound = allBusinesses.length;
      logger.info(`Found ${allBusinesses.length} total businesses`);

      if (allBusinesses.length === 0) {
        logger.warn('No businesses found. Check your Google Places API key and quota.');
        return;
      }

      // Step 2: Filter businesses without websites
      logger.info('🌐 Step 2: Filtering businesses without websites...');
      const businessesWithoutWebsites = await this.googleScraper.filterBusinessesWithoutWebsites(allBusinesses);
      this.stats.businessesWithoutWebsites = businessesWithoutWebsites.length;
      logger.info(`Found ${businessesWithoutWebsites.length} businesses without websites`);

      if (businessesWithoutWebsites.length === 0) {
        logger.info('No businesses without websites found.');
        return;
      }

      // Step 3: Process each business for outreach
      logger.info('📞 Step 3: Processing businesses for outreach...');
      await this.processBusinessesForOutreach(businessesWithoutWebsites);

      // Step 4: Generate final report
      const duration = Date.now() - startTime;
      await this.generateFinalReport(duration);

    } catch (error) {
      logger.error('❌ Lead generation process failed', error);
      this.stats.errors++;
    } finally {
      this.isRunning = false;
    }
  }

  async processBusinessesForOutreach(businesses) {
    const batchSize = 5;
    const batches = [];
    
    // Split businesses into batches for processing
    for (let i = 0; i < businesses.length; i += batchSize) {
      batches.push(businesses.slice(i, i + batchSize));
    }

    logger.info(`Processing ${businesses.length} businesses in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing batch ${i + 1}/${batches.length} (${batch.length} businesses)`);

      const batchPromises = batch.map(business => this.processSingleBusiness(business));
      await Promise.allSettled(batchPromises);

      // Delay between batches to be respectful
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async processSingleBusiness(business) {
    try {
      logger.info(`Processing: ${business.name}`);
      
      // Skip if no phone numbers
      if (!business.phoneNumbers || business.phoneNumbers.length === 0) {
        logger.warn(`Skipping ${business.name} - no phone numbers found`);
        await this.leadLogger.logLead(business, '', { 
          skipped: true, 
          skipReason: 'No phone numbers' 
        });
        this.stats.skipped++;
        return;
      }

      const primaryPhone = business.phoneNumbers[0];
      const contactResults = { contactedAt: new Date().toISOString() };

      // Check WhatsApp status
      let isOnWhatsApp = false;
      try {
        isOnWhatsApp = await this.whatsappService.isNumberOnWhatsApp(primaryPhone);
        contactResults.whatsapp = { status: isOnWhatsApp ? 'Available' : 'Not Available' };
        logger.debug(`${business.name} WhatsApp status: ${isOnWhatsApp}`);
      } catch (error) {
        logger.error(`Failed to check WhatsApp for ${business.name}`, error);
        contactResults.whatsapp = { status: 'Check Failed', error: error.message };
      }

      // Generate personalized messages
      let whatsappMessage = null;
      let emailTemplate = null;

      try {
        if (isOnWhatsApp) {
          whatsappMessage = await this.openaiService.generatePersonalizedMessage(business, 'whatsapp');
        }
        
        // Always generate email template as backup
        emailTemplate = await this.openaiService.generatePersonalizedMessage(business, 'email');
      } catch (error) {
        logger.error(`Failed to generate messages for ${business.name}`, error);
      }

      // Send WhatsApp message if available
      if (isOnWhatsApp && whatsappMessage) {
        try {
          await this.whatsappService.sendMessage(primaryPhone, whatsappMessage);
          contactResults.whatsapp.success = true;
          contactResults.whatsapp.messageSent = true;
          this.stats.whatsappMessages++;
          logger.success(`WhatsApp sent to ${business.name}`);
        } catch (error) {
          logger.error(`Failed to send WhatsApp to ${business.name}`, error);
          contactResults.whatsapp.success = false;
          contactResults.whatsapp.error = error.message;
        }
      }

      // Send email if no WhatsApp or as additional channel
      if (business.email && emailTemplate) {
        try {
          const subject = typeof emailTemplate === 'object' ? emailTemplate.subject : 'Professional Website Services';
          const body = typeof emailTemplate === 'object' ? emailTemplate.body : emailTemplate;
          
          await this.emailService.sendEmail(business.email, subject, body, body);
          contactResults.email = { success: true, messageSent: true, status: 'Sent' };
          this.stats.emailsSent++;
          logger.success(`Email sent to ${business.name}`);
        } catch (error) {
          logger.error(`Failed to send email to ${business.name}`, error);
          contactResults.email = { success: false, error: error.message, status: 'Failed' };
        }
      } else if (!business.email) {
        contactResults.email = { status: 'No Email Available' };
      }

      // If neither WhatsApp nor email worked, mark as skipped
      if (!contactResults.whatsapp?.success && !contactResults.email?.success) {
        if (!isOnWhatsApp && !business.email) {
          contactResults.skipped = true;
          contactResults.skipReason = 'No WhatsApp or Email available';
          this.stats.skipped++;
        }
      }

      // Log the lead
      await this.leadLogger.logLead(business, 'bulk_search', contactResults);

    } catch (error) {
      logger.error(`Failed to process business: ${business.name}`, error);
      this.stats.errors++;
      
      // Still try to log the failed attempt
      try {
        await this.leadLogger.logLead(business, 'bulk_search', {
          error: true,
          errorMessage: error.message,
          skipped: true,
          skipReason: 'Processing error'
        });
      } catch (logError) {
        logger.error('Failed to log error case', logError);
      }
    }
  }

  async generateFinalReport(duration) {
    logger.info('📊 Generating final report...');
    
    const report = {
      duration: `${Math.round(duration / 1000)} seconds`,
      stats: this.stats,
      timestamp: new Date().toISOString(),
      successRate: {
        whatsapp: this.stats.businessesWithoutWebsites > 0 ? 
          Math.round((this.stats.whatsappMessages / this.stats.businessesWithoutWebsites) * 100) : 0,
        email: this.stats.businessesWithoutWebsites > 0 ? 
          Math.round((this.stats.emailsSent / this.stats.businessesWithoutWebsites) * 100) : 0
      }
    };

    logger.info('📈 FINAL REPORT:');
    logger.info(`⏱️  Duration: ${report.duration}`);
    logger.info(`🔍 Total searches: ${report.stats.totalSearches}`);
    logger.info(`🏢 Businesses found: ${report.stats.totalBusinessesFound}`);
    logger.info(`🌐 Without websites: ${report.stats.businessesWithoutWebsites}`);
    logger.info(`📱 WhatsApp messages sent: ${report.stats.whatsappMessages}`);
    logger.info(`📧 Emails sent: ${report.stats.emailsSent}`);
    logger.info(`⏭️  Skipped: ${report.stats.skipped}`);
    logger.info(`❌ Errors: ${report.stats.errors}`);
    logger.info(`📊 WhatsApp success rate: ${report.successRate.whatsapp}%`);
    logger.info(`📊 Email success rate: ${report.successRate.email}%`);

    // Get lead stats
    const leadStats = await this.leadLogger.getLeadStats();
    logger.info(`💾 Total leads logged: ${leadStats.totalLeads}`);
    logger.info(`📄 CSV file: ${leadStats.csvPath}`);
    
    if (leadStats.googleSheetsConnected) {
      logger.info(`📊 Google Sheets: ${leadStats.googleSheetsTitle} (${leadStats.googleSheetsRows} rows)`);
    }

    return report;
  }

  async stop() {
    logger.info('🛑 Stopping lead generation agent...');
    this.isRunning = false;
    
    if (this.whatsappService) {
      await this.whatsappService.disconnect();
    }
    
    logger.info('✅ Agent stopped');
  }

  // Method to run a quick test with limited search terms
  async runTest(limit = 5) {
    logger.info(`🧪 Running test mode with ${limit} search terms`);
    await this.run({ limit });
  }

  // Method to search for specific business types in specific locations
  async runTargeted(businessTypes, locations) {
    const searchTerms = [];
    businessTypes.forEach(business => {
      locations.forEach(location => {
        searchTerms.push(`${business} in ${location}`);
      });
    });
    
    logger.info(`🎯 Running targeted search with ${searchTerms.length} specific terms`);
    await this.run({ searchTerms });
  }
}

// Main execution
async function main() {
  const agent = new LeadGenerationAgent();
  
  try {
    await agent.initialize();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const testMode = args.includes('--test');
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;

    if (testMode) {
      await agent.runTest(limit || 5);
    } else if (limit) {
      await agent.run({ limit });
    } else {
      await agent.run();
    }
    
  } catch (error) {
    logger.error('❌ Application failed', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the application
if (require.main === module) {
  main();
}

module.exports = LeadGenerationAgent;
