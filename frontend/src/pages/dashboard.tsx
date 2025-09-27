"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { db, messaging } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";

// Profile structure
interface ProfileData {
  combatRole?: string;
  aooTeam?: string;
  farms?: { name: string; power: string; cityHall: string }[];
}

// Stubbed announcements component for now
function Announcements() {
  return <p>No announcements yet.</p>;
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifStatus, setNotifStatus] = useState("");

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      const docRef = doc(db, "players_profiles", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data() as ProfileData);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Enable push notifications
  const enableNotifications = async () => {
    try {
      if (!messaging) {
        setNotifStatus("❌ Notifications not supported in this browser");
        return;
      }
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      if (!fcmToken) {
        setNotifStatus("❌ No token received");
        return;
      }
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fcmToken }),
      });
      if (res.ok) {
        setNotifStatus("✅ Subscribed to push notifications");
      } else {
        setNotifStatus("❌ Subscription failed");
      }
    } catch (err) {
      console.error(err);
      setNotifStatus("❌ Failed to enable notifications");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-kingdom-black text-white">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kingdom-black text-white">
      {/* Banner */}
      <div className="relative w-full h-56">
        <img
          src="/dashboard-image.webp"
          alt="Kingdom Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-kingdom-black/40">
          <h1 className="text-3xl font-bold text-gold">
            Welcome, Governor {user?.uid}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Profile Card */}
          <div className="rounded-lg bg-kingdom-gray p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gold mb-4">
              Your Profile
            </h2>
            <p>Combat Role: {profile?.combatRole || "Not set"}</p>
            <p>AoO Team: {profile?.aooTeam || "None"}</p>
            {profile?.farms && profile.farms.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Farms:</h3>
                <ul className="list-disc pl-5">
                  {profile.farms.map((farm, i) => (
                    <li key={i}>
                      {farm.name} — Power: {farm.power}, CH: {farm.cityHall}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Announcements */}
          <div className="rounded-lg bg-kingdom-gray p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gold mb-4">
              Announcements
            </h2>
            <Announcements />
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <button
            onClick={enableNotifications}
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400"
          >
            Enable Notifications
          </button>
          {notifStatus && <p className="mt-2">{notifStatus}</p>}
        </div>

        {/* Admin Quick Links */}
        {(role === "officer" || role === "king") && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gold mb-3">
              Admin Quick Links
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/admin/events"
                className="bg-gray-800 text-gold px-4 py-3 rounded shadow hover:bg-gray-700"
              >
                📅 View/Schedule Events
              </Link>
              <Link
                href="/admin/unavailability"
                className="bg-gray-800 text-gold px-4 py-3 rounded shadow hover:bg-gray-700"
              >
                🕒 Player Unavailability
              </Link>
              <Link
                href="/admin/announcements"
                className="bg-gray-800 text-gold px-4 py-3 rounded shadow hover:bg-gray-700"
              >
                📢 Edit Announcements
              </Link>
              <Link
                href="/admin/push"
                className="bg-gray-800 text-gold px-4 py-3 rounded shadow hover:bg-gray-700"
              >
                🔔 Push Notifications
              </Link>
            </div>
          </div>
        )}

        {/* Player Menu */}
        <div className="flex gap-4 mt-10">
          <a href="/kvk" className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
            KVK Stats & DKP
          </a>
          <a href="/events" className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
            Events Calendar
          </a>
          <a
            href="/unavailability"
            className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
          >
            Unavailability
          </a>
        </div>
      </div>
    </div>
  );
}
