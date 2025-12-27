const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Helper to ensure virtuals are included in JSON
const toJSONConfig = {
    virtuals: true,
    transform: (doc, ret) => { delete ret._id; delete ret.__v; }
};

const teamSchema = new Schema({
    name: { type: String, required: true }
}, { timestamps: true, toJSON: toJSONConfig });

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['Admin', 'Worker', 'Technician', 'Manager'], required: true },
    avatar_url: String,
    team_id: { type: Schema.Types.ObjectId, ref: 'Team' }
}, { timestamps: true, toJSON: toJSONConfig });

const equipmentSchema = new Schema({
    name: { type: String, required: true },
    serial_number: { type: String, unique: true },
    purchase_date: Date,
    warranty_info: String,
    location: String,
    department: String,
    is_scrap: { type: Boolean, default: false },
    status: { type: String, enum: ['Active', 'Pending Approval', 'Scrap'], default: 'Active' },
    maintenance_team_id: { type: Schema.Types.ObjectId, ref: 'Team' },
    technician_id: { type: Schema.Types.ObjectId, ref: 'User' },
    assigned_employee_id: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: toJSONConfig });

const maintenanceRequestSchema = new Schema({
    subject: { type: String, required: true },
    request_type: { type: String, enum: ['Corrective', 'Preventive'], required: true },
    scheduled_date: Date,
    duration: Number,
    priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['New', 'In Progress', 'Repaired', 'Scrap'], default: 'New' },
    notes: String,
    equipment_id: { type: Schema.Types.ObjectId, ref: 'Equipment' },
    team_id: { type: Schema.Types.ObjectId, ref: 'Team' },
    technician_id: { type: Schema.Types.ObjectId, ref: 'User' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: toJSONConfig });

const Team = mongoose.model('Team', teamSchema);
const User = mongoose.model('User', userSchema);
const Equipment = mongoose.model('Equipment', equipmentSchema);
const MaintenanceRequest = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);

module.exports = { Team, User, Equipment, MaintenanceRequest };
