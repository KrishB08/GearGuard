import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { CheckCircle, Clock, Play } from 'lucide-react';

export default function TechnicianDashboard() {
    const [assignedRequests, setAssignedRequests] = useState([]);

    useEffect(() => {
        // In a real app, endpoint should be /requests?technician_id=me
        // For now fetching all and filtering client side or just showing all for demo if filter not implemented
        const fetchRequests = async () => {
            try {
                const res = await api.get('/requests');
                // data isn't filtered by tech on backend yet so we might see all. 
                // That's fine for this step or we can add a simple filter if user ID is available.
                setAssignedRequests(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRequests();
    }, []);

    const updateStatus = async (id, newStatus) => {
        try {
            await api.put(`/requests/${id}/status`, { status: newStatus });
            // Optimistic update
            setAssignedRequests(requests => requests.map(r =>
                r._id === id ? { ...r, status: newStatus } : r
            ));
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Jobs</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {assignedRequests.map((request) => (
                        <li key={request._id} className="block hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{request.subject}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${request.status === 'New' ? 'bg-green-100 text-green-800' :
                                                request.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {request.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                            {request.equipment_id?.name || 'Unknown Equipment'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 flex space-x-3">
                                    {request.status === 'New' && (
                                        <button
                                            onClick={() => updateStatus(request._id, 'In Progress')}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                        >
                                            <Play className="h-4 w-4 mr-1" /> Accept
                                        </button>
                                    )}
                                    {request.status === 'In Progress' && (
                                        <button
                                            onClick={() => updateStatus(request._id, 'Repaired')}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" /> Complete
                                        </button>
                                    )}
                                    <button
                                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <Clock className="h-4 w-4 mr-1" /> Log Time
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {assignedRequests.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No assigned jobs.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
