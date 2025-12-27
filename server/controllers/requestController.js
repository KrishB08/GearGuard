const { MaintenanceRequest, Equipment, Team, User } = require('../models');

exports.getAllRequests = async (req, res) => {
    try {
        const { team_id } = req.query;
        let query = team_id ? { team_id } : {};

        // RBAC Visibility Logic:
        // Admin: sees all (no extra filter)
        // Worker: sees only requests they created
        // Technician: sees only requests assigned to them (or their team if needed)

        // Note: 'req.user' comes from the 'protect' middleware. Warning: if protect is missing, this will crash/fail security.
        if (!req.user) {
            return res.status(401).json({ message: 'User context is missing.' });
        }

        if (req.user.role === 'Worker') {
            query.created_by = req.user.id;
        } else if (req.user.role === 'Technician') {
            // Can see assigned to self OR unassigned in their team queue (optional, but requested 'assigned to userId')
            query.$or = [
                { technician_id: req.user.id },
                { technician_id: null, team_id: req.user.team_id }
            ];
        }
        // Admin stays as {} (all)

        const requests = await MaintenanceRequest.find(query)
            .populate('equipment_id', 'name serial_number location') // optimizing selection
            .populate('team_id', 'name')
            .populate('technician_id', 'name')
            .populate('created_by', 'name')
            .sort({ createdAt: -1 });

        // Map to match frontend expectations (aliases)
        const result = requests.map(r => {
            const obj = r.toJSON();
            obj.Equipment = obj.equipment_id;
            obj.Team = obj.team_id;
            obj.Technician = obj.technician_id;
            return obj;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRequest = async (req, res) => {
    try {
        const { equipment_id, subject, description, priority, request_type } = req.body;

        // 1. Validate Equipment
        const equipment = await Equipment.findById(equipment_id);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        // 2. Auto-Assignment Logic
        // Priority: Specific Default Technician > Maintenance Team > Unassigned
        let assignedTechnician = equipment.technician_id;
        let assignedTeam = equipment.maintenance_team_id;

        // 3. Create Request
        const request = await MaintenanceRequest.create({
            subject,
            request_type,
            priority,
            equipment_id,
            team_id: assignedTeam,
            technician_id: assignedTechnician,
            status: 'New',
            created_by: req.user.id // Track creator
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.acceptRequest = async (req, res) => {
    const { id } = req.params;
    const { technician_id } = req.body;

    try {
        const request = await MaintenanceRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'New') {
            return res.status(400).json({ message: 'Only new requests can be accepted' });
        }

        // Enforce Team restriction
        // Allow if explicitly assigned to this technician
        const isAssignedToUser = request.technician_id &&
            (request.technician_id.toString() === req.user._id.toString() ||
                request.technician_id._id?.toString() === req.user._id.toString());

        if (!isAssignedToUser) {
            // Enforce Team restriction for picking up unassigned requests
            if (request.team_id && req.user.team_id) {
                if (request.team_id.toString() !== req.user.team_id.toString()) {
                    return res.status(403).json({ message: 'You can only accept requests assigned to your team' });
                }
            }
        }

        request.technician_id = technician_id || req.user._id;
        request.status = 'In Progress';
        await request.save();

        const populated = await MaintenanceRequest.findById(id)
            .populate('equipment_id')
            .populate('team_id')
            .populate('technician_id');

        const obj = populated.toJSON();
        obj.Equipment = obj.equipment_id;
        obj.Team = obj.team_id;
        obj.Technician = obj.technician_id;

        res.json({ message: 'Request accepted', request: obj });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRequestStage = async (req, res) => {
    const { id } = req.params;
    const { status, duration, scheduled_date, subject, notes } = req.body;
    const user = req.user;

    try {
        const request = await MaintenanceRequest.findById(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // RBAC Permission Logic
        if (user.role === 'Admin') {
            // Admin can edit everything
            if (status) request.status = status;
            if (duration) request.duration = duration;
            if (scheduled_date) request.scheduled_date = scheduled_date;
            if (subject) request.subject = subject;
            if (notes) request.notes = notes;
        }
        else if (user.role === 'Worker') {
            // Worker: Edit ONLY own requests && ONLY if status is New
            if (request.created_by.toString() !== user.id) {
                return res.status(403).json({ message: 'Not authorized to edit this request' });
            }
            if (request.status !== 'New') {
                return res.status(403).json({ message: 'Cannot edit request after it has been processed' });
            }
            // Allowed fields for Worker
            if (subject) request.subject = subject;
        }
        else if (user.role === 'Technician') {
            // Technician: Edit ONLY assigned requests
            if (request.technician_id && request.technician_id.toString() !== user.id) {
                return res.status(403).json({ message: 'Not authorized: Request not assigned to you' });
            }

            // Allowed updates for Technician
            if (subject) request.subject = subject;
            if (scheduled_date) request.scheduled_date = scheduled_date;
            if (duration) request.duration = duration;
            if (notes) request.notes = notes;

            // Status transitions: Technician moves to Repaired
            if (status) {
                if (status === 'Repaired' && !duration && !request.duration) {
                    return res.status(400).json({ message: 'Duration is required when marking as Repaired' });
                }
                request.status = status;
            }
        }

        // Business Logic: Scrap Equipment
        if (status === 'Scrap' && (user.role === 'Admin' || user.role === 'Technician')) {
            await Equipment.findByIdAndUpdate(request.equipment_id, { is_scrap: true });
        }

        await request.save();

        const populated = await MaintenanceRequest.findById(id)
            .populate('equipment_id')
            .populate('team_id')
            .populate('technician_id');

        const obj = populated.toJSON();
        obj.Equipment = obj.equipment_id;
        obj.Team = obj.team_id;
        obj.Technician = obj.technician_id;

        res.json({ message: 'Request updated', request: obj });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await MaintenanceRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        await MaintenanceRequest.findByIdAndDelete(id);
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
