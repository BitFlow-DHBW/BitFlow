import type { Circuit, CustomComponent, SignalState } from './circuit';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  createdAt: string;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  circuit: Circuit;
  inputSignals: SignalState;
  customComponents: CustomComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  shortcuts: KeyboardShortcuts;
}

export interface KeyboardShortcuts {
  editMode: string;
  simulateMode: string;
  deleteSelection: string;
}

export interface ApiResult<T> {
  data: T;
  status: number;
}

