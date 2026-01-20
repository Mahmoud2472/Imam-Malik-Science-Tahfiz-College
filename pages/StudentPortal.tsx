import React, { useState, useEffect } from 'react';
import { Student, TermResult } from '../types';
import { User, Lock, Download, AlertCircle, CheckCircle, FileText, Loader2, Trophy, BarChart3, GraduationCap } from 'lucide-react';
import { driveService } from '../services/driveService';
import { generateTerminalReport, generateReceipt } from '../utils/pdfUtils';

const StudentPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [regInput, setRegInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [results, setResults] = useState<TermResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const students = await driveService.getTable('imst_students');
    const found = students.find((s: any) => s.regNumber.toUpperCase() === regInput.toUpperCase() && s.pin === pinInput);
    if (found) { 
        setStudent(found); 
        setIsLoggedIn(true); 
        setError(''); 
        fetchResults(found.id);
    } else setError('Invalid Registration Number or PIN');
    setLoading(false);
  };

  const fetchResults = async (studentId: string) => {
    const allResults = await driveService.getTable('imst_results');
    const studentResults = allResults.filter((r: any) => r.studentId === studentId);
    setResults(studentResults);
  };

  const handleDownloadFeesReceipt = () => {
    if (!student) return;
    generateReceipt({
        receiptType: "School Fees Payment Receipt",
        studentName: student.fullName,
        regNo: student.regNumber,
        amount: "50,000",
        reference: `PAY-${student.regNumber.replace(/\//g, '-')}-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString(),
        term: "1st Term",
        session: "2024/2025"
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
          <div className="text-center mb-10">
              <div className="w-20 h-20 bg-blue-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-2">
                <GraduationCap size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Portal</h1>
              <p className="text-slate-500 font-medium">Verify results & payment status</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <input type="text" value={regInput} onChange={(e) => setRegInput(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" placeholder="Registration No" required />
            <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-600 font-bold" placeholder="PIN" required />
            {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center"><AlertCircle size={14} className="mr-2"/> {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-800 shadow-xl flex items-center justify-center transition-all">
               {loading ? <Loader2 className="animate-spin" /> : 'Enter Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Welcome, {student?.fullName}</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">{student?.regNumber} • {student?.classLevel}</p>
        </div>
        <button onClick={() => { setIsLoggedIn(false); setStudent(null); }} className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-100 transition-all shadow-sm">Logout</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
           {/* Summary Stats */}
           <div className="grid grid-cols-1 gap-4">
               <div className="bg-blue-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-all"><Trophy size={100}/></div>
                   <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">Current Academic Average</p>
                   <h2 className="text-5xl font-black">{results.length > 0 ? results[0].average.toFixed(1) : '0.0'}%</h2>
               </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h2 className="font-black text-lg mb-6 flex items-center uppercase tracking-widest text-slate-400 text-[10px]">Financial Status</h2>
              {student?.feesPaid ? (
                <div className="space-y-4">
                  <div className="flex items-center text-green-700 bg-green-50 p-5 rounded-2xl border border-green-100">
                    <CheckCircle className="h-6 w-6 mr-4 shrink-0" />
                    <div><p className="font-black text-sm uppercase tracking-tight leading-tight">Tuition Cleared</p><p className="text-[10px] opacity-70">Term 1 (2024/25)</p></div>
                  </div>
                  <button onClick={handleDownloadFeesReceipt} className="w-full flex items-center justify-center py-4 bg-slate-50 text-blue-900 rounded-2xl font-black border-2 border-slate-100 hover:border-blue-900 transition-all"><FileText className="h-4 w-4 mr-2" /> Secure Receipt</button>
                </div>
              ) : (
                <div className="flex items-center text-orange-700 bg-orange-50 p-5 rounded-2xl border border-orange-100">
                  <AlertCircle className="h-6 w-6 mr-4 shrink-0" />
                  <div><p className="font-black text-sm uppercase tracking-tight leading-tight">Payment Pending</p><p className="text-[10px] opacity-70">Visit Bursary Dept.</p></div>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center"><BarChart3 className="mr-3 text-blue-600"/> Terminal Report Sheets</h2>
           
           {results.length === 0 ? (
             <div className="bg-slate-50 p-20 rounded-[3rem] text-center border-4 border-dashed border-slate-100">
                <FileText className="h-16 w-16 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 font-bold">No academic records released for this session yet.</p>
             </div>
           ) : (
             <div className="space-y-6">
                {results.map((res, idx) => (
                   <div key={idx} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all">
                      <div className="bg-slate-50/80 px-10 py-6 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                         <div>
                            <h3 className="font-black text-xl text-slate-900">{res.term}</h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{res.session}</p>
                         </div>
                         <div className="flex gap-4">
                            <div className="bg-white px-5 py-2 rounded-xl border border-slate-200 shadow-sm text-center">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rank</p>
                               <p className="font-black text-blue-600 leading-none">{res.position}</p>
                            </div>
                            <button onClick={() => generateTerminalReport(res)} className="flex items-center justify-center bg-blue-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-800 transition-all shadow-lg active:scale-95">
                               <Download className="mr-2" size={18} /> Official Report Sheet
                            </button>
                         </div>
                      </div>
                      
                      <div className="p-10">
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                               <thead className="text-slate-400 font-black uppercase tracking-widest text-[9px] border-b">
                                  <tr><th className="pb-4">Subject</th><th className="pb-4">CA</th><th className="pb-4">Exam</th><th className="pb-4">Total</th><th className="pb-4">Grade</th></tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {res.results.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                       <td className="py-4 font-black text-slate-700">{r.subject}</td>
                                       <td className="py-4 font-bold text-slate-400">{r.ca}</td>
                                       <td className="py-4 font-bold text-slate-400">{r.exam}</td>
                                       <td className="py-4 font-black text-slate-900">{r.total}</td>
                                       <td className="py-4">
                                          <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-xs">{r.grade}</span>
                                       </td>
                                    </tr>
                                  ))}
                               </tbody>
                            </table>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
