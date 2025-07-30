# Example Usage Scenarios

This document provides practical examples of how to use the Kidanga Lead Generation Agent for different scenarios.

## Scenario 1: Quick Test Run

**Goal**: Test the system with a small number of searches

```bash
# Method 1: Using npm script
npm test

# Method 2: Using CLI with custom limit
node src/cli.js run --limit 5

# Method 3: Direct runner with arguments
node src/runner.js --test --limit=3
```

**Expected Output**:
- 3-5 search queries executed
- Businesses found and filtered
- Test messages sent
- Results logged to CSV

## Scenario 2: Target Specific Industries

**Goal**: Focus on restaurants and salons in major cities

```bash
node src/cli.js targeted \\
  --businesses "restaurant" "salon" "barbershop" "cafe" \\
  --locations "Nairobi" "Mombasa" "Kisumu" "Nakuru"
```

**This will search for**:
- restaurant in Nairobi
- restaurant in Mombasa
- salon in Nairobi
- salon in Mombasa
- etc.

## Scenario 3: Full Production Run

**Goal**: Run the complete lead generation process

```bash
# Full run with all 100+ search terms
npm start

# Or with a reasonable limit for daily use
node src/cli.js run --limit 50
```

**Expected Results**:
- 1000+ businesses scraped
- 200-500 businesses without websites
- 50-200 WhatsApp messages sent
- 100-300 emails sent

## Scenario 4: WhatsApp-Only Campaign

**Goal**: Only contact businesses via WhatsApp

**Step 1**: Start WhatsApp server
```bash
npm run whatsapp
```

**Step 2**: Run lead generation
```bash
npm start
```

The system will automatically:
1. Check each phone number on WhatsApp
2. Send messages only to WhatsApp users
3. Skip email sending

## Scenario 5: Email-Only Campaign

**Goal**: Only send emails (no WhatsApp)

**Modify the runner** or create a custom script:
```javascript
// In src/runner.js, comment out WhatsApp sections
// Focus only on businesses with email addresses
```

## Scenario 6: Geographic Focus

**Goal**: Target businesses in specific areas

**Edit** `src/config/keywords.js`:
```javascript
const locations = [
  'Karen', 'Westlands', 'Kilimani', 'Lavington' // Nairobi areas only
];
```

**Or use targeted search**:
```bash
node src/cli.js targeted \\
  --businesses "clinic" "pharmacy" "dentist" \\
  --locations "Karen" "Westlands" "Kilimani"
```

## Scenario 7: High-Value Business Focus

**Goal**: Target businesses likely to pay for websites

```bash
node src/cli.js targeted \\
  --businesses "law firm" "accounting firm" "real estate agent" "clinic" "dentist" \\
  --locations "Nairobi" "Mombasa" "Kisumu"
```

## Scenario 8: Daily Lead Generation

**Goal**: Sustainable daily lead generation

**Create a cron job** (Linux/Mac):
```bash
# Edit crontab
crontab -e

# Add line to run every day at 9 AM
0 9 * * * cd /path/to/kidanga_agent && npm start --limit=20
```

**Or use a script**:
```bash
#!/bin/bash
cd /home/wellington/Hobby/kidanga_agent
node src/cli.js run --limit 20
```

## Scenario 9: A/B Testing Messages

**Goal**: Test different message approaches

**Step 1**: Generate multiple message versions
```javascript
// In your custom script
const variations = await openaiService.generateMessageVariations(business, 'whatsapp', 3);
// Test different variations with different business segments
```

**Step 2**: Track performance in Google Sheets

## Scenario 10: Follow-up Campaigns

**Goal**: Re-contact businesses after initial outreach

**Step 1**: Export previous leads
```bash
# CSV file is automatically created at ./leads.csv
# Filter for businesses that didn't respond
```

**Step 2**: Create follow-up messages
- Different tone/approach
- New value proposition
- Limited-time offers

## Scenario 11: Multi-Channel Campaigns

**Goal**: Contact via both WhatsApp and Email

```bash
# Standard run contacts via both channels automatically
npm start
```

**The system will**:
1. Send WhatsApp if number is available
2. Send email if email is available  
3. Send both if both are available
4. Log all contact attempts

## Scenario 12: Niche Market Focus

**Goal**: Target very specific business types

```javascript
// Custom business types in keywords.js
const nicheBusinesses = [
  'solar installer', 'swimming pool maintenance', 'event photography',
  'wedding videography', 'interior designer', 'landscaper'
];
```

## Scenario 13: Monitoring and Analytics

**Goal**: Track campaign performance

```bash
# Check status of all services
npm run status

# View lead statistics
node -e "
const LeadLogger = require('./src/services/leadLogger');
const logger = new LeadLogger();
logger.getLeadStats().then(console.log);
"
```

**Google Sheets Dashboard**:
- Total leads by date
- Response rates by business type
- Geographic performance
- Message success rates

## Scenario 14: Bulk WhatsApp Testing

**Goal**: Test WhatsApp functionality separately

```bash
# Start WhatsApp server
npm run whatsapp

# Test with curl
curl -X POST http://localhost:3001/check \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "254790147060"}'

curl -X POST http://localhost:3001/send \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "254790147060", "message": "Test message from Kidanga!"}'
```

## Scenario 15: Error Recovery

**Goal**: Handle and recover from errors

```bash
# Check logs for errors
tail -f logs/$(date +%Y-%m-%d).log

# Restart with error recovery
npm start --limit 10
```

**Common Issues**:
- API quota exceeded → Wait or upgrade plan
- WhatsApp disconnected → Scan QR code again
- Email failures → Check SendGrid status

## Performance Expectations

### Small Test (5 searches)
- Runtime: 2-5 minutes
- Businesses found: 10-50
- Messages sent: 5-20

### Medium Run (20 searches)
- Runtime: 10-20 minutes
- Businesses found: 50-200
- Messages sent: 20-80

### Full Run (100+ searches)
- Runtime: 1-3 hours
- Businesses found: 500-2000
- Messages sent: 100-500

## Tips for Success

1. **Start Small**: Always test with limited searches first
2. **Monitor Quotas**: Keep track of API usage
3. **Personalize**: Customize messages for better response rates
4. **Time Appropriately**: Run during business hours
5. **Follow Up**: Use logged data for follow-up campaigns
6. **Respect Limits**: Don't spam the same businesses
7. **Track Results**: Monitor which approaches work best
