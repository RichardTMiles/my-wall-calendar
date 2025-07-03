import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import type { EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

type Calendar = {
    id: string;
    name: string;
    color: string;
};

type CalEvent = {
    id: string;
    calendarId: string;
    title: string;
    start: string;
    end: string;
    color?: string;
};

const CALS_KEY   = 'wallCal-calendars';
const EVENTS_KEY = 'wallCal-events';

function load<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : fallback;
    } catch {
        return fallback;
    }
}

export default function App() {
    const [calendars, setCalendars] = useState<Calendar[]>(() => load(CALS_KEY, []));
    const [events, setEvents]       = useState<CalEvent[]>(() => load(EVENTS_KEY, []));

    // keep localStorage in sync
    useEffect(() => { localStorage.setItem(CALS_KEY, JSON.stringify(calendars)); }, [calendars]);
    useEffect(() => { localStorage.setItem(EVENTS_KEY, JSON.stringify(events));   }, [events]);

    const [newCalName,  setNewCalName]  = useState('');
    const [newCalColor, setNewCalColor] = useState('#3788d8');

    const handleAddCalendar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCalName) return;
        setCalendars([...calendars, { id: crypto.randomUUID(), name: newCalName, color: newCalColor }]);
        setNewCalName('');
        setNewCalColor('#3788d8');
    };

    const editCalendar = (id: string) => {
        const cal = calendars.find(c => c.id === id);
        if (!cal) return;
        const name  = prompt('Calendar name', cal.name);
        if (!name) return;
        const color = prompt('Color (#rrggbb)', cal.color) || cal.color;
        setCalendars(calendars.map(c => c.id === id ? { ...c, name, color } : c));
    };

    const deleteCalendar = (id: string) => {
        if (!confirm('Delete calendar and all its events?')) return;
        setCalendars(calendars.filter(c => c.id !== id));
        setEvents(events.filter(e => e.calendarId !== id));
    };

    // event form state
    const [evTitle, setEvTitle] = useState('');
    const [evStart, setEvStart] = useState('');
    const [evEnd,   setEvEnd]   = useState('');
    const [evCal,   setEvCal]   = useState('');
    const [evColor, setEvColor] = useState('');

    useEffect(() => {
        if (calendars.length && !calendars.some(c => c.id === evCal)) {
            setEvCal(calendars[0].id);
        }
    }, [calendars, evCal]);

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!evTitle || !evStart || !evEnd || !evCal) return;
        setEvents([...events, { id: crypto.randomUUID(), title: evTitle, start: evStart, end: evEnd, calendarId: evCal, color: evColor || undefined }]);
        setEvTitle('');
        setEvStart('');
        setEvEnd('');
        setEvColor('');
    };

    const handleEventClick = (info: EventClickArg) => {
        const id = info.event.id;
        const ev = events.find(e => e.id === id);
        if (!ev) return;

        const choice = prompt('Edit title or type DELETE to remove', ev.title);
        if (choice === null) return;

        if (choice.toLowerCase() === 'delete') {
            if (confirm('Delete this event?')) setEvents(events.filter(e => e.id !== id));
            return;
        }

        const start = prompt('Start (YYYY-MM-DDThh:mm)', ev.start) || ev.start;
        const end   = prompt('End (YYYY-MM-DDThh:mm)',   ev.end)   || ev.end;
        const color = prompt('Color (#rrggbb or blank)', ev.color || '') || '';

        setEvents(events.map(e => e.id === id ? { ...e, title: choice, start, end, color: color || undefined } : e));
    };

    const fullCalEvents = events.map(ev => {
        const cal = calendars.find(c => c.id === ev.calendarId);
        return { ...ev, color: ev.color || cal?.color };
    });

    return (
        <div className="container py-4">
            <h1 className="mb-4">Wall Calendar</h1>

            <h2>Calendars</h2>
            <form className="row g-2 align-items-end" onSubmit={handleAddCalendar}>
                <div className="col">
                    <input className="form-control" placeholder="Name" value={newCalName} onChange={(e) => setNewCalName(e.target.value)} />
                </div>
                <div className="col-auto">
                    <input type="color" className="form-control form-control-color" value={newCalColor} onChange={(e) => setNewCalColor(e.target.value)} />
                </div>
                <div className="col-auto">
                    <button type="submit" className="btn btn-primary">Add Calendar</button>
                </div>
            </form>
            <ul className="list-group mt-3">
                {calendars.map(cal => (
                    <li key={cal.id} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                            <span className="badge me-2" style={{ backgroundColor: cal.color }}>&nbsp;</span>
                            {cal.name}
                        </span>
                        <span>
                            <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => editCalendar(cal.id)}>Edit</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCalendar(cal.id)}>Delete</button>
                        </span>
                    </li>
                ))}
            </ul>

            <h2 className="mt-5">Add Event</h2>
            <form className="row g-2 align-items-end" onSubmit={handleAddEvent}>
                <div className="col">
                    <input className="form-control" placeholder="Title" value={evTitle} onChange={(e) => setEvTitle(e.target.value)} />
                </div>
                <div className="col-auto">
                    <input type="datetime-local" className="form-control" value={evStart} onChange={(e) => setEvStart(e.target.value)} />
                </div>
                <div className="col-auto">
                    <input type="datetime-local" className="form-control" value={evEnd} onChange={(e) => setEvEnd(e.target.value)} />
                </div>
                <div className="col-auto">
                    <select className="form-select" value={evCal} onChange={(e) => setEvCal(e.target.value)}>
                        {calendars.map(cal => (<option key={cal.id} value={cal.id}>{cal.name}</option>))}
                    </select>
                </div>
                <div className="col-auto">
                    <input type="color" className="form-control form-control-color" value={evColor} onChange={(e) => setEvColor(e.target.value)} />
                </div>
                <div className="col-auto">
                    <button type="submit" className="btn btn-success">Add Event</button>
                </div>
            </form>

            <div className="mt-4">
                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    events={fullCalEvents}
                    eventClick={handleEventClick}
                    displayEventEnd
                />
            </div>
        </div>
    );
}
