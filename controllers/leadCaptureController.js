const Lead = require('../models/Lead');
const { validationResult } = require('express-validator');
const LeadLifecycleMessaging = require('../services/leadLifecycleMessaging');

/**
 * Capture a new lead from various sources (Instagram, website, etc.)
 */
exports.captureLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { 
      title,
      name, 
      email, 
      phone, 
      company,
      budget,
      notes,
      source = 'website', 
      sourceDetails, 
      platformData,
      metadata = {},
      // Extract any additional form fields as custom fields
      ...additionalFields
    } = req.body;

    // Extract custom fields (any field not in the standard lead fields)
    const standardFields = ['title', 'name', 'email', 'phone', 'company', 'budget', 'notes', 'source', 'sourceDetails', 'platformData', 'metadata'];
    const customFields = {};
    Object.keys(additionalFields).forEach(key => {
      if (!standardFields.includes(key) && additionalFields[key] !== undefined && additionalFields[key] !== '') {
        customFields[key] = additionalFields[key];
      }
    });

    // Allow duplicate emails and phone numbers - customers may submit multiple enquiries
    // This is normal business behavior and should not be blocked

    // Create new lead
    const newLead = new Lead({
      title: title || 'General Enquiry',
      name,
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      company: company || '',
      budget: budget || '',
      notes: notes || '',
      source,
      sourceDetails,
      status: 'new',
      priority: 'medium',
      autoCaptured: true,
      customFields, // Add custom fields to the lead
      captureSource: {
        platform: source,
        pageUrl: metadata.pageUrl || '',
        formData: { ...platformData, ...customFields }, // Include custom fields in formData too
        timestamp: new Date()
      },
      userId: req.user?.id || '507f1f77bcf86cd799439011', // Default user ID for auto-captured leads
      followUps: [{
        type: 'message',
        summary: `New lead from ${source}`,
        notes: `Auto-captured from ${source}: ${sourceDetails || 'No additional details'}`,
        date: new Date(),
        completed: false
      }]
    });

    await newLead.save();

    // Send welcome message automatically
    await LeadLifecycleMessaging.sendWelcomeMessage(newLead._id);

    res.status(201).json({
      success: true,
      message: 'Lead captured successfully',
      lead: newLead,
      isNew: true
    });

  } catch (error) {
    console.error('Error capturing lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error capturing lead',
      error: error.message
    });
  }
};

/**
 * Webhook handler for Instagram lead generation
 */
exports.instagramWebhook = async (req, res) => {
  try {
    // Verify webhook signature (implement your verification logic here)
    const signature = req.headers['x-hub-signature-256'];
    // Add signature verification logic here

    const { entry } = req.body;
    
    if (!entry || !Array.isArray(entry)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload'
      });
    }

    // Process each entry in the webhook
    for (const webhookEvent of entry) {
      if (webhookEvent.changes) {
        for (const change of webhookEvent.changes) {
          if (change.field === 'leadgen') {
            // Extract lead data from Instagram leadgen webhook
            const leadData = change.value;
            
            // Map Instagram lead data to our lead model
            const leadInfo = {
              name: leadData.full_name || `${leadData.first_name} ${leadData.last_name || ''}`.trim(),
              email: leadData.email,
              phone: leadData.phone_number,
              source: 'instagram',
              sourceDetails: `Instagram Lead Ad: ${leadData.ad_name || 'N/A'}`,
              platformData: leadData,
              metadata: {
                adId: leadData.ad_id,
                formId: leadData.form_id,
                pageUrl: leadData.adset_id ? `https://www.facebook.com/ads/manager/lead_gen/adset/${leadData.adset_id}` : ''
              }
            };

            // Call captureLead with the mapped data
            req.body = leadInfo;
            return await exports.captureLead(req, res);
          }
        }
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing Instagram webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

/**
 * Webhook for website form submissions
 */
exports.websiteFormWebhook = async (req, res) => {
  try {
    const { 
      title,
      name, 
      email, 
      phone, 
      company,
      budget,
      notes,
      source = 'website',
      sourceDetails = 'Website contact form',
      formData = {},
      pageUrl = req.headers.referer || '',
      // Extract any additional form fields
      ...additionalFields
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Call captureLead with form data (including all additional fields)
    req.body = {
      title,
      name,
      email,
      phone,
      company,
      budget,
      notes,
      source,
      sourceDetails,
      platformData: formData,
      metadata: {
        pageUrl,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      },
      // Pass through all additional fields so they get saved as customFields
      ...additionalFields
    };

    return await exports.captureLead(req, res);
  } catch (error) {
    console.error('Error processing website form:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing form submission',
      error: error.message
    });
  }
};
