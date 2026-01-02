export enum ViewState {
  HOME = 'HOME',
  TRANSPORT = 'TRANSPORT',
  AR_SCANNER = 'AR_SCANNER',
  STORIES = 'STORIES',
  CHAT = 'CHAT',
  PROGRAM = 'PROGRAM',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  PROFILE = 'PROFILE',
  USER_PROFILE = 'USER_PROFILE',
  BADGES = 'BADGES',
  LEADERBOARD = 'LEADERBOARD',
  DIRECT_MESSAGES = 'DIRECT_MESSAGES',
  DIRECT_CHAT = 'DIRECT_CHAT',
  SEARCH = 'SEARCH',
  EVENTS = 'EVENTS',
  EVENT_DETAIL = 'EVENT_DETAIL'
}

export interface BusRoute {
  id: string;
  name: string;
  color: string;
  type: 'TRONCAL' | 'ESPECIAL' | 'PEATONAL';
  eta: number; // minutes
  stops: string[];
}

export interface Story {
  id: string;
  user: string;
  avatar: string;
  mediaUrl: string; // Image or Video placeholder
  location: string;
  likes: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface CulturalPoint {
  id: string;
  title: string;
  description: string;
  coordinate: { x: number; y: number }; // Relative percentage for map
  type: 'EVENT' | 'LANDMARK';
}
