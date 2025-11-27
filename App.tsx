import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { ViewState, UserSession } from './types';
import { Layout } from './components/Layout';
import { TaskView } from './components/TaskView';
import { FileView } from './components/FileView';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Lock, User } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('tasks');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Check for existing token and username persistence
    const token = localStorage.getItem('godo_token');
    const savedUser = localStorage.getItem('godo_user');
    
    if (token && savedUser) {
      api.setToken(token);
      setSession({ username: savedUser, token });
    }
    setIsLoadingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const res = await api.login({ username, password });
      
      // Persist
      api.setToken(res.token);
      localStorage.setItem('godo_user', username);
      
      setSession({ username, token: res.token });
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    localStorage.removeItem('godo_user');
    setSession(null);
    setUsername('');
    setPassword('');
    setCurrentView('tasks');
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Login View
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-600/30">
              G
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Sign in to your GoDo Scheduler dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  className="pl-10"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  className="pl-10"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {loginError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg text-center">
                {loginError}
              </div>
            )}

            <Button className="w-full py-3" isLoading={isLoggingIn} type="submit">
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center text-xs text-slate-400">
            GoDo Task Scheduling System &copy; 2024
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Layout
  return (
    <Layout 
      currentView={currentView} 
      username={session.username}
      onViewChange={setCurrentView}
      onLogout={handleLogout}
    >
      {currentView === 'tasks' ? (
        <TaskView username={session.username} />
      ) : (
        <FileView />
      )}
    </Layout>
  );
};

export default App;
