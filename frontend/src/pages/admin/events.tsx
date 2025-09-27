import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

interface Event {
  id: string;
  title: string;
  description: string;
  start: any;
  end: any;
  allianceEvent?: boolean;
}

export default function ManageEventsPage() {
  const { role, governorId } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [allianceEvent, setAllianceEvent] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

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

  if (role !== "officer" && role !== "king") {
    return <p className="p-6">You don’t have permission to manage events.</p>;
  }

  const addEvent = async () => {
    if (!title.trim() || !start || !end) return;
    await addDoc(collection(db, "events"), {
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      allianceEvent,
      createdAt: serverTimestamp(),
      createdBy: governorId,
    });
    setTitle("");
    setDescription("");
    setStart("");
    setEnd("");
    setAllianceEvent(false);
  };

  const deleteEvent = async (id: string) => {
    await deleteDoc(doc(db, "events", id));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Manage Events</h1>

      {/* Add event */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        />
        <label className="block mb-2">Start:</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        />
        <label className="block mb-2">End:</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="w-full mb-4 rounded-md bg-gray-800 p-3 text-white"
        />
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={allianceEvent}
            onChange={(e) => setAllianceEvent(e.target.checked)}
            className="mr-2"
          />
          Alliance Event
        </label>

        <button
          onClick={addEvent}
          className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400"
        >
          Add Event
        </button>
      </div>

      {/* Existing events */}
      <ul className="space-y-4">
        {events.map((ev) => (
          <li key={ev.id} className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-yellow-400 font-bold">{ev.title}</h3>
            <p>{ev.description}</p>
            <p className="text-xs text-gray-400">
              {new Date(ev.start.seconds * 1000).toLocaleString()} –{" "}
              {new Date(ev.end.seconds * 1000).toLocaleString()}
            </p>
            {ev.allianceEvent && (
              <p className="text-xs text-blue-400">Alliance Event</p>
            )}
            <button
              onClick={() => deleteEvent(ev.id)}
              className="mt-2 text-sm text-red-400 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
