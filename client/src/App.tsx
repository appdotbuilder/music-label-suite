
import { useState, useEffect, useCallback } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { TaskManager } from '@/components/TaskManager';
import type { PublicUser, AuthResponse } from '../../server/src/schema';

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored auth on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as PublicUser;
        setAuthState({
          user,
          token: storedToken,
          isAuthenticated: true
        });
      } catch {
        // Clear invalid stored data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = useCallback((authResponse: AuthResponse) => {
    const newAuthState = {
      user: authResponse.user,
      token: authResponse.token,
      isAuthenticated: true
    };
    
    setAuthState(newAuthState);
    
    // Store auth data
    localStorage.setItem('auth_token', authResponse.token);
    localStorage.setItem('auth_user', JSON.stringify(authResponse.user));
  }, []);

  const handleLogout = useCallback(() => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false
    });
    
    // Clear stored auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {!authState.isAuthenticated ? (
        <AuthForm onAuthSuccess={handleAuthSuccess} />
      ) : (
        <TaskManager user={authState.user!} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
