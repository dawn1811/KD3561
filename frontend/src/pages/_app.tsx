import type { AppProps } from "next/app";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import "../styles/globals.css";
import { useRouter } from "next/router";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user && router.pathname !== "/login" && router.pathname !== "/register") {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  return <>{children}</>;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AuthGuard>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthGuard>
    </AuthProvider>
  );
}
