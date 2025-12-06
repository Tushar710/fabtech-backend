const express = require('express');
const axios = require('axios');
const router = express.Router();

// WhatsApp API configuration
const WHATSAPP_API_URL = 'https://webhook.whatapi.in/webhook/68c92f20bde42bbd9075014f';

/**
 * Send welcome message to new lead
 * @param {string} phoneNumber - 10 digit phone number
 * @param {string} message - Welcome message to send
 */
const sendWelcomeMessage = async (phoneNumber, message = 'Welcome! Thank you for your interest. Our team will contact you soon.') => {
  try {
    // Validate phone number (should be 10 digits)
    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
      console.log('❌ Invalid phone number:', phoneNumber);
      return { success: false, error: 'Invalid phone number format' };
    }

    // Prepare API URL with parameters
    const apiUrl = `${WHATSAPP_API_URL}?number=91${phoneNumber}&message=${encodeURIComponent(message)}`;
    
    console.log('📱 Sending WhatsApp message to:', phoneNumber);
    console.log('📝 Message:', message);
    console.log('🔗 API URL:', apiUrl);

    // Send message via WhatsApp API
    const response = await axios.get(apiUrl, {
      timeout: 10000 // 10 seconds timeout
    });

    console.log('✅ WhatsApp message sent successfully');
    console.log('📊 Response:', response.data);

    return {
      success: true,
      data: response.data,
      message: 'WhatsApp message sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to send WhatsApp message'
    };
  }
};

// API endpoint to manually send welcome message
router.post('/send-welcome', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    const result = await sendWelcomeMessage(phoneNumber, message);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Error in send-welcome endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'WhatsApp Simple API is working',
    endpoints: [
      'POST /api/whatsapp-simple/send-welcome - Send welcome message to phone number'
    ]
  });
});

module.exports = router;
module.exports.sendWelcomeMessage = sendWelcomeMessage;
