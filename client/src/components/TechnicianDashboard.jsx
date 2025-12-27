import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { CheckCircleIcon, ClockIcon, XCircleIcon } from 'lucide-react';

export default function TechnicianDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showTimeForm, setShowTimeForm] = useState(false);
    const [timeData, setTimeData] = useState({ duration: '', notes: '' });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            // Filter to show only requests assigned to this technician or unassigned
            const filtered = res.data.filter(req => {
                const isTeamMatch = !req.team_id || (user.team_id && (req.team_id.id === user.team_id || req.team_id === user.team_id));
                const isAssignedToMe = req.technician_id?.id === user._id || req.technician_id === user._id;

                return isTeamMatch && (isAssignedToMe || req.status === 'New');
            });
            setRequests(filtered);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            await api.put(`/requests/${requestId}/accept`, { technician_id: user._id });
            fetchRequests();
        } catch (err) {
            alert('Failed to accept request: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleUpdateTime = async () => {
        if (!timeData.duration || isNaN(parseFloat(timeData.duration))) {
            alert('Please enter a valid duration in hours');
            return;
        }

        try {
            await api.put(`/requests/${selectedRequest.id}/status`, {
                status: 'Repaired',
                duration: parseFloat(timeData.duration),
                notes: timeData.notes
            });
            setShowTimeForm(false);
            setSelectedRequest(null);
            setTimeData({ duration: '', notes: '' });
            fetchRequests();
        } catch (err) {
            alert('Failed to update request: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleStatusUpdate = async (requestId, newStatus) => {
        try {
            await api.put(`/requests/${requestId}/status`, { status: newStatus });
            fetchRequests();
        } catch (err) {
            alert('Failed to update status: ' + (err.response?.data?.error || err.message));
        }
    };

    if (loading) return <div>Loading...</div>;

    const newRequests = requests.filter(r => r.status === 'New');
    const inProgressRequests = requests.filter(r => r.status === 'In Progress');
    const completedRequests = requests.filter(r => r.status === 'Repaired');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
                <div className="text-sm text-gray-500">
                    Welcome, {user?.name}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">New Requests</div>
                        <div className="mt-1 text-3xl font-semibold text-blue-600">{newRequests.length}</div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">In Progress</div>
                        <div className="mt-1 text-3xl font-semibold text-yellow-600">{inProgressRequests.length}</div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">Completed</div>
                        <div className="mt-1 text-3xl font-semibold text-green-600">{completedRequests.length}</div>
                    </div>
                </div>
            </div>

            {/* New Requests Section */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">New Requests - Accept to Start</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {newRequests.length === 0 ? (
                        <li className="px-4 py-5 text-center text-gray-500">No new requests</li>
                    ) : (
                        newRequests.map((request) => (
                            <li key={request.id} className="px-4 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <p className="text-sm font-medium text-gray-900">{request.subject}</p>
                                            {request.priority === 'High' && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    High Priority
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Equipment: {request.Equipment?.name || 'N/A'}
                                                </p>
                                                {request.Equipment?.location && (
                                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                        Location: {request.Equipment.location}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                Type: {request.request_type}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <button
                                            onClick={() => handleAccept(request.id)}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* In Progress Requests Section */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">In Progress Requests</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {inProgressRequests.length === 0 ? (
                        <li className="px-4 py-5 text-center text-gray-500">No requests in progress</li>
                    ) : (
                        inProgressRequests.map((request) => (
                            <li key={request.id} className="px-4 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <p className="text-sm font-medium text-gray-900">{request.subject}</p>
                                            {request.priority === 'High' && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                    High Priority
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Equipment: {request.Equipment?.name || 'N/A'}
                                                </p>
                                                {request.Equipment?.location && (
                                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                        Location: {request.Equipment.location}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                Type: {request.request_type}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSelectedRequest(request);
                                                setShowTimeForm(true);
                                            }}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                        >
                                            <ClockIcon className="h-4 w-4 mr-2" />
                                            Mark Complete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Completed Requests Section */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Completed Requests</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {completedRequests.length === 0 ? (
                        <li className="px-4 py-5 text-center text-gray-500">No completed requests</li>
                    ) : (
                        completedRequests.map((request) => (
                            <li key={request.id} className="px-4 py-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{request.subject}</p>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Equipment: {request.Equipment?.name || 'N/A'}
                                                </p>
                                                {request.duration && (
                                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                        Duration: {request.duration} hours
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                Completed
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Time Update Modal */}
            {showTimeForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Request Completion</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Time Taken (hours) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        required
                                        value={timeData.duration}
                                        onChange={(e) => setTimeData({ ...timeData, duration: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="e.g., 2.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                                    <textarea
                                        value={timeData.notes}
                                        onChange={(e) => setTimeData({ ...timeData, notes: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        rows="3"
                                        placeholder="Optional notes about the repair..."
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowTimeForm(false);
                                            setSelectedRequest(null);
                                            setTimeData({ duration: '', notes: '' });
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpdateTime}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                                    >
                                        Mark as Repaired
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

