import React from 'react';

export enum UserRole {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST',
  TEACHER = 'TEACHER'
}

export interface Student {
  id: string;
  fullName: string;
  regNumber: string;
  pin: string; // Added PIN for secure access
  classLevel: string;
  guardianPhone: string;
  feesPaid: boolean;
  photoUrl?: string;
  email?: string;
  applicationDate?: string;
  // New fields
  dateOfBirth?: string;
  address?: string;
  lastSchoolAttended?: string;
  graduationYear?: string;
  parentOccupation?: string;
  status?: 'Admitted' | 'Pending' | 'Applicant';
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  assignedClasses: string[];
  subjects: string[];
}

export interface SubjectResult {
  subject: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
}

export interface TermResult {
  term: string;
  year: string;
  results: SubjectResult[];
  teacherComment?: string;
  aiAnalysis?: string;
  // New Statistics
  position?: string;
  totalStudents?: number;
  average?: number;
  totalScore?: number;
  nextTermBegins?: string;
}

export interface ApplicationForm {
  fullName: string;
  dateOfBirth: string;
  address: string;
  lastSchoolAttended: string;
  graduationYear: string;
  parentOccupation: string;
  applyingForClass: string;
  parentPhone: string;
  email: string;
  // Security & Tracking
  userId?: string;
  paymentReference?: string;
  paymentStatus?: 'pending' | 'verified';
}

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  author?: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}