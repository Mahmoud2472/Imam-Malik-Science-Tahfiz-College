import React, { useState, useEffect } from 'react';
import { 
  Users, User, LogOut, Loader2, PlusCircle, Trash2, Edit, Save, 
  Search, LayoutDashboard, Cloud, RefreshCw, BookOpen, GraduationCap, 
  Layers, UserPlus, X, AlertCircle, ShieldCheck, HardDrive, Download, 
  ExternalLink, CheckCircle, FileBadge, Settings, Plus, FileSpreadsheet,
  Filter, Printer, ChevronRight
} from 'lucide-react';
import { MOCK_STUDENTS, MOCK_TEACHERS } from '../constants';
import { Student, Teacher, ApplicationForm } from '../types';
import { driveService } from '../services/driveService';
import { generateAdmissionLetter } from '../utils/pdfUtils';
import * as XLSX from 'xlsx';

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [applications, setApplications] = useState<ApplicationForm[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  // Report Filters
  const [reportClass, setReportClass] = useState('All');
  const [reportTerm, setReportTerm] = useState('1st Term');
  const [reportSession, setReportSession] = useState('2024/2025');
  const [reportType, setReportType] = useState<'fees' | 'academic'>('fees');

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const cloudStudents = await driveService.getTable('imst_students');
    setStudents(cloudStudents.length ? cloudStudents : MOCK_STUDENTS);
    
    const cloudTeachers = await driveService.getTable('imst_teachers');
    setTeachers(cloudTeachers.length ? cloudTeachers : MOCK_TEACHERS);
    
    const cloudApps = await driveService.getTable('imst_applications');
    setApplications(cloudApps);
    
    const cloudClasses = await driveService.getTable('imst_classes');
    if (!cloudClasses.length) {
      const defaults = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'].map(c => ({ id: btoa(c), name: c }));
      setClasses(defaults);
      for (const c of defaults) {
        await driveService.upsert('imst_classes', c);
      }
    } else {
      setClasses(cloudClasses);
    }
    
    setLastSync(driveService.getLastSyncTime());
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { user, error } = await driveService.signIn(email, password);
    if (!error) setIsAuthenticated(true); else alert(error);
  };

  const handleSyncDrive = async () => {
    setIsSyncing(true);
    try {
      await driveService.exportToDrive();
      setLastSync(new Date().toISOString());
      alert("✅ DATABASE BACKUP READY\n\nCloud file downloaded. Upload to Drive manually.");
    } catch (error) {
      alert("Sync failed.");
    } finally { setIsSyncing(false); }
  };

  const handleComputeRanks = async () => {
    setIsSyncing(true);
    try {
      for (const c of classes) {
        await driveService.computePositions(c.name, '1st Term', '2024/2025');
      }
      alert("✅ Class rankings and averages computed successfully.");
    } finally { setIsSyncing(false); }
  };

  const handleExportStudents = () => {
    const exportData = students.map(s => ({
      'Full Name': s.fullName,
      'Reg Number': s.regNumber,
      'Class Level': s.classLevel,
      'Guardian Phone': s.guardianPhone,
      'Fee Status': s.feesPaid ? 'Paid' : 'Unpaid',
      'PIN': s.pin
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students_List");
    XLSX.writeFile(wb, `IMST_Students_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportFeeReport = () => {
    const filtered = students.filter(s => reportClass === 'All' || s.classLevel === reportClass);
    const exportData = filtered.map(s => ({
      'Student Name': s.fullName,
      'Reg Number': s.regNumber,
      'Class': s.classLevel,
      'Session': reportSession,
      'Term': reportTerm,
      'Payment Status': s.feesPaid ? 'COMPLETED' : 'PENDING',
      'Guardian Contact': s.guardianPhone
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee_Report");
    XLSX.writeFile(wb, `IMST_FeeReport_${reportClass}_${reportTerm.replace(' ', '_')}.xlsx`);
  };

  const handleApproveApp = async (app: any) => {
    const newStudent = {
      fullName: app.fullName,
      regNumber: `IMST/${new Date().getFullYear()}/${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`,
      pin: Math.floor(10000 + Math.random() * 90000).toString(),
      classLevel: app.classApplied,
      guardianPhone: app.phone,
      feesPaid: false,
      photoUrl: app.photo_url,
      status: 'Admitted'
    };
    await driveService.upsert('imst_students', newStudent);
    await driveService.upsert('imst_applications', { ...app, status: 'Approved' }, 'user_id');
    fetchData();
    alert(`Approved! New Reg No: ${newStudent.regNumber}. Inform parents.`);
  };

  const handleSave = async (key: string, item: any) => {
    // Regex validation for student reg number
    if (key === 'imst_students') {
      const regRegex = /^IMST\/\d{4}\/\d{3}$/i;
      if (!regRegex.test(item.regNumber)) {
        alert('Invalid Reg Number format! Please use IMST/YYYY/NNN (e.g., IMST/2024/001)');
        return;
      }
    }

    await driveService.upsert(key, item);
    fetchData();
    setShowModal(null);
    setEditItem(null);
  };

  const handleDelete = async (key: string, id: string) => {
    if (window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      await driveService.delete(key, id);
      fetchData();
    }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <h1 className="text-3xl font-black text-center mb-8 tracking-tight">Admin Access</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" placeholder="admin@school.com" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black hover:bg-blue-800 shadow-xl transition-all active:scale-95">Sign In</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
        <div><h1 className="text-4xl font-black text-slate-900 tracking-tight">Management</h1><p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 flex items-center"><HardDrive size={14} className="mr-1.5"/> Data Local Instance Active</p></div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleComputeRanks} disabled={isSyncing} className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-2xl font-black text-sm flex items-center shadow-xl active:scale-95 transition-all">
             <RefreshCw className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} size={18} /> Compute Ranks
          </button>
          <button onClick={handleSyncDrive} disabled={isSyncing} className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center shadow-2xl active:scale-95 transition-all">
            <Cloud className="mr-2" size={18} /> Sync Cloud
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="bg-white border-2 border-slate-100 text-slate-400 p-3 rounded-2xl hover:text-red-600 shadow-sm transition-all"><LogOut size={22}/></button>
        </div>
      </div>

      <div className="flex gap-2 border-b mb-10 overflow-x-auto pb-1 scrollbar-hide">
        {[ 
          { id: 'overview', icon: LayoutDashboard, label: 'Dash' }, 
          { id: 'students', icon: Users, label: 'Students' }, 
          { id: 'applications', icon: FileBadge, label: 'Apps' }, 
          { id: 'teachers', icon: BookOpen, label: 'Staff' },
          { id: 'classes', icon: Layers, label: 'Classes' },
          { id: 'reports', icon: FileSpreadsheet, label: 'Reports' }
        ].map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center px-6 py-4 font-black text-sm transition-all rounded-t-[1.5rem] whitespace-nowrap ${activeTab===t.id ? 'bg-white text-blue-900 border-x border-t border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
            <t.icon className="h-4 w-4 mr-2.5" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-24"><Loader2 className="animate-spin h-12 w-12 text-blue-600" /></div> : (
        <div className="animate-fadeIn">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[ 
                  { l: 'Total Students', v: students.length, c: 'blue' }, 
                  { l: 'Pending Apps', v: applications.filter(a=>a.status==='Pending').length, c: 'orange' },
                  { l: 'Active Staff', v: teachers.length, c: 'purple' },
                  { l: 'Classes', v: classes.length, c: 'green' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.l}</p>
                    <h3 className="text-4xl font-black text-slate-900">{stat.v}</h3>
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h2 className="font-black text-2xl text-slate-900">Admission Requests</h2></div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]"><tr><th className="p-8">Applicant</th><th className="p-8">Class Applied</th><th className="p-8">Status</th><th className="p-8 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                         {applications.map(app => (
                           <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-8 font-black text-slate-900">{app.fullName}</td>
                              <td className="p-8 font-bold text-slate-500">{app.classApplied}</td>
                              <td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status==='Approved' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{app.status}</span></td>
                              <td className="p-8 text-right space-x-2">
                                 {app.status === 'Pending' && <button onClick={()=>handleApproveApp(app)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-green-700 shadow-sm">Approve</button>}
                                 {app.status === 'Approved' && <button onClick={()=>generateAdmissionLetter(app.fullName, 'IMST/TEMP', app.classApplied)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-sm"><Download size={14} className="inline mr-1"/> PDF</button>}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
          )}

          {activeTab === 'students' && (
             <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h2 className="font-black text-2xl text-slate-900">Directory</h2>
                  <div className="flex gap-3">
                    <button onClick={handleExportStudents} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center shadow-xl hover:bg-slate-800 transition-all"><FileSpreadsheet className="mr-2" size={18}/> Export (.xlsx)</button>
                    <button onClick={()=>{setEditItem({}); setShowModal('student')}} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl flex items-center hover:bg-blue-700 transition-all"><UserPlus size={18} className="mr-2"/> Add Student</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]"><tr><th className="p-8">Name</th><th className="p-8">Reg No</th><th className="p-8">Class</th><th className="p-8">Fees</th><th className="p-8 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                         {students.map(s => (
                           <tr key={s.id} className="hover:bg-blue-50/30 transition-colors">
                              <td className="p-8 font-black text-slate-900">{s.fullName}</td>
                              <td className="p-8 font-mono text-xs text-slate-500 font-bold">{s.regNumber}</td>
                              <td className="p-8"><span className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">{s.classLevel}</span></td>
                              <td className="p-8">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${s.feesPaid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                  {s.feesPaid ? 'PAID' : 'UNPAID'}
                                </span>
                              </td>
                              <td className="p-8 text-right flex justify-end gap-3">
                                 <button onClick={()=>{setEditItem(s); setShowModal('student')}} className="p-3 bg-white border border-slate-100 rounded-xl text-blue-600 shadow-sm hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                                 <button onClick={()=>handleDelete('imst_students', s.id)} className="p-3 bg-white border border-slate-100 rounded-xl text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'teachers' && (
             <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h2 className="font-black text-2xl text-slate-900">Staff Management</h2><button onClick={()=>{setEditItem({}); setShowModal('teacher')}} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl"><UserPlus size={18} className="inline mr-2"/> Add Staff</button></div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]"><tr><th className="p-8">Name</th><th className="p-8">Email</th><th className="p-8">Classes</th><th className="p-8 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                         {teachers.map(t => (
                           <tr key={t.id} className="hover:bg-purple-50/30 transition-colors">
                              <td className="p-8 font-black text-slate-900">{t.fullName}</td>
                              <td className="p-8 text-slate-500 font-medium">{t.email}</td>
                              <td className="p-8">
                                <div className="flex flex-wrap gap-1">
                                  {t.assignedClasses.map(c => <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black">{c}</span>)}
                                </div>
                              </td>
                              <td className="p-8 text-right flex justify-end gap-3">
                                 <button onClick={()=>{setEditItem(t); setShowModal('teacher')}} className="p-3 bg-white border border-slate-100 rounded-xl text-purple-600 shadow-sm hover:bg-purple-600 hover:text-white transition-all"><Edit size={16}/></button>
                                 <button onClick={()=>handleDelete('imst_teachers', t.id)} className="p-3 bg-white border border-slate-100 rounded-xl text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'classes' && (
             <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center"><h2 className="font-black text-2xl text-slate-900">Academic Classes</h2><button onClick={()=>{setEditItem({}); setShowModal('class')}} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl"><Plus size={18} className="inline mr-2"/> Add Class</button></div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-widest text-[10px]"><tr><th className="p-8">Class Level</th><th className="p-8 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                         {classes.map(c => (
                           <tr key={c.id} className="hover:bg-green-50/30 transition-colors">
                              <td className="p-8 font-black text-slate-900">{c.name}</td>
                              <td className="p-8 text-right flex justify-end gap-3">
                                 <button onClick={()=>{setEditItem(c); setShowModal('class')}} className="p-3 bg-white border border-slate-100 rounded-xl text-green-600 shadow-sm hover:bg-green-600 hover:text-white transition-all"><Edit size={16}/></button>
                                 <button onClick={()=>handleDelete('imst_classes', c.id)} className="p-3 bg-white border border-slate-100 rounded-xl text-red-500 shadow-sm hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center mb-8 gap-3">
                  <Filter className="text-blue-600" size={24} />
                  <h2 className="text-2xl font-black text-slate-900">Report Generation Engine</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                    <select value={reportClass} onChange={e=>setReportClass(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold">
                      <option value="All">All Classes</option>
                      {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Term</label>
                    <select value={reportTerm} onChange={e=>setReportTerm(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold">
                      <option>1st Term</option><option>2nd Term</option><option>3rd Term</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session</label>
                    <select value={reportSession} onChange={e=>setReportSession(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold">
                      <option>2024/2025</option><option>2025/2026</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleExportFeeReport} className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black hover:bg-blue-800 shadow-xl transition-all flex items-center justify-center group">
                      <Download className="mr-2 group-hover:translate-y-0.5 transition-transform" size={20}/> Download Report
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-xl mb-6 text-slate-900 flex items-center"><Printer className="mr-3 text-orange-500" /> Batch Printing</h3>
                    <p className="text-slate-500 font-medium mb-6">Select a class to generate all admission letters or report sheets in one click.</p>
                    <div className="space-y-3">
                       {classes.slice(0, 4).map(c => (
                         <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group cursor-pointer">
                            <span className="font-black text-slate-700">{c.name} - Reports</span>
                            <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                         </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-blue-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10"><FileSpreadsheet size={150} /></div>
                    <h3 className="text-2xl font-black mb-4">Financial Insights</h3>
                    <p className="text-blue-100 opacity-80 mb-8 font-medium">Currently viewing payment compliance for {reportSession}.</p>
                    <div className="flex items-center gap-6">
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Paid</p>
                          <p className="text-4xl font-black">{students.filter(s=>s.feesPaid).length}</p>
                       </div>
                       <div className="h-12 w-px bg-white/20"></div>
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Pending</p>
                          <p className="text-4xl font-black text-orange-400">{students.filter(s=>!s.feesPaid).length}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
          <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] animate-scaleIn">
                  <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-slate-900">Manage Record</h3><button onClick={()=>setShowModal(null)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"><X size={24}/></button></div>
                  <div className="space-y-6">
                      {(showModal === 'student' || showModal === 'teacher') && (
                        <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Full Name</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" value={editItem?.fullName || ''} onChange={e=>setEditItem({...editItem, fullName: e.target.value})} placeholder="Ahmed Musa" /></div>
                      )}
                      
                      {showModal === 'student' && (
                        <>
                          <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Class</label><select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" value={editItem?.classLevel || ''} onChange={e=>setEditItem({...editItem, classLevel: e.target.value})}>{classes.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                          <div className="group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Reg Number</label>
                            <input className={`w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold ${editItem?.regNumber && !/^IMST\/\d{4}\/\d{3}$/i.test(editItem.regNumber) ? 'border-red-500 focus:border-red-600' : 'border-slate-100 focus:border-blue-600'}`} value={editItem?.regNumber || ''} onChange={e=>setEditItem({...editItem, regNumber: e.target.value})} placeholder="IMST/2024/001" />
                            {editItem?.regNumber && !/^IMST\/\d{4}\/\d{3}$/i.test(editItem.regNumber) && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">Format: IMST/YYYY/NNN</p>}
                          </div>
                          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                             <input type="checkbox" id="feesPaid" checked={editItem?.feesPaid || false} onChange={e=>setEditItem({...editItem, feesPaid: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                             <label htmlFor="feesPaid" className="font-bold text-slate-700">Fees Paid for current term</label>
                          </div>
                        </>
                      )}

                      {showModal === 'teacher' && (
                        <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Email Address</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" value={editItem?.email || ''} onChange={e=>setEditItem({...editItem, email: e.target.value})} placeholder="teacher@school.com" /></div>
                      )}

                      {showModal === 'class' && (
                        <div className="group"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Class Level Name</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-green-600 font-bold" value={editItem?.name || ''} onChange={e=>setEditItem({...editItem, name: e.target.value})} placeholder="e.g. JSS 4" /></div>
                      )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-12">
                      <button onClick={()=>setShowModal(null)} className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl transition-all hover:bg-slate-100">Discard</button>
                      <button onClick={()=>handleSave(showModal === 'student' ? 'imst_students' : (showModal === 'teacher' ? 'imst_teachers' : 'imst_classes'), editItem)} className={`flex-1 py-4 font-black text-white rounded-2xl shadow-xl transition-all active:scale-95 ${showModal === 'class' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-900 hover:bg-blue-800'}`}>Save Changes</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;