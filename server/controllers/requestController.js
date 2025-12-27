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
            query.technician_id = req.user.id;
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

exports.updateRequestStage = async (req, res) => {
    const { id } = req.params;
    const { status, duration, scheduled_date, subject } = req.body;
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
            // Worker can't change status directly typically, or maybe cancel? 
            // Assuming simplified requirement: "Edit requests they created"
        }
        else if (user.role === 'Technician') {
            // Technician: Edit ONLY assigned requests
            if (request.technician_id && request.technician_id.toString() !== user.id) {
                return res.status(403).json({ message: 'Not authorized: Request not assigned to you' });
            }

            // Allowed updates for Technician
            if (subject) request.subject = subject; // "Update Subject"
            if (scheduled_date) request.scheduled_date = scheduled_date; // "Update Scheduled Date"
            if (duration) request.duration = duration; // "Update Duration"

            // Status transitions: Technician moves to Repaired
            if (status) {
                if (status === 'Repaired' && !duration && !request.duration) {
                    return res.status(400).json({ message: 'Duration is required when marking as Repaired' });
                }
                // Prevent Technician from arbitrary status changes if needed, but requirements say "move status to Repaired"
                request.status = status;
            }
        }

        // Business Logic: Scrap Equipment
        if (status === 'Scrap' && (user.role === 'Admin' || user.role === 'Technician')) {
            await Equipment.findByIdAndUpdate(request.equipment_id, { is_scrap: true });
        }

        await request.save();
        res.json({ message: 'Request updated', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
