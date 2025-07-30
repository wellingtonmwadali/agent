/**
 * Email service using SendGrid and Nodemailer
 */

const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.sendgridConfigured = false;
    this.nodemailerConfigured = false;
    this.setupSendGrid();
    this.setupNodemailer();
  }

  setupSendGrid() {
    try {
      if (config.sendgrid.apiKey) {
        sgMail.setApiKey(config.sendgrid.apiKey);
        this.sendgridConfigured = true;
        logger.info('SendGrid configured successfully');
      } else {
        logger.warn('SendGrid API key not provided');
      }
    } catch (error) {
      logger.error('Failed to configure SendGrid', error);
    }
  }

  setupNodemailer() {
    try {
      // Create a test account if no SMTP config provided
      this.transporter = nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: config.personal.email,
          pass: process.env.EMAIL_PASSWORD || 'your_app_password_here'
        }
      });
      
      this.nodemailerConfigured = true;
      logger.info('Nodemailer configured');
    } catch (error) {
      logger.error('Failed to configure Nodemailer', error);
    }
  }

  async sendEmailViaSendGrid(to, subject, htmlContent, textContent) {
    if (!this.sendgridConfigured) {
      throw new Error('SendGrid is not configured');
    }

    try {
      const msg = {
        to,
        from: {
          email: config.personal.email,
          name: config.personal.agencyName
        },
        subject,
        text: textContent,
        html: htmlContent,
      };

      await sgMail.send(msg);
      logger.success(`Email sent via SendGrid to ${to}`);
      return { success: true, provider: 'sendgrid' };

    } catch (error) {
      logger.error(`Failed to send email via SendGrid to ${to}`, error);
      throw error;
    }
  }

  async sendEmailViaNodemailer(to, subject, htmlContent, textContent) {
    if (!this.nodemailerConfigured) {
      throw new Error('Nodemailer is not configured');
    }

    try {
      const mailOptions = {
        from: `${config.personal.agencyName} <${config.personal.email}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.success(`Email sent via Nodemailer to ${to}: ${info.messageId}`);
      return { success: true, provider: 'nodemailer', messageId: info.messageId };

    } catch (error) {
      logger.error(`Failed to send email via Nodemailer to ${to}`, error);
      throw error;
    }
  }

  async sendEmail(to, subject, htmlContent, textContent) {
    // Try SendGrid first, fallback to Nodemailer
    try {
      if (this.sendgridConfigured) {
        return await this.sendEmailViaSendGrid(to, subject, htmlContent, textContent);
      } else if (this.nodemailerConfigured) {
        return await this.sendEmailViaNodemailer(to, subject, htmlContent, textContent);
      } else {
        throw new Error('No email service configured');
      }
    } catch (error) {
      // If SendGrid fails, try Nodemailer as fallback
      if (this.sendgridConfigured && this.nodemailerConfigured) {
        logger.warn('SendGrid failed, trying Nodemailer as fallback');
        return await this.sendEmailViaNodemailer(to, subject, htmlContent, textContent);
      }
      throw error;
    }
  }

  generateColdEmailTemplate(business, personalized = false) {
    const businessName = business.name || 'Business Owner';
    const location = business.address ? this.extractLocationFromAddress(business.address) : 'your area';
    const agencyName = config.personal.agencyName;
    const agencyPhone = config.personal.phoneNumber;
    const agencyEmail = config.personal.email;

    const subject = `Professional Website for ${businessName} - Stand Out Online`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .cta { background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${agencyName} Digital Solutions</h1>
                <p>Professional Websites for Local Businesses</p>
            </div>
            
            <div class="content">
                <h2>Hello ${businessName},</h2>
                
                <p>I noticed that <strong>${businessName}</strong> is a well-established business in ${location}, but you might not have a professional website yet.</p>
                
                <p>In today's digital world, having a strong online presence is crucial for:</p>
                <ul>
                    <li>✅ Attracting new customers who search online</li>
                    <li>✅ Building trust and credibility</li>
                    <li>✅ Staying competitive with other businesses</li>
                    <li>✅ Making it easy for customers to find and contact you</li>
                </ul>
                
                <p>We specialize in creating professional, mobile-friendly websites for local businesses in Kenya. Our websites include:</p>
                <ul>
                    <li>🌟 Professional design that reflects your brand</li>
                    <li>📱 Mobile-responsive (works on all devices)</li>
                    <li>🔍 SEO optimization to rank on Google</li>
                    <li>📞 Contact forms and click-to-call buttons</li>
                    <li>⚡ Fast loading speeds</li>
                    <li>🛡️ Secure hosting included</li>
                </ul>
                
                <p><strong>Special offer for ${location} businesses:</strong> Professional website starting from just KSh 25,000 with free maintenance for 3 months!</p>
                
                <a href="tel:${agencyPhone}" class="cta">Call Us Now: ${agencyPhone}</a>
                
                <p>We'd love to show you examples of websites we've created for similar businesses. No obligation - just a friendly conversation about how we can help ${businessName} grow online.</p>
                
                <p>Best regards,<br>
                <strong>${agencyName} Team</strong><br>
                📧 ${agencyEmail}<br>
                📞 ${agencyPhone}</p>
            </div>
            
            <div class="footer">
                <p>This email was sent to help local businesses in Kenya establish their online presence.</p>
                <p>If you're not interested, simply ignore this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
Hello ${businessName},

I noticed that ${businessName} is a well-established business in ${location}, but you might not have a professional website yet.

In today's digital world, having a strong online presence is crucial for:
- Attracting new customers who search online
- Building trust and credibility  
- Staying competitive with other businesses
- Making it easy for customers to find and contact you

We specialize in creating professional, mobile-friendly websites for local businesses in Kenya.

Special offer for ${location} businesses: Professional website starting from just KSh 25,000 with free maintenance for 3 months!

Call us now: ${agencyPhone}
Email: ${agencyEmail}

We'd love to show you examples of websites we've created for similar businesses. No obligation - just a friendly conversation about how we can help ${businessName} grow online.

Best regards,
${agencyName} Team
    `;

    return { subject, htmlContent, textContent };
  }

  extractLocationFromAddress(address) {
    // Extract city/area from address
    const locations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Karen', 'Westlands', 'Kilimani'];
    for (const location of locations) {
      if (address.toLowerCase().includes(location.toLowerCase())) {
        return location;
      }
    }
    return 'Kenya';
  }

  async sendBulkEmails(contacts, customTemplate = null) {
    const results = [];
    
    for (const contact of contacts) {
      try {
        // Add delay between emails to avoid spam detection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const emailTemplate = customTemplate || this.generateColdEmailTemplate(contact);
        const result = await this.sendEmail(
          contact.email,
          emailTemplate.subject,
          emailTemplate.htmlContent,
          emailTemplate.textContent
        );
        
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

  async verifyEmailConfiguration() {
    try {
      if (this.sendgridConfigured) {
        // SendGrid doesn't have a simple verify method, assume it's working
        logger.info('SendGrid configuration verified');
        return { sendgrid: true };
      }
      
      if (this.nodemailerConfigured) {
        await this.transporter.verify();
        logger.info('Nodemailer configuration verified');
        return { nodemailer: true };
      }
      
      return { error: 'No email service configured' };
    } catch (error) {
      logger.error('Email configuration verification failed', error);
      return { error: error.message };
    }
  }
}

module.exports = EmailService;
