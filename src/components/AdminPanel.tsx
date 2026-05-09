import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  addDoc, 
  serverTimestamp,
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { Application, Message } from '../types';
import { 
  Users, 
  Search, 
  LogOut, 
  Mail, 
  Phone, 
  Calendar,
  X,
  User as UserIcon,
  Send,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Download,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateDoc } from 'firebase/firestore';

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const adminDoc = await getDoc(doc(db, 'admins', u.uid));
        if (adminDoc.exists()) {
          setUser(u);
        } else {
          await signOut(auth);
          setLoginError('অবৈধ অ্যাডমিন অ্যাকাউন্ট (Invalid admin account)');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Application));
      setApplications(apps);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!selectedApplicant) return;
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Message))
        .filter(m => m.applicantId === selectedApplicant.id);
      setMessages(msgs);
    });
    return unsub;
  }, [selectedApplicant]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const normalizedAdminId = adminId.trim();
      const adminDoc = await getDoc(doc(db, 'admin_access', normalizedAdminId));

      if (!adminDoc.exists()) {
        setLoginError('এই Admin ID সিস্টেমে অনুমোদিত নয়।');
        return;
      }

      const adminData = adminDoc.data() as { authEmail?: string; active?: boolean };
      if (!adminData.active || !adminData.authEmail) {
        setLoginError('এই Admin ID বর্তমানে নিষ্ক্রিয় অথবা অসম্পূর্ণ।');
        return;
      }

      const signInResult = await signInWithEmailAndPassword(auth, adminData.authEmail, password);

      const adminProfileRef = doc(db, 'admins', signInResult.user.uid);
      const adminProfileSnap = await getDoc(adminProfileRef);
      if (!adminProfileSnap.exists()) {
        await setDoc(adminProfileRef, {
          email: adminData.authEmail,
          role: 'superadmin',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setLoginError('Config Required: Enable Email/Password Auth in Firebase Console.');
      } else {
        setLoginError('ভুল আইডি বা পাসওয়ার্ড (Wrong ID or Security Key).');
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'accepted' | 'rejected') => {
    setUpdateLoading(true);
    try {
      await updateDoc(doc(db, 'applications', id), { status: newStatus });
      
      const appSnap = await getDoc(doc(db, 'applications', id));
      if (appSnap.exists()) {
        const app = { id, ...appSnap.data() } as Application;
        
        const emailContent = newStatus === 'accepted' 
          ? {
            subject: 'সিবিটি প্রগ্রেস টিমে আপনাকে স্বাগতম!',
            text: `অভিনন্দন ${app.fullName}! আপনাকে সিবিটি প্রগ্রেস কোর্সের টিমে যুক্ত করা হয়েছে। আমরা আপনার সাথে কাজ করতে আগ্রহী। শীঘ্রই আপনাকে পরবর্তী ধাপগুলো জানিয়ে দেয়া হবে।`,
            html: `<h1>অভিনন্দন ${app.fullName}!</h1><p>আপনাকে <b>সিবিটি প্রগ্রেস</b> কোর্সের টিমে যুক্ত করা হয়েছে। আমরা আপনার সাথে কাজ করতে আগ্রহী। শীঘ্রই আপনাকে পরবর্তী ধাপগুলো জানিয়ে দেয়া হবে।</p>`
          }
          : {
            subject: 'আবেদন সংক্রান্ত আপডেট - সিবিটি প্রগ্রেস',
            text: `দুঃখিত ${app.fullName}, আপনার আবেদনটি এই মুহূর্তে সিবিটি প্রগ্রেস টিমের জন্য মনোনীত হয়নি। আমরা আপনার উজ্জ্বল ভবিষ্যৎ কামনা করি।`,
            html: `<h3>আবেদন এর রেজাল্ট</h3><p>দুঃখিত ${app.fullName}, আপনার আবেদনটি এই মুহূর্তে <b>সিবিটি প্রগ্রেস</b> টিমের জন্য মনোনীত হয়নি। আমরা আপনার উজ্জ্বল ভবিষ্যৎ কামনা করি।</p>`
          };

        await addDoc(collection(db, 'mail'), {
          to: app.email,
          message: emailContent,
          createdAt: serverTimestamp()
        });

        await addDoc(collection(db, 'messages'), {
          applicantId: id,
          content: `Account ${newStatus === 'accepted' ? 'Confirmed' : 'Rejected'} - Notification Sent.`,
          senderId: 'SYSTEM',
          createdAt: serverTimestamp(),
        });
      }

      if (selectedApplicant?.id === id) {
        setSelectedApplicant({ ...selectedApplicant, status: newStatus });
      }
    } catch (err) {
      console.error(err);
      alert('Update failed');
    } finally {
      setUpdateLoading(false);
    }
  };

  const downloadCSV = () => {
    const acceptedOnes = applications.filter(app => app.status === 'accepted');
    if (acceptedOnes.length === 0) {
      alert("No accepted candidates to export.");
      return;
    }

    const headers = ['FullName', 'Email', 'Phone', 'WhatsApp', 'Roll', 'RegNo', 'Department', 'Semester', 'Shift', 'Group', 'Status', 'Motivation'];
    const rows = acceptedOnes.map(app => [
      `"${app.fullName}"`,
      `"${app.email}"`,
      `"${app.phone}"`,
      `"${app.whatsapp || 'N/A'}"`,
      `"${app.roll}"`,
      `"${app.regNo}"`,
      `"${app.department}"`,
      `"${app.semester}"`,
      `"${app.shift}"`,
      `"${app.group}"`,
      `"${app.status}"`,
      `"${app.motivationLetter?.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `CBT_Progress_Team_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplications = applications.filter(app => {
    const matchesTab = activeTab === 'pending' ? (app.status === 'pending' || app.status === 'reviewed') : (app.status === activeTab);
    const matchesSearch = 
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      app.roll.includes(searchTerm) || 
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.department?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSendMessage = async () => {
    if (!selectedApplicant || !messageText.trim() || !user) return;
    try {
      await addDoc(collection(db, 'messages'), {
        applicantId: selectedApplicant.id,
        content: messageText,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      setMessageText('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center px-6 md:border-[12px] border-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 md:p-12 border-4 border-editorial-text shadow-[12px_12px_0px_0px_#1A1A1A] max-w-md w-full"
        >
          <button 
            onClick={() => window.location.href = '/'}
            className="group flex items-center gap-3 px-6 py-3 bg-stone-100 border-4 border-editorial-text font-black uppercase text-[10px] tracking-[0.2em] shadow-[6px_6px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all mb-10 w-fit"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m15 18-6-6 6-6"/></svg>
            Back to Application
          </button>
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-editorial-accent-blue border-4 border-editorial-text flex items-center justify-center rotate-3">
              <UserIcon className="w-10 h-10 text-editorial-text" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-black text-center mb-2 italic">
            Admin Auth
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center mb-10 opacity-40">
            CBT Progress Central Terminal
          </p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-editorial-text uppercase tracking-widest mb-2 opacity-50">Operational ID</label>
              <input 
                type="text" 
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-200 focus:border-editorial-text outline-none text-sm transition-all font-bold"
                placeholder="Ex: 1502361149"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-editorial-text uppercase tracking-widest mb-2 opacity-50">Security Key</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-stone-50 border-2 border-stone-200 focus:border-editorial-text outline-none text-sm transition-all"
                required
              />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 border border-red-200 text-xs font-bold">
                <ShieldAlert size={16} /> {loginError}
              </div>
            )}
            <button className="w-full text-white py-5 font-black uppercase tracking-widest transition-all shadow-[6px_6px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 bg-editorial-text">
              Access Terminal
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-bg flex md:border-[12px] border-white overflow-hidden relative">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r-4 border-editorial-text p-8 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="flex justify-between items-center mb-12">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-30 leading-none mb-1">Central Console</span>
            <h1 className="text-3xl font-serif font-black tracking-tighter uppercase leading-none italic">সিবিটি প্রগ্রেস</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-4">
          <button 
            onClick={() => { setActiveTab('pending'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-5 py-4 border-2 border-editorial-text shadow-[4px_4px_0px_0px_#1A1A1A] font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'pending' ? 'bg-editorial-accent-blue' : 'bg-white'}`}
          >
            <span className="flex items-center gap-3"><Users className="w-4 h-4" /> Pending Approval</span>
            <span className="bg-editorial-text text-white px-2 py-0.5 rounded-sm text-[10px]">
              {applications.filter(app => app.status === 'pending' || app.status === 'reviewed').length}
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('accepted'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-5 py-4 border-2 border-editorial-text shadow-[4px_4px_0px_0px_#1A1A1A] font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'accepted' ? 'bg-[#55EFC4]' : 'bg-white'}`}
          >
            <span className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4" /> The Team</span>
            <span className="bg-editorial-text text-white px-2 py-0.5 rounded-sm text-[10px]">
              {applications.filter(app => app.status === 'accepted').length}
            </span>
          </button>

          <button 
            onClick={() => { setActiveTab('rejected'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-5 py-4 border-2 border-editorial-text shadow-[4px_4px_0px_0px_#1A1A1A] font-black uppercase text-xs tracking-widest transition-all ${activeTab === 'rejected' ? 'bg-editorial-accent-red text-white' : 'bg-white'}`}
          >
            <span className="flex items-center gap-3"><XCircle className="w-4 h-4" /> Rejected</span>
            <span className="bg-editorial-text text-white px-2 py-0.5 rounded-sm text-[10px]">
              {applications.filter(app => app.status === 'rejected').length}
            </span>
          </button>

          {activeTab === 'accepted' && (
            <button 
              onClick={downloadCSV}
              className="w-full flex items-center gap-3 px-5 py-4 bg-editorial-text text-white border-2 border-editorial-text font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-stone-800"
            >
              <Download className="w-4 h-4" /> Export Team CSV
            </button>
          )}
        </nav>

        <div className="mt-auto pt-8 border-t-2 border-editorial-text/10">
          <div className="flex items-center gap-3 mb-6 p-3 bg-stone-50 border border-stone-100 italic text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System Live: Stable
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-3 px-5 py-4 bg-white border-2 border-editorial-text text-editorial-text hover:bg-editorial-accent-red hover:text-white font-black uppercase text-xs tracking-widest transition-colors shadow-[4px_4px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
          >
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-white/30">
        <header className="bg-white border-b-4 border-editorial-text px-6 md:px-10 py-6 md:py-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 border-2 border-editorial-text shadow-[3px_3px_0px_0px_#1A1A1A]">
              <Filter className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
               <h2 className="text-xl md:text-3xl font-serif font-black italic tracking-tight">Dashboard</h2>
               <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Selection Phase</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <div className="relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-editorial-text opacity-30" />
              <input 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 md:pl-12 pr-4 md:pr-6 py-2 md:py-3 bg-stone-100 border-2 border-transparent focus:border-editorial-text focus:bg-white transition-all text-[10px] md:text-xs font-bold w-32 sm:w-48 lg:w-72 outline-none"
              />
            </div>
            <div className="flex items-center gap-3 md:gap-4 border-l-2 border-editorial-text/10 pl-3 md:pl-6">
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-black uppercase opacity-40 leading-none mb-1">Authenticated as</p>
                 <p className="text-xs font-bold">{user.email?.split('@')[0]}</p>
              </div>
              <div className="w-8 h-8 md:w-12 md:h-12 border-2 border-editorial-text shadow-[2px_2px_0px_0px_#1A1A1A] md:shadow-[3px_3px_0px_0px_#1A1A1A] bg-stone-800 flex items-center justify-center">
                 <UserIcon className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:40px_40px] [background-position:center] opacity-100">
          <div className="bg-white border-4 border-editorial-text shadow-[12px_12px_0px_0px_#1A1A1A] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
               <ShieldAlert size={120} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-editorial-text text-white">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10">Candidate Identity</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10 hidden sm:table-cell">Academic Context</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/10">Status Matrix</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-editorial-text">
                  {filteredApplications.map(app => (
                    <tr key={app.id} className="hover:bg-editorial-accent-blue/20 transition-colors group">
                      <td className="px-8 py-6 border-r-2 border-editorial-text/5">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 border-2 border-editorial-text shadow-[4px_4px_0px_0px_#1A1A1A] bg-stone-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <UserIcon className="w-5 h-5 text-editorial-text/60" />
                          </div>
                          <div>
                            <p className="font-serif font-black italic text-lg leading-none mb-1">{app.fullName}</p>
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{app.email || 'NO-EMAIL-SET'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 border-r-2 border-editorial-text/5 hidden sm:table-cell">
                        <p className="text-xs font-black uppercase tracking-tighter mb-1">{app.department} / <span className="opacity-40">Group {app.group}</span></p>
                        <p className="text-[10px] font-medium text-stone-500 italic">Roll: {app.roll} | Phase: {app.semester}</p>
                      </td>
                      <td className="px-8 py-6 border-r-2 border-editorial-text/5">
                        <span className={`inline-block px-4 py-1.5 border-2 border-editorial-text text-[10px] font-black uppercase tracking-widest ${
                          app.status === 'pending' ? 'bg-editorial-accent-orange text-white' :
                          app.status === 'accepted' ? 'bg-[#55EFC4] text-editorial-text' :
                          app.status === 'rejected' ? 'bg-editorial-accent-red text-white' :
                          'bg-stone-200 text-stone-600'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(app.id!, 'accepted')}
                                className="p-2 bg-green-100 text-green-700 border-2 border-green-700 hover:bg-green-700 hover:text-white transition-all shadow-[2px_2px_0px_0px] shadow-green-900"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(app.id!, 'rejected')}
                                className="p-2 bg-red-100 text-red-700 border-2 border-red-700 hover:bg-red-700 hover:text-white transition-all shadow-[2px_2px_0px_0px] shadow-red-900"
                              >
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setSelectedApplicant(app)}
                            className="px-4 py-2 border-2 border-editorial-text bg-white text-editorial-text font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApplications.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 opacity-20" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30">No matching records found in active buffer</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {selectedApplicant && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApplicant(null)}
              className="fixed inset-0 bg-editorial-text z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-screen w-full max-w-2xl bg-white z-50 border-l-[12px] border-white flex flex-col"
            >
              <div className="p-10 border-b-4 border-editorial-text flex items-center justify-between bg-editorial-bg">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Personnel Dossier</span>
                  <h3 className="text-3xl font-serif font-black italic">Candidate Profile</h3>
                </div>
                <button onClick={() => setSelectedApplicant(null)} className="w-12 h-12 border-2 border-editorial-text flex items-center justify-center hover:bg-editorial-accent-red hover:text-white transition-colors shadow-[4px_4px_0px_0px_#1A1A1A] hover:shadow-none">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-12 custom-scrollbar">
                <div className="flex flex-col md:flex-row items-center gap-10 mb-16">
                  <div className="w-48 h-56 border-4 border-editorial-text shadow-[12px_12px_0px_0px_#1A1A1A] overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-editorial-text/60" />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-5xl font-serif font-black italic mb-4 leading-tight">{selectedApplicant.fullName}</h2>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                       <span className="bg-editorial-accent-pink text-white px-4 py-1.5 border-2 border-editorial-text text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_#1A1A1A]">
                         ID: {selectedApplicant.id?.slice(0, 8)}
                       </span>
                       <span className="bg-white px-4 py-1.5 border-2 border-editorial-text text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_#1A1A1A]">
                         {selectedApplicant.department}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10 mb-16 border-y-4 border-editorial-text/10 py-12">
                  <DetailItem icon={<Mail size={16} />} label="Email Address" value={selectedApplicant.email || 'Unspecified'} />
                  <DetailItem icon={<Phone size={16} />} label="Primary Contact" value={selectedApplicant.phone || 'Unknown'} />
                  <DetailItem icon={<div className="font-bold text-green-500">WA</div>} label="WhatsApp" value={selectedApplicant.whatsapp || 'Not Provided'} />
                  <DetailItem icon={<Calendar size={16} />} label="Roll / Registration" value={`${selectedApplicant.roll} / ${selectedApplicant.regNo}`} />
                  <DetailItem icon={<Users size={16} />} label="Academic Phase" value={`${selectedApplicant.semester} Semester | ${selectedApplicant.shift} | Group ${selectedApplicant.group}`} />
                </div>

                {selectedApplicant.status === 'pending' && (
                  <div className="flex gap-4 mb-10">
                    <button 
                      onClick={() => handleUpdateStatus(selectedApplicant.id!, 'accepted')}
                      disabled={updateLoading}
                      className="flex-1 bg-[#55EFC4] border-4 border-editorial-text py-5 font-black uppercase text-xs tracking-[0.2em] shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
                    >
                      {updateLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Accept into Team</>}
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedApplicant.id!, 'rejected')}
                      disabled={updateLoading}
                      className="flex-1 bg-editorial-accent-red text-white border-4 border-editorial-text py-5 font-black uppercase text-xs tracking-[0.2em] shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
                    >
                      {updateLoading ? <Loader2 className="animate-spin" /> : <><XCircle size={18} /> Send Rejection</>}
                    </button>
                  </div>
                )}

                <div className="mb-16">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-0.5 flex-1 bg-editorial-text/10" />
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">Career Manifesto</h4>
                    <div className="h-0.5 flex-1 bg-editorial-text/10" />
                  </div>
                  <div className="p-10 bg-editorial-accent-blue/10 border-2 border-editorial-text italic text-lg leading-relaxed text-stone-800 shadow-[8px_8px_0px_0px_#1A1A1A] relative">
                    <span className="absolute -top-4 -left-4 text-6xl font-serif text-editorial-accent-orange opacity-20">"</span>
                    {selectedApplicant.motivationLetter}
                  </div>
                </div>

                <div className="bg-stone-50 border-4 border-editorial-text p-8 shadow-[10px_10px_0px_0px_#A29BFE]">
                  <h4 className="text-[10px] font-black text-editorial-text uppercase tracking-[0.4em] mb-8 pb-4 border-b-2 border-editorial-text/5 flex items-center gap-3">
                    <Send size={14} className="text-editorial-accent-purple" /> Automated Communication Log
                  </h4>
                  <div className="space-y-6 mb-10 min-h-[150px]">
                    {messages.length === 0 && (
                      <p className="text-center italic text-stone-400 text-sm py-10">No previous transmissions recorded.</p>
                    )}
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 border-2 border-editorial-text text-sm font-medium shadow-[4px_4px_0px_0px_#1A1A1A] ${
                          msg.senderId === user.uid ? 'bg-editorial-accent-blue text-editorial-text' : 'bg-white text-stone-800'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea 
                      placeholder="Compose transmission..." 
                      className="w-full p-6 bg-white border-2 border-editorial-text focus:bg-stone-50 outline-none resize-none text-sm transition-all"
                      rows={4}
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="absolute right-6 bottom-6 bg-editorial-text text-white px-6 py-3 font-black uppercase text-xs tracking-widest shadow-[4px_4px_0px_0px_#FD79A8] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      Process <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 border-2 border-editorial-text bg-white flex items-center justify-center text-editorial-text shadow-[3px_3px_0px_0px_#1A1A1A]">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-2">{label}</p>
        <p className="font-bold text-stone-900 border-b-2 border-editorial-accent-blue/20 inline-block break-all">{value}</p>
      </div>
    </div>
  );
}
