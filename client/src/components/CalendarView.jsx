import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const locales = {
    'en-US': import('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function CalendarView() {
    const [events, setEvents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/requests');
            // Filter for Preventive and Map to Calendar Events
            const calendarEvents = res.data
                .filter(r => r.request_type === 'Preventive' && r.scheduled_date)
                .map(r => ({
                    id: r.id,
                    title: `Preventive: ${r.Equipment?.name}`,
                    start: new Date(r.scheduled_date),
                    end: new Date(r.scheduled_date),
                    allDay: true,
                    resource: r
                }));
            setEvents(calendarEvents);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectSlot = ({ start }) => {
        // Open new request form with pre-filled date?
        // For now just navigate to new request
        navigate('/new-request');
    };

    return (
        <div className="h-[600px] p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Preventive Maintenance Schedule</h2>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
                onSelectSlot={handleSelectSlot}
                selectable
                views={['month', 'week', 'agenda']}
            />
        </div>
    );
}
