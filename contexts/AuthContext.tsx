import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'HOST' | 'SELLER';

interface User {
  id: string;
  email: string;
  nombre: string;
  apellido?: string;
  avatar?: string;
  region?: string;
  faceData?: string; // Base64 encoded face image for Face ID
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithFace: (faceImage: string) => Promise<boolean>;
  loginAsDemo: (userType?: 'user' | 'seller' | 'admin') => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  region?: string;
  faceData?: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

// Demo users for testing without a real backend.
// Passwords are intentionally omitted — demo mode sets user state directly
// without sending credentials to any endpoint.
const DEMO_USERS = {
  user: {
    email: 'demo@guelaguetza.mx',
    nombre: 'Usuario Demo',
    apellido: 'Oaxaca',
    region: 'Valles Centrales',
    role: 'USER' as UserRole,
  },
  seller: {
    email: 'artesano@guelaguetza.mx',
    nombre: 'Maria',
    apellido: 'Gonzalez',
    region: 'Valles Centrales',
    role: 'SELLER' as UserRole,
  },
  admin: {
    email: 'admin@guelaguetza.mx',
    nombre: 'Admin',
    apellido: 'Guelaguetza',
    region: 'Valles Centrales',
    role: 'ADMIN' as UserRole,
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load saved auth on mount OR auto-login as demo user
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    const autoDemo = localStorage.getItem('auto_demo_mode');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsDemoMode(savedToken.startsWith('demo_'));
    } else if (autoDemo === 'true') {
      // Auto-login as demo user
      loginAsDemo('user');
    }
    setIsLoading(false);
  }, []);

  // Function to login as demo user.
  // Demo mode sets user state directly — no passwords are sent to any endpoint.
  const loginAsDemo = async (userType: 'user' | 'seller' | 'admin' = 'user'): Promise<boolean> => {
    const demoUser = DEMO_USERS[userType];

    // Always use local demo mode — no credentials to send
    const demoToken = `demo_${userType}_${Date.now()}`;
    const demoUserData: User = {
      id: `demo_${userType}_id`,
      email: demoUser.email,
      nombre: demoUser.nombre,
      apellido: demoUser.apellido,
      region: demoUser.region,
      role: demoUser.role,
    };

    setToken(demoToken);
    setUser(demoUserData);
    setIsDemoMode(true);
    localStorage.setItem('auto_demo_mode', 'true');
    return true;
  };

  // Save auth changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, [token, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login error:', error);

      // Demo mode: Check local registered users (by email only) when backend unavailable.
      // Passwords are never stored in localStorage — match by email as demo identity only.
      const savedUsers = localStorage.getItem('demo_users');
      if (savedUsers) {
        const users = JSON.parse(savedUsers);
        const foundUser = users.find((u: { email: string }) => u.email === email);
        if (foundUser) {
          const demoToken = 'demo_token_' + Date.now();
          setToken(demoToken);
          setUser({
            id: foundUser.id,
            email: foundUser.email,
            nombre: foundUser.nombre,
            apellido: foundUser.apellido,
            region: foundUser.region,
            faceData: foundUser.faceData,
          });
          return true;
        }
      }

      return false;
    }
  };

  // Face authentication: calls a dedicated backend endpoint — no hardcoded password bypass.
  // In demo mode (no backend), sets user state directly from locally registered face data.
  const loginWithFace = async (faceImage: string): Promise<boolean> => {
    // Get all users with face data from local storage (demo mode)
    const savedFaces = localStorage.getItem('registered_faces');
    if (!savedFaces) return false;

    try {
      const faces: Array<{ email: string; faceData: string }> = JSON.parse(savedFaces);

      // Simple demo: find user with face data
      // In production, use face-api.js or backend ML service for real matching
      const matchedFace = faces.find(f => f.faceData);

      if (matchedFace) {
        // Try backend face-auth endpoint (sends face image, not a password)
        try {
          const res = await fetch(`${API_BASE}/auth/face-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: matchedFace.email,
              faceImage,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setToken(data.token);
            setUser({ ...data.user, faceData: matchedFace.faceData });
            return true;
          }
        } catch {
          // Backend unavailable, use demo mode
        }

        // Demo mode: find user in local storage and set state directly
        const savedUsers = localStorage.getItem('demo_users');
        if (savedUsers) {
          const users = JSON.parse(savedUsers);
          const foundUser = users.find((u: { email: string }) => u.email === matchedFace.email);
          if (foundUser) {
            const demoToken = 'demo_token_' + Date.now();
            setToken(demoToken);
            setUser({
              id: foundUser.id,
              email: foundUser.email,
              nombre: foundUser.nombre,
              apellido: foundUser.apellido,
              region: foundUser.region,
              faceData: matchedFace.faceData,
            });
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          nombre: data.nombre,
          apellido: data.apellido,
          region: data.region,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await res.json();

      // Save face data locally for Face ID
      if (data.faceData) {
        const savedFaces = localStorage.getItem('registered_faces');
        const faces = savedFaces ? JSON.parse(savedFaces) : [];
        faces.push({ email: data.email, faceData: data.faceData });
        localStorage.setItem('registered_faces', JSON.stringify(faces));
      }

      setToken(result.token);
      setUser({ ...result.user, faceData: data.faceData });
      return true;
    } catch (error) {
      console.error('Register error:', error);

      // Demo mode: Save user locally when backend unavailable.
      // Passwords are never stored in localStorage.
      const newUser = {
        id: 'demo_' + Date.now(),
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        region: data.region,
        faceData: data.faceData,
      };

      // Save to demo users
      const savedUsers = localStorage.getItem('demo_users');
      const users = savedUsers ? JSON.parse(savedUsers) : [];

      // Check if email already exists
      if (users.some((u: { email: string }) => u.email === data.email)) {
        return false;
      }

      users.push(newUser);
      localStorage.setItem('demo_users', JSON.stringify(users));

      // Save face data for Face ID
      if (data.faceData) {
        const savedFaces = localStorage.getItem('registered_faces');
        const faces = savedFaces ? JSON.parse(savedFaces) : [];
        faces.push({ email: data.email, faceData: data.faceData });
        localStorage.setItem('registered_faces', JSON.stringify(faces));
      }

      const demoToken = 'demo_token_' + Date.now();
      setToken(demoToken);
      setUser({
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        region: newUser.region,
        faceData: newUser.faceData,
      });
      return true;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('auto_demo_mode');
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) return false;

      const updated = await res.json();
      setUser(prev => prev ? { ...prev, ...updated } : null);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isDemoMode,
        login,
        loginWithFace,
        loginAsDemo,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
