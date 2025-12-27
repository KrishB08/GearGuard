import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, FilterIcon, CheckCircleIcon } from 'lucide-react';

export default function AdminDashboard() {
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupBy, setGroupBy] = useState('none'); // none, department, employee
    const [showEquipmentForm, setShowEquipmentForm] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState(null);
    const [teams, setTeams] = useState([]);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        serial_number: '',
        purchase_date: '',
        warranty_info: '',
        location: '',
        department: '',
        maintenance_team_id: '',
        technician_id: '',
        assigned_employee_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [eqRes, reqRes, teamsRes, usersRes] = await Promise.all([
                api.get('/equipment'),
                api.get('/requests'),
                api.get('/teams'),
                api.get('/users')
            ]);
            setEquipment(eqRes.data);
            setRequests(reqRes.data);
            setTeams(teamsRes.data);
            setUsers(usersRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            await api.put(`/equipment/${id}`, { status: 'Active' });
            fetchData();
        } catch (err) {
            alert('Failed to approve equipment: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this equipment?')) return;
        try {
            await api.delete(`/equipment/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete equipment: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm('Are you sure you want to delete this request?')) return;
        try {
            await api.delete(`/requests/${id}`);
            fetchData();
        } catch (err) {
            alert('Failed to delete request: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEdit = (eq) => {
        setEditingEquipment(eq);
        setFormData({
            name: eq.name || '',
            serial_number: eq.serial_number || '',
            purchase_date: eq.purchase_date ? eq.purchase_date.split('T')[0] : '',
            warranty_info: eq.warranty_info || '',
            location: eq.location || '',
            department: eq.department || '',
            maintenance_team_id: eq.maintenance_team_id?.id || eq.maintenance_team_id || '',
            technician_id: eq.technician_id?.id || eq.technician_id || '',
            assigned_employee_id: eq.assigned_employee_id?.id || eq.assigned_employee_id || ''
        });
        setShowEquipmentForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingEquipment) {
                await api.put(`/equipment/${editingEquipment.id}`, formData);
            } else {
                await api.post('/equipment', formData);
            }
            setShowEquipmentForm(false);
            setEditingEquipment(null);
            setFormData({
                name: '', serial_number: '', purchase_date: '', warranty_info: '',
                location: '', department: '', maintenance_team_id: '', technician_id: '', assigned_employee_id: ''
            });
            fetchData();
        } catch (err) {
            alert('Failed to save equipment: ' + (err.response?.data?.error || err.message));
        }
    };

    const filteredEquipment = equipment.filter(eq => {
        const matchesSearch = !searchTerm ||
            eq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.location?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const groupedEquipment = () => {
        if (groupBy === 'department') {
            const grouped = {};
            filteredEquipment.forEach(eq => {
                const dept = eq.department || 'Unassigned';
                if (!grouped[dept]) grouped[dept] = [];
                grouped[dept].push(eq);
            });
            return grouped;
        } else if (groupBy === 'employee') {
            const grouped = {};
            filteredEquipment.forEach(eq => {
                const emp = eq.AssignedEmployee?.name || eq.assigned_employee_id?.name || 'Unassigned';
                if (!grouped[emp]) grouped[emp] = [];
                grouped[emp].push(eq);
            });
            return grouped;
        }
        return { 'All Equipment': filteredEquipment };
    };

    if (loading) return <div>Loading...</div>;

    const grouped = groupedEquipment();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <button
                    onClick={() => {
                        setEditingEquipment(null);
                        setFormData({
                            name: '', serial_number: '', purchase_date: '', warranty_info: '',
                            location: '', department: '', maintenance_team_id: '', technician_id: '', assigned_employee_id: ''
                        });
                        setShowEquipmentForm(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Equipment
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">Total Equipment</div>
                        <div className="mt-1 text-3xl font-semibold text-gray-900">{equipment.length}</div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">Active Requests</div>
                        <div className="mt-1 text-3xl font-semibold text-gray-900">
                            {requests.filter(r => r.status === 'New' || r.status === 'In Progress').length}
                        </div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">Departments</div>
                        <div className="mt-1 text-3xl font-semibold text-gray-900">
                            {new Set(equipment.map(e => e.department).filter(Boolean)).size}
                        </div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">Pending Approval</div>
                        <div className="mt-1 text-3xl font-semibold text-yellow-600">
                            {equipment.filter(e => e.status === 'Pending Approval').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white shadow rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search equipment..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FilterIcon className="h-5 w-5 text-gray-400" />
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="none">No Grouping</option>
                            <option value="department">Group by Department</option>
                            <option value="employee">Group by Employee</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Pending Approval List - Only show if there are pending items */}
            {
                equipment.some(e => e.status === 'Pending Approval') && (
                    <div className="bg-yellow-50 shadow overflow-hidden sm:rounded-md border border-yellow-200">
                        <div className="px-4 py-5 border-b border-yellow-200 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-yellow-900">Pending Approval</h3>
                        </div>
                        <ul className="divide-y divide-yellow-200">
                            {equipment.filter(e => e.status === 'Pending Approval').map((item) => (
                                <li key={item.id} className="hover:bg-yellow-100">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
                                                <div className="mt-2 flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        SN: {item.serial_number}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleApprove(item.id)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150"
                                                >
                                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }

            {/* Maintenance Requests List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Maintenance Requests</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {requests.slice(0, 10).map((request) => (
                        <li key={request.id} className="hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <p className="text-sm font-medium text-indigo-600 truncate">{request.subject}</p>
                                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                request.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {request.status}
                                            </span>
                                            <span className="ml-2 text-sm text-gray-500">
                                                {request.request_type}
                                            </span>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex gap-4">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Eq: {request.Equipment?.name}
                                                </p>
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Tech: {request.Technician?.name || 'Unassigned'}
                                                </p>
                                                {request.duration && (
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        Duration: {request.duration} hrs
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ml-4 flex items-center gap-2">
                                    <div className="text-sm text-gray-500 mr-4">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                    </div>
                                    <Link
                                        to={`/requests/edit/${request.id}`}
                                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                                        title="Edit Request"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteRequest(request.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete Request"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Equipment List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment Management (Active)</h3>
                </div>
                {Object.entries(grouped).map(([groupName, items]) => (
                    <div key={groupName}>
                        {groupBy !== 'none' && (
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700">{groupName} ({items.length})</h4>
                            </div>
                        )}
                        <ul className="divide-y divide-gray-200">
                            {items.filter(i => i.status !== 'Pending Approval').map((item) => (
                                <li key={item.id} className="hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <Link to={`/equipment/${item.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                                    {item.name}
                                                </Link>
                                                <div className="mt-2 sm:flex sm:justify-between">
                                                    <div className="sm:flex gap-4">
                                                        <p className="flex items-center text-sm text-gray-500">
                                                            SN: {item.serial_number}
                                                        </p>
                                                        {item.department && (
                                                            <p className="flex items-center text-sm text-gray-500">
                                                                Dept: {item.department}
                                                            </p>
                                                        )}
                                                        {item.AssignedEmployee?.name && (
                                                            <p className="flex items-center text-sm text-gray-500">
                                                                Employee: {item.AssignedEmployee.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                        <p>{item.location}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex items-center gap-2">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_scrap ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {item.is_scrap ? 'Scrapped' : 'Active'}
                                                </span>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Equipment Form Modal */}
            {
                showEquipmentForm && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Serial Number *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.serial_number}
                                            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                                        <input
                                            type="date"
                                            value={formData.purchase_date}
                                            onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Warranty Information</label>
                                        <textarea
                                            value={formData.warranty_info}
                                            onChange={(e) => setFormData({ ...formData, warranty_info: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                            rows="2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Department</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Maintenance Team</label>
                                        <select
                                            value={formData.maintenance_team_id}
                                            onChange={(e) => setFormData({ ...formData, maintenance_team_id: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            <option value="">Select Team</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>{team.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Default Technician</label>
                                        <select
                                            value={formData.technician_id}
                                            onChange={(e) => setFormData({ ...formData, technician_id: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            <option value="">Select Technician</option>
                                            {users.filter(u => u.role === 'Technician').map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Assigned Employee</label>
                                        <select
                                            value={formData.assigned_employee_id}
                                            onChange={(e) => setFormData({ ...formData, assigned_employee_id: e.target.value })}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                                        >
                                            <option value="">Select Employee</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEquipmentForm(false);
                                                setEditingEquipment(null);
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {editingEquipment ? 'Update' : 'Create'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
