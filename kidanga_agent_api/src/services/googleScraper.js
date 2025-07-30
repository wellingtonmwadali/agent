/**
 * Google Places API scraper service
 */

const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');
const { extractPhoneNumbers } = require('../utils/phoneUtils');

class GoogleScraper {
  constructor() {
    this.apiKey = config.google.placesApiKey;
    this.baseUrl = 'https://maps.googleapis.com/api/place';
    this.maxRetries = config.app.retryAttempts;
    this.delay = config.app.delayBetweenRequests;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, retryCount = 0) {
    try {
      await this.delay(this.delay);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        logger.warn(`Request failed, retrying (${retryCount + 1}/${this.maxRetries})`, { error: error.message });
        await this.delay(this.delay * (retryCount + 1));
        return this.makeRequest(url, retryCount + 1);
      }
      throw error;
    }
  }

  async searchPlaces(query) {
    try {
      logger.debug(`Searching for: ${query}`);
      
      const searchUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      const searchData = await this.makeRequest(searchUrl);

      if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
        throw new Error(`Places API error: ${searchData.status} - ${searchData.error_message || 'Unknown error'}`);
      }

      if (searchData.status === 'ZERO_RESULTS') {
        logger.debug(`No results found for: ${query}`);
        return [];
      }

      const businesses = [];
      
      for (const place of searchData.results) {
        try {
          const business = await this.getPlaceDetails(place.place_id);
          if (business) {
            businesses.push(business);
          }
        } catch (error) {
          logger.error(`Failed to get details for place ${place.place_id}`, error);
          continue;
        }
      }

      logger.info(`Found ${businesses.length} businesses for query: ${query}`);
      return businesses;

    } catch (error) {
      logger.error(`Failed to search places for query: ${query}`, error);
      return [];
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const fields = [
        'name',
        'formatted_phone_number',
        'international_phone_number',
        'website',
        'formatted_address',
        'business_status',
        'types',
        'url',
        'vicinity',
        'rating',
        'user_ratings_total'
      ].join(',');

      const detailsUrl = `${this.baseUrl}/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;
      const detailsData = await this.makeRequest(detailsUrl);

      if (detailsData.status !== 'OK') {
        throw new Error(`Place details API error: ${detailsData.status}`);
      }

      const place = detailsData.result;
      
      // Skip if business is permanently closed
      if (place.business_status === 'CLOSED_PERMANENTLY') {
        return null;
      }

      // Extract phone numbers from various fields
      const phoneNumbers = [];
      if (place.formatted_phone_number) {
        phoneNumbers.push(...extractPhoneNumbers(place.formatted_phone_number));
      }
      if (place.international_phone_number) {
        phoneNumbers.push(...extractPhoneNumbers(place.international_phone_number));
      }

      // Deduplicate phone numbers
      const uniquePhones = [...new Set(phoneNumbers)];

      const business = {
        name: place.name,
        phoneNumbers: uniquePhones,
        website: place.website || null,
        address: place.formatted_address || place.vicinity,
        types: place.types || [],
        rating: place.rating || null,
        totalRatings: place.user_ratings_total || 0,
        googleUrl: place.url || null,
        placeId: placeId,
        businessStatus: place.business_status || 'OPERATIONAL',
        scrapedAt: new Date().toISOString()
      };

      return business;

    } catch (error) {
      logger.error(`Failed to get place details for ${placeId}`, error);
      return null;
    }
  }

  // Batch search with rate limiting
  async batchSearch(queries, batchSize = 5) {
    const results = [];
    const batches = [];
    
    // Split queries into batches
    for (let i = 0; i < queries.length; i += batchSize) {
      batches.push(queries.slice(i, i + batchSize));
    }

    logger.info(`Processing ${queries.length} queries in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      logger.info(`Processing batch ${i + 1}/${batches.length}`);

      const batchPromises = batch.map(query => this.searchPlaces(query));
      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        } else {
          logger.error('Batch search failed', result.reason);
        }
      }

      // Delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await this.delay(this.delay * 2);
      }
    }

    // Remove duplicates based on name and phone number
    const uniqueResults = this.deduplicateBusinesses(results);
    logger.info(`Found ${uniqueResults.length} unique businesses from ${queries.length} queries`);
    
    return uniqueResults;
  }

  deduplicateBusinesses(businesses) {
    const seen = new Map();
    const unique = [];

    for (const business of businesses) {
      // Create a key based on name and first phone number
      const key = `${business.name}_${business.phoneNumbers[0] || 'no_phone'}`.toLowerCase();
      
      if (!seen.has(key)) {
        seen.set(key, true);
        unique.push(business);
      }
    }

    return unique;
  }

  // Check if business has a website by trying to access it
  async hasValidWebsite(website) {
    if (!website) return false;

    try {
      const response = await axios.head(website, { 
        timeout: 5000,
        validateStatus: status => status < 500 // Accept 4xx as valid (might be temp down)
      });
      return response.status < 400;
    } catch (error) {
      // Try with https if http failed
      if (website.startsWith('http://')) {
        const httpsUrl = website.replace('http://', 'https://');
        try {
          const response = await axios.head(httpsUrl, { timeout: 5000 });
          return response.status < 400;
        } catch (httpsError) {
          return false;
        }
      }
      return false;
    }
  }

  // Filter businesses that don't have websites
  async filterBusinessesWithoutWebsites(businesses) {
    const filtered = [];
    
    for (const business of businesses) {
      if (!business.website) {
        business.hasWebsite = false;
        filtered.push(business);
        continue;
      }

      const hasWebsite = await this.hasValidWebsite(business.website);
      business.hasWebsite = hasWebsite;
      
      if (!hasWebsite) {
        filtered.push(business);
      } else {
        logger.debug(`Skipping ${business.name} - has valid website: ${business.website}`);
      }
    }

    logger.info(`Filtered ${filtered.length} businesses without valid websites from ${businesses.length} total`);
    return filtered;
  }
}

module.exports = GoogleScraper;
