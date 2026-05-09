import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Mascot from './Mascot';
import { MascotState } from '../types';
import { CheckCircle2, AlertCircle, Send, Loader2, Clock, Globe } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  initialState: MascotState;
  persistentText?: string;
  persistentState?: MascotState;
  isTrap?: boolean;
}

const BASE_QUESTIONS: Question[] = [
  {
    id: 'attendance',
    text: 'প্রতিদিন ক্লাসে আসতে পারবে?',
    initialState: 'questioning',
    persistentText: 'আমি কিন্তু আবারও বলছি, একটি ক্লাসও কি মিস হবে না? ভালো করে ভেবে বলো!',
    persistentState: 'thinking'
  },
  {
    id: 'consistency',
    text: 'একটি ক্লাসও কি মিস হবে না? ভেবে বলো।',
    initialState: 'thinking'
  },
  {
    id: 'learning',
    text: 'যা শেখানো হবে তা কি বিনয়ের সাথে শিখতে প্রস্তুত?',
    initialState: 'neutral'
  },
  {
    id: 'english',
    text: 'ইংরেজি ক্লাসগুলো কি বুঝতে পারবে?',
    initialState: 'thinking'
  },
  {
    id: 'homework',
    text: 'প্রতিদিনের কাজ কি প্রতিদিন জমা দিতে পারবে?',
    initialState: 'questioning'
  },
  {
    id: 'hardwork',
    text: 'অনেক পরিশ্রম করতে হবে, তুমি কি তৈরি?',
    initialState: 'thinking'
  },
  {
    id: 'assessment',
    text: 'কঠোর এসেসমেন্টে নিজেকে প্রমাণ করতে পারবে?',
    initialState: 'questioning'
  },
  {
    id: 'seriousness',
    text: 'তুমি কি সত্যিই এই কোর্স নিয়ে সিরিয়াস?',
    initialState: 'questioning'
  }
];

export default function StudentPortal() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEligible, setIsEligible] = useState(true);
  const [step, setStep] = useState<'landing' | 'filtration' | 'form' | 'success' | 'rejected'>('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [consecutiveYes, setConsecutiveYes] = useState(0);
  const [mascotState, setMascotState] = useState<MascotState>('neutral');
  const reactionIndexRef = useRef(0);
  const [mascotGaze, setMascotGaze] = useState<{ x: number, y: number } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formInstruction, setFormInstruction] = useState('অনুগ্রহ করে আপনার তথ্যগুলো সঠিক ভাবে প্রদান করুন।');

  const startFiltration = () => {
    const questionsStates: MascotState[] = ['thinking', 'cool', 'neutral'];
    
    const shuffled = [...BASE_QUESTIONS]
      .sort(() => Math.random() - 0.5)
      .map((q, index) => ({
        ...q,
        initialState: questionsStates[index % questionsStates.length]
      }));
    
    setQuestions(shuffled);
    setStep('filtration');
    setCurrentQuestionIndex(0);
    setConsecutiveYes(0);
    setIsEligible(true);
    setMascotState('wave');
  };

    useEffect(() => {
      if (step === 'filtration' && questions[currentQuestionIndex]) {
        const q = questions[currentQuestionIndex];
        
        if (currentQuestionIndex === 0 && mascotState === 'wave') {
          const timer = setTimeout(() => {
            setMascotState(q.initialState);
          }, 3000);
          return () => clearTimeout(timer);
        } else {
          setMascotState(q.initialState);
        }
      }
    }, [currentQuestionIndex, step, questions]);

  const handleAnswer = (answer: boolean) => {
    const q = questions[currentQuestionIndex];
    setMascotGaze(null);

    if (answer === false) {
      setIsEligible(false);
      setMascotState('sad');
    } else {
      setConsecutiveYes(prev => prev + 1);
      
      const positiveStates: MascotState[] = ['happy', 'smiling', 'excited', 'grin', 'wink', 'cool', 'persistent'];
      const nextPose = positiveStates[reactionIndexRef.current];
      reactionIndexRef.current = (reactionIndexRef.current + 1) % positiveStates.length;
      
      if (q.id === 'attendance') {
        setMascotState('thinking');
      } else {
        setMascotState(nextPose);
      }
    }

    if (q.id === 'attendance' && answer === true) {
      const trap: Question = {
        id: 'attendance_trap',
        text: 'আমি কিন্তু আবারও বলছি, একটি ক্লাসও কি মিস হবে না? ভালো করে ভেবে বলো!',
        initialState: 'questioning',
        isTrap: true
      };
      
      const newQuestions = [...questions];
      const insertIndex = Math.min(currentQuestionIndex + 3, newQuestions.length);
      newQuestions.splice(insertIndex, 0, trap);
      setQuestions(newQuestions);
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setMascotState(questions[nextIndex].initialState);
      } else {
        if (isEligible && answer === true) {
          setStep('form');
          setMascotState('happy');
        } else {
          setStep('rejected');
          setMascotState('sad');
        }
      }
    }, 1200);
  };

  const onFormFieldFocus = useCallback((fieldLabel: string) => {
    setMascotState('pointing');
    setFormInstruction(`এখন আপনার ${fieldLabel} ইনপুট দিন।`);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const applicationData = {
        fullName: formData.get('fullName'),
        roll: formData.get('roll'),
        regNo: formData.get('regNo'),
        semester: formData.get('semester'),
        shift: formData.get('shift'),
        department: formData.get('department'),
        group: formData.get('group'),
        fatherName: formData.get('fatherName'),
        motherName: formData.get('motherName'),
        dob: formData.get('dob'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        whatsapp: formData.get('whatsapp'),
        motivationLetter: formData.get('motivationLetter'),
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'applications'), applicationData);
      setStep('success');
      setMascotState('excited');
    } catch (error) {
      console.error("Submission error:", error);
      alert("সিস্টেম এরর হয়েছে। আবার চেষ্টা করো।");
      setMascotState('sad');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-text font-sans flex flex-col lg:border-[16px] border-white overflow-x-hidden">
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 md:py-10 border-b-4 border-editorial-text bg-editorial-bg sticky top-0 z-50">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-40 leading-none mb-1">CBT PROGRESS</span>
          <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tighter uppercase leading-none italic">Progress Portal</h1>
        </div>
        <Link to="/admin" className="bg-editorial-text text-white px-6 py-3 text-[10px] md:text-xs uppercase font-black tracking-[0.2em] shadow-[5px_5px_0px_0px_#FD79A8] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">Admin Access</Link>
      </nav>

      <main className="flex-1 flex flex-col xl:flex-row overflow-visible xl:overflow-hidden bg-white/40">
        <section className="w-full xl:w-[35%] p-10 md:p-14 border-b-4 xl:border-b-0 xl:border-r-4 border-editorial-text flex flex-col justify-between bg-editorial-bg relative">
          <div className="relative z-10">
            <span className="inline-block px-4 py-1.5 bg-editorial-accent-orange text-white text-[10px] font-black uppercase tracking-[0.3em] mb-10 shadow-[4px_4px_0px_0px_#1A1A1A]">Selection 2026</span>
            <h2 className="text-5xl md:text-7xl font-serif font-black leading-[0.85] mb-10 italic tracking-tighter decoration-editorial-accent-pink decoration-4 underline-offset-8">
              Future of <br/>Web Design
            </h2>
            <div className="space-y-8 border-t-4 border-editorial-text/10 pt-10">
              <p className="text-xl font-medium leading-relaxed text-gray-800 italic opacity-80">
                স্বপ্নের ক্যারিয়ার শুরু করুন। এটি কেবল একটি কোর্স নয়, বরং আপনার ইন্ডাস্ট্রি-রেডি স্কিল গড়ার একটি যাত্রা।
              </p>
              <div className="bg-yellow-100 p-6 border-4 border-editorial-text shadow-[8px_8px_0px_0px_#1A1A1A] -rotate-1">
                 <p className="text-xs font-black uppercase tracking-widest leading-tight">Notice: Only dedicated candidates will pass the Octopus Filtration.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1 bg-editorial-accent-blue relative flex items-center justify-center p-6 md:p-20 min-h-[600px] xl:min-h-0">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:40px_40px] pointer-events-none"></div>

          <AnimatePresence mode="wait">
            {step === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="relative z-10 text-center"
              >
                <div className="mb-14 relative inline-block">
                   <div className="w-56 h-56 md:w-80 md:h-80 mx-auto relative overflow-visible">
                    <Mascot state="neutral" lookAt={mascotGaze} />
                  </div>
                  <div className="absolute top-0 right-0 p-4 bg-white border-4 border-editorial-text rounded-2xl rotate-12 shadow-xl font-black text-xs uppercase tracking-widest">HI! I'M OCTOPUS</div>
                </div>
                <button
                  onClick={startFiltration}
                  onMouseEnter={() => setMascotGaze({ x: 0, y: 1 })}
                  onMouseLeave={() => setMascotGaze(null)}
                  className="group relative bg-white border-4 border-editorial-text px-14 py-7 font-black text-3xl md:text-5xl uppercase shadow-[12px_12px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all flex items-center gap-6 mx-auto"
                >
                  Apply Now <ChevronsRight className="w-10 h-10 md:w-14 md:h-14 transition-transform group-hover:translate-x-3" />
                </button>
              </motion.div>
            )}

            {step === 'filtration' && (
              <motion.div
                key={`filtration-${currentQuestionIndex}`}
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-3xl flex flex-col items-center gap-10 md:gap-14"
              >
                <div className="bg-white p-8 md:p-14 border-4 border-editorial-text shadow-[12px_12px_0px_0px_#1A1A1A] w-full relative">
                  <p className="text-xl md:text-3xl font-black leading-tight text-center italic">
                    {mascotState === 'wave' 
                      ? 'অক্টোপাস ফিলট্রেশনে স্বাগতম! তোমার যোগ্যতা যাচাইয়ের জন্য কিছু প্রশ্ন করা হবে...' 
                      : questions[currentQuestionIndex]?.text}
                  </p>
                  <div className="absolute -bottom-4 left-10 w-8 h-8 bg-white border-l-4 border-b-4 border-editorial-text transform -rotate-45" />
                </div>

                <div className="w-56 h-56 md:w-80 md:h-80 relative overflow-visible">
                  <Mascot state={mascotState} lookAt={mascotGaze} />
                </div>

                {mascotState !== 'wave' && (
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full max-w-2xl px-4">
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        handleAnswer(true);
                      }}
                      onMouseEnter={() => setMascotGaze({ x: -1, y: 1 })}
                      onMouseLeave={() => setMascotGaze(null)}

                      className="flex-1 bg-white border-4 border-editorial-text py-6 font-black text-2xl uppercase shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                    >
                      হ্যাঁ অবশ্যই
                    </button>
                    <button
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        handleAnswer(false);
                      }}
                      onMouseEnter={() => setMascotGaze({ x: 1, y: 1 })}
                      onMouseLeave={() => setMascotGaze(null)}
                      className="flex-1 bg-editorial-accent-red text-white border-4 border-editorial-text py-6 font-black text-2xl uppercase shadow-[8px_8px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                      >
                      ভেবে দেখি
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl flex flex-col lg:flex-row gap-10 items-start my-6 md:my-16 px-4"
              >
                <div className="w-full lg:w-80 lg:sticky lg:top-40 flex flex-col items-center gap-6">
                   <div className="w-full bg-white border-4 border-editorial-text p-6 shadow-[10px_10px_0px_0px_#1A1A1A] relative">
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-center leading-relaxed">
                        {formInstruction}
                      </p>
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border-r-4 border-b-4 border-editorial-text rotate-45" />
                   </div>
                   <div className="w-40 h-40 md:w-56 md:h-56 relative overflow-visible">
                     <Mascot state={mascotState} lookAt={mascotGaze} />
                   </div>
                </div>

                <div className="flex-1 bg-white border-4 border-editorial-text p-6 md:p-16 shadow-[16px_16px_0px_0px_#1A1A1A]">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 mb-12 border-b-4 border-editorial-text pb-10">
                    <h2 className="text-4xl md:text-5xl font-serif font-black italic tracking-tighter">Candidate Dossier</h2>
                    <span className="md:ml-auto px-4 py-2 bg-editorial-accent-blue text-white text-[10px] font-black uppercase tracking-[0.3em]">Phase 02: Verification</span>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <FormField name="fullName" label="পিক নাম" placeholder="Candidate Full Name" onFocus={() => onFormFieldFocus('নাম')} required />
                    <FormField name="roll" label="রোল" placeholder="Student Roll No" onFocus={() => onFormFieldFocus('রোল')} required />
                    <FormField name="regNo" label="রেজিস্ট্রেশন নং" placeholder="Official Reg" onFocus={() => onFormFieldFocus('রেজ নং')} required />
                    <FormField name="semester" label="সেমিস্টার" defaultValue="5" onFocus={() => onFormFieldFocus('সেমিস্টার')} required />
                    <FormField name="shift" label="শিফট" defaultValue="1" onFocus={() => onFormFieldFocus('শিফট')} required />
                    <FormField name="department" label="বিভাগ" defaultValue="CST" onFocus={() => onFormFieldFocus('ডিপার্টমেন্ট')} required />
                    <SelectField name="group" label="গ্রুপ (A/B)" options={['A', 'B']} defaultValue="" onFocus={() => onFormFieldFocus('গ্রুপ')} required />
                    
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-10">
                      <FormField name="phone" label="ফোন নম্বর" placeholder="+880" onFocus={() => onFormFieldFocus('ফোন নম্বর')} required />
                      <FormField name="whatsapp" label="হোয়াটসঅ্যাপ নম্বর" placeholder="+880" onFocus={() => onFormFieldFocus('হোয়াটসঅ্যাপ')} required />
                    </div>
                    
                    <FormField name="email" label="ইমেইল" type="email" placeholder="example@email.com" onFocus={() => onFormFieldFocus('ইমেইল')} required />
                    <FormField name="dob" label="জন্ম তারিখ" type="date" onFocus={() => onFormFieldFocus('জন্ম তারিখ')} required />
                    
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-4 opacity-100">Career Manifesto & Intent</label>
                      <textarea
                        name="motivationLetter" required rows={6}
                        onFocus={() => { setMascotState('thinking'); setFormInstruction('এখানে বিস্তারিত লিখুন কেন আপনি এই কোর্সটি করতে চান।'); }}
                        className="w-full px-8 py-6 bg-stone-50 border-4 border-stone-100 focus:border-editorial-text outline-none text-base transition-all font-medium"
                        placeholder="আপনার অনুপ্রেরণা এবং লক্ষ্য সম্পর্কে লিখুন..."
                      />
                    </div>

                    <button
                      type="submit" disabled={formLoading}
                      className="md:col-span-2 bg-editorial-text text-white py-7 font-black text-2xl uppercase shadow-[10px_10px_0px_0px_#FD79A8] hover:shadow-none hover:translate-x-1.5 hover:translate-y-1.5 transition-all disabled:opacity-50 flex items-center justify-center gap-6"
                    >
                      {formLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>Finalize Submission <Send className="w-7 h-7" /></>}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {step === 'rejected' && (
              <motion.div
                key="rejected"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border-4 border-editorial-text p-16 md:p-20 text-center shadow-[16px_16px_0px_0px_#FF7675] max-w-2xl"
              >
                <div className="w-24 h-24 bg-red-50 border-4 border-editorial-text mx-auto mb-10 flex items-center justify-center -rotate-6">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-5xl font-serif font-black italic mb-6">Access Denied</h2>
                <div className="w-48 h-48 mx-auto mb-8 relative overflow-visible"><Mascot state="sad" /></div>
                <p className="text-lg font-medium text-stone-600 mb-10 px-6">
                  দুঃখিত! আমরা মনে করছি আপনি এই কোর্সের জন্য যথেষ্ট সিরিয়াস নন। সিবিটি প্রগ্রেস শুধুমাত্র ডেডিকেটেড স্টুডেন্টদের জন্য।
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-editorial-text text-white px-10 py-5 font-black uppercase text-xs tracking-widest shadow-[6px_6px_0px_0px_#1A1A1A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border-4 border-editorial-text p-20 text-center shadow-[20px_20px_0px_0px_#55EFC4] max-w-2xl"
              >
                <div className="w-28 h-28 bg-editorial-bg border-4 border-editorial-text mx-auto mb-12 flex items-center justify-center rotate-6 shadow-xl">
                  <CheckCircle2 className="w-14 h-14 text-green-500" />
                </div>
                <h2 className="text-6xl font-serif font-black italic mb-8 tracking-tighter">Transmission Complete</h2>
                <div className="w-48 h-48 mx-auto mb-8"><Mascot state="excited" /></div>
                <p className="text-xl font-medium text-stone-600 mb-12 px-10">
                  আপনার আবেদনটি সফলভাবে গৃহীত হয়েছে। আমরা খুব শীঘ্রই আপনার ডাটা এনালিসিস করে ফলাফলী জানাবো।
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-block border-b-8 border-editorial-accent-orange font-black text-sm uppercase tracking-[0.4em] hover:opacity-50 transition-opacity"
                >
                  Reset Terminal
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="bg-editorial-bg border-t-4 border-editorial-text px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div className="flex flex-wrap gap-10 items-center justify-center md:justify-start">
          <div className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
             <Clock className="w-4 h-4 text-editorial-accent-orange" />
             Ends In: <span className="text-editorial-accent-orange">12d 04h 22m</span>
          </div>
          <div className="h-6 w-px bg-editorial-text opacity-20 hidden md:block" />
          <div className="flex gap-4">
            <div className="w-4 h-4 border-2 border-editorial-text bg-[#55EFC4] rounded-full shadow-[2px_2px_0_0_#1A1A1A]" />
            <div className="w-4 h-4 border-2 border-editorial-text bg-[#81ECEC] rounded-full shadow-[2px_2px_0_0_#1A1A1A]" />
            <div className="w-4 h-4 border-2 border-editorial-text bg-[#A29BFE] rounded-full shadow-[2px_2px_0_0_#1A1A1A]" />
          </div>
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 flex items-center gap-3">
          <Globe className="w-4 h-4" /> Octopus Core Automation Protocol v6.0.1
        </div>
      </footer>
    </div>
  );
}

function FormField({ name, label, type = "text", placeholder = "", defaultValue = "", required = false, onFocus }: { name: string, label: string, type?: string, placeholder?: string, defaultValue?: string, required?: boolean, onFocus?: () => void }) {
  return (
    <div className="group">
      <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 opacity-60">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        onFocus={onFocus}
        className="w-full px-6 py-5 bg-stone-50 border-4 border-stone-100 focus:border-editorial-text outline-none text-base transition-all font-bold placeholder:text-stone-300"
      />
    </div>
  );
}

function SelectField({ name, label, options, defaultValue, required = false, onFocus }: { name: string, label: string, options: string[], defaultValue?: string, required?: boolean, onFocus?: () => void }) {
  return (
    <div className="group">
      <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 opacity-60">
        {label}
      </label>
      <select
        name={name}
        required={required}
        onFocus={onFocus}
        defaultValue={defaultValue}
        className="w-full px-6 py-5 bg-stone-50 border-4 border-stone-100 focus:border-editorial-text outline-none text-base transition-all font-bold appearance-none cursor-pointer"
      >
        <option value="" disabled>নির্বাচন করুন</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ChevronsRight(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 17 5-5-5-5" />
      <path d="m13 17 5-5-5-5" />
    </svg>
  );
}
