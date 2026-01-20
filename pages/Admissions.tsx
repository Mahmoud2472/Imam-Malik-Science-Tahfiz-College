import React, { useState, useEffect, useCallback } from 'react';
import { Download, CreditCard, CheckCircle, Upload, Loader2, User, School, ShieldCheck, ExternalLink, Camera, Phone, Mail, AlertCircle, FileText, FileBadge, Info, BookOpen, Fingerprint, Clock, CheckCircle2, ArrowRight, Calendar } from 'lucide-react';
import { PAYSTACK_APP_FEE_LINK, SCHOOL_NAME, APPLICATION_FEE_AMOUNT } from '../constants';
import { driveService } from '../services/driveService';
import { jsPDF } from "jspdf";
import { useLocation } from 'react-router-dom';
import { addPdfHeader, generateAdmissionLetter } from '../utils/pdfUtils';
import { ApplicationForm } from '../types';

type AdmissionStep = 'auth' | 'payment_confirmed' | 'form' | 'status' | 'success';

const Admissions: React.FC = () => {
  const [step, setStep] = useState<AdmissionStep>('auth');
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [currentApp, setCurrentApp] = useState<ApplicationForm | null>(null);
  const [formData, setFormData] = useState({ fullName: '', gender: '', dateOfBirth: '', lastSchoolAttended: '', islamiyyaSchool: '', graduationYear: '', classApplied: '', parentName: '', phone: '', email: '', address: '' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reference = params.get('reference') || params.get('trxref');
    const directAccess = params.get('payment') === 'completed';
    
    if (reference || directAccess) {
      const finalRef = reference || `PAID-AUTO-${Date.now().toString().slice(-4)}`;
      setPaymentRef(finalRef);
      sessionStorage.setItem('pending_payment_ref', finalRef);
      const session = localStorage.getItem('imst_session');
      
      if (session) {
        setStep('payment_confirmed');
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
  }, [location]);

  const checkExistingApplication = useCallback(async (userId: string) => {
    try {
      const data = await driveService.getTable('imst_applications');
      const found = data.find((d: any) => d.user_id === userId);
      if (found) {
        setCurrentApp(found);
        setFormData(prev => ({ ...prev, ...found }));
        if (found.payment_reference) setPaymentRef(found.payment_reference);
        if (found.photo_url) setPhotoPreview(found.photo_url);
        
        if (found.status === 'Approved') setStep('success');
        else if (found.status === 'Pending') setStep('status');
        else setStep('form');
      }
    } catch (err) {
      console.error("Error checking application:", err);
    }
  }, []);

  useEffect(() => {
    const session = localStorage.getItem('imst_session');
    if (session) {
      const userData = JSON.parse(session);
      setUser(userData);
      setFormData(prev => ({ ...prev, email: userData.email || '' }));
      
      const storedRef = sessionStorage.getItem('pending_payment_ref');
      if (storedRef && step === 'auth') {
        setPaymentRef(storedRef);
        setStep('payment_confirmed');
      } else if (!storedRef) {
        checkExistingApplication(userData.id);
      }
    }
  }, [checkExistingApplication, step]);

  const handleAuth = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const emailToUse = customEmail || authEmail;
    const passToUse = customPass || authPassword;

    const { user: authUser, error } = await driveService.signIn(emailToUse, passToUse);
    if (error) {
      setAuthError(error);
    } else {
      setUser(authUser);
      localStorage.setItem('imst_session', JSON.stringify(authUser));
      setFormData(prev => ({ ...prev, email: emailToUse }));
      
      const storedRef = sessionStorage.getItem('pending_payment_ref');
      if (storedRef) {
        setPaymentRef(storedRef);
        setStep('payment_confirmed');
      } else {
        await checkExistingApplication(authUser.id);
        if (step === 'auth') setStep('form');
      }
    }
    setAuthLoading(false);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef) return alert("Please complete the payment first.");
    setSubmitLoading(true);
    try {
      const payload = {
        ...formData,
        user_id: user.id,
        payment_reference: paymentRef,
        status: 'Pending',
        photo_url: photoPreview,
        created_at: new Date().toISOString()
      };
      await driveService.upsert('imst_applications', payload, 'user_id');
      sessionStorage.removeItem('pending_payment_ref');
      setStep('status');
    } catch (err) {
      alert("Submission failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="text-center lg:text-left mb-10">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Admissions Portal</h1>
            <p className="text-slate-500 font-medium">Join the legacy of Science and Tahfiz excellence.</p>
          </div>

          {step === 'auth' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
                <div className="flex items-center mb-8 space-x-4 text-blue-900">
                  <div className="p-3 bg-blue-50 rounded-2xl"><ShieldCheck size={32} /></div>
                  <h2 className="text-2xl font-black">Login to Apply</h2>
                </div>
                <form onSubmit={(e) => handleAuth(e)} className="space-y-5">
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-medium" placeholder="Email Address" />
                  <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-medium" placeholder="Password" />
                  {authError && <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl flex items-center"><AlertCircle size={18} className="mr-3"/> {authError}</div>}
                  <button type="submit" disabled={authLoading} className="w-full bg-blue-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-800 transition-all shadow-xl">
                    {authLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
                  </button>
                </form>
                <button onClick={() => handleAuth(undefined, 'applicant@school.com', 'applicant')} className="mt-4 w-full py-3 text-blue-600 font-bold border-2 border-dashed border-blue-100 rounded-xl hover:bg-blue-50 transition-colors">Demo Login</button>
              </div>
            </div>
          )}

          {step === 'payment_confirmed' && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 animate-scaleIn text-center">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Payment Successful!</h2>
              <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto">We have received your application fee. You can now proceed to complete your registration form.</p>
              
              <div className="bg-slate-50 rounded-[2rem] p-8 mb-10 border border-slate-100 text-left space-y-4">
                 <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Ref</span>
                    <span className="font-mono text-xs font-bold text-blue-600">{paymentRef}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                    <span className="font-black text-slate-900">₦{APPLICATION_FEE_AMOUNT.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Applicant Email</span>
                    <span className="font-bold text-slate-600">{user?.email}</span>
                 </div>
              </div>

              <button 
                onClick={() => setStep('form')}
                className="w-full bg-blue-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-blue-800 transition-all active:scale-95 flex items-center justify-center"
              >
                Complete Application Form <ArrowRight className="ml-3" />
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 animate-fadeIn">
              {!paymentRef ? (
                <div className="text-center py-10">
                   <div className="bg-blue-900 p-12 rounded-[3rem] text-white shadow-2xl">
                      <CreditCard size={48} className="mx-auto mb-6 text-yellow-400" />
                      <h3 className="text-3xl font-black mb-4">Application Fee: ₦{APPLICATION_FEE_AMOUNT.toLocaleString()}</h3>
                      <p className="mb-10 text-blue-100 opacity-80">Payment is required to unhide the digital application form.</p>
                      <a href={PAYSTACK_APP_FEE_LINK} className="inline-flex items-center px-10 py-5 bg-yellow-400 text-blue-900 font-black text-xl rounded-full hover:bg-yellow-300 transition-all shadow-2xl">Pay & Proceed</a>
                   </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-8 animate-fadeIn">
                  <div className="p-4 bg-green-50 border-2 border-green-100 rounded-2xl flex items-center text-green-700 font-bold">
                    <CheckCircle size={20} className="mr-3"/> Payment Verified: {paymentRef}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2 flex justify-center">
                       <div className="w-40 h-40 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden cursor-pointer flex flex-col items-center justify-center relative">
                         {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" /> : <Camera size={40} className="text-slate-300"/>}
                         <input type="file" accept="image/*" onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const reader = new FileReader();
                              reader.onloadend = () => setPhotoPreview(reader.result as string);
                              reader.readAsDataURL(e.target.files[0]);
                            }
                          }} className="absolute inset-0 opacity-0 cursor-pointer" />
                       </div>
                    </div>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Full Name (Surname First)" />
                    <select required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.classApplied} onChange={e => setFormData({ ...formData, classApplied: e.target.value })}>
                       <option value="">Applying for Class...</option>
                       <option>JSS 1</option><option>JSS 2</option><option>SSS 1</option>
                    </select>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Parent Phone Number" />
                    <input required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Home Address" />
                  </div>
                  <button type="submit" disabled={submitLoading} className="w-full bg-blue-900 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-blue-800 transition-all">
                    {submitLoading ? <Loader2 className="animate-spin" /> : 'Submit Application'}
                  </button>
                </form>
              )}
            </div>
          )}

          {step === 'status' && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-16 text-center animate-fadeIn border border-slate-100">
              <Clock size={80} className="mx-auto mb-8 text-orange-400" />
              <h2 className="text-3xl font-black mb-4">Application Processing</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-10 font-medium text-lg leading-relaxed">
                Thank you, {formData.fullName}. Your application is currently under review by the Registrar.
              </p>
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 inline-block">
                <p className="text-orange-700 font-black text-sm uppercase tracking-widest">Status: PENDING REVIEW</p>
              </div>
              <p className="mt-10 text-slate-400 text-sm italic">Please check back in 24-48 hours for your admission letter.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="bg-white rounded-[3rem] shadow-2xl p-16 text-center animate-fadeIn border border-slate-100">
              <CheckCircle2 size={80} className="mx-auto mb-8 text-green-500" />
              <h2 className="text-4xl font-black mb-6">Congratulations!</h2>
              <p className="text-slate-500 mb-12 text-lg font-medium">Your admission has been approved. You are now a student of {SCHOOL_NAME}.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button 
                  onClick={() => generateAdmissionLetter(formData.fullName, 'IMST/OFFICIAL/' + Date.now().toString().slice(-4), formData.classApplied)} 
                  className="bg-blue-900 text-white px-10 py-5 rounded-3xl font-black text-lg flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
                >
                  <FileBadge className="mr-3" /> Download Admission Letter
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-2xl font-black mb-6 flex items-center"><Info className="mr-3 text-blue-400"/> Requirements</h3>
              <ul className="space-y-4 text-slate-400 font-medium">
                 <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-500" /> Valid Passport Photo</li>
                 <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-500" /> Last School Report</li>
                 <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-500" /> Birth Certificate Copy</li>
                 <li className="flex items-center"><CheckCircle size={16} className="mr-2 text-green-500" /> Application Fee Slip</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Admissions;