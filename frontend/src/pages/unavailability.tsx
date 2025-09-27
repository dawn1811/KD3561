import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

interface Unavailability {
  id: string;
  reason: string;
  start: any;
  end: any;
}

export default function UnavailabilityPage() {
  const { governorId } = useAuth();
  const [reason, setReason] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [entries, setEntries] = useState<Unavailability[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!governorId) return;
    const q = query(
      collection(db, "unavailability"),
      where("governorId", "==", governorId),
      orderBy("start", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items: Unavailability[] = [];
      snapshot.forEach((doc) =>
        items.push({ id: doc.id, ...(doc.data() as Omit<Unavailability, "id">) })
      );
      setEntries(items);
    });
    return () => unsub();
  }, [governorId]);

  const addOrUpdateEntry = async () => {
    if (!governorId || !reason.trim() || !start || !end) return;

    if (editingId) {
      // Update existing
      await updateDoc(doc(db, "unavailability", editingId), {
        reason,
        start: new Date(start),
        end: new Date(end),
      });
      setEditingId(null);
    } else {
      // Add new
      await addDoc(collection(db, "unavailability"), {
        governorId,
        reason,
        start: new Date(start),
        end: new Date(end),
        createdAt: serverTimestamp(),
      });
    }

    setReason("");
    setStart("");
    setEnd("");
  };

  const deleteEntry = async (id: string) => {
    await deleteDoc(doc(db, "unavailability", id));
  };

  const editEntry = (entry: Unavailability) => {
    setEditingId(entry.id);
    setReason(entry.reason);
    setStart(new Date(entry.start.seconds * 1000).toISOString().slice(0, 16));
    setEnd(new Date(entry.end.seconds * 1000).toISOString().slice(0, 16));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">
        My Unavailability
      </h1>

      {/* Add/Edit entry */}
      <div className="bg-gray-900 p-6 rounded-lg mb-8">
        <textarea
          placeholder="Reason (e.g., vacation, family, work)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
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

        <button
          onClick={addOrUpdateEntry}
          className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400"
        >
          {editingId ? "Update Unavailability" : "Add Unavailability"}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setEditingId(null);
              setReason("");
              setStart("");
              setEnd("");
            }}
            className="ml-4 text-sm text-gray-400 hover:text-white"
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Existing entries */}
      <h2 className="text-lg font-semibold mb-4">My Entries</h2>
      {entries.length === 0 ? (
        <p>No unavailability recorded.</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="bg-gray-800 p-4 rounded flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-yellow-300">
                  {entry.reason}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(entry.start.seconds * 1000).toLocaleString()} →{" "}
                  {new Date(entry.end.seconds * 1000).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editEntry(entry)}
                  className="text-blue-400 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
