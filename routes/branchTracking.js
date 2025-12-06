const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');

// Get all branches with their lead statistics for company
router.get('/company-overview', auth, async (req, res) => {
  try {
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    console.log('📊 Fetching branch overview for company:', companyId);

    // Get all branches for this company
    const branches = await Branch.find({ 
      company: companyId,
      isActive: true 
    }).select('name address city phone email branchCode');
    
    console.log(`📊 Found ${branches.length} branches for company ${companyId}`);

    // Get lead statistics for each branch
    const branchStats = await Promise.all(
      branches.map(async (branch) => {
        console.log(`🔍 Checking leads for branch: ${branch.name} (${branch._id})`);
        
        // Company-assigned leads (have assignedBranch field set by company)
        const companyAssignedLeads = await Lead.countDocuments({
          assignedBranch: branch._id,
          company: companyId
        });
        
        // Branch-added leads (created by this branch)
        const branchAddedLeads = await Lead.countDocuments({
          createdByBranch: branch._id,
          company: companyId
        });
        
        // Total leads (both types)
        const totalLeads = companyAssignedLeads + branchAddedLeads;
        
        console.log(`📊 Branch ${branch.name}: ${totalLeads} total (${companyAssignedLeads} assigned, ${branchAddedLeads} self-added)`);

        // Company-assigned leads status breakdown
        const companyAssignedStatus = await Lead.aggregate([
          {
            $match: {
              assignedBranch: branch._id,
              company: companyId
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);
        
        // Branch-added leads status breakdown
        const branchAddedStatus = await Lead.aggregate([
          {
            $match: {
              createdByBranch: branch._id,
              company: companyId
            }
          },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        // Recent leads (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentLeads = await Lead.countDocuments({
          assignedBranch: branch._id,
          company: companyId,
          createdAt: { $gte: sevenDaysAgo }
        });

        // Leads by priority
        const priorityBreakdown = await Lead.aggregate([
          {
            $match: {
              assignedBranch: branch._id,
              company: companyId
            }
          },
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 }
            }
          }
        ]);

        // Convert to object format
        const companyAssignedStatusObj = {};
        companyAssignedStatus.forEach(item => {
          companyAssignedStatusObj[item._id || 'unknown'] = item.count;
        });
        
        const branchAddedStatusObj = {};
        branchAddedStatus.forEach(item => {
          branchAddedStatusObj[item._id || 'unknown'] = item.count;
        });

        const priorityObj = {};
        priorityBreakdown.forEach(item => {
          priorityObj[item._id || 'unknown'] = item.count;
        });

        return {
          branch: {
            _id: branch._id,
            name: branch.name,
            address: branch.address,
            city: branch.city,
            phone: branch.phone,
            email: branch.email,
            branchCode: branch.branchCode
          },
          stats: {
            totalLeads,
            recentLeads,
            companyAssigned: {
              count: companyAssignedLeads,
              statusBreakdown: companyAssignedStatusObj
            },
            branchAdded: {
              count: branchAddedLeads,
              statusBreakdown: branchAddedStatusObj
            },
            priorityBreakdown: priorityObj
          }
        };
      })
    );

    // Overall company statistics
    const totalCompanyLeads = await Lead.countDocuments({ company: companyId });
    const assignedLeads = await Lead.countDocuments({ 
      company: companyId,
      assignedBranch: { $ne: null }
    });
    const unassignedLeads = totalCompanyLeads - assignedLeads;

    res.json({
      success: true,
      data: {
        branches: branchStats,
        summary: {
          totalBranches: branches.length,
          totalLeads: totalCompanyLeads,
          assignedLeads,
          unassignedLeads
        }
      }
    });

  } catch (error) {
    console.error('Error fetching branch overview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch branch overview' 
    });
  }
});

// Get detailed leads for a specific branch (for company to view)
router.get('/branch/:branchId/leads', auth, async (req, res) => {
  try {
    const { branchId } = req.params;
    const companyId = req.company?.id || req.user?.companyId;

    console.log('🔍 Branch tracking leads request:', {
      branchId,
      companyId,
      companyFromReq: req.company?.id,
      userCompanyId: req.user?.companyId
    });

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    // Verify branch belongs to this company
    const branch = await Branch.findOne({
      _id: branchId,
      company: companyId
    });

    if (!branch) {
      console.log('❌ Branch not found:', branchId);
      return res.status(404).json({ error: 'Branch not found' });
    }

    console.log('✅ Branch found:', branch.name);

    // Get all leads for this branch (both assigned and self-added)
    const mongoose = require('mongoose');
    const branchObjectId = new mongoose.Types.ObjectId(branchId);
    const companyObjectId = new mongoose.Types.ObjectId(companyId);
    
    console.log('🔍 Searching for leads with:', {
      assignedBranch: branchObjectId.toString(),
      createdByBranch: branchObjectId.toString(),
      company: companyObjectId.toString()
    });
    
    // Get both company-assigned and branch-added leads
    const leads = await Lead.find({
      $or: [
        { assignedBranch: branchObjectId, company: companyObjectId },
        { createdByBranch: branchObjectId, company: companyObjectId }
      ]
    })
    .populate('assignedEmployee', 'teamMemberName email')
    .populate('createdBy', 'teamMemberName email')
    .sort({ createdAt: -1 });

    console.log(`✅ Found ${leads.length} leads for branch tracking (assigned + self-added)`);
    
    if (leads.length > 0) {
      console.log('📋 First lead sample:', {
        id: leads[0]._id,
        customerName: leads[0].customerName,
        assignedBranch: leads[0].assignedBranch,
        company: leads[0].company
      });
    }

    res.json({
      success: true,
      data: {
        branch: {
          _id: branch._id,
          name: branch.name,
          city: branch.city
        },
        leads
      }
    });

  } catch (error) {
    console.error('Error fetching branch leads:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch branch leads' 
    });
  }
});

// Debug endpoint - check recent branch leads
router.get('/debug/recent-branch-leads', async (req, res) => {
  try {
    const recentLeads = await Lead.find({ 
      assignedBranch: { $ne: null } 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name customerName assignedBranch company companyId createdAt');

    res.json({
      success: true,
      count: recentLeads.length,
      leads: recentLeads
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get branch performance metrics
router.get('/branch/:branchId/performance', auth, async (req, res) => {
  try {
    const { branchId } = req.params;
    const companyId = req.company?.id || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    // Verify branch belongs to this company
    const branch = await Branch.findOne({
      _id: branchId,
      company: companyId
    });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Get performance metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Leads created in last 30 days
    const leadsThisMonth = await Lead.countDocuments({
      assignedBranch: branchId,
      company: companyId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Conversion rate (closed won / total)
    const totalLeads = await Lead.countDocuments({
      assignedBranch: branchId,
      company: companyId
    });

    const closedWonLeads = await Lead.countDocuments({
      assignedBranch: branchId,
      company: companyId,
      status: 'closed_won'
    });

    const conversionRate = totalLeads > 0 ? ((closedWonLeads / totalLeads) * 100).toFixed(2) : 0;

    // Average response time (time from lead creation to first contact)
    const leadsWithContact = await Lead.find({
      assignedBranch: branchId,
      company: companyId,
      lastContact: { $exists: true }
    }).select('createdAt lastContact');

    let avgResponseTime = 0;
    if (leadsWithContact.length > 0) {
      const totalResponseTime = leadsWithContact.reduce((sum, lead) => {
        const responseTime = new Date(lead.lastContact) - new Date(lead.createdAt);
        return sum + responseTime;
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / leadsWithContact.length / (1000 * 60 * 60)); // in hours
    }

    res.json({
      success: true,
      data: {
        branch: {
          _id: branch._id,
          name: branch.name
        },
        performance: {
          leadsThisMonth,
          totalLeads,
          closedWonLeads,
          conversionRate: parseFloat(conversionRate),
          avgResponseTimeHours: avgResponseTime
        }
      }
    });

  } catch (error) {
    console.error('Error fetching branch performance:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch branch performance' 
    });
  }
});

// Get branch's own dashboard stats (for branch login)
router.get('/branch-dashboard', auth, async (req, res) => {
  try {
    const branchId = req.branch?.id || req.user?.branchId;
    const companyId = req.company?.id || req.user?.companyId;

    if (!branchId) {
      return res.status(400).json({ error: 'Branch ID required' });
    }

    console.log('📊 Fetching branch dashboard for:', branchId);

    // Company-assigned leads (assigned to this branch by company)
    const companyAssignedLeads = await Lead.find({
      assignedBranch: branchId,
      company: companyId
    }).select('customerName email phone status priority createdAt assignedAt');

    // Branch-added leads (created by this branch)
    const branchAddedLeads = await Lead.find({
      createdByBranch: branchId,
      company: companyId
    }).select('customerName email phone status priority createdAt');

    // Stats for company-assigned leads
    const companyAssignedStats = {
      total: companyAssignedLeads.length,
      byStatus: {},
      byPriority: {}
    };

    companyAssignedLeads.forEach(lead => {
      const status = lead.status || 'unknown';
      const priority = lead.priority || 'medium';
      companyAssignedStats.byStatus[status] = (companyAssignedStats.byStatus[status] || 0) + 1;
      companyAssignedStats.byPriority[priority] = (companyAssignedStats.byPriority[priority] || 0) + 1;
    });

    // Stats for branch-added leads
    const branchAddedStats = {
      total: branchAddedLeads.length,
      byStatus: {},
      byPriority: {}
    };

    branchAddedLeads.forEach(lead => {
      const status = lead.status || 'unknown';
      const priority = lead.priority || 'medium';
      branchAddedStats.byStatus[status] = (branchAddedStats.byStatus[status] || 0) + 1;
      branchAddedStats.byPriority[priority] = (branchAddedStats.byPriority[priority] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        companyAssigned: {
          stats: companyAssignedStats,
          leads: companyAssignedLeads
        },
        branchAdded: {
          stats: branchAddedStats,
          leads: branchAddedLeads
        },
        summary: {
          totalLeads: companyAssignedLeads.length + branchAddedLeads.length,
          companyAssignedCount: companyAssignedLeads.length,
          branchAddedCount: branchAddedLeads.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching branch dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch branch dashboard' });
  }
});

module.exports = router;
