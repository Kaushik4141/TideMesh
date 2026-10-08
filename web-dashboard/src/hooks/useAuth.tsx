'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'DUTY_OFFICER' | 'INCIDENT_COMMANDER' | 'COMMISSIONER' | 'OBSERVER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  avatarInitials: string;
}

export const MOCK_USERS: User[] = [
  {
    id: 'user-officer',
    name: 'R. Shetty',
    role: 'DUTY_OFFICER',
    roleTitle: 'Duty Officer · Shift 1',
    avatarInitials: 'RS',
  },
  {
    id: 'user-commander',
    name: 'K. Rao',
    role: 'INCIDENT_COMMANDER',
    roleTitle: 'Incident Commander',
    avatarInitials: 'KR',
  },
  {
    id: 'user-commissioner',
    name: 'Dr. V. Hegde',
    role: 'COMMISSIONER',
    roleTitle: 'Municipal Commissioner (Executive)',
    avatarInitials: 'VH',
  },
  {
    id: 'user-observer',
    name: 'A. Nayak',
    role: 'OBSERVER',
    roleTitle: 'Field Observer / Media',
    avatarInitials: 'AN',
  },
];

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
}

const AuthContext = createContext<AuthContextType>({
  currentUser: MOCK_USERS[0],
  setCurrentUser: () => {},
  users: MOCK_USERS,
});

const AUTH_STORAGE_KEY = 'tidemesh:auth:current_user_id';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User>(MOCK_USERS[0]);

  // Load saved user on mount
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedId) {
        const found = MOCK_USERS.find((u) => u.id === savedId);
        if (found) {
          setCurrentUserState(found);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, user.id);
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, users: MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Permission checker: returns whether current role has a specific capability
 */
export function usePermission() {
  const { currentUser } = useAuth();

  const can = (permission: string): boolean => {
    if (!permission) return true;

    // Actions requiring responder write capabilities
    if (permission === 'acknowledge') {
      return currentUser.role === 'DUTY_OFFICER' || currentUser.role === 'INCIDENT_COMMANDER';
    }

    if (permission === 'assignTeam') {
      return currentUser.role === 'DUTY_OFFICER' || currentUser.role === 'INCIDENT_COMMANDER';
    }

    if (permission === 'manageAlerts') {
      return currentUser.role === 'DUTY_OFFICER' || currentUser.role === 'INCIDENT_COMMANDER';
    }

    // Navigation and viewing shortcuts are permitted for all roles
    return true;
  };

  return {
    can,
    role: currentUser.role,
    isReadOnly: currentUser.role === 'COMMISSIONER' || currentUser.role === 'OBSERVER',
  };
}
