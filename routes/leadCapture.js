const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const leadCaptureController = require('../controllers/leadCaptureController');

// Middleware to verify webhook secret (for Instagram)
const verifyWebhookSecret = (req, res, next) => {
  // Implement your webhook verification logic here
  // For Instagram, you would verify the X-Hub-Signature header
  next();
};

// Capture lead from any source (Public endpoint)
router.post('/capture', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('source').optional().trim(),
  body('sourceDetails').optional().trim(),
  body('platformData').optional(),
  body('metadata').optional()
], leadCaptureController.captureLead);

// Instagram webhook endpoint
router.post('/webhook/instagram', verifyWebhookSecret, leadCaptureController.instagramWebhook);

// Website form submission endpoint (Public endpoint)
router.post('/webhook/website', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('source').optional().trim(),
  body('sourceDetails').optional().trim(),
  body('formData').optional(),
  body('pageUrl').optional().trim()
], leadCaptureController.websiteFormWebhook);

module.exports = router;
