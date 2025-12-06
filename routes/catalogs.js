const express = require('express');
const router = express.Router();
const Catalog = require('../models/Catalog');
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');

// Get all catalogs
router.get('/', auth, async (req, res) => {
  try {
    const { category, targetAudience, isActive, search } = req.query;
    let query = { companyId: req.user.companyId };

    // Add filters
    if (category) query.category = category;
    if (targetAudience) query.targetAudience = targetAudience;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const catalogs = await Catalog.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: catalogs,
      count: catalogs.length
    });
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalogs',
      error: error.message
    });
  }
});

// Get catalog by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const catalog = await Catalog.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    }).populate('createdBy', 'name email');

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }

    res.json({
      success: true,
      data: catalog
    });
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalog',
      error: error.message
    });
  }
});

// Create new catalog
router.post('/', auth, async (req, res) => {
  try {
    const catalogData = {
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id
    };

    const catalog = new Catalog(catalogData);
    await catalog.save();

    await catalog.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Catalog created successfully',
      data: catalog
    });
  } catch (error) {
    console.error('Error creating catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create catalog',
      error: error.message
    });
  }
});

// Update catalog
router.put('/:id', auth, async (req, res) => {
  try {
    const catalog = await Catalog.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }

    res.json({
      success: true,
      message: 'Catalog updated successfully',
      data: catalog
    });
  } catch (error) {
    console.error('Error updating catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update catalog',
      error: error.message
    });
  }
});

// Delete catalog
router.delete('/:id', auth, async (req, res) => {
  try {
    const catalog = await Catalog.findOneAndDelete({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }

    res.json({
      success: true,
      message: 'Catalog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting catalog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete catalog',
      error: error.message
    });
  }
});

// Send catalog to lead
router.post('/:id/send-to-lead', auth, async (req, res) => {
  try {
    const { leadId, method = 'Email' } = req.body;

    // Verify lead exists and belongs to company
    const lead = await Lead.findOne({
      _id: leadId,
      companyId: req.user.companyId
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Find and update catalog
    const catalog = await Catalog.findOneAndUpdate(
      { _id: req.params.id, companyId: req.user.companyId },
      {
        $push: {
          sentToLeads: {
            leadId: leadId,
            sentBy: req.user.id,
            method: method,
            sentAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }

    // Here you can add email/WhatsApp sending logic
    // For now, we'll just track that it was sent

    res.json({
      success: true,
      message: `Catalog sent to ${lead.name || lead.customerName} via ${method}`,
      data: {
        catalog: catalog.name,
        lead: lead.name || lead.customerName,
        method: method,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error sending catalog to lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send catalog to lead',
      error: error.message
    });
  }
});

// Get catalog send history
router.get('/:id/send-history', auth, async (req, res) => {
  try {
    const catalog = await Catalog.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    })
    .populate('sentToLeads.leadId', 'name customerName email phone')
    .populate('sentToLeads.sentBy', 'name email');

    if (!catalog) {
      return res.status(404).json({
        success: false,
        message: 'Catalog not found'
      });
    }

    res.json({
      success: true,
      data: catalog.sentToLeads
    });
  } catch (error) {
    console.error('Error fetching catalog send history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch send history',
      error: error.message
    });
  }
});

// Get catalogs sent to a specific lead
router.get('/lead/:leadId', auth, async (req, res) => {
  try {
    const catalogs = await Catalog.find({
      companyId: req.user.companyId,
      'sentToLeads.leadId': req.params.leadId
    })
    .populate('createdBy', 'name email')
    .select('name description category sentToLeads createdAt');

    // Filter sentToLeads to only include entries for this lead
    const filteredCatalogs = catalogs.map(catalog => {
      const catalogObj = catalog.toObject();
      catalogObj.sentToLeads = catalogObj.sentToLeads.filter(
        sent => sent.leadId.toString() === req.params.leadId
      );
      return catalogObj;
    });

    res.json({
      success: true,
      data: filteredCatalogs
    });
  } catch (error) {
    console.error('Error fetching catalogs for lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalogs for lead',
      error: error.message
    });
  }
});

module.exports = router;
