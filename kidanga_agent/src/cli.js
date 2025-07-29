#!/usr/bin/env node

/**
 * CLI interface for the Kidanga Lead Generation Agent
 */

const { program } = require('commander');
const LeadGenerationAgent = require('./runner');
const { generateSearchTerms, specificSearchTerms } = require('./config/keywords');
const logger = require('./utils/logger');

program
  .name('kidanga-agent')
  .description('Kidanga Lead Generation Agent - Find and contact businesses without websites')
  .version('1.0.0');

program
  .command('run')
  .description('Run the full lead generation process')
  .option('-l, --limit <number>', 'Limit the number of search queries')
  .option('-t, --test', 'Run in test mode with limited searches')
  .action(async (options) => {
    const agent = new LeadGenerationAgent();
    try {
      await agent.initialize();
      
      if (options.test) {
        await agent.runTest(options.limit || 5);
      } else {
        await agent.run({ limit: options.limit ? parseInt(options.limit) : null });
      }
    } catch (error) {
      logger.error('Failed to run agent', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Run a quick test with 5 searches')
  .action(async () => {
    const agent = new LeadGenerationAgent();
    try {
      await agent.initialize();
      await agent.runTest(5);
    } catch (error) {
      logger.error('Failed to run test', error);
      process.exit(1);
    }
  });

program
  .command('targeted')
  .description('Run targeted search for specific business types and locations')
  .requiredOption('-b, --businesses <businesses...>', 'Business types to search for')
  .requiredOption('-l, --locations <locations...>', 'Locations to search in')
  .action(async (options) => {
    const agent = new LeadGenerationAgent();
    try {
      await agent.initialize();
      await agent.runTargeted(options.businesses, options.locations);
    } catch (error) {
      logger.error('Failed to run targeted search', error);
      process.exit(1);
    }
  });

program
  .command('keywords')
  .description('Show all available search keywords')
  .action(() => {
    const allTerms = generateSearchTerms();
    console.log(`Generated ${allTerms.length} search terms from business types and locations`);
    console.log(`Plus ${specificSearchTerms.length} specific search terms`);
    console.log(`Total: ${allTerms.length + specificSearchTerms.length} search combinations`);
    
    console.log('\nFirst 10 generated terms:');
    allTerms.slice(0, 10).forEach((term, index) => {
      console.log(`${index + 1}. ${term}`);
    });
    
    console.log('\nSpecific search terms:');
    specificSearchTerms.slice(0, 10).forEach((term, index) => {
      console.log(`${index + 1}. ${term}`);
    });
  });

program
  .command('status')
  .description('Check the status of various services')
  .action(async () => {
    const agent = new LeadGenerationAgent();
    
    console.log('🔍 Checking service status...\n');
    
    // Check WhatsApp status
    try {
      const whatsappStatus = await agent.whatsappService.getStatus();
      console.log(`📱 WhatsApp: ${whatsappStatus.isReady ? '✅ Ready' : '❌ Not Ready'}`);
    } catch (error) {
      console.log(`📱 WhatsApp: ❌ Error - ${error.message}`);
    }
    
    // Check email status
    try {
      const emailStatus = await agent.emailService.verifyEmailConfiguration();
      console.log(`📧 Email: ${emailStatus.sendgrid || emailStatus.nodemailer ? '✅ Configured' : '❌ Not Configured'}`);
    } catch (error) {
      console.log(`📧 Email: ❌ Error - ${error.message}`);
    }
    
    // Check OpenAI status
    try {
      const openaiStatus = await agent.openaiService.testConnection();
      console.log(`🤖 OpenAI: ${openaiStatus.connected ? '✅ Connected' : '❌ Not Connected'}`);
    } catch (error) {
      console.log(`🤖 OpenAI: ❌ Error - ${error.message}`);
    }
    
    // Check lead logger status
    try {
      const leadStats = await agent.leadLogger.getLeadStats();
      console.log(`💾 Lead Logger: ✅ Ready (${leadStats.totalLeads} leads logged)`);
      console.log(`📊 Google Sheets: ${leadStats.googleSheetsConnected ? '✅ Connected' : '❌ Not Connected'}`);
    } catch (error) {
      console.log(`💾 Lead Logger: ❌ Error - ${error.message}`);
    }
  });

program.parse();
