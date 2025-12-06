const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const ProjectMgnt = require('../models/ProjectMgnt'); // Assuming you have this model
const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const { validationResult, body } = require('express-validator');

// Get project with complete sales team and leads data
router.get('/:id/sales-data', async (req, res) => {
  try {
    const { id } = req.params;

    // Get project with populated team members
    const project = await ProjectMgnt.findById(id)
      .populate({
        path: 'teamMembers',
        select: 'name email role department phone permissions isActive',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate('company', 'businessName businessEmail');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get sales team members (sales_rep, sales_manager)
    const salesTeam = await Employee.find({
      role: { $in: ['sales_rep', 'sales_manager'] },
      isActive: true,
      // Optionally filter by company if needed
      // userId: project.company
    }).populate('department', 'name');

    // Get leads assigned to project team members
    const teamMemberIds = project.teamMembers.map(member => member._id);
    
    const assignedLeads = await Lead.find({
      assignedTo: { $in: teamMemberIds }
    }).populate('assignedTo', 'name email role')
      .populate('workflow', 'name')
      .populate('customer', 'name email phone company')
      .sort({ assignmentDate: -1 });

    // Get leads statistics for each team member
    const leadsStats = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $in: teamMemberIds }
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
          wonLeads: { $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] } },
          totalValue: { $sum: '$amount' },
          avgValue: { $avg: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          employeeId: '$_id',
          employeeName: '$employee.name',
          employeeEmail: '$employee.email',
          employeeRole: '$employee.role',
          totalLeads: 1,
          newLeads: 1,
          contactedLeads: 1,
          qualifiedLeads: 1,
          wonLeads: 1,
          totalValue: 1,
          avgValue: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $multiply: [{ $divide: ['$wonLeads', '$totalLeads'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    // Get recent lead activities for project team
    const recentActivities = await Lead.find({
      assignedTo: { $in: teamMemberIds },
      lastContact: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).populate('assignedTo', 'name')
      .select('name status lastContact assignmentDate')
      .sort({ lastContact: -1 })
      .limit(10);

    // Compile response data
    const responseData = {
      project: project,
      salesTeam: salesTeam,
      assignedLeads: assignedLeads,
      leadsStatistics: leadsStats,
      recentActivities: recentActivities,
      summary: {
        totalTeamMembers: project.teamMembers.length,
        totalSalesTeam: salesTeam.length,
        totalAssignedLeads: assignedLeads.length,
        totalLeadValue: assignedLeads.reduce((sum, lead) => sum + (lead.amount || 0), 0),
        activeLeads: assignedLeads.filter(lead => 
          ['new', 'contacted', 'qualified', 'proposal', 'negotiation'].includes(lead.status)
        ).length,
        wonLeads: assignedLeads.filter(lead => lead.status === 'closed_won').length
      }
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching project sales data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project sales data'
    });
  }
});

// Get all projects with sales performance summary
router.get('/sales-performance', async (req, res) => {
  try {
    const projects = await ProjectMgnt.find({})
      .populate('teamMembers', 'name email role')
      .populate('company', 'businessName')
      .select('title status startDate dueDate budget progress teamMembers company');

    const projectsWithSalesData = await Promise.all(
      projects.map(async (project) => {
        const teamMemberIds = project.teamMembers.map(member => member._id);
        
        // Get leads count and value for this project's team
        const leadsData = await Lead.aggregate([
          {
            $match: {
              assignedTo: { $in: teamMemberIds }
            }
          },
          {
            $group: {
              _id: null,
              totalLeads: { $sum: 1 },
              totalValue: { $sum: '$amount' },
              wonLeads: { $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] } },
              wonValue: { 
                $sum: { 
                  $cond: [
                    { $eq: ['$status', 'closed_won'] }, 
                    '$amount', 
                    0
                  ] 
                } 
              }
            }
          }
        ]);

        const salesData = leadsData[0] || {
          totalLeads: 0,
          totalValue: 0,
          wonLeads: 0,
          wonValue: 0
        };

        return {
          ...project.toObject(),
          salesPerformance: {
            ...salesData,
            conversionRate: salesData.totalLeads > 0 
              ? ((salesData.wonLeads / salesData.totalLeads) * 100).toFixed(1)
              : 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: projectsWithSalesData
    });

  } catch (error) {
    console.error('Error fetching projects sales performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects sales performance'
    });
  }
});

// Assign leads to project team members
router.post('/:id/assign-leads', [
  body('leadIds').isArray().withMessage('Lead IDs must be an array'),
  body('teamMemberIds').isArray().withMessage('Team member IDs must be an array'),
  body('assignmentStrategy').optional().isIn(['round_robin', 'manual', 'equal_distribution'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { leadIds, teamMemberIds, assignmentStrategy = 'round_robin', manualAssignments } = req.body;

    // Verify project exists
    const project = await ProjectMgnt.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Verify team members belong to project
    const validTeamMembers = project.teamMembers.filter(memberId => 
      teamMemberIds.includes(memberId.toString())
    );

    if (validTeamMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid team members found for this project'
      });
    }

    let assignments = [];

    if (assignmentStrategy === 'manual' && manualAssignments) {
      // Manual assignment
      assignments = manualAssignments;
    } else if (assignmentStrategy === 'round_robin') {
      // Round robin assignment
      leadIds.forEach((leadId, index) => {
        const assignedTo = validTeamMembers[index % validTeamMembers.length];
        assignments.push({ leadId, assignedTo });
      });
    } else if (assignmentStrategy === 'equal_distribution') {
      // Equal distribution
      const leadsPerMember = Math.ceil(leadIds.length / validTeamMembers.length);
      leadIds.forEach((leadId, index) => {
        const memberIndex = Math.floor(index / leadsPerMember);
        const assignedTo = validTeamMembers[memberIndex] || validTeamMembers[validTeamMembers.length - 1];
        assignments.push({ leadId, assignedTo });
      });
    }

    // Execute assignments
    const assignmentResults = await Promise.all(
      assignments.map(async ({ leadId, assignedTo }) => {
        try {
          const updatedLead = await Lead.findByIdAndUpdate(
            leadId,
            {
              assignedTo: assignedTo,
              assignmentDate: new Date(),
              assignmentNotes: `Assigned via project: ${project.title}`,
              lastContact: new Date(),
              $push: {
                followUps: {
                  type: 'assignment',
                  summary: `Lead assigned to project team member`,
                  notes: `Assigned via project: ${project.title}`,
                  date: new Date(),
                  completed: false,
                  assignedBy: req.user?.id || 'system'
                }
              }
            },
            { new: true }
          ).populate('assignedTo', 'name email role');

          return {
            leadId,
            assignedTo,
            success: true,
            lead: updatedLead
          };
        } catch (error) {
          return {
            leadId,
            assignedTo,
            success: false,
            error: error.message
          };
        }
      })
    );

    const successfulAssignments = assignmentResults.filter(result => result.success);
    const failedAssignments = assignmentResults.filter(result => !result.success);

    res.json({
      success: true,
      message: `${successfulAssignments.length} leads assigned successfully`,
      data: {
        successful: successfulAssignments.length,
        failed: failedAssignments.length,
        assignments: assignmentResults
      }
    });

  } catch (error) {
    console.error('Error assigning leads to project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign leads to project'
    });
  }
});

// Get project team performance analytics
router.get('/:id/team-analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const project = await ProjectMgnt.findById(id).populate('teamMembers', 'name email role');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const teamMemberIds = project.teamMembers.map(member => member._id);
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        assignmentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get detailed analytics for each team member
    const teamAnalytics = await Lead.aggregate([
      {
        $match: {
          assignedTo: { $in: teamMemberIds },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          totalLeads: { $sum: 1 },
          newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
          contactedLeads: { $sum: { $cond: [{ $eq: ['$status', 'contacted'] }, 1, 0] } },
          qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
          proposalLeads: { $sum: { $cond: [{ $eq: ['$status', 'proposal'] }, 1, 0] } },
          negotiationLeads: { $sum: { $cond: [{ $eq: ['$status', 'negotiation'] }, 1, 0] } },
          wonLeads: { $sum: { $cond: [{ $eq: ['$status', 'closed_won'] }, 1, 0] } },
          lostLeads: { $sum: { $cond: [{ $eq: ['$status', 'closed_lost'] }, 1, 0] } },
          totalValue: { $sum: '$amount' },
          wonValue: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'closed_won'] }, '$amount', 0] 
            } 
          },
          avgLeadValue: { $avg: '$amount' },
          followUpsCount: { $sum: { $size: { $ifNull: ['$followUps', []] } } }
        }
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      {
        $unwind: '$employee'
      },
      {
        $project: {
          employeeId: '$_id',
          employeeName: '$employee.name',
          employeeEmail: '$employee.email',
          employeeRole: '$employee.role',
          totalLeads: 1,
          newLeads: 1,
          contactedLeads: 1,
          qualifiedLeads: 1,
          proposalLeads: 1,
          negotiationLeads: 1,
          wonLeads: 1,
          lostLeads: 1,
          totalValue: 1,
          wonValue: 1,
          avgLeadValue: 1,
          followUpsCount: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $multiply: [{ $divide: ['$wonLeads', '$totalLeads'] }, 100] },
              0
            ]
          },
          winRate: {
            $cond: [
              { $gt: [{ $add: ['$wonLeads', '$lostLeads'] }, 0] },
              { $multiply: [{ $divide: ['$wonLeads', { $add: ['$wonLeads', '$lostLeads'] }] }, 100] },
              0
            ]
          }
        }
      },
      {
        $sort: { wonValue: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        project: project,
        teamAnalytics: teamAnalytics,
        summary: {
          totalTeamMembers: teamAnalytics.length,
          totalLeads: teamAnalytics.reduce((sum, member) => sum + member.totalLeads, 0),
          totalWonLeads: teamAnalytics.reduce((sum, member) => sum + member.wonLeads, 0),
          totalWonValue: teamAnalytics.reduce((sum, member) => sum + member.wonValue, 0),
          avgConversionRate: teamAnalytics.length > 0 
            ? (teamAnalytics.reduce((sum, member) => sum + member.conversionRate, 0) / teamAnalytics.length).toFixed(1)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching team analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team analytics'
    });
  }
});

module.exports = router;
