import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Wrench } from 'lucide-react';

export default function EquipmentDetail() {
    const { id } = useParams();
    const [equipment, setEquipment] = useState(null);
    const [openRequests, setOpenRequests] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eqRes = await api.get(`/equipment/${id}`);
                setEquipment(eqRes.data);

                const countRes = await api.get(`/equipment/${id}/open-requests-count`);
                setOpenRequests(countRes.data.count);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [id]);

    if (!equipment) return <div>Loading...</div>;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Equipment Details</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">{equipment.name}</p>
                </div>
                <div>
                    {/* Smart Button */}
                    <Link to={`/?equipment_id=${id}`} className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                        <Wrench className="mr-2 h-5 w-5" />
                        Maintenance
                        {openRequests > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                {openRequests}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
            <div className="border-t border-gray-200">
                <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{equipment.serial_number}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{equipment.location}</dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Warranty Info</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{equipment.warranty_info || 'N/A'}</dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                            {equipment.is_scrap ? <span className="text-red-600 font-bold">SCRAPPED</span> : 'Operational'}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
