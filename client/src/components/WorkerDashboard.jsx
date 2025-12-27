import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { PlusIcon, PencilIcon, SearchIcon, FilterIcon } from 'lucide-react';

export default function WorkerDashboard() {
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupBy, setGroupBy] = useState('none');
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
                alert('Equipment request created. It enters "Pending Approval" state.');
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
                <h1 className="text-3xl font-bold text-gray-900">Worker Dashboard</h1>
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
                    Request New Equipment
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">Total Equipment</div>
                        <div className="mt-1 text-3xl font-semibold text-gray-900">{equipment.length}</div>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="text-sm font-medium text-gray-500">My Requests</div>
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

            {/* My Requests List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">My Maintenance Requests</h3>
                </div>
                {requests.filter(r => r.status === 'New' || r.status === 'In Progress').length === 0 ? (
                    <div className="px-4 py-5 text-gray-500">No active requests found.</div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {requests.filter(r => r.status === 'New' || r.status === 'In Progress').map((request) => (
                            <li key={request.id} className="hover:bg-gray-50">
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{request.subject}</p>
                                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'New' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex gap-4">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        Eq: {request.Equipment?.name}
                                                    </p>
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        Type: {request.request_type}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex items-center gap-2">
                                            <div className="text-sm text-gray-500 mr-4">
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </div>
                                            {request.status === 'New' && (
                                                <Link
                                                    to={`/requests/edit/${request.id}`}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Edit Request"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Equipment List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment List</h3>
                </div>
                {Object.entries(grouped).map(([groupName, items]) => (
                    <div key={groupName}>
                        {groupBy !== 'none' && (
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                                <h4 className="text-sm font-semibold text-gray-700">{groupName} ({items.length})</h4>
                            </div>
                        )}
                        <ul className="divide-y divide-gray-200">
                            {items.map((item) => (
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
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' :
                                                    item.is_scrap || item.status === 'Scrap' ? 'bg-red-100 text-red-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                    {item.status || (item.is_scrap ? 'Scrapped' : 'Active')}
                                                </span>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <PencilIcon className="h-5 w-5" />
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
            {showEquipmentForm && (
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
            )}
        </div>
    );
}
