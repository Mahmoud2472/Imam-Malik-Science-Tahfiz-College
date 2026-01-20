import React, { useState, useEffect } from 'react';
import { BookOutlined, LogoutOutlined, UserOutlined, SearchOutlined, CalculatorOutlined, UploadOutlined, FileExcelOutlined, DownloadOutlined, CheckCircleOutlined, InfoCircleOutlined, SaveOutlined, LoadingOutlined } from '@ant-design/icons';
import { BookOpen, LogOut, User, Search, Calculator, Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, Save, Loader2, RefreshCw, FileText } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_TEACHERS } from '../constants';
import { Teacher, Student, SubjectResult } from '../types';
import { driveService } from '../services/driveService';
import * as XLSX from 'xlsx';

const TeacherDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [selectedClass, setSelectedClass] = useState('JSS 1');
  const [searchReg, setSearchReg] = useState('');
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [subject, setSubject] = useState('');
  const [caScore, setCaScore] = useState<number>(0);
  const [examScore, setExamScore] = useState<number>(0);
  const [term, setTerm] = useState('1st Term');
  const [session, setSession] = useState('2024/2025');
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = MOCK_TEACHERS.find(t => t.email === email);
    if (teacher && password.length > 3) { setCurrentTeacher(teacher); setIsAuthenticated(true); } 
    else alert("Invalid Teacher Credentials.");
  };

  const handleSearchStudent = async () => {
    // Regex validation for format IMST/YYYY/NNN
    const regRegex = /^IMST\/\d{4}\/\d{3}$/i;
    if (!regRegex.test(searchReg)) {
      setTargetStudent(null);
      setMessage('Invalid format! Use IMST/YYYY/NNN (e.g., IMST/2024/001)');
      return;
    }

    const students = await driveService.getTable('imst_students');
    const allStudents = [...students, ...MOCK_STUDENTS];
    const found = allStudents.find(s => s.regNumber.toUpperCase() === searchReg.toUpperCase());
    if (found) { setTargetStudent(found); setMessage(''); } 
    else { setTargetStudent(null); setMessage('Student not found in database.'); }
  };

  const calculateGrade = (total: number) => {
    if (total >= 70) return { grade: 'A', remark: 'Excellent' };
    if (total >= 60) return { grade: 'B', remark: 'Very Good' };
    if (total >= 50) return { grade: 'C', remark: 'Credit' };
    if (total >= 45) return { grade: 'D', remark: 'Pass' };
    if (total >= 40) return { grade: 'E', remark: 'Fair' };
    return { grade: 'F', remark: 'Fail' };
  };

  const downloadTemplate = () => {
    const data = [
      { RegNumber: 'IMST/2024/001', CAScore: 30, ExamScore: 55 },
      { RegNumber: 'IMST/2024/002', CAScore: 25, ExamScore: 40 }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "IMST_Results_Template.xlsx");
  };

  const handleSaveResult = async () => {
    if (!targetStudent || !subject) return alert("Select Student and Subject first.");
    const total = caScore + examScore;
    if (total > 100) return alert("Total score cannot exceed 100");
    
    setIsSaving(true);
    const { grade, remark } = calculateGrade(total);
    const newSubjectResult: SubjectResult = { subject, ca: caScore, exam: examScore, total, grade, remark };

    const results = await driveService.getTable('imst_results');
    const existing = results.find((r: any) => r.studentId === targetStudent.id && r.term === term && r.session === session);

    let updatedResult;
    if (existing) {
      const otherSubjects = existing.results.filter((s: any) => s.subject !== subject);
      const newSubjectList = [...otherSubjects, newSubjectResult];
      const newTotal = newSubjectList.reduce((acc, curr) => acc + curr.total, 0);
      updatedResult = { ...existing, results: newSubjectList, totalScore: newTotal, average: newTotal / newSubjectList.length };
    } else {
      updatedResult = {
        studentId: targetStudent.id,
        studentName: targetStudent.fullName,
        regNumber: targetStudent.regNumber,
        classLevel: targetStudent.classLevel,
        term,
        session,
        results: [newSubjectResult],
        totalScore: total,
        average: total,
        position: 'PENDING',
        classPopulation: 0,
        dateGenerated: new Date().toISOString()
      };
    }

    await driveService.upsert('imst_results', updatedResult, 'id');
    setIsSaving(false);
    setMessage(`Successfully saved ${subject} for ${targetStudent.fullName}.`);
    setCaScore(0); setExamScore(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const arrayBuffer = evt.target?.result as ArrayBuffer;
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            setBulkPreview(data);
        } catch (error) { alert("Error parsing file."); }
    };
    reader.readAsArrayBuffer(file);
  };

  const processBulk = async () => {
    setIsSaving(true);
    const students = await driveService.getTable('imst_students');
    const allStudents = [...students, ...MOCK_STUDENTS];

    for (const row of bulkPreview) {
      // Robust column mapping
      const reg = row.RegNumber || row.regnumber || row.Registration;
      const ca = Number(row.CAScore || row.ca || row.CA || 0);
      const exam = Number(row.ExamScore || row.exam || row.Exam || 0);
      
      const s = allStudents.find(st => st.regNumber.toUpperCase() === String(reg).toUpperCase());
      if (!s) continue;

      const total = ca + exam;
      const { grade, remark } = calculateGrade(total);
      const res = { subject, ca, exam, total, grade, remark };
      
      const allResults = await driveService.getTable('imst_results');
      const existing = allResults.find((r: any) => r.studentId === s.id && r.term === term && r.session === session);

      if (existing) {
        const others = existing.results.filter((sub: any) => sub.subject !== subject);
        const list = [...others, res];
        const tScore = list.reduce((a, b) => a + b.total, 0);
        await driveService.upsert('imst_results', { ...existing, results: list, totalScore: tScore, average: tScore / list.length }, 'id');
      } else {
        await driveService.upsert('imst_results', {
            studentId: s.id, studentName: s.fullName, regNumber: s.regNumber, classLevel: s.classLevel, term, session, results: [res], totalScore: total, average: total, position: 'PENDING', classPopulation: 0, dateGenerated: new Date().toISOString()
        });
      }
    }
    setIsSaving(false);
    setBulkPreview([]);
    alert("Bulk processing complete. Admin must compute rankings before results show in Portal.");
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <h1 className="text-3xl font-black text-center mb-8">Staff Portal</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-purple-600 font-bold" placeholder="teacher@school.com" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-purple-600 font-bold" placeholder="Password" required />
          <button type="submit" className="w-full bg-purple-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-purple-800 shadow-xl transition-all">Sign In</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div><h1 className="text-4xl font-black text-slate-900 tracking-tight">Staff Dashboard</h1><p className="text-slate-500 font-medium tracking-tight">Academic Grading System</p></div>
        <button onClick={() => setIsAuthenticated(false)} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black hover:bg-red-100 transition-all flex items-center shadow-sm">
          <LogOut className="mr-2" size={20}/> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h2 className="font-black text-lg mb-6 flex items-center uppercase tracking-widest text-slate-400 text-xs">Configuration</h2>
              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Class</label>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold">
                        {currentTeacher?.assignedClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Subject</label>
                    <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold"><option value="">Select Subject</option>{currentTeacher?.subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Term</label>
                        <select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold"><option>1st Term</option><option>2nd Term</option><option>3rd Term</option></select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Session</label>
                        <select value={session} onChange={(e) => setSession(e.target.value)} className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold"><option>2024/2025</option></select>
                    </div>
                 </div>
              </div>
           </div>
           
           <button onClick={downloadTemplate} className="w-full p-6 bg-slate-900 text-white rounded-[2rem] font-black flex items-center justify-center hover:bg-slate-800 transition-all shadow-xl group">
              <FileSpreadsheet className="mr-3 group-hover:scale-110 transition-transform" /> Download Template
           </button>
        </div>

        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="flex border-b bg-slate-50/50">
              <button onClick={() => setActiveTab('single')} className={`flex-1 py-5 text-sm font-black transition-all ${activeTab === 'single' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Manual Entry</button>
              <button onClick={() => setActiveTab('bulk')} className={`flex-1 py-5 text-sm font-black transition-all ${activeTab === 'bulk' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Bulk Excel Import</button>
           </div>
           
           <div className="p-10">
              {activeTab === 'single' ? (
                 <div className="space-y-8 animate-fadeIn">
                    <div className="flex gap-3">
                        <input type="text" value={searchReg} onChange={(e)=>setSearchReg(e.target.value)} className={`flex-grow p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-purple-600 font-bold transition-all ${searchReg && !/^IMST\/\d{4}\/\d{3}$/i.test(searchReg) ? 'border-red-300' : 'border-slate-100'}`} placeholder="Student Reg No (e.g. IMST/2024/001)" />
                        <button onClick={handleSearchStudent} className="bg-purple-600 text-white px-8 rounded-2xl hover:bg-purple-700 transition-all shadow-lg active:scale-95"><Search size={24}/></button>
                    </div>

                    {message && <div className={`p-4 font-bold rounded-2xl border flex items-center ${message.includes('Invalid format') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                      {message.includes('Invalid format') ? <AlertCircle size={18} className="mr-3"/> : <RefreshCw size={18} className="mr-3"/>} 
                      {message}
                    </div>}

                    {targetStudent && (
                       <div className="bg-slate-50 p-10 rounded-[2.5rem] border-2 border-slate-100 relative overflow-hidden group">
                          <div className="flex items-center mb-10">
                              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mr-6 shadow-sm"><User size={32}/></div>
                              <div>
                                  <h3 className="text-2xl font-black text-slate-900">{targetStudent.fullName}</h3>
                                  <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">{targetStudent.regNumber} • {targetStudent.classLevel}</p>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">CA Score (Max 40)</label>
                                <input type="number" max="40" value={caScore} onChange={(e)=>setCaScore(Number(e.target.value))} className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-purple-600 font-bold text-xl" />
                             </div>
                             <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Exam Score (Max 60)</label>
                                <input type="number" max="60" value={examScore} onChange={(e)=>setExamScore(Number(e.target.value))} className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-purple-600 font-bold text-xl" />
                             </div>
                          </div>
                          
                          <button onClick={handleSaveResult} disabled={isSaving} className="w-full mt-10 bg-purple-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-purple-800 transition-all active:scale-95 flex items-center justify-center">
                            {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-3" />} Save Grade
                          </button>
                       </div>
                    )}
                 </div>
              ) : (
                 <div className="space-y-8 text-center animate-fadeIn">
                    <div className="p-16 border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50 hover:border-purple-300 transition-all group">
                        <FileSpreadsheet className="w-20 h-20 text-slate-200 mx-auto mb-6 group-hover:text-purple-400 transition-colors" />
                        <h4 className="text-xl font-black text-slate-900 mb-2">Academic Bulk Import</h4>
                        <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium">Upload your processed Excel file. Ensure it contains correct student Reg Numbers.</p>
                        
                        <input type="file" onChange={handleFileUpload} className="hidden" id="fileUpload" />
                        <label htmlFor="fileUpload" className="inline-flex items-center px-10 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-black cursor-pointer hover:border-purple-600 transition-all shadow-sm active:scale-95">
                           <Upload className="mr-3" size={20}/> Choose File
                        </label>
                    </div>

                    {bulkPreview.length > 0 && (
                        <div className="bg-green-50 p-8 rounded-[2rem] border-2 border-green-100">
                           <h3 className="text-green-800 font-black mb-6 flex items-center justify-center"><CheckCircle size={20} className="mr-2"/> Found {bulkPreview.length} student records</h3>
                           <button onClick={processBulk} disabled={isSaving} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-green-700 transition-all">
                              {isSaving ? <Loader2 className="animate-spin" /> : 'Confirm & Upload Data'}
                           </button>
                        </div>
                    )}
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;