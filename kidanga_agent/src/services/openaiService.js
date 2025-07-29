/**
 * OpenAI service for generating personalized messages
 */

const OpenAI = require('openai');
const config = require('../config/config');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.setupOpenAI();
  }

  setupOpenAI() {
    try {
      if (config.openai.apiKey) {
        this.client = new OpenAI({
          apiKey: config.openai.apiKey,
        });
        this.isConfigured = true;
        logger.info('OpenAI configured successfully');
      } else {
        logger.warn('OpenAI API key not provided');
      }
    } catch (error) {
      logger.error('Failed to configure OpenAI', error);
    }
  }

  async generatePersonalizedMessage(business, channel = 'whatsapp', tone = 'professional') {
    if (!this.isConfigured) {
      return this.getFallbackMessage(business, channel);
    }

    try {
      const businessName = business.name || 'Business';
      const businessTypes = Array.isArray(business.types) ? business.types.join(', ') : 'business';
      const location = this.extractLocationFromAddress(business.address) || 'Kenya';
      const agencyName = config.personal.agencyName;
      const agencyPhone = config.personal.phoneNumber;

      const prompt = this.createPrompt(businessName, businessTypes, location, channel, tone);
      
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a professional digital marketing expert helping create personalized outreach messages for ${agencyName}, a web development agency in Kenya. Create concise, compelling messages that offer website development services to local businesses.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: channel === 'whatsapp' ? 300 : 500,
        temperature: 0.7,
      });

      const message = completion.choices[0].message.content.trim();
      logger.debug(`Generated personalized message for ${businessName}`);
      
      return this.formatMessage(message, business, channel);

    } catch (error) {
      logger.error(`Failed to generate personalized message for ${business.name}`, error);
      return this.getFallbackMessage(business, channel);
    }
  }

  createPrompt(businessName, businessTypes, location, channel, tone) {
    const channelSpecs = {
      whatsapp: 'WhatsApp message (keep under 200 words, casual but professional)',
      email: 'email subject line and body (can be longer, more detailed)',
      sms: 'SMS message (keep under 160 characters)'
    };

    return `
Create a personalized ${channelSpecs[channel]} for a ${tone} outreach to "${businessName}", which is a ${businessTypes} business located in ${location}, Kenya.

The message should:
1. Address them by business name
2. Mention their location and business type naturally
3. Explain how a professional website can help their specific business
4. Include a clear value proposition
5. Have a soft call-to-action
6. Be culturally appropriate for Kenyan business owners
7. Mention that many customers now search online for their services

Agency details to include:
- Agency: ${config.personal.agencyName}
- Phone: ${config.personal.phoneNumber}
- We specialize in websites for local Kenyan businesses

${channel === 'whatsapp' ? 'Make it conversational and include relevant emojis.' : ''}
${channel === 'email' ? 'Include both subject line and email body.' : ''}

Avoid being too salesy. Focus on helping their business grow online.
    `;
  }

  formatMessage(message, business, channel) {
    const agencyName = config.personal.agencyName;
    const agencyPhone = config.personal.phoneNumber;
    const agencyEmail = config.personal.email;

    // Replace any placeholders that might not have been filled
    let formattedMessage = message
      .replace(/\[Business Name\]/g, business.name || 'Business')
      .replace(/\[Agency Name\]/g, agencyName)
      .replace(/\[Phone\]/g, agencyPhone)
      .replace(/\[Email\]/g, agencyEmail);

    // Add signature if not already present
    if (channel === 'whatsapp' && !formattedMessage.includes(agencyName)) {
      formattedMessage += `\n\n${agencyName}\n📞 ${agencyPhone}`;
    }

    return formattedMessage;
  }

  getFallbackMessage(business, channel) {
    const businessName = business.name || 'Business Owner';
    const location = this.extractLocationFromAddress(business.address) || 'your area';
    const agencyName = config.personal.agencyName;
    const agencyPhone = config.personal.phoneNumber;

    if (channel === 'whatsapp') {
      return `Hi ${businessName}! 👋

I noticed your business in ${location} and wanted to reach out. Many customers now search online for services like yours, and having a professional website can really help you stand out and attract more clients.

We at ${agencyName} specialize in creating websites for local Kenyan businesses. We'd love to help you establish a strong online presence.

Interested in learning more? Let's chat!

${agencyName}
📞 ${agencyPhone}`;
    }

    if (channel === 'email') {
      return {
        subject: `Professional Website for ${businessName} - Grow Your Business Online`,
        body: `Hello ${businessName},

I hope this email finds you well. I came across your business in ${location} and wanted to reach out with an opportunity that could help you grow.

In today's digital world, more customers are searching online for services like yours. Having a professional website can help you:
- Attract new customers who search online
- Build trust and credibility
- Stay competitive in your market
- Make it easy for customers to find and contact you

At ${agencyName}, we specialize in creating professional websites for local businesses in Kenya. We understand the unique needs of businesses like yours and create websites that actually help you get more customers.

Would you be interested in a quick conversation about how a website could benefit your business? No obligation - just a friendly chat about growing your online presence.

Best regards,
${agencyName} Team
📞 ${agencyPhone}`
      };
    }

    return `Hello ${businessName}! We help ${location} businesses like yours get professional websites to attract more customers. Contact ${agencyName} at ${agencyPhone}`;
  }

  async generateBulkMessages(businesses, channel = 'whatsapp', tone = 'professional') {
    const messages = [];
    
    for (const business of businesses) {
      try {
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const message = await this.generatePersonalizedMessage(business, channel, tone);
        messages.push({
          business,
          message,
          success: true
        });
        
      } catch (error) {
        messages.push({
          business,
          message: this.getFallbackMessage(business, channel),
          success: false,
          error: error.message
        });
      }
    }

    return messages;
  }

  extractLocationFromAddress(address) {
    if (!address) return null;
    
    const locations = [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Machakos',
      'Karen', 'Westlands', 'Kilimani', 'Lavington', 'Upperhill', 'Parklands'
    ];
    
    for (const location of locations) {
      if (address.toLowerCase().includes(location.toLowerCase())) {
        return location;
      }
    }
    
    return null;
  }

  async testConnection() {
    if (!this.isConfigured) {
      return { connected: false, error: 'OpenAI not configured' };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 10
      });

      return { connected: true, model: response.model };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }

  // Generate different message variations for A/B testing
  async generateMessageVariations(business, channel = 'whatsapp', count = 3) {
    const tones = ['professional', 'friendly', 'urgent'];
    const variations = [];

    for (let i = 0; i < Math.min(count, tones.length); i++) {
      const message = await this.generatePersonalizedMessage(business, channel, tones[i]);
      variations.push({
        tone: tones[i],
        message,
        id: i + 1
      });
    }

    return variations;
  }
}

module.exports = OpenAIService;
