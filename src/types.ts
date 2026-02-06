
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserType {
  PRESCHOOLER = 'PRESCHOOLER',
  SCHOOLER = 'SCHOOLER'
}

export enum SubscriptionStatus {
  NONE = 'none',
  TRIAL_ACTIVE = 'trial_active',
  TRIAL_EXPIRED = 'trial_expired',
  SUBSCRIBED_ACTIVE = 'subscribed_active',
  SUBSCRIBED_EXPIRED = 'subscribed_expired'
}

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  role: UserRole;
  type: UserType;
  classLevel?: number; // 1-11
  learningGoal: string | null;
  registeredAt: string;
  consents: {
    privacyPolicy: boolean;
    termsOfUse: boolean;
    dataProcessing: boolean;
  };
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  trialStart?: string;
  trialEnd?: string;
  subStart?: string;
  subEnd?: string;
}

export interface AppState {
  testMode: boolean;
  lastTestBroadcastAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type LearningMode = 
  | 'explain' 
  | 'solve_with_me' 
  | 'training' 
  | 'check_solution' 
  | 'exam_prep';

export interface GameStats {
  stars: number;
  streak: number;
  completedGames: string[];
}
