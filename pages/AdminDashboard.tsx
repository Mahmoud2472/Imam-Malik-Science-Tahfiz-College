import React, { useState, useEffect } from 'react';
import { Users, Brain, FilePlus, ChevronRight, Lock, Loader2, LogOut, User, Mail, Calendar, MapPin, School, Briefcase, PlusCircle, Trash2, Megaphone, GraduationCap, X, FileText, Download, FileSpreadsheet, Edit, Save, Book, Layers, CheckCircle, Sparkles, Search, Filter, LayoutDashboard, Bell, Upload, AlertCircle, Camera, DollarSign, PieChart, BarChart3, CreditCard, Printer, UserPlus, BookOpen, Settings2, UserCog, Wand2, Copy, RefreshCw, Type } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_RESULTS, MOCK_POSTS, MOCK_TEACHERS, SCHOOL_NAME, SCHOOL_ADDRESS, APPLICATION_FEE_AMOUNT } from '../constants';
import { generateStudentReport } from '../services/geminiService';
import { Student, Post, Teacher, TermResult } from '../types';
import { supabase } from '../services/supabaseClient';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import { addPdfHeader, generateReceipt } from '../utils/pdfUtils';

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [academicSubTab, setAcademicSubTab] = useState<'classes' | 'subjects' | 'staff'>('classes');
  
  // Dynamic Academic State
  const [classes, setClasses] = useState<string[]>(['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']);
  const [subjects, setSubjects] = useState<string[]>(['Mathematics', 'English', 'Quranic Studies', 'Basic Science', 'Arabic', 'Social Studies', 'Civic Education']);
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // UI Helpers
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('');
  
  // AI Report States
  const [processingAi, setProcessingAi] = useState<string | null>(null);
  const [aiRemarks, setAiRemarks] = useState<Record<string, string>>({});
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });
  const [reportClass, setReportClass] = useState('');
  const [reportTerm, setReportTerm] = useState('1st Term');

  // Update/Post State
  const [showPostModal, setShowPostModal] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState({ title: '', content: '' });

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase.from('posts').select('*').order('date', { ascending: false });
      if (data) setPosts(data);
      else setPosts(MOCK_POSTS);
    } catch (err) { setPosts(MOCK_POSTS); }
  };

  const fetchApplications = async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      const { data, error } = await supabase.from('applications').select('*').order('id', { ascending: false });
      if (data) {
        const applicants: Student[] = data.map((app: any) => ({
          id: `app-${app.id}`, 
          fullName: app.full_name, 
          regNumber: app.status === 'Admitted' ? 'ADMITTED' : 'APPLICANT',
          pin: 'N/A', 
          classLevel: app.class_applied, 
          guardianPhone: app.phone, 
          feesPaid: !!app.payment_reference, 
          photoUrl: app.photo_url,
          email: app.email, 
          applicationDate: new Date(app.created_at).toLocaleDateString(),
          dateOfBirth: app.dob, 
          address: app.address, 
          lastSchoolAttended: app.last_school, 
          graduationYear: app.grad_year,
          parentOccupation: app.parent_occupation, 
          status: app.status || 'Applicant'
        }));
        setStudents([...MOCK_STUDENTS, ...applicants]);
      }
    } catch (err) { console.error(err); } finally { setLoadingData(false); }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
      fetchPosts();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    if (email === 'admin@school.com' && password === 'admin') { 
      setIsAuthenticated(true); 
      setAuthLoading(false); 
      return; 
    }
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert("Login Failed: " + error.message); else setIsAuthenticated(true);
    } catch (err) { alert("Invalid credentials."); }
    setAuthLoading(false);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPost(true);
    try {
      if (editingPostId) {
        await supabase.from('posts').update({ title: postForm.title, content: postForm.content }).eq('id', editingPostId);
      } else {
        await supabase.from('posts').insert([{ title: postForm.title, content: postForm.content, date: new Date().toISOString().split('T')[0] }]);
      }
      await fetchPosts();
      setShowPostModal(false);
    } catch (err: any) {
      alert("Database Error: " + err.message);
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Permanently delete this announcement?")) return;
    try {
      await supabase.from('posts').delete().eq('id', id);
      await fetchPosts();
    } catch (err: any) { }
  };

  const handleGenerateAiComment = async (student: Student) => {
    setProcessingAi(student.id);
    try {
      const lookupId = student.id.replace('app-', '');
      const studentResults = (MOCK_RESULTS[lookupId] || MOCK_RESULTS[student.id] || []).find(r => r.term === reportTerm);
      if (!studentResults) {
        alert("No results found for " + student.fullName + ". Please enter scores first.");
        return;
      }
      const comment = await generateStudentReport(student.fullName, studentResults.results, studentResults.average, studentResults.totalScore);
      setAiRemarks(prev => ({ ...prev, [student.id]: comment }));
    } catch (err) {
      console.error(err);
      alert("AI Generation Error.");
    } finally {
      setProcessingAi(null);
    }
  };

  const handleGenerateAllAiRemarks = async () => {
    if (!reportClass) return alert("Select a class.");
    const classStudents = students.filter(s => s.classLevel === reportClass);
    if (classStudents.length === 0) return alert("No students in this class.");
    setIsBulkGenerating(true);
    setAiProgress({ current: 0, total: classStudents.length });
    for (let i = 0; i < classStudents.length; i++) {
      const student = classStudents[i];
      setAiProgress(prev => ({ ...prev, current: i + 1 }));
      const lookupId = student.id.replace('app-', '');
      const res = (MOCK_RESULTS[lookupId] || MOCK_RESULTS[student.id] || []).find(r => r.term === reportTerm);
      if (res) {
        setProcessingAi(student.id);
        try {
          const comment = await generateStudentReport(student.fullName, res.results, res.average, res.totalScore);
          setAiRemarks(prev => ({ ...prev, [student.id]: comment }));
        } catch (e) { }
      }
    }
    setProcessingAi(null);
    setIsBulkGenerating(false);
    alert("Batch Processing Complete!");
  };

  const handleCopyRemark = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Remark copied to clipboard!");
  };

  const handleToggleFeeStatus = async (id: string) => {
    const isApp = id.startsWith('app-');
    if (isApp) {
      const actualId = id.replace('app-', '');
      const studentToUpdate = students.find(s => s.id === id);
      const newStatus = !studentToUpdate?.feesPaid;
      try {
        await supabase.from('applications').update({ 
          payment_reference: newStatus ? `ADMIN-VERIFIED-${Date.now()}` : null 
        }).eq('id', actualId);
      } catch (e) {}
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, feesPaid: !s.feesPaid } : s));
    if (selectedStudent?.id === id) setSelectedStudent(prev => prev ? { ...prev, feesPaid: !prev.feesPaid } : null);
  };

  const handleApproveApplicant = async (student: Student) => {
    if (!confirm(`Approve ${student.fullName}?`)) return;
    const newReg = `IMST/2025/${Math.floor(1000 + Math.random() * 9000)}`;
    if (student.id.startsWith('app-')) {
      const actualId = student.id.replace('app-', '');
      try {
        await supabase.from('applications').update({ status: 'Admitted' }).eq('id', actualId);
      } catch (e) {}
    }
    setStudents(students.map(s => s.id === student.id ? { ...s, status: 'Admitted', regNumber: newReg, feesPaid: true } : s));
    if (selectedStudent?.id === student.id) setSelectedStudent({ ...student, status: 'Admitted', regNumber: newReg, feesPaid: true } as Student);
  };

  const generateAllReportCards = async () => {
    if (!reportClass) return alert("Select a class.");
    const classStudents = students.filter(s => s.classLevel === reportClass);
    if (classStudents.length === 0) return alert("No students found.");
    const doc = new jsPDF();
    let isFirstPage = true;
    for (const student of classStudents) {
      const lookupId = student.id.replace('app-', '');
      const res = (MOCK_RESULTS[lookupId] || MOCK_RESULTS[student.id] || []).find(r => r.term === reportTerm);
      if (res) {
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;
        const yStart = await addPdfHeader(doc, "TERM REPORT CARD", `${reportTerm} ${res.year}`);
        let y = yStart + 10;
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text("Student Name:", 15, y);
        doc.setFont("helvetica", "normal"); doc.text(student.fullName, 45, y);
        doc.setFont("helvetica", "bold"); doc.text("Reg No:", 130, y);
        doc.setFont("helvetica", "normal"); doc.text(student.regNumber, 155, y);
        y += 8; doc.setFont("helvetica", "bold"); doc.text("Class:", 15, y);
        doc.setFont("helvetica", "normal"); doc.text(student.classLevel, 45, y);
        y += 10; doc.setFillColor(30, 58, 138); doc.rect(15, y, 180, 8, 'F');
        doc.setTextColor(255); doc.setFontSize(9);
        doc.text("SUBJECT", 17, y + 5.5); doc.text("TOTAL", 100, y + 5.5); doc.text("GRADE", 130, y + 5.5); doc.text("REMARK", 160, y + 5.5);
        y += 8; doc.setTextColor(0);
        res.results.forEach((sub, i) => {
          if (i % 2 === 0) doc.setFillColor(248, 250, 252); else doc.setFillColor(255, 255, 255);
          doc.rect(15, y, 180, 7, 'F'); doc.text(sub.subject, 17, y + 5); doc.text(sub.total.toString(), 100, y + 5); doc.text(sub.grade, 130, y + 5);
          doc.setFontSize(7); doc.text(sub.remark, 160, y + 5); doc.setFontSize(9);
          y += 7;
        });
        y += 10; doc.setFont("helvetica", "bold"); doc.text("AI ACADEMIC ANALYSIS & PRINCIPAL'S REMARK:", 15, y);
        y += 5; doc.setFont("helvetica", "italic"); doc.setFontSize(8);
        const remark = aiRemarks[student.id] || "Academic potential is evident; keep striving for excellence.";
        const splitRemark = doc.splitTextToSize(`"${remark}"`, 175); doc.text(splitRemark, 15, y);
        y += (splitRemark.length * 4) + 10; doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text(`AVERAGE: ${res.average}%`, 15, y); doc.text(`POSITION: ${res.position}`, 80, y); doc.text(`TOTAL SCORE: ${res.totalScore}`, 140, y);
      }
    }
    doc.save(`${reportClass}_Batch_Report_Cards.pdf`);
  };

  const generatePaymentReport = () => {
    const data: any[] = students.map(s => ({
      "Student Name": s.fullName,
      "Reg Number": s.regNumber,
      "Class": s.classLevel,
      "Status": s.feesPaid ? 'PAID' : 'PENDING',
      "Ref": s.feesPaid ? 'Verified' : 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PaymentReport");
    XLSX.writeFile(wb, `School_Fees_Report_${new Date().toLocaleDateString()}.xlsx`);
  };

  if (!isAuthenticated) return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-100">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Portal</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-md" placeholder="admin@school.com" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-md" placeholder="Password" required />
            <button type="submit" disabled={authLoading} className="w-full bg-blue-900 text-white py-3 rounded-md font-bold">{authLoading ? "Loading..." : "Sign In"}</button>
          </form>
          <div className="mt-4 text-center text-xs text-blue-500">Demo: admin@school.com / admin</div>
        </div>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1><p className="text-slate-500 mt-1">Cloud-synced management for IMST College.</p></div>
        <button onClick={() => setIsAuthenticated(false)} className="flex items-center text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"><LogOut className="h-4 w-4 mr-2" /> Sign Out</button>
      </div>
      
      <div className="flex space-x-2 mb-6 border-b border-slate-200 overflow-x-auto pb-1">
        {[ 
            { id: 'overview', label: 'Overview', icon: LayoutDashboard }, 
            { id: 'records', label: 'Students', icon: Users }, 
            { id: 'academics', label: 'School Setup', icon: Settings2 }, 
            { id: 'finance', label: 'Finance', icon: DollarSign },
            { id: 'reports', label: 'Reports & AI', icon: Brain },
            { id: 'updates', label: 'Updates', icon: Megaphone }
        ].map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex items-center px-4 py-3 font-medium text-sm transition-all rounded-t-lg ${ activeTab===tab.id ? 'bg-white text-blue-600 border-x border-t border-slate-200 shadow-sm -mb-px' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50' }`}> <tab.icon className={`h-4 w-4 mr-2 ${activeTab===tab.id ? 'text-blue-600' : 'text-slate-400'}`} /> {tab.label} </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center"><div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4"><Users size={24}/></div><div><p className="text-slate-500 text-sm">Total Students</p><h3 className="text-2xl font-bold">{students.length}</h3></div></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center"><div className="p-3 bg-green-100 text-green-600 rounded-full mr-4"><DollarSign size={24}/></div><div><p className="text-slate-500 text-sm">Revenue Today</p><h3 className="text-2xl font-bold">₦{students.filter(s=>s.feesPaid).length * 50000}</h3></div></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center"><div className="p-3 bg-purple-100 text-purple-600 rounded-full mr-4"><Brain size={24}/></div><div><p className="text-slate-500 text-sm">AI Remarks Gen</p><h3 className="text-2xl font-bold">{Object.keys(aiRemarks).length}</h3></div></div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center"><div className="p-3 bg-yellow-100 text-yellow-600 rounded-full mr-4"><Megaphone size={24}/></div><div><p className="text-slate-500 text-sm">Active Updates</p><h3 className="text-2xl font-bold">{posts.length}</h3></div></div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="space-y-6 animate-fadeIn">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Payment & Fee Reports</h2>
              <button onClick={generatePaymentReport} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow hover:bg-green-700"><FileSpreadsheet className="h-4 w-4 mr-2" /> Export to Excel</button>
           </div>
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b">
                    <tr><th className="px-6 py-4">Student</th><th className="px-6 py-4">Class</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Action</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {students.map(s => (
                       <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4"><p className="font-bold">{s.fullName}</p><p className="text-[10px] text-slate-400 font-mono">{s.regNumber}</p></td>
                          <td className="px-6 py-4">{s.classLevel}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${s.feesPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.feesPaid ? 'PAID' : 'PENDING'}</span></td>
                          <td className="px-6 py-4"><button onClick={() => handleToggleFeeStatus(s.id)} className="text-blue-600 text-xs font-bold hover:underline">{s.feesPaid ? 'Mark Unpaid' : 'Verify Payment'}</button></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'academics' && (
        <div className="animate-fadeIn">
           <div className="flex space-x-4 mb-6">
              {['classes', 'subjects', 'staff'].map(sub => (
                 <button key={sub} onClick={() => setAcademicSubTab(sub as any)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${academicSubTab === sub ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>{sub}</button>
              ))}
           </div>
           
           <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              {academicSubTab === 'classes' && (
                 <div>
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">Class Management</h3><button className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center"><PlusCircle className="h-4 w-4 mr-2"/> Add Class</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       {classes.map(c => (
                          <div key={c} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                             <span className="font-bold text-slate-700">{c}</span>
                             <div className="flex gap-2"><button className="text-slate-400 hover:text-blue-600"><Edit size={16}/></button><button className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button></div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
              {academicSubTab === 'subjects' && (
                 <div>
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">Subject Repository</h3><button className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center"><PlusCircle className="h-4 w-4 mr-2"/> Add Subject</button></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                       {subjects.map(s => (
                          <div key={s} className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex justify-between items-center">
                             <span className="font-medium text-slate-700">{s}</span>
                             <button className="text-slate-400 hover:text-red-600"><X size={14}/></button>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
              {academicSubTab === 'staff' && (
                 <div>
                    <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg">Staff Directory</h3><button className="bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center"><UserPlus className="h-4 w-4 mr-2"/> Register Teacher</button></div>
                    <div className="space-y-4">
                       {teachers.map(t => (
                          <div key={t.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                             <div className="flex items-center gap-4"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">{t.fullName.charAt(0)}</div><div><p className="font-bold">{t.fullName}</p><p className="text-xs text-slate-500">{t.subjects.join(', ')}</p></div></div>
                             <div className="flex gap-3"><button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"><UserCog size={18}/></button><button className="text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button></div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'records' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between"><h2 className="font-bold flex items-center"><Users className="h-5 w-5 mr-2 text-blue-600" /> Directory</h2><button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center"><PlusCircle className="h-3 w-3 mr-1" /> Add</button></div>
                    <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md" /></div>
                    <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5"><option value="">All Classes</option>{classes.map(c => <option key={c}>{c}</option>)}</select>
                </div>
                <div className="overflow-y-auto flex-grow">
                  <ul className="divide-y divide-slate-100">
                    {loadingData ? (
                      <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
                    ) : (
                      students.filter(s => {
                        const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase());
                        const matchesClass = filterClass ? s.classLevel === filterClass : true;
                        return matchesSearch && matchesClass;
                      }).map(s => (
                        <li key={s.id} onClick={()=>setSelectedStudent(s)} className={`p-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between ${selectedStudent?.id===s.id?'bg-blue-50 border-l-4 border-blue-600':''}`}>
                          <div className="flex items-center">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 text-white text-xs font-bold ${s.feesPaid ? 'bg-green-500' : 'bg-red-500'}`}>{s.fullName.charAt(0)}</div>
                            <div><p className="font-medium text-slate-900 line-clamp-1">{s.fullName}</p><p className="text-xs text-slate-500 uppercase">{s.regNumber}</p></div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </li>
                      ))
                    )}
                  </ul>
                </div>
            </div>
            <div className="lg:col-span-2">
                {selectedStudent ? (
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 animate-fadeIn">
                        <div className="flex items-start space-x-6 mb-8">
                            <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-slate-50 shadow-sm overflow-hidden">{selectedStudent.photoUrl ? <img src={selectedStudent.photoUrl} className="h-full w-full object-cover"/> : <div className="h-full w-full flex items-center justify-center text-slate-300 text-3xl font-bold">{selectedStudent.fullName.charAt(0)}</div>}</div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900">{selectedStudent.fullName}</h2>
                                <p className="text-slate-500 font-medium">{selectedStudent.classLevel} • {selectedStudent.regNumber}</p>
                                <div className="flex gap-2 mt-3">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${selectedStudent.feesPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedStudent.feesPaid ? 'Fees Cleared' : 'Fees Pending'}</span>
                                    {selectedStudent.status === 'Applicant' && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-yellow-100 text-yellow-800">New Applicant</span>}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                            <button onClick={() => handleToggleFeeStatus(selectedStudent.id)} className={`py-3 rounded-xl font-bold flex items-center justify-center ${selectedStudent.feesPaid ? 'bg-slate-100 text-slate-600' : 'bg-green-600 text-white shadow-lg'}`}>{selectedStudent.feesPaid ? <X className="mr-2 h-4 w-4"/> : <CheckCircle className="mr-2 h-4 w-4"/>} {selectedStudent.feesPaid ? 'Undo Payment' : 'Mark Paid'}</button>
                            {selectedStudent.status === 'Applicant' ? (
                                <button onClick={() => handleApproveApplicant(selectedStudent)} className="bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg"><CheckCircle className="mr-2 h-4 w-4"/> Approve Admission</button>
                            ) : (
                                <button className="bg-blue-900 text-white py-3 rounded-xl font-bold flex items-center justify-center shadow-lg"><Download className="mr-2 h-4 w-4"/> Student ID Card</button>
                            )}
                        </div>
                    </div>
                ) : <div className="h-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 min-h-[400px]"><Users className="h-10 w-10 mb-2 opacity-20"/><p>Select a student to view details</p></div>}
            </div>
          </div>
      )}

      {activeTab === 'updates' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <Megaphone className="h-6 w-6 mr-2 text-orange-500" />
              School Announcements
            </h2>
            <button 
              onClick={() => { setEditingPostId(null); setPostForm({ title: '', content: '' }); setShowPostModal(true); }} 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center shadow-lg hover:bg-blue-700 transition-all"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              New Update
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.date}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => { setEditingPostId(post.id); setPostForm({ title: post.title, content: post.content }); setShowPostModal(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                     <button onClick={() => handleDeletePost(post.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1">{post.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-4 flex-grow italic">"{post.content}"</p>
                <div className="mt-4 pt-4 border-t border-slate-50">
                   <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tighter">Verified Official Announcement</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Post Modal --- */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 relative animate-fadeIn">
              <button onClick={() => setShowPostModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X className="h-6 w-6" /></button>
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">{editingPostId ? 'Edit Announcement' : 'Create New Update'}</h2>
              <form onSubmit={handleSavePost} className="space-y-6">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Update Title</label><input required value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Details / Content</label><textarea required rows={6} value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none transition-all resize-none" /></div>
                <div className="pt-4 flex gap-4">
                  <button type="submit" disabled={isSavingPost} className="flex-grow bg-blue-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-800 transition-all flex items-center justify-center">
                    {isSavingPost ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                    {editingPostId ? 'Update in Cloud' : 'Save to Cloud'}
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;