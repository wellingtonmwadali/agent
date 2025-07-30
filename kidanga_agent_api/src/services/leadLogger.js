/**
 * Lead logging service for Google Sheets and CSV
 */

const { GoogleSpreadsheet } = require('google-spreadsheet');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const logger = require('../utils/logger');

class LeadLogger {
  constructor() {
    this.csvPath = path.join(process.cwd(), 'leads.csv');
    this.googleSheet = null;
    this.csvWriter = null;
    this.setupCsvWriter();
    this.setupGoogleSheets();
  }

  setupCsvWriter() {
    this.csvWriter = createCsvWriter({
      path: this.csvPath,
      header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'businessName', title: 'Business Name' },
        { id: 'phoneNumbers', title: 'Phone Numbers' },
        { id: 'email', title: 'Email' },
        { id: 'website', title: 'Website' },
        { id: 'address', title: 'Address' },
        { id: 'businessTypes', title: 'Business Types' },
        { id: 'rating', title: 'Google Rating' },
        { id: 'totalRatings', title: 'Total Ratings' },
        { id: 'hasWebsite', title: 'Has Website' },
        { id: 'whatsappStatus', title: 'WhatsApp Status' },
        { id: 'emailStatus', title: 'Email Status' },
        { id: 'messageStatus', title: 'Message Status' },
        { id: 'searchQuery', title: 'Search Query' },
        { id: 'scrapedAt', title: 'Scraped At' },
        { id: 'contactedAt', title: 'Contacted At' },
        { id: 'notes', title: 'Notes' }
      ],
      append: true
    });
    logger.info(`CSV writer setup - file: ${this.csvPath}`);
  }

  async setupGoogleSheets() {
    try {
      if (!config.googleSheets.privateKey || !config.googleSheets.clientEmail || !config.googleSheets.sheetId) {
        logger.warn('Google Sheets credentials not provided, will only use CSV logging');
        return;
      }

      this.googleSheet = new GoogleSpreadsheet(config.googleSheets.sheetId);

      await this.googleSheet.useServiceAccountAuth({
        client_email: config.googleSheets.clientEmail,
        private_key: config.googleSheets.privateKey.replace(/\\n/g, '\n'),
      });

      await this.googleSheet.loadInfo();
      logger.info(`Google Sheets connected: ${this.googleSheet.title}`);

      // Get or create the leads worksheet
      let worksheet = this.googleSheet.worksheetsByTitle['Leads'];
      if (!worksheet) {
        worksheet = await this.googleSheet.addWorksheet({
          title: 'Leads',
          headerValues: [
            'Timestamp', 'Business Name', 'Phone Numbers', 'Email', 'Website',
            'Address', 'Business Types', 'Google Rating', 'Total Ratings',
            'Has Website', 'WhatsApp Status', 'Email Status', 'Message Status',
            'Search Query', 'Scraped At', 'Contacted At', 'Notes'
          ]
        });
        logger.info('Created new Leads worksheet');
      }

      this.worksheet = worksheet;

    } catch (error) {
      logger.error('Failed to setup Google Sheets', error);
      this.googleSheet = null;
    }
  }

  formatLeadForLogging(lead, searchQuery = '', contactResults = {}) {
    return {
      timestamp: new Date().toISOString(),
      businessName: lead.name || '',
      phoneNumbers: Array.isArray(lead.phoneNumbers) ? lead.phoneNumbers.join(', ') : '',
      email: lead.email || '',
      website: lead.website || '',
      address: lead.address || '',
      businessTypes: Array.isArray(lead.types) ? lead.types.join(', ') : '',
      rating: lead.rating || '',
      totalRatings: lead.totalRatings || '',
      hasWebsite: lead.hasWebsite ? 'Yes' : 'No',
      whatsappStatus: contactResults.whatsapp?.status || 'Not Checked',
      emailStatus: contactResults.email?.status || 'Not Checked', 
      messageStatus: this.determineMessageStatus(contactResults),
      searchQuery: searchQuery,
      scrapedAt: lead.scrapedAt || new Date().toISOString(),
      contactedAt: contactResults.contactedAt || '',
      notes: contactResults.notes || ''
    };
  }

  determineMessageStatus(contactResults) {
    const statuses = [];
    
    if (contactResults.whatsapp?.success) {
      statuses.push('WhatsApp Sent');
    } else if (contactResults.whatsapp?.error) {
      statuses.push('WhatsApp Failed');
    }

    if (contactResults.email?.success) {
      statuses.push('Email Sent');
    } else if (contactResults.email?.error) {
      statuses.push('Email Failed');
    }

    if (contactResults.skipped) {
      statuses.push('Skipped - ' + contactResults.skipReason);
    }

    return statuses.length > 0 ? statuses.join(', ') : 'No Contact';
  }

  async logLead(lead, searchQuery = '', contactResults = {}) {
    try {
      const formattedLead = this.formatLeadForLogging(lead, searchQuery, contactResults);
      
      // Log to CSV
      await this.logToCSV(formattedLead);
      
      // Log to Google Sheets if available
      if (this.worksheet) {
        await this.logToGoogleSheets(formattedLead);
      }
      
      logger.success(`Lead logged: ${lead.name}`);

    } catch (error) {
      logger.error(`Failed to log lead: ${lead.name}`, error);
    }
  }

  async logToCSV(formattedLead) {
    try {
      await this.csvWriter.writeRecords([formattedLead]);
    } catch (error) {
      logger.error('Failed to write to CSV', error);
      throw error;
    }
  }

  async logToGoogleSheets(formattedLead) {
    try {
      await this.worksheet.addRow(formattedLead);
    } catch (error) {
      logger.error('Failed to write to Google Sheets', error);
      // Don't throw error for Google Sheets failures
    }
  }

  async logBulkLeads(leads, searchQuery = '', contactResults = []) {
    const formattedLeads = leads.map((lead, index) => {
      const leadContactResults = contactResults[index] || {};
      return this.formatLeadForLogging(lead, searchQuery, leadContactResults);
    });

    // Log to CSV
    await this.csvWriter.writeRecords(formattedLeads);
    logger.info(`Logged ${formattedLeads.length} leads to CSV`);

    // Log to Google Sheets if available
    if (this.worksheet) {
      try {
        await this.worksheet.addRows(formattedLeads);
        logger.info(`Logged ${formattedLeads.length} leads to Google Sheets`);
      } catch (error) {
        logger.error('Failed to write bulk leads to Google Sheets', error);
      }
    }
  }

  async getLeadStats() {
    try {
      // Read CSV file to get stats
      const csvExists = await fs.access(this.csvPath).then(() => true).catch(() => false);
      if (!csvExists) {
        return { totalLeads: 0, csvPath: this.csvPath };
      }

      const csvContent = await fs.readFile(this.csvPath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const totalLeads = Math.max(0, lines.length - 1); // Subtract header row

      const stats = {
        totalLeads,
        csvPath: this.csvPath,
        googleSheetsConnected: !!this.worksheet,
        lastUpdated: new Date().toISOString()
      };

      // Get Google Sheets stats if available
      if (this.worksheet) {
        try {
          const rows = await this.worksheet.getRows();
          stats.googleSheetsRows = rows.length;
          stats.googleSheetsTitle = this.googleSheet.title;
        } catch (error) {
          logger.error('Failed to get Google Sheets stats', error);
        }
      }

      return stats;

    } catch (error) {
      logger.error('Failed to get lead stats', error);
      return { error: error.message };
    }
  }

  async exportLeads(format = 'csv', filterOptions = {}) {
    try {
      if (format === 'csv') {
        const exists = await fs.access(this.csvPath).then(() => true).catch(() => false);
        if (exists) {
          const content = await fs.readFile(this.csvPath, 'utf8');
          return { format: 'csv', content, path: this.csvPath };
        }
        return { error: 'CSV file not found' };
      }

      if (format === 'json' && this.worksheet) {
        const rows = await this.worksheet.getRows();
        const leads = rows.map(row => row._rawData);
        return { format: 'json', data: leads };
      }

      return { error: 'Unsupported format or Google Sheets not available' };

    } catch (error) {
      logger.error('Failed to export leads', error);
      return { error: error.message };
    }
  }

  // Update lead status (for follow-ups)
  async updateLeadStatus(businessName, phoneNumber, newStatus, notes = '') {
    try {
      if (this.worksheet) {
        const rows = await this.worksheet.getRows();
        const leadRow = rows.find(row => 
          row.businessName === businessName && row.phoneNumbers.includes(phoneNumber)
        );

        if (leadRow) {
          leadRow.messageStatus = newStatus;
          leadRow.notes = notes;
          leadRow.lastUpdated = new Date().toISOString();
          await leadRow.save();
          logger.info(`Updated lead status for ${businessName}: ${newStatus}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to update lead status for ${businessName}`, error);
    }
  }
}

module.exports = LeadLogger;
