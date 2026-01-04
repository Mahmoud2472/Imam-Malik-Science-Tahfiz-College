import React, { useState } from 'react';
import { CreditCard, FileText, Check, Calendar, Download } from 'lucide-react';
import { PAYSTACK_SCHOOL_FEE_LINK, SCHOOL_NAME } from '../constants';
import { jsPDF } from "jspdf";
import { addPdfHeader } from '../utils/pdfUtils';

const Fees: React.FC = () => {
  const [session, setSession] = useState('2024/2025');
  const [term, setTerm] = useState('1st Term');
  const [receiptData, setReceiptData] = useState({ name: '', amount: '', reference: '' });

  const handleReceiptDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptData.name || !receiptData.amount || !receiptData.reference) { alert("Please fill in all receipt details."); return; }

    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, "PAYMENT RECEIPT");
    
    // Receipt Box
    doc.setDrawColor(0);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, yStart + 10, 170, 100, 'F');
    
    doc.setFontSize(12);
    let y = yStart + 30;
    const xLabel = 30;
    const xValue = 90;
    
    const addRow = (label: string, value: string) => { doc.setFont("helvetica", "bold"); doc.text(label, xLabel, y); doc.setFont("helvetica", "normal"); doc.text(value, xValue, y); y += 15; };
    
    addRow("Date:", new Date().toLocaleDateString());
    addRow("Reference No:", receiptData.reference);
    addRow("Student Name:", receiptData.name);
    addRow("Session:", session);
    addRow("Term:", term);
    addRow("Amount Paid:", `NGN ${receiptData.amount}`);
    addRow("Status:", "Successful (Student Generated)");
    
    doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text("This receipt was generated based on user input for record keeping.", 105, yStart + 120, { align: "center" });
    
    doc.save(`Receipt_${receiptData.reference}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12"><h1 className="text-3xl font-bold text-slate-900">School Fees Payment</h1><p className="mt-4 text-slate-600">Securely pay term fees and download your receipts.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-100"><div className="bg-blue-900 p-6 text-white text-center"><h2 className="text-2xl font-bold">Pay School Fees</h2><p className="opacity-80">Secure Payment via Paystack</p></div><div className="p-8"><div className="bg-blue-50 p-5 rounded-lg mb-6 border border-blue-100"><h3 className="font-semibold text-blue-900 mb-3 flex items-center"><Calendar className="h-4 w-4 mr-2" /> Select Payment Period</h3><div className="space-y-4"><div><label className="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">Academic Session</label><select value={session} onChange={(e) => setSession(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 bg-white"><option value="2024/2025">2024/2025 Session</option><option value="2025/2026">2025/2026 Session</option></select></div><div><label className="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wide">Term</label><select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 bg-white"><option value="1st Term">1st Term</option><option value="2nd Term">2nd Term</option><option value="3rd Term">3rd Term</option></select></div></div></div><ul className="space-y-4 mb-8"><li className="flex items-center text-slate-700"><Check className="h-5 w-5 text-green-500 mr-2" /> Tuition Fee ({term})</li><li className="flex items-center text-slate-700"><Check className="h-5 w-5 text-green-500 mr-2" /> Exam Fee</li><li className="flex items-center text-slate-700"><Check className="h-5 w-5 text-green-500 mr-2" /> ICT & Lab Charges</li></ul><a href={PAYSTACK_SCHOOL_FEE_LINK} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 transition-colors shadow-md"><CreditCard className="mr-2 h-5 w-5" /> Pay for {term}</a></div></div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md"><div className="flex items-center mb-6"><div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3"><FileText className="h-5 w-5" /></div><div><h2 className="text-lg font-bold text-slate-900">Get Receipt</h2><p className="text-xs text-slate-500">Generate a slip after payment</p></div></div><form onSubmit={handleReceiptDownload} className="space-y-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label><input type="text" required value={receiptData.name} onChange={(e) => setReceiptData({...receiptData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Full Name" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Amount (NGN)</label><input type="number" required value={receiptData.amount} onChange={(e) => setReceiptData({...receiptData, amount: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 50000" /></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Paystack Ref</label><input type="text" required value={receiptData.reference} onChange={(e) => setReceiptData({...receiptData, reference: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Ref No" /></div></div><div className="bg-slate-50 p-3 rounded text-xs text-slate-500 border border-slate-100">Confirm the <strong>Session</strong> and <strong>Term</strong> selected in the payment box are correct before generating.</div><button type="submit" className="w-full flex items-center justify-center bg-blue-900 text-white py-2.5 rounded-md font-semibold hover:bg-blue-800 transition-colors"><Download className="mr-2 h-4 w-4" /> Download Receipt PDF</button></form></div>
      </div>
    </div>
  );
};

export default Fees;