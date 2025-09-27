import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

interface Unavailability {
  id: string;
  governorId: string;
  reason: string;
  start: any;
  end: any;
}

export default function AdminUnavailabilityPage() {
  const { role } = useAuth();
  const [entries, setEntries] = useState<Unavailability[]>([]);

  useEffect(() => {
    const q = query(collection(db, "unavailability"), orderBy("start", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const items: Unavailability[] = [];
      snapshot.forEach((doc) =>
        items.push({ id: doc.id, ...(doc.data() as Omit<Unavailability, "id">) })
      );
      setEntries(items);
    });
    return () => unsub();
  }, []);

  if (role !== "officer" && role !== "king") {
    return <p className="p-6">You don’t have permission to view this page.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">
        Player Unavailability
      </h1>

      {entries.length === 0 ? (
        <p>No unavailability recorded.</p>
      ) : (
        <table className="w-full border border-gray-700 bg-gray-900 rounded-lg">
          <thead>
            <tr className="bg-gray-800 text-yellow-400">
              <th className="p-2 text-left">Governor</th>
              <th className="p-2 text-left">Reason</th>
              <th className="p-2 text-left">Start</th>
              <th className="p-2 text-left">End</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((u) => (
              <tr key={u.id} className="border-t border-gray-700">
                <td className="p-2">{u.governorId}</td>
                <td className="p-2">{u.reason}</td>
                <td className="p-2">
                  {new Date(u.start.seconds * 1000).toLocaleString()}
                </td>
                <td className="p-2">
                  {new Date(u.end.seconds * 1000).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
