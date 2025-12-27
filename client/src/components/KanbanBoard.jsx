import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api/axios';

const columns = {
    'New': { id: 'New', title: 'New Requests', color: 'bg-blue-50 border-blue-200' },
    'In Progress': { id: 'In Progress', title: 'In Progress', color: 'bg-yellow-50 border-yellow-200' },
    'Repaired': { id: 'Repaired', title: 'Repaired', color: 'bg-green-50 border-green-200' },
    'Scrap': { id: 'Scrap', title: 'Scrap / Unusable', color: 'bg-red-50 border-red-200' }
};

export default function KanbanBoard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const newStatus = destination.droppableId;

        // Optimistic Update
        const updatedRequests = requests.map(req =>
            req.id === parseInt(draggableId) ? { ...req, status: newStatus } : req
        );
        setRequests(updatedRequests);

        // Prompt for Duration if moving to Repaired
        let duration = null;
        if (newStatus === 'Repaired') {
            const input = prompt("Enter duration in hours:");
            duration = parseFloat(input);
            if (isNaN(duration)) {
                alert("Invalid duration. Reverting.");
                fetchRequests(); // Revert
                return;
            }
        }

        try {
            await api.put(`/requests/${draggableId}/status`, { status: newStatus, duration });
        } catch (err) {
            console.error(err);
            fetchRequests(); // Revert on fail
        }
    };

    const getColumnRequests = (status) => requests.filter(r => r.status === status);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 px-4 sm:px-0">Maintenance Priorities</h2>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden text-gray-700">
                    <div className="flex h-full space-x-4 pb-4">
                        {Object.values(columns).map(column => (
                            <Droppable key={column.id} droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-shrink-0 w-80 flex flex-col rounded-lg border ${column.color} ${snapshot.isDraggingOver ? 'bg-opacity-75' : ''}`}
                                    >
                                        <div className="p-3 font-semibold text-sm uppercase tracking-wider text-gray-500">
                                            {column.title}
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 min-h-[500px]">
                                            {getColumnRequests(column.id).map((request, index) => (
                                                <Draggable key={request.id} draggableId={request.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white p-3 rounded shadow-sm mb-3 border border-gray-100 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''}`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-sm font-medium text-gray-900">{request.subject}</span>
                                                                {request.Technician?.avatar_url && (
                                                                    <img src={request.Technician.avatar_url} alt="Tech" className="h-6 w-6 rounded-full" />
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 mb-1">
                                                                {request.Equipment?.name}
                                                            </div>
                                                            {request.priority === 'High' && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                    High Priority
                                                                </span>
                                                            )}
                                                            {request.status === 'Repaired' && request.duration && (
                                                                <div className="mt-2 text-xs text-gray-400">Duration: {request.duration}h</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
}
