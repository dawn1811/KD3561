import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logoutUser, role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-kingdom-black text-kingdom-white">
      {/* Header / Navbar */}
      <header className="bg-kingdom-gray border-b border-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Title */}
          <h1 className="text-xl font-bold text-gold">Kingdom 3561</h1>

          {/* Main Menu */}
          <nav className="flex gap-6 text-sm font-medium">
            <Link href="/dashboard" className="hover:text-gold">
              Dashboard
            </Link>
            <Link href="/kvk" className="hover:text-gold">
              KVK Stats & DKP
            </Link>
            <Link href="/events" className="hover:text-gold">
              Events Calendar
            </Link>
            <Link href="/kingdom-stats" className="hover:text-gold">
              Kingdom Statistics
            </Link>

            {/* Admin Quick Links */}
            {(role === "officer" || role === "king") && (
              <>
                <Link href="/admin/events" className="hover:text-gold">
                  📅 Manage Events
                </Link>
                <Link href="/admin/unavailability" className="hover:text-gold">
                  🕒 Player Unavailability
                </Link>
                <Link href="/admin/announcements" className="hover:text-gold">
                  📢 Edit Announcements
                </Link>
                <Link href="/admin/aoo-teams" className="hover:text-gold">
                  ⚔️ AoO Teams
                </Link>
                <Link href="/admin/push" className="hover:text-gold">
                  🔔 Send Push
                </Link>
              </>
            )}
          </nav>

          {/* User / Auth */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-kingdom-lightgray">
                  Welcome, Governor {user.uid}
                </span>
                <button
                  onClick={logoutUser}
                  className="bg-gold text-kingdom-black px-3 py-1 rounded-md hover:bg-yellow-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="text-sm hover:text-gold">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6">{children}</main>

      {/* Footer */}
      <footer className="bg-kingdom-gray border-t border-gray-800 text-center py-4 text-sm text-kingdom-lightgray">
        Kingdom 3561 © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
