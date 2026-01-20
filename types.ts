
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
  pin: string;
  classLevel: string;
  guardianPhone: string;
  feesPaid: boolean;
  photoUrl?: string;
  email?: string;
  applicationDate?: string;
  dateOfBirth?: string;
  address?: string;
  // Added to fix "property 'status' does not exist" errors in constants.ts
  status?: string;
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
  // Fields made optional or added to match mock data in constants.ts
  id?: string;
  studentId?: string;
  studentName?: string;
  regNumber?: string;
  classLevel?: string;
  term: string;
  session?: string;
  // Added to fix "property 'year' does not exist" error in constants.ts
  year?: string;
  results: SubjectResult[];
  // Stats computed by the system
  totalScore: number;
  average: number;
  position: string;
  classPopulation?: number;
  // Added to match properties used in mock data
  totalStudents?: number;
  nextTermBegins?: string;
  teacherComment?: string;
  principalComment?: string;
  dateGenerated?: string;
}

export interface ApplicationForm {
  id: string;
  fullName: string;
  classApplied: string;
  phone: string;
  email: string;
  payment_reference: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  user_id: string;
  photo_url?: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
}
