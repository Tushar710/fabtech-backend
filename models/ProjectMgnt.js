const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  title: { type: String, required: true },
  description: { type: String },

  status: { 
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },

  startDate: { type: Date },
  dueDate: { type: Date },

  budget: { type: Number, min: 0 },

  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],

  progress: { type: Number, min: 0, max: 100, default: 0 },

  clientName: { type: String },
  clientEmail: { type: String, match: /.+\@.+\..+/ },
  clientMobileNo: { type: String },

  // Additional fields for lead integration
  assignedLeads: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lead' }],
  totalLeadValue: { type: Number, default: 0 },
  wonLeadValue: { type: Number, default: 0 },
  
  // Project metrics
  metrics: {
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalLeads: { type: Number, default: 0 },
    convertedLeads: { type: Number, default: 0 },
    teamProductivity: { type: Number, default: 0 }
  },

  // Project settings
  settings: {
    autoAssignLeads: { type: Boolean, default: false },
    leadAssignmentStrategy: { 
      type: String, 
      enum: ['round_robin', 'manual', 'equal_distribution'],
      default: 'manual'
    },
    notifyOnLeadAssignment: { type: Boolean, default: true },
    trackSalesMetrics: { type: Boolean, default: true }
  }

}, { timestamps: true });

// Indexes for better performance
projectSchema.index({ company: 1, status: 1 });
projectSchema.index({ teamMembers: 1 });
projectSchema.index({ startDate: 1, dueDate: 1 });
projectSchema.index({ 'metrics.totalLeads': 1 });

// Virtual for completion percentage
projectSchema.virtual('completionPercentage').get(function() {
  if (this.metrics.totalTasks === 0) return 0;
  return Math.round((this.metrics.completedTasks / this.metrics.totalTasks) * 100);
});

// Virtual for lead conversion rate
projectSchema.virtual('leadConversionRate').get(function() {
  if (this.metrics.totalLeads === 0) return 0;
  return Math.round((this.metrics.convertedLeads / this.metrics.totalLeads) * 100);
});

// Pre-save middleware to update metrics
projectSchema.pre('save', async function(next) {
  if (this.isModified('assignedLeads')) {
    // Update lead metrics when leads are modified
    try {
      const Lead = mongoose.model('Lead');
      const leads = await Lead.find({ _id: { $in: this.assignedLeads } });
      
      this.metrics.totalLeads = leads.length;
      this.totalLeadValue = leads.reduce((sum, lead) => sum + (lead.amount || 0), 0);
      
      const wonLeads = leads.filter(lead => lead.status === 'closed_won');
      this.metrics.convertedLeads = wonLeads.length;
      this.wonLeadValue = wonLeads.reduce((sum, lead) => sum + (lead.amount || 0), 0);
      
    } catch (error) {
      console.error('Error updating project metrics:', error);
    }
  }
  next();
});

// Static method to get projects with sales data
projectSchema.statics.getProjectsWithSalesData = async function(filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $lookup: {
        from: 'employees',
        localField: 'teamMembers',
        foreignField: '_id',
        as: 'teamMembersData'
      }
    },
    {
      $lookup: {
        from: 'leads',
        localField: 'assignedLeads',
        foreignField: '_id',
        as: 'leadsData'
      }
    },
    {
      $addFields: {
        salesTeamCount: {
          $size: {
            $filter: {
              input: '$teamMembersData',
              cond: { $in: ['$$this.role', ['sales_rep', 'sales_manager', 'sales_director']] }
            }
          }
        },
        activeLeadsCount: {
          $size: {
            $filter: {
              input: '$leadsData',
              cond: { $in: ['$$this.status', ['new', 'contacted', 'qualified', 'proposal', 'negotiation']] }
            }
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
};

// Instance method to assign leads to project
projectSchema.methods.assignLeads = async function(leadIds, assignmentStrategy = 'manual') {
  try {
    const Lead = mongoose.model('Lead');
    
    // Add leads to project
    this.assignedLeads = [...new Set([...this.assignedLeads, ...leadIds])];
    
    // Update lead assignments based on strategy
    if (assignmentStrategy === 'round_robin' && this.teamMembers.length > 0) {
      const leads = await Lead.find({ _id: { $in: leadIds } });
      
      for (let i = 0; i < leads.length; i++) {
        const teamMemberIndex = i % this.teamMembers.length;
        const assignedTo = this.teamMembers[teamMemberIndex];
        
        await Lead.findByIdAndUpdate(leads[i]._id, {
          assignedTo: assignedTo,
          assignmentDate: new Date(),
          assignmentNotes: `Auto-assigned via project: ${this.title}`,
          $push: {
            followUps: {
              type: 'assignment',
              summary: 'Lead assigned via project management',
              notes: `Assigned to project: ${this.title}`,
              date: new Date(),
              completed: false
            }
          }
        });
      }
    }
    
    await this.save();
    return { success: true, assignedLeads: leadIds.length };
    
  } catch (error) {
    console.error('Error assigning leads to project:', error);
    return { success: false, error: error.message };
  }
};

module.exports = mongoose.model('ProjectMgnt', projectSchema);
