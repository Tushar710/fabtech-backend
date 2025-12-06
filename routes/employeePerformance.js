const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Get comprehensive employee performance analytics
router.get('/analytics', async (req, res) => {
  try {
    console.log('🔍 Fetching employee performance analytics...');
    
    // Extract company ID directly from JWT token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let companyId;
    
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      console.log('🔍 Decoded token in route:', decoded);
      
      if (decoded?.role === 'company') {
        companyId = decoded.id;
        console.log('✅ Company ID extracted from token:', companyId);
      }
    }
    
    console.log('🏢 Final company ID for filtering:', companyId);
    
    // If no company ID, return empty response immediately
    if (!companyId) {
      console.log('❌ No company ID found - returning empty response');
      return res.json({
        success: true,
        data: [],
        teamStatistics: {
          totalEmployees: 0,
          activeEmployees: 0,
          totalLeads: 0,
          totalConversions: 0,
          totalFollowUps: 0,
          totalRevenue: 0,
          averagePerformanceScore: "0.00"
        },
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Get employees filtered by company - handle both ObjectId and string formats
    const employeeFilter = { 
      $or: [
        { company: companyId },           // String format
        { company: new mongoose.Types.ObjectId(companyId) }  // ObjectId format
      ]
    };
    console.log('📋 Employee filter being used:', employeeFilter);
    
    const employees = await Employee.find(employeeFilter).lean();
    console.log('📊 Filtered employees found:', employees.length);
    
    // If no employees found for this company, return empty response
    if (employees.length === 0) {
      console.log('❌ No employees found for company:', companyId);
      return res.json({
        success: true,
        data: [],
        teamStatistics: {
          totalEmployees: 0,
          activeEmployees: 0,
          totalLeads: 0,
          totalConversions: 0,
          totalFollowUps: 0,
          totalRevenue: 0,
          averagePerformanceScore: "0.00"
        },
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log('✅ Found employees for company:', companyId, '- Count:', employees.length);
    
    // Manually populate company and department to handle invalid ObjectIds
    for (let employee of employees) {
      // Handle company population
      if (employee.company && mongoose.Types.ObjectId.isValid(employee.company)) {
        try {
          const Company = require('../models/Company');
          const company = await Company.findById(employee.company).lean();
          employee.company = company ? { name: company.name } : { name: 'Unknown Company' };
        } catch (err) {
          employee.company = { name: 'Unknown Company' };
        }
      } else {
        employee.company = { name: employee.company || 'Unknown Company' };
      }
      
      // Handle department population
      if (employee.department && mongoose.Types.ObjectId.isValid(employee.department)) {
        try {
          const Department = require('../models/Department');
          const department = await Department.findById(employee.department).lean();
          employee.department = department ? { name: department.name } : { name: 'Sales' };
        } catch (err) {
          employee.department = { name: 'Sales' };
        }
      } else {
        employee.department = { name: employee.department || 'Sales' };
      }
    }

    console.log(`📊 Found ${employees.length} employees`);

    const performanceData = [];

    for (const employee of employees) {
      const employeeId = employee._id.toString();
      
      // Get all leads assigned to this employee
      const assignedLeads = await Lead.find({ assignedTo: employeeId }).lean();
      
      // Calculate lead statistics
      const totalLeads = assignedLeads.length;
      const leadsByStatus = {
        new: assignedLeads.filter(lead => lead.status === 'new').length,
        contacted: assignedLeads.filter(lead => lead.status === 'contacted').length,
        qualified: assignedLeads.filter(lead => lead.status === 'qualified').length,
        proposal: assignedLeads.filter(lead => lead.status === 'proposal').length,
        negotiation: assignedLeads.filter(lead => lead.status === 'negotiation').length,
        closed_won: assignedLeads.filter(lead => lead.status === 'closed_won').length,
        closed_lost: assignedLeads.filter(lead => lead.status === 'closed_lost').length,
        on_hold: assignedLeads.filter(lead => lead.status === 'on_hold').length
      };

      // Calculate follow-up statistics
      let totalFollowUps = 0;
      let completedFollowUps = 0;
      let pendingFollowUps = 0;
      let overdueFollowUps = 0;

      assignedLeads.forEach(lead => {
        if (lead.followUps && Array.isArray(lead.followUps)) {
          totalFollowUps += lead.followUps.length;
          
          lead.followUps.forEach(followUp => {
            if (followUp.completed) {
              completedFollowUps++;
            } else {
              pendingFollowUps++;
              
              // Check if overdue
              if (followUp.nextFollowUpDate && new Date(followUp.nextFollowUpDate) < new Date()) {
                overdueFollowUps++;
              }
            }
          });
        }
      });

      // Calculate conversion metrics
      const convertedLeads = leadsByStatus.closed_won;
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : 0;
      
      // Calculate total lead value
      const totalLeadValue = assignedLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      const convertedValue = assignedLeads
        .filter(lead => lead.status === 'closed_won')
        .reduce((sum, lead) => sum + (lead.value || 0), 0);

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLeads = assignedLeads.filter(lead => 
        new Date(lead.assignedAt || lead.createdAt) >= thirtyDaysAgo
      ).length;

      const recentFollowUps = assignedLeads.reduce((count, lead) => {
        if (lead.followUps && Array.isArray(lead.followUps)) {
          return count + lead.followUps.filter(followUp => 
            new Date(followUp.date) >= thirtyDaysAgo
          ).length;
        }
        return count;
      }, 0);

      // Calculate performance score
      let performanceScore = 0;
      if (totalLeads > 0) {
        const followUpRate = totalFollowUps > 0 ? (completedFollowUps / totalFollowUps) * 100 : 0;
        const responseRate = pendingFollowUps > 0 ? ((pendingFollowUps - overdueFollowUps) / pendingFollowUps) * 100 : 100;
        
        performanceScore = (
          (parseFloat(conversionRate) * 0.4) + 
          (followUpRate * 0.3) + 
          (responseRate * 0.3)
        ).toFixed(2);
      }

      performanceData.push({
        employee: {
          _id: employee._id,
          name: employee.teamMemberName || employee.name || 'Unknown',
          email: employee.teamMemberEmail || employee.email || '',
          phone: employee.emergencyMobileNumber || employee.phone || employee.teamMemberMobile || '',
          role: employee.role || 'Sales Executive',
          company: employee.company?.name || 'Unknown Company',
          department: employee.department?.name || 'Sales',
          joinDate: employee.createdAt,
          isActive: employee.isActive !== false
        },
        workload: {
          totalLeads,
          activeLeads: totalLeads - leadsByStatus.closed_won - leadsByStatus.closed_lost,
          recentLeads,
          workloadPercentage: Math.min((totalLeads / 50) * 100, 100) // Assuming 50 leads is 100% workload
        },
        leadStatistics: {
          total: totalLeads,
          byStatus: leadsByStatus,
          totalValue: totalLeadValue,
          convertedValue,
          averageLeadValue: totalLeads > 0 ? (totalLeadValue / totalLeads).toFixed(2) : 0
        },
        followUpMetrics: {
          total: totalFollowUps,
          completed: completedFollowUps,
          pending: pendingFollowUps,
          overdue: overdueFollowUps,
          recent: recentFollowUps,
          completionRate: totalFollowUps > 0 ? ((completedFollowUps / totalFollowUps) * 100).toFixed(2) : 0
        },
        conversionMetrics: {
          convertedLeads,
          conversionRate: parseFloat(conversionRate),
          lostLeads: leadsByStatus.closed_lost,
          lossRate: totalLeads > 0 ? ((leadsByStatus.closed_lost / totalLeads) * 100).toFixed(2) : 0,
          pipelineLeads: leadsByStatus.qualified + leadsByStatus.proposal + leadsByStatus.negotiation
        },
        performance: {
          score: parseFloat(performanceScore),
          rating: performanceScore >= 80 ? 'Excellent' : 
                 performanceScore >= 60 ? 'Good' : 
                 performanceScore >= 40 ? 'Average' : 'Needs Improvement',
          lastActivity: assignedLeads.length > 0 ? 
            Math.max(...assignedLeads.map(lead => new Date(lead.lastContact || lead.updatedAt || lead.createdAt))) : null
        }
      });
    }

    // Sort by performance score
    performanceData.sort((a, b) => b.performance.score - a.performance.score);

    // Calculate team statistics
    const teamStats = {
      totalEmployees: performanceData.length,
      activeEmployees: performanceData.filter(emp => emp.employee.isActive).length,
      totalLeads: performanceData.reduce((sum, emp) => sum + emp.leadStatistics.total, 0),
      totalConversions: performanceData.reduce((sum, emp) => sum + emp.conversionMetrics.convertedLeads, 0),
      totalFollowUps: performanceData.reduce((sum, emp) => sum + emp.followUpMetrics.total, 0),
      totalRevenue: performanceData.reduce((sum, emp) => sum + emp.leadStatistics.convertedValue, 0),
      averagePerformanceScore: performanceData.length > 0 ? 
        (performanceData.reduce((sum, emp) => sum + emp.performance.score, 0) / performanceData.length).toFixed(2) : 0
    };

    res.json({
      success: true,
      data: {
        employees: performanceData,
        teamStatistics: teamStats,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching employee performance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance analytics',
      error: error.message
    });
  }
});

// Get individual employee detailed performance
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log(`🔍 Fetching detailed performance for employee: ${employeeId}`);

    // Get company ID from token for filtering
    const companyId = req.companyId || req.user?.companyId;
    
    // Get employee info with company filtering
    const employeeFilter = { _id: employeeId };
    if (companyId) {
      employeeFilter.company = companyId;
    }
    const employee = await Employee.findOne(employeeFilter).lean();
    
    if (employee) {
      // Manually populate company and department to handle invalid ObjectIds
      if (employee.company && mongoose.Types.ObjectId.isValid(employee.company)) {
        try {
          const Company = require('../models/Company');
          const company = await Company.findById(employee.company).lean();
          employee.company = company ? { name: company.name } : { name: 'Unknown Company' };
        } catch (err) {
          employee.company = { name: 'Unknown Company' };
        }
      } else {
        employee.company = { name: employee.company || 'Unknown Company' };
      }
      
      if (employee.department && mongoose.Types.ObjectId.isValid(employee.department)) {
        try {
          const Department = require('../models/Department');
          const department = await Department.findById(employee.department).lean();
          employee.department = department ? { name: department.name } : { name: 'Sales' };
        } catch (err) {
          employee.department = { name: 'Sales' };
        }
      } else {
        employee.department = { name: employee.department || 'Sales' };
      }
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get all leads assigned to this employee with detailed info
    const assignedLeads = await Lead.find({ assignedTo: employeeId })
      .sort({ assignedAt: -1 })
      .lean();

    // Calculate monthly performance trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthLeads = assignedLeads.filter(lead => {
        const assignedDate = new Date(lead.assignedAt || lead.createdAt);
        return assignedDate >= monthStart && assignedDate <= monthEnd;
      });

      const monthConversions = monthLeads.filter(lead => lead.status === 'closed_won').length;
      const monthFollowUps = monthLeads.reduce((count, lead) => {
        if (lead.followUps && Array.isArray(lead.followUps)) {
          return count + lead.followUps.filter(followUp => {
            const followUpDate = new Date(followUp.date);
            return followUpDate >= monthStart && followUpDate <= monthEnd;
          }).length;
        }
        return count;
      }, 0);

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        leads: monthLeads.length,
        conversions: monthConversions,
        followUps: monthFollowUps,
        conversionRate: monthLeads.length > 0 ? ((monthConversions / monthLeads.length) * 100).toFixed(2) : 0
      });
    }

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivities = [];
    
    assignedLeads.forEach(lead => {
      // Add lead assignment activity
      if (new Date(lead.assignedAt || lead.createdAt) >= thirtyDaysAgo) {
        recentActivities.push({
          type: 'lead_assigned',
          date: lead.assignedAt || lead.createdAt,
          description: `Lead assigned: ${lead.name}`,
          leadId: lead._id,
          leadName: lead.name
        });
      }

      // Add follow-up activities
      if (lead.followUps && Array.isArray(lead.followUps)) {
        lead.followUps.forEach(followUp => {
          if (new Date(followUp.date) >= thirtyDaysAgo) {
            recentActivities.push({
              type: 'follow_up',
              date: followUp.date,
              description: `Follow-up: ${followUp.summary}`,
              leadId: lead._id,
              leadName: lead.name,
              followUpType: followUp.type
            });
          }
        });
      }

      // Add status change activities
      if (lead.status === 'closed_won' && new Date(lead.updatedAt) >= thirtyDaysAgo) {
        recentActivities.push({
          type: 'conversion',
          date: lead.updatedAt,
          description: `Lead converted: ${lead.name}`,
          leadId: lead._id,
          leadName: lead.name,
          value: lead.value
        });
      }
    });

    // Sort activities by date (most recent first)
    recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        employee: {
          _id: employee._id,
          name: employee.teamMemberName || employee.name || 'Unknown',
          email: employee.teamMemberEmail || employee.email || '',
          phone: employee.emergencyMobileNumber || employee.phone || employee.teamMemberMobile || '',
          role: employee.role || 'Sales Executive',
          company: employee.company?.name || 'Unknown Company',
          department: employee.department?.name || 'Sales',
          joinDate: employee.createdAt,
          isActive: employee.isActive !== false
        },
        leads: assignedLeads.map(lead => ({
          _id: lead._id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          status: lead.status,
          value: lead.value || 0,
          source: lead.source,
          assignedAt: lead.assignedAt,
          lastContact: lead.lastContact,
          followUpsCount: lead.followUps ? lead.followUps.length : 0,
          nextFollowUp: lead.followUps && lead.followUps.length > 0 ? 
            lead.followUps.find(f => !f.completed && f.nextFollowUpDate)?.nextFollowUpDate : null
        })),
        monthlyTrends,
        recentActivities: recentActivities.slice(0, 20), // Last 20 activities
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching employee detailed performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee detailed performance',
      error: error.message
    });
  }
});

// Get team performance comparison
router.get('/team-comparison', async (req, res) => {
  try {
    console.log('🔍 Fetching team performance comparison...');

    // Get performance analytics for all employees
    const analyticsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/employee-performance/analytics`);
    const analyticsData = await analyticsResponse.json();

    if (!analyticsData.success) {
      throw new Error('Failed to fetch analytics data');
    }

    const employees = analyticsData.data.employees;

    // Create comparison metrics
    const comparison = {
      topPerformers: employees.slice(0, 5),
      conversionLeaders: employees
        .sort((a, b) => b.conversionMetrics.conversionRate - a.conversionMetrics.conversionRate)
        .slice(0, 5),
      followUpChampions: employees
        .sort((a, b) => b.followUpMetrics.completionRate - a.followUpMetrics.completionRate)
        .slice(0, 5),
      workloadDistribution: employees.map(emp => ({
        name: emp.employee.name,
        workload: emp.workload.totalLeads,
        workloadPercentage: emp.workload.workloadPercentage
      })),
      departmentStats: {}
    };

    // Calculate department-wise statistics
    employees.forEach(emp => {
      const dept = emp.employee.department;
      if (!comparison.departmentStats[dept]) {
        comparison.departmentStats[dept] = {
          employees: 0,
          totalLeads: 0,
          conversions: 0,
          followUps: 0,
          avgPerformance: 0
        };
      }
      
      comparison.departmentStats[dept].employees++;
      comparison.departmentStats[dept].totalLeads += emp.leadStatistics.total;
      comparison.departmentStats[dept].conversions += emp.conversionMetrics.convertedLeads;
      comparison.departmentStats[dept].followUps += emp.followUpMetrics.total;
      comparison.departmentStats[dept].avgPerformance += emp.performance.score;
    });

    // Calculate averages for departments
    Object.keys(comparison.departmentStats).forEach(dept => {
      const stats = comparison.departmentStats[dept];
      stats.avgPerformance = (stats.avgPerformance / stats.employees).toFixed(2);
      stats.conversionRate = stats.totalLeads > 0 ? ((stats.conversions / stats.totalLeads) * 100).toFixed(2) : 0;
    });

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Error fetching team performance comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team performance comparison',
      error: error.message
    });
  }
});

module.exports = router;
