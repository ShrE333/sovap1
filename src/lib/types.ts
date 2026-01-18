export type UserRole = 'student' | 'teacher' | 'college' | 'admin';

export interface College {
  id: string;
  name: string;
  adminEmail: string;
  licenseCount: number;
  coursesLimit: number;
  licenseExpiry: string;
  status: 'active' | 'expired' | 'pending';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  collegeId?: string;
}

export type ConfidenceLevel = number; // 0 to 1

export interface Topic {
  id: string;
  title: string;
  description: string;
  content: string; // Markdown/HTML content
  prerequisites: string[]; // Topic IDs
  estimatedTime: number; // in minutes
}

export interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  explanation: string;
}

export interface Module {
  id: string;
  title: string;
  topics: Topic[];
  mcqs: MCQ[]; // Pool of 70
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
}

export interface StudentLearningState {
  studentId: string;
  courseId: string;
  topicConfidence: Record<string, ConfidenceLevel>; // topicId -> confidence
  topicMastery: Record<string, boolean>; // topicId -> mastered
  attemptHistory: Attempt[];
  labStatus: Record<string, LabStatus>;
  lastActive: string;
  currentPath: string[]; // suggested sequence of topic IDs
}

export interface Attempt {
  topicId: string;
  timestamp: string;
  score: number;
  confidence: ConfidenceLevel;
}

export type LabStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'failed';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
