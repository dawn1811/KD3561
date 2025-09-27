import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

interface Event {
  id: string;
  title: string;
  description: string;
  start: any;
  end: any;
  allianceEvent?: boolean;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("start", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: Event[] = [];
      snapshot.forEach((doc) =>
        items.push({ id: doc.id, ...(doc.data() as Omit<Event, "id">) })
      );
      setEvents(items);
    });
    return () => unsub();
  }, []);

  const dayEvents = selectedDate
    ? events.filter(
        (e) =>
          new Date(e.start.seconds * 1000).toDateString() ===
          selectedDate.toDateString()
      )
    : [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Events Calendar</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar */}
        <Calendar
          onClickDay={(date) => setSelectedDate(date)}
          className="bg-gray-900 text-white rounded-lg p-4"
        />

        {/* Events for selected date */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-400 mb-4">
            {selectedDate
              ? `Events on ${selectedDate.toDateString()}`
              : "Select a date"}
          </h2>

          {dayEvents.length === 0 ? (
            <p>No events.</p>
          ) : (
            <ul className="space-y-4">
              {dayEvents.map((ev) => (
                <li key={ev.id} className="bg-gray-800 p-4 rounded-md">
                  <h3 className="text-yellow-400 font-bold">{ev.title}</h3>
                  <p>{ev.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(ev.start.seconds * 1000).toLocaleString()} –{" "}
                    {new Date(ev.end.seconds * 1000).toLocaleString()}
                  </p>
                  {ev.allianceEvent && (
                    <p className="text-xs text-blue-400">Alliance Event</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
