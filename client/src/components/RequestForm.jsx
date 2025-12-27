import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';

export default function RequestForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [equipmentList, setEquipmentList] = useState([]);
    const [formData, setFormData] = useState({
        subject: '',
        equipment_id: '',
        request_type: 'Corrective',
        scheduled_date: '',
        description: '',
        priority: 'Medium',
        team_id: '',
        technician_id: ''
    });
    const [autoFillInfo, setAutoFillInfo] = useState({ team_name: '', technician_name: '' });

    useEffect(() => {
        const fetchDefaults = async () => {
            try {
                const res = await api.get('/equipment');
                const active = res.data.filter(e => e.status !== 'Pending Approval' && !e.is_scrap && e.status !== 'Scrap');
                setEquipmentList(active);

                if (id) {
                    const reqRes = await api.get(`/requests/${id}`);
                    const req = reqRes.data;
                    setFormData({
                        subject: req.subject,
                        equipment_id: req.equipment_id?.id || req.equipment_id,
                        request_type: req.request_type,
                        scheduled_date: req.scheduled_date ? req.scheduled_date.split('T')[0] : '',
                        description: req.description || '',
                        priority: req.priority,
                        team_id: req.team_id?.id || req.team_id,
                        technician_id: req.technician_id?.id || req.technician_id
                    });

                    // Fetch equipment defaults to show team/tech names
                    if (req.equipment_id) {
                        const eqId = req.equipment_id.id || req.equipment_id;
                        const eqRes = await api.get(`/equipment/${eqId}/defaults`);
                        setAutoFillInfo({
                            team_name: eqRes.data.team_name,
                            technician_name: eqRes.data.technician_name
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to load data", err);
            }
        };
        fetchDefaults();
    }, [id]);

    const handleEquipmentChange = async (e) => {
        const eqId = e.target.value;
        setFormData(prev => ({ ...prev, equipment_id: eqId }));

        if (eqId) {
            try {
                const res = await api.get(`/equipment/${eqId}/defaults`);
                setFormData(prev => ({
                    ...prev,
                    team_id: res.data.team_id,
                    technician_id: res.data.technician_id
                }));
                setAutoFillInfo({
                    team_name: res.data.team_name,
                    technician_name: res.data.technician_name
                });
            } catch (err) {
                console.error("Failed to fetch defaults", err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                await api.put(`/requests/${id}`, formData);
            } else {
                await api.post('/requests', formData);
            }
            navigate('/');
        } catch (err) {
            alert('Failed to save request');
            console.error(err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">{id ? 'Edit Maintenance Request' : 'Create Maintenance Request'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input type="text" required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment</label>
                    <select required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.equipment_id}
                        onChange={handleEquipmentChange}
                    >
                        <option value="">Select Equipment</option>
                        {equipmentList.map(eq => (
                            <option key={eq.id} value={eq.id}>{eq.name} ({eq.serial_number})</option>
                        ))}
                    </select>
                </div>

                {/* Auto-filled Readonly Fields */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned Team (Auto-filled)</label>
                        <input type="text" readOnly
                            value={autoFillInfo.team_name || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Assigned Tech (Auto-filled)</label>
                        <input type="text" readOnly
                            value={autoFillInfo.technician_name || ''}
                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 text-gray-500 sm:text-sm border p-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                        value={formData.request_type}
                        onChange={e => setFormData({ ...formData, request_type: e.target.value })}
                    >
                        <option value="Corrective">Corrective</option>
                        <option value="Preventive">Preventive</option>
                    </select>
                </div>

                {formData.request_type === 'Preventive' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                        <input type="date" required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            value={formData.scheduled_date}
                            onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                        />
                    </div>
                )}

                <div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {id ? 'Update Request' : 'Create Request'}
                    </button>
                </div>
            </form>
        </div>
    );
}
