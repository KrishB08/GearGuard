import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function EquipmentList() {
    const [equipment, setEquipment] = useState([]);

    useEffect(() => {
        api.get('/equipment').then(res => setEquipment(res.data)).catch(console.error);
    }, []);

    const [groupBy, setGroupBy] = useState('none');

    const groupedEquipment = () => {
        if (groupBy === 'none') return { 'All Equipment': equipment };

        return equipment.reduce((acc, item) => {
            let key = 'Unassigned';
            if (groupBy === 'department') {
                key = item.department || 'No Department';
            } else if (groupBy === 'employee') {
                key = item.AssignedEmployee ? item.AssignedEmployee.name : 'Unassigned';
            }

            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    };

    const groups = groupedEquipment();

    return (
        <div className="space-y-4">
            <div className="flex justify-end px-4 sm:px-6">
                <div className="flex items-center space-x-2">
                    <label htmlFor="groupBy" className="text-sm font-medium text-gray-700">Group By:</label>
                    <select
                        id="groupBy"
                        value={groupBy}
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="none">None</option>
                        <option value="department">Department</option>
                        <option value="employee">Employee</option>
                    </select>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {Object.keys(groups).map((groupTitle) => (
                    <div key={groupTitle}>
                        {groupBy !== 'none' && (
                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{groupTitle}</h3>
                            </div>
                        )}
                        <ul className="divide-y divide-gray-200">
                            {groups[groupTitle].map((item) => (
                                <li key={item._id || item.id}>
                                    <Link to={`/equipment/${item._id || item.id}`} className="block hover:bg-gray-50">
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{item.name}</p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_scrap ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                        {item.is_scrap ? 'Scrapped' : 'Active'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 sm:flex sm:justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        SN: {item.serial_number}
                                                    </p>
                                                    {groupBy !== 'department' && item.department && (
                                                        <p className="ml-4 flex items-center text-sm text-gray-500">
                                                            Dept: {item.department}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                    <p>
                                                        {item.location}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
