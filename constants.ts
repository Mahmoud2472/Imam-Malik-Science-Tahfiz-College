import { Student, TermResult, Post, Teacher } from './types';

export const SCHOOL_NAME = "Imam Malik Science & Tahfiz College";
export const SCHOOL_ADDRESS = "Karefa Road Tudun Wada Dankadai, Kano State";
export const SCHOOL_PHONE = "07011748311";
export const SCHOOL_EMAIL = "maitechitservices6@gmail.com";

// Payment Links
export const PAYSTACK_APP_FEE_LINK = "https://paystack.shop/pay/mxrl-hceiv";
export const PAYSTACK_SCHOOL_FEE_LINK = "https://paystack.shop/pay/njvkcjper-";

// Fee Amounts
export const APPLICATION_FEE_AMOUNT = 1200;

// Mock Data for Demo Purposes
export const MOCK_STUDENTS: Student[] = [
  {
    id: '1',
    fullName: 'Ahmed Musa',
    regNumber: 'IMST/2024/001',
    pin: '12345',
    classLevel: 'JSS 1',
    guardianPhone: '08012345678',
    feesPaid: true,
    photoUrl: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200&auto=format&fit=crop',
    status: 'Admitted'
  },
  {
    id: '2',
    fullName: 'Fatima Abdullahi',
    regNumber: 'IMST/2024/002',
    pin: '54321',
    classLevel: 'JSS 2',
    guardianPhone: '08087654321',
    feesPaid: false,
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop',
    status: 'Admitted'
  }
];

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 't1',
    fullName: 'Mallam Ibrahim',
    email: 'teacher@school.com',
    assignedClasses: ['JSS 1', 'JSS 2'],
    subjects: ['Mathematics', 'Basic Science']
  }
];

export const MOCK_RESULTS: Record<string, TermResult[]> = {
  '1': [
    {
      term: '1st Term',
      year: '2024/2025',
      position: '3rd',
      totalStudents: 45,
      average: 83.6,
      totalScore: 418,
      nextTermBegins: '2025-05-05',
      results: [
        { subject: 'Mathematics', ca: 30, exam: 55, total: 85, grade: 'A', remark: 'Excellent' },
        { subject: 'English', ca: 28, exam: 50, total: 78, grade: 'B', remark: 'Very Good' },
        { subject: 'Quranic Studies', ca: 35, exam: 57, total: 92, grade: 'A', remark: 'Outstanding' },
        { subject: 'Basic Science', ca: 30, exam: 58, total: 88, grade: 'A', remark: 'Excellent' },
        { subject: 'Arabic', ca: 25, exam: 50, total: 75, grade: 'B', remark: 'Good' }
      ]
    }
  ]
};

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Entrance Examination Dates Announced',
    content: 'The entrance examination for the 2025/2026 academic session has been scheduled for Saturday, 15th August 2025. All applicants are expected to arrive by 8:00 AM with their writing materials.',
    date: '2025-06-10'
  },
  {
    id: '2',
    title: 'School Resumption for 3rd Term',
    content: 'We are pleased to announce that the school will resume for the 3rd term academic activities on Monday, 5th May 2025. Parents are advised to settle all outstanding fees before resumption.',
    date: '2025-04-20'
  }
];