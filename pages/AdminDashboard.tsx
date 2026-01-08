import React, { useState, useEffect } from 'react';
import { Users, LogOut, Loader2, PlusCircle, Trash2, Edit, Save, Search, LayoutDashboard, Cloud, RefreshCw, BookOpen, GraduationCap, Layers, UserPlus, X, AlertCircle } from 'lucide-react';
import { MOCK_STUDENTS, MOCK_TEACHERS } from '../constants';
import { Student, Teacher } from '../types';
import { driveService } from '../services/driveService';

const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<string[]>(['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3']);
  const [subjects, setSubjects] = useState<string[]>(['Mathematics', 'English', 'Basic Science', 'Quranic Studies', 'Arabic']);
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const cloudStudents = await driveService.getTable('imst_students');
    setStudents(cloudStudents.length ? cloudStudents : MOCK_STUDENTS);
    const cloudTeachers = await driveService.getTable('imst_teachers');
    setTeachers(cloudTeachers.length ? cloudTeachers : MOCK_TEACHERS);
    const cloudClasses = await driveService.getTable('imst_classes');
    if (cloudClasses.length) setClasses(cloudClasses);
    const cloudSubjects = await driveService.getTable('imst_subjects');
    if (cloudSubjects.length) setSubjects(cloudSubjects);
    setLoading(false);
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { user, error } = await driveService.signIn(email, password);
    if (!error) setIsAuthenticated(true); else alert(error);
  };

  const handleSave = async (key: string, item: any) => {
    await driveService.upsert(key, item);
    fetchData();
    setShowModal(null);
    setEditItem(null);
  };

  const handleDelete = async (key: string, id: string) => {
    if (window.confirm("Delete this item permanently?")) {
        await driveService.delete(key, id);
        fetchData();
    }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Portal</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 border rounded" placeholder="Admin Email" />
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full p-3 border rounded" placeholder="Password" />
          <button type="submit" className="w-full bg-blue-900 text-white py-3 rounded font-bold">Sign In</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="text-3xl font-bold text-slate-900">Administration</h1></div>
        <div className="flex gap-4">
          <button onClick={() => driveService.exportToDrive()} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center"><Cloud className="mr-2 h-4 w-4" /> Sync Drive</button>
          <button onClick={() => setIsAuthenticated(false)} className="text-red-600 font-bold"><LogOut className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="flex gap-2 border-b mb-8 overflow-x-auto pb-1">
        {[ 
          { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' }, 
          { id: 'students', icon: Users, label: 'Students' }, 
          { id: 'teachers', icon: BookOpen, label: 'Teachers' },
          { id: 'classes', icon: Layers, label: 'Classes' },
          { id: 'subjects', icon: GraduationCap, label: 'Subjects' }
        ].map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center px-6 py-3 font-medium text-sm transition-all rounded-t-lg ${activeTab===t.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
            <t.icon className="h-4 w-4 mr-2" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div> : (
        <div className="animate-fadeIn">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">Students</p><h3 className="text-2xl font-bold">{students.length}</h3></div>
                <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">Teachers</p><h3 className="text-2xl font-bold">{teachers.length}</h3></div>
                <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">Classes</p><h3 className="text-2xl font-bold">{classes.length}</h3></div>
                <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm">Subjects</p><h3 className="text-2xl font-bold">{subjects.length}</h3></div>
            </div>
          )}

          {activeTab === 'students' && (
             <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-bold">Student Directory</h2>
                    <button onClick={()=>{setEditItem({}); setShowModal('student')}} className="bg-blue-600 text-white px-3 py-1.5 rounded flex items-center text-sm font-bold"><UserPlus className="h-4 w-4 mr-1" /> Add Student</button>
                </div>
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b"><tr><th className="p-4">Name</th><th className="p-4">Reg No</th><th className="p-4">Class</th><th className="p-4">Actions</th></tr></thead>
                   <tbody>
                      {students.map(s => (
                        <tr key={s.id} className="border-b hover:bg-slate-50">
                           <td className="p-4 font-bold">{s.fullName}</td>
                           <td className="p-4">{s.regNumber}</td>
                           <td className="p-4">{s.classLevel}</td>
                           <td className="p-4 flex gap-3">
                              <button onClick={()=>{setEditItem(s); setShowModal('student')}} className="text-blue-600"><Edit size={16}/></button>
                              <button onClick={()=>handleDelete('imst_students', s.id)} className="text-red-500"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}

          {activeTab === 'teachers' && (
             <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-bold">Teaching Staff</h2>
                    <button onClick={()=>{setEditItem({}); setShowModal('teacher')}} className="bg-purple-600 text-white px-3 py-1.5 rounded flex items-center text-sm font-bold"><PlusCircle className="h-4 w-4 mr-1" /> Add Teacher</button>
                </div>
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 border-b"><tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Actions</th></tr></thead>
                   <tbody>
                      {teachers.map(t => (
                        <tr key={t.id} className="border-b">
                           <td className="p-4 font-bold">{t.fullName}</td>
                           <td className="p-4">{t.email}</td>
                           <td className="p-4 flex gap-3">
                              <button onClick={()=>{setEditItem(t); setShowModal('teacher')}} className="text-blue-600"><Edit size={16}/></button>
                              <button onClick={()=>handleDelete('imst_teachers', t.id)} className="text-red-500"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          )}

          {activeTab === 'classes' && (
            <div className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-center mb-6"><h2 className="font-bold">Academic Classes</h2><button onClick={()=>{const n = prompt("Class Name?"); if(n) handleSave('imst_classes', n)}} className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold">New Class</button></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {classes.map((c, i) => (
                        <div key={i} className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                            <span className="font-bold">{c}</span>
                            <button onClick={()=>handleDelete('imst_classes', c)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-center mb-6"><h2 className="font-bold">Subjects</h2><button onClick={()=>{const n = prompt("Subject Name?"); if(n) handleSave('imst_subjects', n)}} className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold">New Subject</button></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subjects.map((s, i) => (
                        <div key={i} className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                            <span className="font-bold">{s}</span>
                            <button onClick={()=>handleDelete('imst_subjects', s)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Students/Teachers */}
      {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
                  <h3 className="text-xl font-bold mb-6">Manage {showModal === 'student' ? 'Student' : 'Teacher'}</h3>
                  <div className="space-y-4">
                      <div><label className="text-xs font-bold text-slate-400">FULL NAME</label><input className="w-full p-3 border rounded-lg" value={editItem?.fullName || ''} onChange={e=>setEditItem({...editItem, fullName: e.target.value})} /></div>
                      {showModal === 'student' ? (
                          <>
                            <div><label className="text-xs font-bold text-slate-400">REG NUMBER</label><input className="w-full p-3 border rounded-lg" value={editItem?.regNumber || ''} onChange={e=>setEditItem({...editItem, regNumber: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-slate-400">CLASS</label><select className="w-full p-3 border rounded-lg bg-white" value={editItem?.classLevel || ''} onChange={e=>setEditItem({...editItem, classLevel: e.target.value})}><option value="">Select Class</option>{classes.map(c=><option key={c}>{c}</option>)}</select></div>
                          </>
                      ) : (
                          <div><label className="text-xs font-bold text-slate-400">EMAIL</label><input className="w-full p-3 border rounded-lg" value={editItem?.email || ''} onChange={e=>setEditItem({...editItem, email: e.target.value})} /></div>
                      )}
                  </div>
                  <div className="flex gap-4 mt-10">
                      <button onClick={()=>setShowModal(null)} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-lg">Cancel</button>
                      <button onClick={()=>handleSave(showModal === 'student' ? 'imst_students' : 'imst_teachers', editItem)} className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-lg">Save Record</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;