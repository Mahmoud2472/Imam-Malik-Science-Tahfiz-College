import React, { useState } from 'react';
import { BookOpen, LogOut, User, Search, Calculator, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_TEACHERS } from '../constants';
import { Teacher, Student, SubjectResult } from '../types';
import * as XLSX from 'xlsx';

const TeacherDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchReg, setSearchReg] = useState('');
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [subject, setSubject] = useState('');
  const [caScore, setCaScore] = useState<number>(0);
  const [examScore, setExamScore] = useState<number>(0);
  const [term, setTerm] = useState('1st Term');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = MOCK_TEACHERS.find(t => t.email === email);
    if (teacher && password.length > 3) { setCurrentTeacher(teacher); setIsAuthenticated(true); } 
    else alert("Invalid Teacher Credentials.");
  };

  const handleSearchStudent = () => {
    const found = MOCK_STUDENTS.find(s => s.regNumber.toUpperCase() === searchReg.toUpperCase());
    if (found) { setTargetStudent(found); setMessage(''); setCaScore(0); setExamScore(0); } 
    else { setTargetStudent(null); setMessage('Student not found.'); }
  };

  const calculateGrade = (total: number) => {
    if (total >= 70) return { grade: 'A', remark: 'Excellent' };
    if (total >= 60) return { grade: 'B', remark: 'Very Good' };
    if (total >= 50) return { grade: 'C', remark: 'Credit' };
    if (total >= 45) return { grade: 'D', remark: 'Pass' };
    if (total >= 40) return { grade: 'E', remark: 'Fair' };
    return { grade: 'F', remark: 'Fail' };
  };

  const handleSaveResult = () => {
    if (!targetStudent || !subject) return;
    const total = caScore + examScore;
    if (total > 100) return alert("Total score cannot exceed 100");
    setMessage(`Successfully saved ${subject} result for ${targetStudent.fullName}.`);
    setCaScore(0); setExamScore(0);
  };

  const downloadTemplate = () => {
    let data: any[] = [];
    if (selectedClass) {
        const classStudents = MOCK_STUDENTS.filter(s => s.classLevel === selectedClass);
        if (classStudents.length > 0) {
            data = classStudents.map(s => ({ "RegNumber": s.regNumber, "StudentName": s.fullName, "CAScore": "", "ExamScore": "" }));
        }
    }
    if (data.length === 0) {
        data = [{ "RegNumber": "IMST/2024/001", "StudentName": "Ahmed Musa", "CAScore": 30, "ExamScore": 50 }];
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ResultTemplate");
    XLSX.writeFile(wb, `${selectedClass || 'Class'}_Result_Template.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const arrayBuffer = evt.target?.result as ArrayBuffer;
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            const processed = data.map((row: any) => {
                const total = (Number(row.CAScore) || 0) + (Number(row.ExamScore) || 0);
                const { grade, remark } = calculateGrade(total);
                return { 
                  regNumber: row.RegNumber, 
                  studentName: row.StudentName, 
                  ca: row.CAScore, 
                  exam: row.ExamScore, 
                  total, 
                  grade, 
                  remark, 
                  isValid: total <= 100 
                };
            });
            setBulkPreview(processed);
        } catch (error) { setBulkError("Error parsing file."); }
    };
    reader.readAsArrayBuffer(file);
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <h1 className="text-2xl font-bold text-center mb-6">Staff Portal</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-md" placeholder="teacher@school.com" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-md" placeholder="Password" required />
          <button type="submit" className="w-full bg-purple-900 text-white py-3 rounded-md font-semibold">Login</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-2xl font-bold text-slate-900">Staff Dashboard</h1><p className="text-slate-600">Welcome, {currentTeacher?.fullName}</p></div>
        <button onClick={() => setIsAuthenticated(false)} className="text-red-600 font-medium">Sign Out</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="font-bold text-lg mb-4">Configuration</h2>
              <div className="space-y-4">
                 <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Class</option>{currentTeacher?.assignedClasses.map(c => <option key={c}>{c}</option>)}</select>
                 <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Subject</option>{currentTeacher?.subjects.map(s => <option key={s}>{s}</option>)}</select>
              </div>
           </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="flex border-b">
              <button onClick={() => setActiveTab('single')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'single' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-slate-500'}`}>Single Entry</button>
              <button onClick={() => setActiveTab('bulk')} className={`flex-1 py-4 text-sm font-bold ${activeTab === 'bulk' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-slate-500'}`}>Bulk Upload</button>
           </div>
           <div className="p-8">
              {activeTab === 'single' ? (
                 <div className="space-y-6">
                    <div className="flex gap-2"><input type="text" value={searchReg} onChange={(e)=>setSearchReg(e.target.value)} className="flex-grow p-2 border rounded" placeholder="Reg Number" /><button onClick={handleSearchStudent} className="bg-purple-600 text-white px-4 rounded"><Search size={18}/></button></div>
                    {targetStudent && (
                       <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                          <p className="font-bold mb-4">{targetStudent.fullName}</p>
                          <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-xs font-bold uppercase block mb-1">CA (40)</label><input type="number" value={caScore} onChange={(e)=>setCaScore(Number(e.target.value))} className="w-full p-2 border rounded" /></div>
                             <div><label className="text-xs font-bold uppercase block mb-1">Exam (60)</label><input type="number" value={examScore} onChange={(e)=>setExamScore(Number(e.target.value))} className="w-full p-2 border rounded" /></div>
                          </div>
                          <button onClick={handleSaveResult} className="w-full mt-6 bg-purple-900 text-white py-2 rounded font-bold">Save Result</button>
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="space-y-6 text-center">
                    <button onClick={downloadTemplate} className="text-blue-600 font-bold flex items-center justify-center mx-auto mb-4"><Download className="h-4 w-4 mr-1"/> Download Template</button>
                    <input type="file" onChange={handleFileUpload} className="hidden" id="fileUpload" /><label htmlFor="fileUpload" className="cursor-pointer block p-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-purple-500 bg-slate-50">Click to Upload Excel Result Sheet</label>
                    {bulkPreview.length > 0 && <button className="w-full bg-green-600 text-white py-3 rounded font-bold">Process {bulkPreview.length} Records</button>}
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;