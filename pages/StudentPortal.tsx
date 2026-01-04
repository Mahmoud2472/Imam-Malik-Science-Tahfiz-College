import React, { useState } from 'react';
import { MOCK_STUDENTS, MOCK_RESULTS } from '../constants';
import { Student, TermResult } from '../types';
import { User, Lock, Download, AlertCircle, CheckCircle, KeyRound, Calendar, TrendingUp, Award, Users, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";
import { addPdfHeader, generateReceipt } from '../utils/pdfUtils';

const StudentPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [regInput, setRegInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [student, setStudent] = useState<Student | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = MOCK_STUDENTS.find(s => s.regNumber.toUpperCase() === regInput.toUpperCase() && s.pin === pinInput);
    if (found) { setStudent(found); setIsLoggedIn(true); setError(''); } 
    else setError('Invalid Registration Number or PIN');
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

  const downloadResult = async (result: TermResult, student: Student) => {
    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, "TERM REPORT CARD");
    let y = yStart + 10;
    doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold"); doc.text("Student Name:", 15, y);
    doc.setFont("helvetica", "normal"); doc.text(student.fullName, 45, y);
    doc.setFont("helvetica", "bold"); doc.text("Class:", 15, y+6);
    doc.setFont("helvetica", "normal"); doc.text(student.classLevel, 45, y+6);
    doc.setFont("helvetica", "bold"); doc.text("Reg No:", 130, y);
    doc.setFont("helvetica", "normal"); doc.text(student.regNumber, 160, y);
    doc.setFont("helvetica", "bold"); doc.text("Term:", 130, y+6);
    doc.setFont("helvetica", "normal"); doc.text(`${result.term} ${result.year}`, 160, y+6);
    y += 15;
    const startX = 15;
    const rowHeight = 8;
    const colWidths = [65, 20, 20, 20, 20, 35];
    const headers = ["SUBJECT", "CA", "EXAM", "TOTAL", "GRADE", "REMARK"];
    doc.setFillColor(30, 58, 138); doc.setTextColor(255, 255, 255);
    doc.rect(startX, y, 180, rowHeight, 'F');
    doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    let currentX = startX;
    headers.forEach((h, i) => { doc.text(h, currentX + (colWidths[i]/2), y + 5.5, { align: "center" }); currentX += colWidths[i]; });
    y += rowHeight;
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");
    result.results.forEach((sub, i) => {
        if (i % 2 === 0) doc.setFillColor(248, 250, 252); else doc.setFillColor(255, 255, 255);
        doc.rect(startX, y, 180, rowHeight, 'F'); doc.setDrawColor(226, 232, 240); doc.rect(startX, y, 180, rowHeight);
        let x = startX;
        doc.text(sub.subject, x + 2, y + 5.5); x += colWidths[0];
        doc.text(sub.ca.toString(), x + colWidths[1]/2, y + 5.5, {align:"center"}); x += colWidths[1];
        doc.text(sub.exam.toString(), x + colWidths[2]/2, y + 5.5, {align:"center"}); x += colWidths[2];
        doc.setFont("helvetica", "bold"); doc.text(sub.total.toString(), x + colWidths[3]/2, y + 5.5, {align:"center"}); doc.setFont("helvetica", "normal"); x += colWidths[3];
        doc.text(sub.grade, x + colWidths[4]/2, y + 5.5, {align:"center"}); x += colWidths[4];
        doc.setFontSize(8); doc.text(sub.remark, x + colWidths[5]/2, y + 5.5, {align:"center"}); doc.setFontSize(9);
        y += rowHeight;
    });
    y += 5;
    doc.setFillColor(241, 245, 249); doc.setDrawColor(0, 0, 0); doc.rect(startX, y, 180, 20, 'F'); doc.rect(startX, y, 180, 20);
    doc.setFont("helvetica", "bold"); doc.text("PERFORMANCE SUMMARY", startX + 5, y + 6);
    doc.text(`Total: ${result.totalScore}`, startX + 5, y + 14); doc.text(`Avg: ${result.average}`, startX + 50, y + 14);
    doc.save(`${student.fullName}_Result.pdf`);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-100">
          <div className="text-center mb-8"><h1 className="text-2xl font-bold text-slate-900">Student Portal</h1><p className="text-slate-500 text-sm mt-2">Check results and payment status</p></div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" value={regInput} onChange={(e) => setRegInput(e.target.value)} className="w-full px-4 py-3 border rounded-md" placeholder="Registration No" required />
            <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full px-4 py-3 border rounded-md" placeholder="PIN" required />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="w-full bg-blue-900 text-white py-3 rounded-md font-semibold">Access Portal</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8"><div><h1 className="text-2xl font-bold text-slate-900">Welcome, {student?.fullName}</h1><p className="text-slate-600">{student?.regNumber} | {student?.classLevel}</p></div><button onClick={() => { setIsLoggedIn(false); setStudent(null); }} className="text-red-600 font-medium">Logout</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-lg font-bold mb-4">Fee Status</h2>
          {student?.feesPaid ? (
            <div className="space-y-4">
              <div className="flex items-center text-green-700 bg-green-50 p-4 rounded-lg"><CheckCircle className="h-6 w-6 mr-3" /><div><p className="font-bold">Fees Cleared</p></div></div>
              <button onClick={handleDownloadFeesReceipt} className="w-full flex items-center justify-center py-2.5 bg-blue-50 text-blue-700 rounded-lg font-bold border border-blue-100"><FileText className="h-4 w-4 mr-2" /> Download Receipt</button>
            </div>
          ) : (
            <div className="flex items-center text-red-700 bg-red-50 p-4 rounded-lg"><AlertCircle className="h-6 w-6 mr-3" /><div><p className="font-bold">Payment Pending</p></div></div>
          )}
        </div>
        <div className="lg:col-span-2 space-y-6">
           <h2 className="text-xl font-bold text-slate-900">Academic Records</h2>
           {(student ? MOCK_RESULTS[student.id] : [] || []).map((res, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                 <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">{res.term} - {res.year}</h3>
                    <button onClick={() => student && downloadResult(res, student)} className="text-blue-600 bg-white border px-3 py-1 rounded text-sm flex items-center"><Download className="h-4 w-4 mr-1" /> PDF</button>
                 </div>
                 <div className="p-4 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                       <thead><tr className="border-b text-slate-500"><th className="pb-3">Subject</th><th className="pb-3">CA</th><th className="pb-3">Exam</th><th className="pb-3">Total</th><th className="pb-3">Grade</th></tr></thead>
                       <tbody>{res.results.map((r, i) => (<tr key={i} className="border-b last:border-0"><td className="py-3 font-medium">{r.subject}</td><td className="py-3">{r.ca}</td><td className="py-3">{r.exam}</td><td className="py-3 font-bold">{r.total}</td><td className="py-3">{r.grade}</td></tr>))}</tbody>
                    </table>
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;