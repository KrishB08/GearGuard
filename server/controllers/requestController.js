const { MaintenanceRequest, Equipment, Team, User } = require('../models');

exports.getAllRequests = async (req, res) => {
    try {
        const { team_id } = req.query;
        const query = team_id ? { team_id } : {};

        const requests = await MaintenanceRequest.find(query)
            .populate('equipment_id')
            .populate('team_id')
            .populate('technician_id')
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
        const request = await MaintenanceRequest.create(req.body);
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateRequestStage = async (req, res) => {
    const { id } = req.params;
    const { status, duration } = req.body;

    try {
        const request = await MaintenanceRequest.findById(id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        if (status === 'Repaired') {
            if (duration === undefined || duration === null) {
                return res.status(400).json({ message: 'Duration is required when marking as Repaired' });
            }
            request.duration = duration;
        }

        if (status === 'Scrap') {
            await Equipment.findByIdAndUpdate(request.equipment_id, { is_scrap: true });
        }

        request.status = status;
        await request.save();

        res.json({ message: 'Request updated', request });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
