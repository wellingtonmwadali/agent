/**
 * Phone number utilities for Kenyan phone numbers
 */

// Format phone number to international format
const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.startsWith('254')) {
    // Already in international format
    return '+' + cleaned;
  } else if (cleaned.startsWith('0')) {
    // Local format starting with 0
    return '+254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    // 9 digits without country code or leading 0
    return '+254' + cleaned;
  } else if (cleaned.length === 10 && cleaned.startsWith('7')) {
    // 10 digits starting with 7
    return '+254' + cleaned;
  }
  
  // Return original if no pattern matches
  return phoneNumber;
};

// Validate Kenyan phone number
const isValidKenyanNumber = (phoneNumber) => {
  const formatted = formatPhoneNumber(phoneNumber);
  if (!formatted) return false;
  
  // Kenyan mobile numbers start with +254 followed by 7, 1, or 0
  const regex = /^\+254[710]\d{8}$/;
  return regex.test(formatted);
};

// Extract phone numbers from text
const extractPhoneNumbers = (text) => {
  if (!text) return [];
  
  const phonePatterns = [
    // +254 format
    /\+254[710]\d{8}/g,
    // 0 format
    /0[710]\d{8}/g,
    // Spaced formats
    /\+254\s[710]\d{2}\s\d{3}\s\d{3}/g,
    /0[710]\d{2}\s\d{3}\s\d{3}/g,
    // Hyphenated formats
    /\+254-[710]\d{2}-\d{3}-\d{3}/g,
    /0[710]\d{2}-\d{3}-\d{3}/g,
  ];
  
  const found = [];
  phonePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches);
    }
  });
  
  // Format and deduplicate
  const formatted = found
    .map(formatPhoneNumber)
    .filter(isValidKenyanNumber)
    .filter((phone, index, arr) => arr.indexOf(phone) === index);
  
  return formatted;
};

// Clean and normalize phone number for WhatsApp
const normalizeForWhatsApp = (phoneNumber) => {
  const formatted = formatPhoneNumber(phoneNumber);
  if (!formatted) return null;
  
  // Remove the + for WhatsApp
  return formatted.substring(1);
};

module.exports = {
  formatPhoneNumber,
  isValidKenyanNumber,
  extractPhoneNumbers,
  normalizeForWhatsApp,
};
