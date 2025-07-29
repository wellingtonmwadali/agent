/**
 * Application logging utility
 */

const fs = require('fs').promises;
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.createLogDir();
  }

  async createLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error.message);
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`.trim();
  }

  async writeToFile(level, message, meta = {}) {
    try {
      const filename = `${new Date().toISOString().split('T')[0]}.log`;
      const filepath = path.join(this.logDir, filename);
      const formattedMessage = this.formatMessage(level, message, meta) + '\n';
      await fs.appendFile(filepath, formattedMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  info(message, meta = {}) {
    console.log(`ℹ️  ${message}`, meta);
    this.writeToFile('info', message, meta);
  }

  success(message, meta = {}) {
    console.log(`✅ ${message}`, meta);
    this.writeToFile('success', message, meta);
  }

  warn(message, meta = {}) {
    console.warn(`⚠️  ${message}`, meta);
    this.writeToFile('warn', message, meta);
  }

  error(message, error = null, meta = {}) {
    console.error(`❌ ${message}`, error, meta);
    const errorMeta = error ? { ...meta, error: error.message, stack: error.stack } : meta;
    this.writeToFile('error', message, errorMeta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🐛 ${message}`, meta);
      this.writeToFile('debug', message, meta);
    }
  }

  // Log lead processing events
  leadFound(businessName, location) {
    this.info(`Lead found: ${businessName} in ${location}`);
  }

  leadSkipped(businessName, reason) {
    this.info(`Lead skipped: ${businessName} - ${reason}`);
  }

  messagesent(businessName, channel, phone) {
    this.success(`Message sent to ${businessName} via ${channel} (${phone})`);
  }

  messageFailed(businessName, channel, error) {
    this.error(`Failed to send message to ${businessName} via ${channel}`, error);
  }

  // Performance logging
  async logPerformance(operation, duration, details = {}) {
    this.info(`Performance: ${operation} completed in ${duration}ms`, details);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
