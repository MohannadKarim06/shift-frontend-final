import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { User } from './types';
import { fetchMe } from './services/api';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Workflows } from './pages/Workflows';
import { WorkflowDetail } from './pages/WorkflowDetail';
import { PromptLibrary } from './pages/PromptLibrary';
import { DepartmentPage } from './pages/DepartmentPage';
import { Leaderboard } from './pages/Leaderboard';
import { MyScore } from './pages/MyScore';
import { AdminPanel } from './pages/AdminPanel';
import { Auth } from './pages/Auth';
import { Loader2, Clock } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await fetchMe();
          if ((profile as any).status === 'pending') {
            setIsPending(true);
            setUser(null);
          } else {
            setIsPending(false);
            setUser(profile);
          }
        } catch (err) {
          console.error('Could not fetch user profile from backend:', err);
          setUser(null);
        }
      } else {
        setUser(null);
        setIsPending(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="w-full max-w-md text-center bg-white p-10 rounded-2xl shadow-xl border border-zinc-100">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock size={32} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">Account Pending Approval</h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Your account is waiting for admin approval. You'll get access once an admin reviews your request.
          </p>
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">
            Contact your admin if this is taking too long
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth onUserCreated={setUser} />} />

            <Route element={user ? <Layout user={user} /> : <Navigate to="/auth" />}>
              <Route path="/" element={<Dashboard user={user!} />} />
              <Route path="/workflows" element={<Workflows user={user!} />} />
              <Route path="/workflows/:id" element={<WorkflowDetail user={user!} />} />
              <Route path="/prompts" element={<PromptLibrary user={user!} />} />
              <Route path="/departments/:dept" element={<DepartmentPage user={user!} />} />
              <Route path="/leaderboard" element={<Leaderboard user={user!} />} />
              <Route path="/myscore" element={<MyScore user={user!} />} />
              <Route
                path="/admin"
                element={
                  user?.role !== 'Team Member' ? (
                    <AdminPanel user={user!} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
            </Route>
          </Routes>
        </Router>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
