import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function EquipmentList() {
    const [equipment, setEquipment] = useState([]);

    useEffect(() => {
        api.get('/equipment').then(res => setEquipment(res.data)).catch(console.error);
    }, []);

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment List</h3>
            </div>
            <ul className="divide-y divide-gray-200">
                {equipment.map((item) => (
                    <li key={item.id}>
                        <Link to={`/equipment/${item.id}`} className="block hover:bg-gray-50">
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
    );
}
