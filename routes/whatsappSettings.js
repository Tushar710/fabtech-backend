const express = require('express');
const router = express.Router();

// In-memory storage for WhatsApp settings (you can replace with database later)
let whatsappSettings = {
  welcomeMessageEnabled: true,
  welcomeMessage: 'नमस्ते {name}! आपकी inquiry के लिए धन्यवाद। हमारी team जल्दी ही आपसे संपर्क करेगी। 🙏',
  updatedAt: new Date().toISOString()
};

// GET /api/whatsapp-settings - Get current WhatsApp settings
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: whatsappSettings
    });
  } catch (error) {
    console.error('Error fetching WhatsApp settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WhatsApp settings',
      error: error.message
    });
  }
});

// POST /api/whatsapp-settings - Update WhatsApp settings
router.post('/', (req, res) => {
  try {
    const { welcomeMessageEnabled, welcomeMessage } = req.body;

    // Validate input
    if (typeof welcomeMessageEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'welcomeMessageEnabled must be a boolean'
      });
    }

    if (!welcomeMessage || typeof welcomeMessage !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'welcomeMessage is required and must be a string'
      });
    }

    // Update settings
    whatsappSettings = {
      welcomeMessageEnabled,
      welcomeMessage: welcomeMessage.trim(),
      updatedAt: new Date().toISOString()
    };

    console.log('📱 WhatsApp settings updated:', whatsappSettings);

    res.json({
      success: true,
      message: 'WhatsApp settings updated successfully',
      data: whatsappSettings
    });
  } catch (error) {
    console.error('Error updating WhatsApp settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update WhatsApp settings',
      error: error.message
    });
  }
});

// GET /api/whatsapp-settings/status - Get only the enabled status
router.get('/status', (req, res) => {
  try {
    res.json({
      success: true,
      enabled: whatsappSettings.welcomeMessageEnabled,
      updatedAt: whatsappSettings.updatedAt
    });
  } catch (error) {
    console.error('Error fetching WhatsApp status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch WhatsApp status',
      error: error.message
    });
  }
});

// Function to get current settings (for use in other routes)
const getCurrentSettings = () => {
  return whatsappSettings;
};

module.exports = router;
module.exports.getCurrentSettings = getCurrentSettings;
