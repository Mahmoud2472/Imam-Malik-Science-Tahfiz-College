
import React, { useState, useEffect, useCallback } from 'react';
import { Download, CreditCard, CheckCircle, Upload, Loader2, User, School, Briefcase, Lock, LogIn, LogOut, ShieldCheck, Save, ExternalLink, Key, Camera, MapPin, Phone, Mail, Calendar, X, AlertCircle, FileText } from 'lucide-react';
import { PAYSTACK_APP_FEE_LINK, SCHOOL_NAME, SCHOOL_ADDRESS, APPLICATION_FEE_AMOUNT } from '../constants';
import { supabase, signOut } from '../services/supabaseClient';
import { jsPDF } from "jspdf";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useLocation } from 'react-router-dom';
import { addPdfHeader, generateReceipt } from '../utils/pdfUtils';

type AdmissionStep = 'auth' | 'form' | 'success';

const Admissions: React.FC = () => {
  const [step, setStep] = useState<AdmissionStep>('auth');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [manualRefInput, setManualRefInput] = useState('');
  const [showManualRefField, setShowManualRefField] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({ fullName: '', gender: '', dateOfBirth: '', specialNeeds: '', lastSchoolAttended: '', islamiyyaSchool: '', graduationYear: '', classApplied: '', parentName: '', parentOccupation: '', address: '', phone: '', email: '', });

  const checkExistingPayment = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && data.payment_reference) {
        setPaymentRef(data.payment_reference);
        setFormData(prev => ({
          ...prev,
          fullName: data.full_name || prev.fullName,
          classApplied: data.class_applied || prev.classApplied,
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
          gender: data.gender || prev.gender,
          dateOfBirth: data.dob || prev.dateOfBirth,
          lastSchoolAttended: data.last_school || prev.lastSchoolAttended,
          islamiyyaSchool: data.islamiyya_school || prev.islamiyyaSchool,
          graduationYear: data.grad_year || prev.graduationYear,
          parentName: data.parent_name || prev.parentName,
          parentOccupation: data.parent_occupation || prev.parentOccupation,
        }));
        if (data.photo_url) setPhotoPreview(data.photo_url);
        setStep('form');
      }
    } catch (err) {
      console.error("Database check failed:", err);
    }
  }, []);

  const savePaymentReference = async (userId: string, ref: string) => {
    try {
      await supabase.from('applications').upsert({
        user_id: userId,
        payment_reference: ref,
        status: 'Applicant'
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.error("Failed to persist payment reference:", e);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try { 
        const { data: { session } } = await supabase.auth.getSession(); 
        if (session?.user) { 
          setUser(session.user); 
          setFormData(prev => ({ ...prev, email: session.user.email || '' })); 
          checkExistingPayment(session.user.id);
        } 
      } catch (e) { }
    }; 
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { 
      if (session?.user) { 
        setUser(session.user); 
        setFormData(prev => ({ ...prev, email: session.user.email || '' })); 
        checkExistingPayment(session.user.id);
        setStep('form'); 
      } else { 
        setUser(null); 
        setStep('auth'); 
      } 
    });
    return () => subscription.unsubscribe();
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

  const handleManualRefSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualRefInput.length > 5) {
      setPaymentRef(manualRefInput);
      if (user) await savePaymentReference(user.id, manualRefInput);
      setStep('form');
      setShowManualRefField(false);
    } else {
      alert("Please enter a valid Paystack reference number.");
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
    if (e.target.files && e.target.files[0]) { 
      const file = e.target.files[0]; 
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } 
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setAuthLoading(true); 
    setAuthError('');
    
    if (authEmail === 'applicant@school.com' && authPassword === 'applicant') { 
      await new Promise(r => setTimeout(r, 500)); 
      setUser({ id: 'demo-applicant', email: authEmail } as SupabaseUser); 
      setStep('form'); 
      setAuthLoading(false); 
      return; 
    }
    
    try {
      if (isLogin) { 
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }); 
        if (error) throw error; 
      } else { 
        const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword }); 
        if (error) throw error; 
        if (!data.session) { 
          alert("Account created. Please check your email to verify, then login."); 
          setIsLogin(true); 
        } 
      }
    } catch (error: any) { 
      setAuthError(error.message || "Authentication failed.");
    } finally { 
      setAuthLoading(false); 
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef) {
      alert("Please complete the application fee payment first.");
      return;
    }
    setSubmitLoading(true);
    try {
      if (user?.id && !user.id.startsWith('demo')) {
        const { error } = await supabase.from('applications').upsert([{
          user_id: user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          dob: formData.dateOfBirth,
          gender: formData.gender,
          class_applied: formData.classApplied,
          last_school: formData.lastSchoolAttended,
          islamiyya_school: formData.islamiyyaSchool,
          grad_year: formData.graduationYear,
          parent_name: formData.parentName,
          parent_occupation: formData.parentOccupation,
          payment_reference: paymentRef,
          status: 'Applicant',
          photo_url: photoPreview
        }], { onConflict: 'user_id' });
        if (error) throw error;
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      setStep('success');
    } catch (err: any) {
      alert("Failed to save application: " + err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadForm = async () => {
    const doc = new jsPDF();
    const yStart = await addPdfHeader(doc, "APPLICATION FOR ADMISSION", `Ref: ${paymentRef || 'N/A'}`);

    if (photoPreview) {
        try { doc.addImage(photoPreview, 'JPEG', 160, yStart - 15, 30, 30); } catch (e) { doc.rect(160, yStart - 15, 30, 30); doc.text("Photo", 168, yStart); }
    } else { doc.rect(160, yStart - 15, 30, 30); doc.text("Paste Photo", 163, yStart); }
    
    let y = yStart + 25; 
    const lineHeight = 10;
    const leftX = 20;

    const addSection = (title: string) => { 
        y += 5; doc.setFont("helvetica", "bold"); doc.setFillColor(240, 240, 240); 
        doc.rect(leftX, y - 4, 170, 6, 'F'); doc.text(title.toUpperCase(), leftX + 2, y); 
        y += 8; doc.setFont("helvetica", "normal"); 
    };
    const addField = (label: string, value: string) => { 
        doc.setFont("helvetica", "bold"); doc.text(label + ":", leftX, y); 
        doc.setFont("helvetica", "normal"); 
        const valText = value || "N/A";
        if (valText.length > 50) { 
            const splitText = doc.splitTextToSize(valText, 120); 
            doc.text(splitText, leftX + 50, y); 
            y += (splitText.length * 5); 
        } else { 
            doc.text(valText, leftX + 50, y); 
            y += lineHeight; 
        } 
        doc.setDrawColor(200); doc.line(leftX, y - 4, 190, y - 4); 
    };

    addSection("Student Information"); addField("Full Name", formData.fullName); addField("Gender", formData.gender); addField("Date of Birth", formData.dateOfBirth); addField("Class Applied", formData.classApplied); addField("Special Needs", formData.specialNeeds || "None");
    addSection("Academic History"); addField("Previous School", formData.lastSchoolAttended); addField("Islamiyya School", formData.islamiyyaSchool); addField("Graduation Year", formData.graduationYear);
    addSection("Guardian Information"); addField("Guardian Name", formData.parentName); addField("Occupation", formData.parentOccupation); addField("Phone Number", formData.phone); addField("Email Address", formData.email); addField("Residential Address", formData.address);

    y += 20; doc.text("__________________________", 20, y); doc.text("__________________________", 140, y); y += 5; doc.text("Guardian Signature", 20, y); doc.text("School Official", 140, y);
    doc.save(`Admission_Form_${formData.fullName.replace(/\s/g, '_')}.pdf`);
  };

  const handleDownloadReceipt = () => {
      generateReceipt({
          receiptType: "Application Fee Receipt",
          studentName: formData.fullName,
          amount: APPLICATION_FEE_AMOUNT.toString(),
          reference: paymentRef,
          date: new Date().toLocaleDateString(),
      });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Admission Portal</h1>
        <div className="flex justify-center mt-8">
            {[1,2,3].map(i => (
                <div key={i} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-500 ${step === (i===1?'auth':i===2?'form':'success') ? 'bg-blue-600 text-white scale-110' : 'bg-slate-200 text-slate-600'}`}>{i}</div>
                    {i<3 && <div className="w-12 h-1 bg-slate-200 mx-2"></div>}
                </div>
            ))}
        </div>
      </div>
      
      {step === 'auth' && (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100">
          <h2 className="text-xl font-bold text-center mb-6">{isLogin ? 'Login to Continue' : 'Create Application Account'}</h2>
          {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{authError}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label>
                <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="your@email.com" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label>
                <input type="password" required minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={authLoading} className="w-full bg-blue-900 text-white py-3 rounded-md font-bold hover:bg-blue-800 flex justify-center shadow-lg transition-transform active:scale-95">
              {authLoading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Login & Proceed' : 'Register & Start Application')}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-medium hover:underline">{isLogin ? "New applicant? Create an account" : "Already have an account? Login here"}</button>
          </div>
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-400">DEMO ACCESS</span></div>
          </div>
          <button onClick={() => { setAuthEmail('applicant@school.com'); setAuthPassword('applicant'); }} className="mt-4 w-full py-2 border-2 border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">Use Demo Applicant Account</button>
        </div>
      )}
      
      {step === 'form' && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-4 border-b">
            <div><h2 className="text-2xl font-bold text-slate-900">Application Form</h2><p className="text-sm text-slate-500">Please provide accurate information to complete your admission.</p></div>
            <button onClick={() => signOut()} className="text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center border border-red-100"><LogOut className="h-4 w-4 mr-2"/> Log Out</button>
          </div>
          
          <div className={`p-5 rounded-xl border mb-10 flex flex-col md:flex-row gap-5 items-center justify-between shadow-sm transition-all duration-500 ${paymentRef ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex-grow w-full">
              <h3 className={`font-bold text-lg mb-1 flex items-center ${paymentRef ? 'text-green-800' : 'text-yellow-800'}`}>
                {paymentRef ? <CheckCircle className="h-5 w-5 mr-2" /> : <Lock className="h-5 w-5 mr-2" />}
                {paymentRef ? 'Payment Successfully Verified' : 'Application Fee Required'}
              </h3>
              {paymentRef ? (
                <p className="text-sm text-green-700">Reference: <span className="font-mono bg-white px-2 py-0.5 rounded border border-green-200">{paymentRef}</span></p>
              ) : (
                <>
                  <p className="text-sm text-yellow-700">The application form is locked. Click the button to pay the <strong>₦{APPLICATION_FEE_AMOUNT.toLocaleString()}</strong> application fee. You will return here automatically after payment.</p>
                  
                  {!showManualRefField ? (
                    <button onClick={() => setShowManualRefField(true)} className="mt-2 text-xs text-blue-600 font-bold hover:underline flex items-center">
                      <Key className="h-3 w-3 mr-1" /> Already paid? Enter reference manually
                    </button>
                  ) : (
                    <form onSubmit={handleManualRefSubmit} className="mt-3 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Paste Reference here..." 
                        className="text-xs px-3 py-1.5 border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500 bg-white" 
                        value={manualRefInput}
                        onChange={(e) => setManualRefInput(e.target.value)}
                        required
                      />
                      <button type="submit" className="bg-yellow-600 text-white text-xs px-3 py-1.5 rounded font-bold">Unlock</button>
                      <button type="button" onClick={() => setShowManualRefField(false)} className="text-xs text-slate-400">Cancel</button>
                    </form>
                  )}
                </>
              )}
            </div>
            {!paymentRef && (
                <button 
                    onClick={() => window.open(PAYSTACK_APP_FEE_LINK, '_blank')} 
                    className="w-full md:w-auto bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition-all whitespace-nowrap active:scale-95"
                >
                    Pay Application Fee Now
                </button>
            )}
          </div>

          {!paymentRef && (
            <div className="mb-10 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800 font-bold">Having trouble unlocking the form?</p>
                <p className="text-xs text-blue-700 mt-1">If you have paid successfully but the form is still locked, the system automatically checks the database. You can also manually enter your reference above.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitApplication} className={`space-y-10 transition-all duration-700 ${!paymentRef ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
            <div>
              <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-3 mb-6 flex items-center"><User className="h-5 w-5 mr-2 text-blue-600"/> Student Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="w-44 h-44 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center overflow-hidden mb-3 relative group shadow-inner">
                    {photoPreview ? (<img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />) : (<div className="text-center text-slate-400 p-4"><Camera className="h-10 w-10 mx-auto mb-2 opacity-30" /><span className="text-[10px] font-bold uppercase tracking-widest">Upload Passport</span></div>)}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold text-xs uppercase">Click to Change</div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">White background preferred</p>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name (Surname First)</label>
                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 focus:outline-none bg-slate-50/50" placeholder="Musa Ahmed Ibrahim" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Gender</label>
                    <select required value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Date of Birth</label>
                    <input type="date" required value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Class Applying For</label>
                    <select required value={formData.classApplied} onChange={(e) => setFormData({...formData, classApplied: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50">
                        <option value="">Select Class</option>
                        <option>JSS 1</option><option>JSS 2</option><option>JSS 3</option>
                        <option>SSS 1</option><option>SSS 2</option><option>SSS 3</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Special Needs / Health Conditions</label>
                    <textarea value={formData.specialNeeds} onChange={(e) => setFormData({...formData, specialNeeds: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" placeholder="Mention any medical concerns or allergies..." rows={2} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-3 mb-6 flex items-center"><School className="h-5 w-5 mr-2 text-blue-600"/> Academic History</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Last School Attended</label>
                            <input type="text" required value={formData.lastSchoolAttended} onChange={(e) => setFormData({...formData, lastSchoolAttended: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" placeholder="Primary/Junior Secondary School" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Islamiyya School</label>
                                <input type="text" value={formData.islamiyyaSchool} onChange={(e) => setFormData({...formData, islamiyyaSchool: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Graduation Year</label>
                                <input type="text" required value={formData.graduationYear} onChange={(e) => setFormData({...formData, graduationYear: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" placeholder="e.g. 2024" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-800 border-l-4 border-blue-600 pl-3 mb-6 flex items-center"><Briefcase className="h-5 w-5 mr-2 text-blue-600"/> Guardian Info</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Parent Name</label>
                                <input type="text" required value={formData.parentName} onChange={(e) => setFormData({...formData, parentName: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Phone Number</label>
                                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Address</label>
                            <input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border-2 border-slate-100 p-2.5 rounded-lg focus:border-blue-500 bg-slate-50/50" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8">
                <button 
                  type="submit" 
                  disabled={submitLoading} 
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center disabled:bg-slate-300 active:scale-95"
                >
                    {submitLoading ? <Loader2 className="animate-spin mr-3" /> : <Save className="mr-3" />}
                    {submitLoading ? 'Submitting Application...' : 'Submit Final Application'}
                </button>
            </div>
          </form>
        </div>
      )}

      {step === 'success' && (
        <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-100 text-center animate-fadeIn">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
          <p className="text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">Your application for <strong>{formData.fullName}</strong> has been received successfully. Our admissions team will review it and contact you via phone or email.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleDownloadReceipt} 
              className="flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 transition-all active:scale-95"
            >
              <FileText className="mr-3 h-5 w-5" /> Download Fee Receipt
            </button>
            <button 
              onClick={handleDownloadForm} 
              className="flex items-center justify-center px-8 py-4 bg-blue-900 text-white rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-all active:scale-95"
            >
              <Download className="mr-3 h-5 w-5" /> Download Application PDF
            </button>
          </div>
          <button 
            onClick={() => window.location.href = '#/'} 
            className="mt-8 px-8 py-2 text-slate-500 font-medium hover:text-slate-800 transition-all underline"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};

export default Admissions;
