import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Plus } from 'lucide-react';

export default function WorkerDashboard() {
    const [myRequests, setMyRequests] = useState([]);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                // In a real app, we'd filter by 'created_by' or similar. 
                // For now, fetching all and we'll pretend filter logic or backend handles it.
                // Assuming the backend has a way to filter or we filter client side for demo.
                const res = await api.get('/requests');
                setMyRequests(res.data);
            } catch (err) {
                console.error("Failed to fetch requests", err);
            }
        };
        fetchRequests();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Worker Dashboard</h1>
                <Link to="/new-request" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-5 w-5 mr-2" />
                    New Request
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">My Requests</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {myRequests.map((request) => (
                        <li key={request._id}>
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
                                            {request.request_type}
                                        </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <p>
                                            Priority: {request.priority}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {myRequests.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            No requests found. Create one to get started.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
