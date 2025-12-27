const { Equipment, Team, User, MaintenanceRequest } = require('../models');

exports.getAllEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.find()
            .populate('maintenance_team_id') // Populate reference
            .populate('technician_id')
            .populate('assigned_employee_id');

        // Transform for frontend compatibility (mapping populated fields to expected names if needed, 
        // but the model standardizes snake_case IDs so it should be fine. 
        // However, populated fields return objects. 
        // The previous Sequelize 'as' aliases mapped to: MaintenanceTeam, DefaultTechnician, AssignedEmployee.
        // We can simulate this structure or update frontend. 
        // To minimize frontend changes, let's remap manually or use virtuals in schema. 
        // For speed, let's map here.
        const result = equipment.map(eq => {
            const obj = eq.toJSON();
            obj.MaintenanceTeam = obj.maintenance_team_id;
            obj.DefaultTechnician = obj.technician_id;
            obj.AssignedEmployee = obj.assigned_employee_id;
            return obj;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEquipmentById = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id)
            .populate('maintenance_team_id')
            .populate('technician_id');

        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        const obj = equipment.toJSON();
        obj.MaintenanceTeam = obj.maintenance_team_id;
        obj.DefaultTechnician = obj.technician_id;

        res.json(obj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createEquipment = async (req, res) => {
    try {
        const equipmentData = { ...req.body };

        // If Worker creates equipment, it requires approval
        if (req.user.role === 'Worker') {
            equipmentData.status = 'Pending Approval';
        } else if (req.user.role === 'Admin' || req.user.role === 'Manager') {
            // Admins/Managers can set status directly, or default to Active
            if (!equipmentData.status) equipmentData.status = 'Active';
        }

        const equipment = await Equipment.create(equipmentData);
        res.status(201).json(equipment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getEquipmentDefaults = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id)
            .populate('maintenance_team_id')
            .populate('technician_id');

        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        res.json({
            team_id: equipment.maintenance_team_id ? equipment.maintenance_team_id.id : null,
            technician_id: equipment.technician_id ? equipment.technician_id.id : null,
            team_name: equipment.maintenance_team_id ? equipment.maintenance_team_id.name : null,
            technician_name: equipment.technician_id ? equipment.technician_id.name : null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateEquipment = async (req, res) => {
    try {
        const updates = { ...req.body };

        // Only Admin/Manager can approve equipment (change status to Active)
        if (updates.status === 'Active' && req.user.role !== 'Admin' && req.user.role !== 'Manager') {
            delete updates.status;
        }

        const equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
            .populate('maintenance_team_id')
            .populate('technician_id')
            .populate('assigned_employee_id');

        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        const obj = equipment.toJSON();
        obj.MaintenanceTeam = obj.maintenance_team_id;
        obj.DefaultTechnician = obj.technician_id;
        obj.AssignedEmployee = obj.assigned_employee_id;

        res.json(obj);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteEquipment = async (req, res) => {
    try {
        const equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        // Check if there are active maintenance requests
        const activeRequests = await MaintenanceRequest.countDocuments({
            equipment_id: req.params.id,
            status: { $in: ['New', 'In Progress'] }
        });

        if (activeRequests > 0) {
            return res.status(400).json({
                error: 'Cannot delete equipment with active maintenance requests'
            });
        }

        await Equipment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOpenRequestCount = async (req, res) => {
    try {
        const count = await MaintenanceRequest.countDocuments({
            equipment_id: req.params.id,
            status: { $in: ['New', 'In Progress'] }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
