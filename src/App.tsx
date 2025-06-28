import { useEffect, useState, useRef } from 'react';
import ICAL from 'ical.js';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';

type CalEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
};

const STORAGE_KEY = 'wallCalUrl';
const REFRESH_MS  = 5 * 60_000;        // 5 min

export default function App() {
    const [url, setUrl] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || '');
    const [events, setEvents] = useState<CalEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState<string | null>(null);

    // keep interval reference so we can clear it on URL change
    const intervalRef = useRef<number | null>(null);

    /** fetch + parse the feed, update events */
    const loadIcs = async () => {
        if (!url) return;
        setLoading(true);
        setError(null);

        try {
            const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const res     = await fetch(proxied);
            if (!res.ok)  throw new Error(`HTTP ${res.status}`);
            const icsText = await res.text();

            const jcal    = ICAL.parse(icsText);
            const comp    = new ICAL.Component(jcal);
            const vevents = comp.getAllSubcomponents('vevent');

            const parsed: CalEvent[] = vevents.map((v) => {
                const ev = new ICAL.Event(v);
                return {
                    id: ev.uid,
                    title: ev.summary || '(no title)',
                    start: ev.startDate.toJSDate(),
                    end:   ev.endDate.toJSDate()
                };
            });

            setEvents(parsed);
        } catch (e: any) {
            setError(e.message || 'Unknown error');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    /** handle URL paste / change */
    const handleLoad = () => {
        if (!url) return;
        localStorage.setItem(STORAGE_KEY, url);     // remember it
        loadIcs();

        // reset the auto-refresh timer whenever URL changes
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(loadIcs, REFRESH_MS);
    };

    /** auto-run once at mount if we already have a saved URL */
    useEffect(() => {
        if (url) handleLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once

    /** tidy up on unmount */
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <div className="container py-4">
            <h1 className="mb-4">Wall Calendar MVP</h1>

            <div className="input-group mb-3">
                <input
                    className="form-control"
                    placeholder="Paste your .ics URL here"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <button
                    className="btn btn-primary"
                    onClick={handleLoad}
                    disabled={loading || !url}
                >
                    {loading ? 'Loading…' : 'Load / Refresh'}
                </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                height="auto"
                events={events}
                displayEventEnd
            />
        </div>
    );
}
