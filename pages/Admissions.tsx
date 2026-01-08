import React, { useState, useEffect, useCallback } from 'react';
import { Download, CreditCard, CheckCircle, Upload, Loader2, User, School, Briefcase, Lock, LogIn, LogOut, ShieldCheck, Save, ExternalLink, Key, Camera, MapPin, Phone, Mail, Calendar, X, AlertCircle, FileText, FileBadge } from 'lucide-react';
import { PAYSTACK_APP_FEE_LINK, SCHOOL_NAME, SCHOOL_ADDRESS, APPLICATION_FEE_AMOUNT } from '../constants';
import { driveService } from '../services/driveService';
import { jsPDF } from "jspdf";
import { useLocation } from 'react-router-dom';
import { addPdfHeader, generateReceipt, generateAdmissionLetter } from '../utils/pdfUtils';

type AdmissionStep = 'auth' | 'form' | 'success';

const Admissions: React.FC = () => {
  const [step, setStep] = useState<AdmissionStep>('auth');
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: '', gender: '', dateOfBirth: '', lastSchoolAttended: '', islamiyyaSchool: '', graduationYear: '', classApplied: '', parentName: '', phone: '', email: '', address: '' });

  const checkExistingPayment = useCallback(async (userId: string) => {
    try {
      const data = await driveService.getTable('imst_applications');
      const found = data.find((d: any) => d.user_id === userId);
      if (found && found.payment_reference) {
        setPaymentRef(found.payment_reference);
        setFormData(prev => ({ ...prev, ...found }));
        if (found.photo_url) setPhotoPreview(found.photo_url);
        if (found.status === 'Admitted') setStep('success');
        else setStep('form');
      }
    } catch (err) {}
  }, []);

  const savePaymentReference = async (userId: string, ref: string) => {
    try {
      await driveService.upsert('imst_applications', {
        user_id: userId,
        payment_reference: ref,
        status: 'Applicant'
      }, 'user_id');
    } catch (e) {}
  };

  useEffect(() => {
    const session = localStorage.getItem('imst_session');
    if (session) {
      const userData = JSON.parse(session);
      setUser(userData);
      setFormData(prev => ({ ...prev, email: userData.email || '' }));
      checkExistingPayment(userData.id);
      setStep('form');
    }
  }, [checkExistingPayment]);

  useEffect(() => { 
    const params = new URLSearchParams(location.search); 
    const reference = params.get('reference') || params.get('trxref'); 
    if (reference) { 
      setPaymentRef(reference); 
      if (user) savePaymentReference(user.id, reference);
      setStep('form'); 
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash); 
    } 
  }, [location, user]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files && e.target.files[0]) { 
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    } 
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setAuthLoading(true); 
    setAuthError('');
    const { user, error } = await driveService.signIn(authEmail, authPassword);
    if (error) setAuthError(error);
    else {
      setUser(user);
      localStorage.setItem('imst_session', JSON.stringify(user));
      setFormData(prev => ({ ...prev, email: authEmail }));
      checkExistingPayment(user.id);
      setStep('form');
    }
    setAuthLoading(false);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef) return alert("Payment required.");
    setSubmitLoading(true);
    try {
      await driveService.upsert('imst_applications', {
        ...formData,
        user_id: user.id,
        payment_reference: paymentRef,
        status: 'Admitted', // Fast-track for demo
        photo_url: photoPreview
      }, 'user_id');
      setStep('success');
    } catch (err) {} finally { setSubmitLoading(false); }
  };

  const handleDownloadForm = async () => {
    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, "ADMISSION APPLICATION FORM", `Ref: ${paymentRef}`);
    if (photoPreview) { try { doc.addImage(photoPreview, 'JPEG', 160, yStart - 15, 30, 30); } catch (e) { doc.rect(160, yStart - 15, 30, 30); } }
    let y = yStart + 25;
    const addField = (l: string, v: string) => { doc.setFont("helvetica", "bold"); doc.text(l+":", 20, y); doc.setFont("helvetica", "normal"); doc.text(v||"N/A", 70, y); y+=10; };
    addField("Name", formData.fullName); addField("Class", formData.classApplied); addField("Phone", formData.phone);
    doc.save(`IMST_Application_${formData.fullName.replace(/\s/g, '_')}.pdf`);
  };

  const handleDownloadAdmissionLetter = () => {
    generateAdmissionLetter(formData.fullName, 'IMST/TEMP/' + Math.floor(Math.random()*1000), formData.classApplied);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Admission Portal</h1>
        <div className="flex justify-center mt-8 gap-4 items-center">
            {[1,2,3].map(i => (
                <React.Fragment key={i}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${step === (i===1?'auth':i===2?'form':'success') ? 'bg-blue-600 text-white scale-110' : 'bg-slate-200 text-slate-600'}`}>{i}</div>
                    {i<3 && <div className="w-10 h-1 bg-slate-200"></div>}
                </React.Fragment>
            ))}
        </div>
      </div>
      
      {step === 'auth' && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100">
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-4 py-2 border rounded-md" placeholder="Email" />
            <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full px-4 py-2 border rounded-md" placeholder="Password" />
            <button type="submit" disabled={authLoading} className="w-full bg-blue-900 text-white py-3 rounded-md font-bold hover:bg-blue-800">{authLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Login & Apply'}</button>
          </form>
          <button onClick={() => { setAuthEmail('applicant@school.com'); setAuthPassword('applicant'); }} className="mt-4 w-full py-2 border border-slate-200 rounded text-slate-500 text-sm">Demo Login</button>
        </div>
      )}
      
      {step === 'form' && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100 animate-fadeIn">
          {!paymentRef ? (
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center mb-8">
                  <h3 className="font-bold text-yellow-800 mb-2">Application Fee Required</h3>
                  <p className="text-sm text-yellow-700 mb-6">Pay ₦{APPLICATION_FEE_AMOUNT.toLocaleString()} to access the form.</p>
                  <button onClick={() => window.open(PAYSTACK_APP_FEE_LINK, '_blank')} className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold">Pay Now</button>
              </div>
          ) : (
              <form onSubmit={handleSubmitApplication} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 flex flex-col items-center">
                        <div className="w-32 h-32 bg-slate-50 border rounded-full overflow-hidden mb-2 relative">
                            {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera className="h-10 w-10 mx-auto mt-10 opacity-20" />}
                            <input type="file" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Upload Passport</span>
                    </div>
                    <input placeholder="Full Name" required className="p-3 border rounded-lg" value={formData.fullName} onChange={e=>setFormData({...formData, fullName:e.target.value})} />
                    <select required className="p-3 border rounded-lg bg-white" value={formData.classApplied} onChange={e=>setFormData({...formData, classApplied:e.target.value})}>
                        <option value="">Select Class</option><option>JSS 1</option><option>SSS 1</option>
                    </select>
                    <input placeholder="Phone" className="p-3 border rounded-lg" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} />
                    <input placeholder="Address" className="p-3 border rounded-lg" value={formData.address} onChange={e=>setFormData({...formData, address:e.target.value})} />
                </div>
                <button type="submit" disabled={submitLoading} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">Submit Application</button>
              </form>
          )}
        </div>
      )}

      {step === 'success' && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center animate-fadeIn">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Successful!</h2>
          <p className="text-slate-600 mb-8">Your admission has been processed.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={handleDownloadAdmissionLetter} className="flex items-center justify-center p-4 bg-blue-900 text-white rounded-xl font-bold"><FileBadge className="mr-2" /> Admission Letter</button>
            <button onClick={handleDownloadForm} className="flex items-center justify-center p-4 bg-slate-100 text-slate-700 rounded-xl font-bold border"><Download className="mr-2" /> Application Copy</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;