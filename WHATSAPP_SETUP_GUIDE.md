# WhatsApp API Setup Guide

## Required Environment Variables

Add these to your `.env` file:

```env
# WhatsApp API Configuration
WHATSAPP_API_URL=https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json
WHATSAPP_ACCOUNT_SID=your_twilio_account_sid
WHATSAPP_AUTH_TOKEN=your_twilio_auth_token
WHATSAPP_PHONE_NUMBER=whatsapp:+14155238886
WHATSAPP_WEBHOOK_URL=https://yourdomain.com/webhook/whatsapp

# Alternative: 360Dialog
# WHATSAPP_API_URL=https://waba.360dialog.io/v1/messages
# WHATSAPP_API_KEY=your_360dialog_api_key
# WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

## Step-by-Step Setup Process

### 1. Choose Your Provider

#### Option A: Twilio (Recommended for beginners)
- Sign up at: https://www.twilio.com/
- Cost: $0.005 per message
- Easy setup
- Good documentation

#### Option B: 360Dialog
- Sign up at: https://www.360dialog.com/
- More affordable for high volume
- Direct WhatsApp Business API

### 2. Get Your Credentials

#### For Twilio:
1. Create account on Twilio
2. Get Account SID and Auth Token
3. Buy a WhatsApp-enabled phone number
4. Verify your business

#### For 360Dialog:
1. Create account
2. Complete business verification
3. Get API key and Phone Number ID

### 3. Message Template Approval

WhatsApp requires pre-approved templates for business messages:

```
Template Categories:
- UTILITY: Order confirmations, receipts
- MARKETING: Promotional messages  
- AUTHENTICATION: OTP, verification codes
```

Example template:
```
Hello {{1}}, 
Thank you for your inquiry about {{2}}. 
Our team will contact you within 24 hours.
Best regards,
{{3}}
```

### 4. Webhook Setup

For receiving message status updates:
```
Webhook URL: https://yourdomain.com/webhook/whatsapp
Events: message_status, message_received
```

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install twilio
# OR for 360Dialog
npm install axios
```

### Step 2: Update Environment Variables
Add the credentials to your `.env` file

### Step 3: Implement WhatsApp Service
The service file will be created automatically

### Step 4: Test Integration
Send test messages to verify setup

## Costs Estimation

### Twilio Pricing:
- WhatsApp messages: $0.005 per message
- Phone number: $1/month
- Setup: Free

### 360Dialog Pricing:
- WhatsApp messages: $0.004 per message
- Setup fee: €50 one-time
- Monthly fee: €10

## Legal Requirements

1. **Business Verification**: WhatsApp requires business verification
2. **Opt-in Consent**: Users must opt-in to receive messages
3. **24-hour Window**: Can only send promotional messages within 24 hours of user interaction
4. **Template Compliance**: All business messages must use approved templates

## Next Steps

1. Choose your provider (Twilio recommended for start)
2. Create account and get credentials
3. Add credentials to .env file
4. I'll implement the integration code
5. Test with your phone number
6. Apply for message template approval
7. Go live!

## Support

If you need help with any step, let me know:
- Account creation
- Credential setup
- Code implementation
- Template approval
- Testing
