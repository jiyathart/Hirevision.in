import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendEmailVerification, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { 
  Upload, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Mail, 
  Search, 
  FileText, 
  LayoutDashboard, 
  Briefcase, 
  BarChart3,
  Settings,
  Star,
  Download,
  ShieldCheck,
  Link as LinkIcon,
  Unlink,
  Send,
  Lock,
  LogOut,
  User,
  MessageSquare,
  X,
  Sparkles,
  Info,
  Key,
  ChevronRight,
  AlertCircle,
  Filter,
  Plus,
  Zap,
  ArrowRight,
  History,
  Tag,
  HelpCircle,
  Globe,
  Award,
  Loader2,
  Save,
  BrainCircuit,
  Image as ImageIcon,
  Video,
  Play,
  Bot,
  AtSign,
  Phone,
  MapPin,
  Calendar,
  Code,
  Shield,
  HelpCircle as QuestionIcon,
  Cpu,
  Database,
  Layers,
  Activity,
  Trash2,
  Edit3,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  CheckSquare,
  Square
} from 'lucide-react';

// --- Global Type Augmentation ---
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    google: any;
    aistudio?: AIStudio;
  }
}

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyC8IlDVLmbtoqcs8Qn_jB37GxANjUz_Wuk",
  authDomain: "hirevision-70315.firebaseapp.com",
  projectId: "hirevision-70315",
  storageBucket: "hirevision-70315.firebasestorage.app",
  messagingSenderId: "410523114115",
  appId: "1:410523114115:web:4776ba7c01300746ca19b6",
  measurementId: "G-ND16BKQ80G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// --- Types ---
type CandidateStatus = 'Pending' | 'Selected' | 'Waitlisted' | 'Rejected';
type SortKey = 'score' | 'name' | 'timestamp';
type SortOrder = 'asc' | 'desc';

interface Candidate {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  education: string;
  score: number;
  reasoning: string;
  status: CandidateStatus;
  timestamp: number;
  aiTags?: string[];
  history?: { event: string; time: number }[];
  fileUrl?: string; 
  fileStoragePath?: string;
  fileMime?: string;
  portfolioImageUrl?: string; 
  portfolioAnalysis?: string;
  portfolioVideoUri?: string;
  lastContacted?: number;
}

interface JobDescription {
  title: string;
  requirements: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

interface EmailTemplate {
  id: string;
  userId?: string;
  name: string;
  subject: string;
  body: string;
}

// --- Constants ---
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    name: 'Advance to Interview',
    subject: 'Next Steps: Interview for {{job_title}}',
    body: 'Hi {{candidate_name}},\n\nYour profile stood out to our AI analysis engine. We would love to schedule an interview to discuss your experience further.\n\nBest regards,\nMohamed Jiyath'
  },
  {
    id: '2',
    name: 'Rejection',
    subject: 'Update on your application for {{job_title}}',
    body: 'Hi {{candidate_name}},\n\nThank you for your interest. After synthesizing your profile against our requirements, we have decided to move forward with other candidates at this time.\n\nBest regards,\nMatrix Core'
  },
  {
    id: '3',
    name: 'Request More Info',
    subject: 'Information required for {{job_title}}',
    body: 'Hi {{candidate_name}},\n\nWe need a bit more technical detail regarding your recent projects to complete the neural evaluation.\n\nBest regards,\nHireVision Team'
  }
];

const DEFAULT_JD: JobDescription = {
  title: "Senior AI & Frontend Engineer",
  requirements: "Proficiency in React, TypeScript, and Tailwind CSS. Experience with Gemini API and UI/UX design. 5+ years of experience in modern web development."
};

// --- Styles ---
const NeuralStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;800&family=Space+Mono:wght@400;700&display=swap');

    :root {
      --bg: #030304;
      --mercury: #e2e2e2;
      --glass: rgba(255, 255, 255, 0.03);
      --accent: #00e5ff;
      --font-main: 'Inter', sans-serif;
      --font-mono: 'Space Mono', monospace;
    }

    .neural-container {
      background-color: var(--bg);
      color: var(--mercury);
      font-family: var(--font-main);
      overflow-x: hidden;
      overflow-y: auto;
      height: 100vh;
      width: 100vw;
      position: relative;
    }

    .crystalline-sifting {
      position: fixed;
      inset: 0;
      background: linear-gradient(217deg, rgba(0, 229, 255, 0.05), rgba(0, 0, 0, 0) 70.71%),
                  linear-gradient(127deg, rgba(168, 85, 247, 0.05), rgba(0, 0, 0, 0) 70.71%),
                  linear-gradient(336deg, rgba(52, 211, 153, 0.05), rgba(0, 0, 0, 0) 70.71%);
      animation: prismatic-shift 20s ease infinite;
      z-index: 0;
      pointer-events: none;
    }

    @keyframes prismatic-shift {
      0%, 100% { filter: hue-rotate(0deg); }
      50% { filter: hue-rotate(180deg); }
    }

    .monolithic-layer {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 100px;
      z-index: 1;
      opacity: 0.2;
      pointer-events: none;
    }

    .monolith {
      width: 30vw;
      height: 60vh;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(80px);
      transform: rotate(-10deg) skew(5deg);
      animation: monolithic-drift 30s ease-in-out infinite alternate;
    }

    @keyframes monolithic-drift {
      0% { transform: translate(0, 0) rotate(-10deg); }
      100% { transform: translate(50px, -50px) rotate(-8deg); }
    }

    .canvas-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      filter: url('#liquid-logic');
      pointer-events: none;
      opacity: 0.4;
    }

    .blob {
      position: absolute;
      background: linear-gradient(135deg, #ffffff 0%, #a1a1a1 50%, #444 100%);
      border-radius: 50%;
      opacity: 0.8;
      box-shadow: inset -10px -10px 30px rgba(0,0,0,0.5), 
                  10px 10px 30px rgba(255,255,255,0.1);
    }

    .theme-cursor {
      position: fixed;
      width: 30px;
      height: 30px;
      background: #fff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      mix-blend-mode: difference;
      transform: translate(-50%, -50%);
      transition: width 0.3s, height 0.3s;
    }

    .theme-cursor.active {
      width: 80px;
      height: 80px;
    }

    .hero-title {
      font-size: clamp(3rem, 10vw, 8rem);
      font-weight: 800;
      line-height: 0.85;
      text-transform: uppercase;
      letter-spacing: -0.06em;
      margin-bottom: 20px;
    }

    .hero-title span {
      display: block;
      background: linear-gradient(to bottom, #fff 30%, #555 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .btn-mercury {
      padding: 20px 60px;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 4px;
      font-size: 0.9rem;
      position: relative;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
      cursor: none;
    }

    .btn-mercury:hover {
      border-color: var(--mercury);
      color: #000;
      background: var(--mercury);
      box-shadow: 0 0 50px rgba(255, 255, 255, 0.2);
    }

    .dashboard-shell {
      background: rgba(5, 5, 5, 0.85);
      backdrop-filter: blur(20px);
      border-radius: 2.5rem;
      margin: 1.5rem;
      border: 1px solid rgba(255, 255, 255, 0.03);
      box-shadow: 0 50px 100px rgba(0,0,0,0.5);
    }

    .scanline {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), 
                  linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
      background-size: 100% 2px, 3px 100%;
      pointer-events: none;
      z-index: 200;
      opacity: 0.3;
    }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  `}</style>
);

const Blob: React.FC<{ initialX: number, initialY: number, size: number }> = ({ initialX, initialY, size }) => {
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const vel = useRef({ x: (Math.random() - 0.5) * 1.5, y: (Math.random() - 0.5) * 1.5 });
  useEffect(() => {
    let animationId: number;
    const move = () => {
      setPos(prev => {
        let nx = prev.x + vel.current.x;
        let ny = prev.y + vel.current.y;
        if (nx < -size) nx = window.innerWidth;
        if (nx > window.innerWidth) nx = -size;
        if (ny < -size) ny = window.innerHeight;
        if (ny > window.innerHeight) ny = -size;
        return { x: nx, y: ny };
      });
      animationId = requestAnimationFrame(move);
    };
    move();
    return () => cancelAnimationFrame(animationId);
  }, [size]);
  return (
    <div className="blob" style={{ width: size, height: size, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }} />
  );
};

const HighEndBackground: React.FC = () => {
  const blobs = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: Math.random() * 300 + 150
  })), []);
  return (
    <>
      <div className="crystalline-sifting" />
      <div className="monolithic-layer"><div className="monolith" /><div className="monolith" /></div>
      <div className="canvas-container">{blobs.map(b => <Blob key={b.id} initialX={b.x} initialY={b.y} size={b.size} />)}</div>
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <defs>
          <filter id="liquid-logic">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -12" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
    </>
  );
};

// --- Main App Component ---
const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showDeveloperProfile, setShowDeveloperProfile] = useState(false);
  const [username, setUsername] = useState(''); // Treating as email
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isCursorActive, setIsCursorActive] = useState(false);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [jd, setJd] = useState<JobDescription>(DEFAULT_JD);

  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortKey>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [notifications, setNotifications] = useState<{id: number, msg: string}[]>([]);
  
  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isEmailDraftOpen, setIsEmailDraftOpen] = useState(false);
  const [draftData, setDraftData] = useState({ to: '', subject: '', body: '', candidateId: '', targetStatus: '' as CandidateStatus | '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: 'model', text: 'HireVision Neural Core Active. Ready for talent synthesis.' }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState<'standard' | 'thinking' | 'search'>('standard');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [candidateChatMessages, setCandidateChatMessages] = useState<ChatMessage[]>([]);
  const [candidateChatInput, setCandidateChatInput] = useState('');
  const [isCandidateChatLoading, setIsCandidateChatLoading] = useState(false);
  const candidateChatEndRef = useRef<HTMLDivElement>(null);

  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const [gmailClientId, setGmailClientId] = useState('');
  const [accessToken, setAccessToken] = useState<string>('');

  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setCursorPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser: FirebaseUser | null) => {
      // Allow login regardless of verification status
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
        setShowLanding(false);
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setCandidates([]);
        setTemplates([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Ensure user profile exists on login
  useEffect(() => {
    if(user) {
        const settingsRef = doc(db, 'users', user.uid);
        // We use setDoc with merge to safely ensure existence without overwriting
        setDoc(settingsRef, { email: user.email }, { merge: true }).catch((e: any) => console.log("Profile init error", e));
    }
  }, [user]);

  // --- Firestore Real-time Listeners ---
  useEffect(() => {
    if (!user) return;

    // Listen for Candidates
    const candidatesQuery = query(collection(db, 'candidates'), where('userId', '==', user.uid));
    const unsubCandidates = onSnapshot(candidatesQuery, (snapshot: any) => {
      const loadedCandidates = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as Candidate));
      setCandidates(loadedCandidates);
    }, (error: any) => {
      console.warn("Candidates listener error (permission/network):", error);
      addNotification("Sync compromised: Check permissions or network.");
    });

    // Listen for Templates
    const templatesQuery = query(collection(db, 'templates'), where('userId', '==', user.uid));
    const unsubTemplates = onSnapshot(templatesQuery, (snapshot: any) => {
      const loadedTemplates = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as EmailTemplate));
      setTemplates(loadedTemplates.length > 0 ? loadedTemplates : DEFAULT_TEMPLATES);
    }, (error: any) => {
      console.warn("Templates listener error:", error);
    });

    // Listen for Settings (JD & Integration)
    const settingsRef = doc(db, 'users', user.uid);
    const unsubSettings = onSnapshot(settingsRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.jd) setJd(data.jd);
        if (data.gmailClientId) setGmailClientId(data.gmailClientId);
      } else {
        // Doc might not exist yet if the useEffect init hasn't completed.
        // We do nothing here and let the explicit init handle creation.
      }
    }, (error: any) => {
      console.warn("Settings listener error:", error);
    });

    return () => {
      unsubCandidates();
      unsubTemplates();
      unsubSettings();
    };
  }, [user]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const selected = candidates.filter(c => c.status === 'Selected').length;
    const pending = candidates.filter(c => c.status === 'Pending').length;
    const avgScore = total ? Math.round(candidates.reduce((acc, c) => acc + (c.score || 0), 0) / total) : 0;
    return { total, selected, pending, avgScore };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    let list = candidates.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'name') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [candidates, searchQuery, statusFilter, sortBy, sortOrder]);

  const addNotification = (msg: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  };

  /**
   * Enhanced safeAiCall to handle quota limits and retries
   */
  async function safeAiCall<T>(fn: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorStr = String(error).toLowerCase();
      const isQuotaError = error?.message?.includes('429') || 
                          error?.status === 'RESOURCE_EXHAUSTED' ||
                          errorStr.includes('quota') ||
                          errorStr.includes('limit');

      if (isQuotaError && retryCount < 3) {
        // More aggressive cooldown for Free Tier
        const delay = 30000 * (retryCount + 1); 
        addNotification(`Neural Quota Limit (429). Retrying in ${delay/1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        return safeAiCall(fn, retryCount + 1);
      }
      
      if (error?.message?.includes('Requested entity was not found')) {
          if (window.aistudio) {
              await window.aistudio.openSelectKey();
          }
      }

      throw error;
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
        if (isLoginMode) {
            // Sign In Logic
            await signInWithEmailAndPassword(auth, username, password);
            // Auth state listener will handle redirection
        } else {
            // Sign Up Logic
            const userCredential = await createUserWithEmailAndPassword(auth, username, password);
            // Optionally send verification email in background, but do not block
            // await sendEmailVerification(userCredential.user); 
            // Auth state listener will handle redirection
        }
    } catch (err: any) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setLoginError("Email or password is incorrect");
        } else if (err.code === 'auth/email-already-in-use') {
            setLoginError("User already exists. Please sign in");
        } else {
            setLoginError(err.message);
        }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsLoggedIn(false);
    setShowLanding(true);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const response = await safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        if (chatMode === 'search') {
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: msg,
            config: { tools: [{ googleSearch: {} }] }
          });
        } else {
          return await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: msg,
            config: {
              thinkingConfig: chatMode === 'thinking' ? { thinkingBudget: 16000 } : undefined
            }
          });
        }
      });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || "Neural core impasse." }]);
    } catch (err) {
      addNotification("Assistant transmission failed. Quota limits may apply.");
    } finally {
      setIsChatLoading(false);
    }
  };

  const applyTemplate = (template: EmailTemplate, candidate: Candidate) => {
    let subject = template.subject.replace(/{{candidate_name}}/g, candidate.name).replace(/{{job_title}}/g, jd.title);
    let body = template.body.replace(/{{candidate_name}}/g, candidate.name).replace(/{{job_title}}/g, jd.title);
    setDraftData(prev => ({ ...prev, subject, body }));
  };

  const prepareDraftEmail = (candidate: Candidate, status: CandidateStatus) => {
    const defaultBody = `Hi ${candidate.name},\n\nOur AI analysis engine has synthesized your profile against our current requirements for the ${jd.title} position. We are moving your status to '${status}'.\n\nBest regards,\nMohamed Jiyath`;
    setDraftData({
      to: candidate.email,
      subject: `Application Update: ${jd.title}`,
      body: defaultBody,
      candidateId: candidate.id,
      targetStatus: status
    });
    setIsEmailDraftOpen(true);
  };
  
  const prepareBulkEmail = () => {
      const defaultBody = `Hi {{candidate_name}},\n\nOur AI analysis engine has synthesized your profile against our current requirements for the ${jd.title} position.\n\nBest regards,\nHireVision Team`;
      setDraftData({
        to: `${selectedIds.size} Candidates Selected`,
        subject: `Update regarding ${jd.title}`,
        body: defaultBody,
        candidateId: '',
        targetStatus: ''
      });
      setIsEmailDraftOpen(true);
  };

  const connectToGmail = () => {
    if (!gmailClientId) {
      addNotification("Error: OAUTH_CLIENT_ID required.");
      return;
    }
    // Save client ID
    if (user) {
      setDoc(doc(db, 'users', user.uid), { gmailClientId }, { merge: true });
    }

    try {
      if (window.google && window.google.accounts) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: gmailClientId,
          scope: 'https://www.googleapis.com/auth/gmail.send',
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              setAccessToken(tokenResponse.access_token);
              addNotification("Gmail Protocol Secured. Uplink Active.");
            }
          },
        });
        client.requestAccessToken();
      } else {
        addNotification("GIS Library not loaded.");
      }
    } catch (e) {
      addNotification("Initialization Error: Check Client ID.");
    }
  };

  const sendViaGmail = async (to: string, subject: string, body: string) => {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `From: me`,
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
      ``,
      body
    ].join('\n');

    const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64EncodedEmail
      })
    });
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gmail API Error");
    }
    return response.json();
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    
    try {
      // Bulk Email Logic
      if (selectedIds.size > 0) {
          const targets = candidates.filter(c => selectedIds.has(c.id));
          let sentCount = 0;
          
          if (!accessToken) {
              // Mailto fallback for bulk is messy (popups), so we use BCC for one generic email if no Gmail API
              // However, personalization is key here.
              // We will open ONE mailto window with BCCs if possible, but variables won't work perfectly.
              // For now, let's just do the first one to show behavior or warn.
              const emails = targets.map(c => c.email).join(',');
              const bodyRaw = draftData.body.replace(/{{candidate_name}}/g, 'Candidate').replace(/{{job_title}}/g, jd.title);
              const subjectRaw = draftData.subject.replace(/{{candidate_name}}/g, 'Candidate').replace(/{{job_title}}/g, jd.title);
              const mailtoLink = `mailto:?bcc=${emails}&subject=${encodeURIComponent(subjectRaw)}&body=${encodeURIComponent(bodyRaw)}`;
              window.open(mailtoLink, '_blank');
              addNotification("Opened external client with BCC list.");
              sentCount = targets.length;
          } else {
              // Gmail API Loop
              for (const candidate of targets) {
                 const personalizedBody = draftData.body
                    .replace(/{{candidate_name}}/g, candidate.name)
                    .replace(/{{job_title}}/g, jd.title);
                 
                 const subject = draftData.subject
                    .replace(/{{candidate_name}}/g, candidate.name)
                    .replace(/{{job_title}}/g, jd.title);
                    
                 await sendViaGmail(candidate.email, subject, personalizedBody);
                 
                 // Update History
                 await updateDoc(doc(db, 'candidates', candidate.id), {
                    status: (draftData.targetStatus as CandidateStatus) || candidate.status,
                    history: [...(candidate.history || []), { event: `Bulk Email: ${subject}`, time: Date.now() }],
                    lastContacted: Date.now()
                 });
                 sentCount++;
                 // Rate limit protection
                 await new Promise(r => setTimeout(r, 500));
              }
              addNotification(`Successfully transmitted ${sentCount} emails.`);
          }
          setSelectedIds(new Set());
      } else {
          // Single Email Logic
          if (accessToken) {
            await sendViaGmail(draftData.to, draftData.subject, draftData.body);
            addNotification(`Gmail Transmission Successful: ${draftData.to}`);
          } else {
            const mailtoLink = `mailto:${draftData.to}?subject=${encodeURIComponent(draftData.subject)}&body=${encodeURIComponent(draftData.body)}`;
            window.open(mailtoLink, '_blank');
            addNotification(`External Mail Client Triggered: ${draftData.to}`);
            await new Promise(r => setTimeout(r, 1000));
          }

          if (draftData.candidateId && draftData.targetStatus) {
             const docRef = doc(db, 'candidates', draftData.candidateId);
             const candidate = candidates.find(c => c.id === draftData.candidateId);
             if (candidate) {
                await updateDoc(docRef, {
                    status: draftData.targetStatus as CandidateStatus,
                    history: [...(candidate.history || []), { event: `Sent: ${draftData.subject}`, time: Date.now() }],
                    lastContacted: Date.now()
                });
             }
          }
      }
    } catch (error: any) {
      addNotification(`Transmission Failed: ${error.message}`);
      console.error(error);
    } finally {
      setIsSendingEmail(false);
      setIsEmailDraftOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // --- ADDED: API Key Check ---
    if (window.aistudio) {
        try {
            if (!(await window.aistudio.hasSelectedApiKey())) {
                await window.aistudio.openSelectKey();
            }
        } catch (e) {
            console.warn("API Key check skipped", e);
        }
    }
    // ----------------------------

    setIsUploading(true);

    const fileList: File[] = Array.from(files);
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check file size (approx 15MB limit for safety)
      if (file.size > 15 * 1024 * 1024) {
          addNotification(`Skipped ${file.name}: File too large (>15MB)`);
          continue;
      }

      try {
        addNotification(`Decoding (${i + 1}/${fileList.length}): ${file.name}...`);
        
        // 1. Convert to Base64 for Gemini Analysis (Keep in memory for now)
        const base64 = await fileToBase64(file);
        const isImage = file.type.startsWith('image/');
        
        // 2. Upload to Firebase Storage
        // Sanitize filename to avoid weird character issues
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `resumes/${user.uid}/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);
        const fileUrl = await getDownloadURL(storageRef);

        // 3. AI Analysis
        const response = await safeAiCall(async () => {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                { inlineData: { mimeType: file.type || 'application/pdf', data: base64 } },
                { text: `SYSTEM DIRECTIVE: Detailed analysis of this candidate's profile/resume against the Job Description:
                - Title: ${jd.title}
                - Requirements: ${jd.requirements}
                
                Identify technical skills, core experience, and educational background. Assign a score (0-100) based on role suitability.
                If this is NOT a resume, still try to extract relevant contact info and note the file nature in reasoning.
                Output ONLY valid JSON matching this schema:
                {
                  "name": "Full Name",
                  "email": "Email address",
                  "phone": "Phone number",
                  "skills": ["Skill 1", "Skill 2"],
                  "experience": "Brief summary of experience",
                  "education": "Degree details",
                  "score": number,
                  "reasoning": "Technical justification for the score",
                  "aiTags": ["Tag 1", "Tag 2"]
                }` }
              ],
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                  experience: { type: Type.STRING },
                  education: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  aiTags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "email", "phone", "skills", "experience", "education", "score", "reasoning", "aiTags"],
              }
            }
          });
        });

        const result = JSON.parse(response.text || '{}');
        
        // 4. Save to Firestore (Store URL, not base64)
        const newCandidate: any = {
          ...result,
          userId: user.uid,
          status: result.score > 85 ? 'Selected' : result.score > 60 ? 'Pending' : 'Rejected',
          timestamp: Date.now(),
          history: [{ event: 'Neural Core Decoded', time: Date.now() }],
          fileUrl: fileUrl,
          fileStoragePath: storagePath,
          fileMime: file.type || 'application/pdf',
        };
        
        // Conditional add to avoid undefined
        if (isImage) {
            newCandidate.portfolioImageUrl = fileUrl;
        }

        await addDoc(collection(db, 'candidates'), newCandidate);
        addNotification(`Synthesis Success: ${newCandidate.name}`);

        // Add a small sequential delay to avoid hitting RPM (Requests Per Minute) limits
        if (fileList.length > 1) await new Promise(r => setTimeout(r, 2000));

      } catch (error: any) {
        const errorMsg = error.message || JSON.stringify(error);
        const isQuota = errorMsg.toLowerCase().includes("429") || errorMsg.toLowerCase().includes("quota");
        const isPermission = errorMsg.includes("permission") || errorMsg.includes("unauthorized");
        
        if (isQuota) {
            addNotification(`Quota Exceeded on ${file.name}. Try again later.`);
        } else if (isPermission) {
            addNotification(`Access Denied: Please refresh the page to reset authentication.`);
        } else {
            addNotification(`Analysis Failed: ${file.name}. ${errorMsg.slice(0, 40)}...`);
        }
        console.error("AI Upload Error:", error);
      }
    }
    setIsUploading(false);
    // Clear input
    e.target.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
  });

  const handleDownloadResume = (candidate: Candidate) => {
    if (!candidate.fileUrl) return;
    window.open(candidate.fileUrl, '_blank');
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };
  
  // Bulk selection toggles
  const toggleSelect = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === filteredCandidates.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(filteredCandidates.map(c => c.id)));
      }
  };
  
  const handleBulkStatus = async (status: CandidateStatus) => {
      const count = selectedIds.size;
      addNotification(`Updating ${count} candidates...`);
      try {
          await Promise.all(Array.from(selectedIds).map(id => 
              updateDoc(doc(db, 'candidates', id), { status })
          ));
          addNotification(`Success: ${count} candidates updated to ${status}`);
          setSelectedIds(new Set());
      } catch (e) {
          addNotification("Bulk update failed.");
      }
  };

  const handleCandidateChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateChatInput.trim() || !selectedCandidate) return;
    const msg = candidateChatInput;
    setCandidateChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setCandidateChatInput('');
    setIsCandidateChatLoading(true);
    
    try {
      const response = await safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Matrix Evaluation: Interrogating Candidate [${selectedCandidate.name}]. Context: ${JSON.stringify(selectedCandidate)}. Query: ${msg}`;
        return await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      });
      setCandidateChatMessages(prev => [...prev, { role: 'model', text: response.text || "Core impasse." }]);
    } catch (err) { addNotification("AI Interrogator Error"); } finally { setIsCandidateChatLoading(false); }
  };

  const analyzePortfolio = async () => {
    if (!selectedCandidate?.portfolioImageUrl) return;
    setIsAnalyzingImage(true);
    try {
      // Note: Fetching image from storage URL for re-analysis requires CORS configuration on bucket.
      // If fails, we catch error.
      const resp = await fetch(selectedCandidate.portfolioImageUrl);
      if (!resp.ok) throw new Error("Failed to fetch image");
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
      });

      const response = await safeAiCall(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        return await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: "Evaluate this technical work. Provide a critique of innovation and logic." }] },
          config: { thinkingConfig: { thinkingBudget: 15000 } }
        });
      });
      const resText = response.text || "Critique synthesized.";
      
      await updateDoc(doc(db, 'candidates', selectedCandidate.id), { portfolioAnalysis: resText });
      setSelectedCandidate(prev => prev ? { ...prev, portfolioAnalysis: resText } : null);

    } catch (err: any) { 
        addNotification("Critique failed. CORS or Quota limit."); 
        console.error(err);
    } finally { setIsAnalyzingImage(false); }
  };

  const generateVeoVideo = async () => {
    if (!selectedCandidate?.portfolioImageUrl) return;
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
    setIsGeneratingVideo(true);
    try {
      // Fetch base64 for Veo
      const resp = await fetch(selectedCandidate.portfolioImageUrl);
      if (!resp.ok) throw new Error("Failed to fetch image");
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob);
      });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let op = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        image: { imageBytes: base64, mimeType: 'image/png' },
        prompt: "A cinematic spotlight revealing details of this technical asset, slow and elegant.",
        config: { resolution: '720p', aspectRatio: '16:9', numberOfVideos: 1 }
      });
      while (!op.done) {
        await new Promise(r => setTimeout(r, 8000));
        op = await ai.operations.getVideosOperation({ operation: op });
      }
      const uri = op.response?.generatedVideos?.[0]?.video?.uri;
      if (uri) {
        const url = `${uri}&key=${process.env.API_KEY}`;
        await updateDoc(doc(db, 'candidates', selectedCandidate.id), { portfolioVideoUri: url });
        setSelectedCandidate(prev => prev ? { ...prev, portfolioVideoUri: url } : null);
      }
    } catch (err) { addNotification("Veo Video Generation Failed (Check CORS/API)."); } finally { setIsGeneratingVideo(false); }
  };

  const deleteTemplate = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'templates', id));
        addNotification("Protocol purged.");
    } catch (e) {
        addNotification("Delete failed.");
    }
  };

  const saveTemplate = async (template: EmailTemplate) => {
    if (!user) return;
    if (editingTemplate && editingTemplate.id && templates.some(t => t.id === editingTemplate.id)) {
      // Update
      await updateDoc(doc(db, 'templates', editingTemplate.id), { 
          name: template.name, 
          subject: template.subject, 
          body: template.body 
      });
      addNotification("Protocol updated.");
    } else {
      // Add
      await addDoc(collection(db, 'templates'), {
          userId: user.uid,
          name: template.name,
          subject: template.subject,
          body: template.body
      });
      addNotification("New protocol saved.");
    }
    setIsTemplateEditorOpen(false);
    setEditingTemplate(null);
  };

  // --- Sub-components ---
  const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-50/10 text-purple-400 border-purple-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      mercury: 'bg-white/5 text-white/70 border-white/10'
    };
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${colorMap[color] || colorMap.mercury}`}>
        {children}
      </span>
    );
  };

  const DeveloperProfile = () => (
    <div className="neural-container bg-white text-slate-900 overflow-y-auto cursor-default">
      <div className="max-w-4xl mx-auto p-12 pt-24 animate-in slide-in-from-bottom duration-700">
        <div className="flex justify-between items-start mb-16 border-b border-slate-100 pb-10">
          <div>
            <h2 className="text-5xl font-extrabold text-slate-900 tracking-tighter mb-2">MOHAMED JIYATH R</h2>
            <p className="text-indigo-600 font-bold text-xl uppercase tracking-wide">Manager & AI Implementation Specialist</p>
            <div className="flex flex-wrap gap-6 mt-6 text-sm font-semibold text-slate-500">
              <span className="flex items-center gap-2"><MapPin size={16} /> Pudukkottai, Tamil Nadu</span>
              <span className="flex items-center gap-2"><Phone size={16} /> +91 63848 67188</span>
              <span className="flex items-center gap-2"><Mail size={16} /> jiyathart@gmail.com</span>
            </div>
          </div>
          <button onClick={() => setShowDeveloperProfile(false)} className="bg-slate-100 p-3 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={28} /></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-16">
            <section>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-6 flex items-center gap-2"><User size={16} /> Executive Summary</h3>
              <p className="text-lg leading-relaxed font-medium text-slate-700">
                Highly motivated and precision-oriented AI expert with a robust background in system analysis and management. Expert in bridging Generative AI capabilities with organizational efficiency.
              </p>
            </section>
            <section>
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-600 mb-8 flex items-center gap-2"><Briefcase size={16} /> Tenure</h3>
              <div className="space-y-10">
                <div className="relative pl-8 border-l-2 border-slate-100">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                  <h4 className="font-extrabold text-xl text-slate-900">Manager & Senior Executive</h4>
                  <p className="text-slate-500 font-bold text-sm mb-4">Haashiya Air Travels | 2025 – Present</p>
                  <p className="text-slate-600 font-medium leading-relaxed">Leading travel operations and core technical infrastructure enhancements using AI integrations.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  if (showLanding) {
    if (showDeveloperProfile) return <DeveloperProfile />;
    return (
      <div className="neural-container">
        <NeuralStyles />
        <div className={`theme-cursor ${isCursorActive ? 'active' : ''}`} style={{ left: cursorPos.x, top: cursorPos.y }}></div>
        <div className="scanline"></div>
        <HighEndBackground />
        
        {/* ADDED: Developer Footer Details */}
        <div className="absolute bottom-10 left-10 z-50 text-white/50 font-mono text-xs">
            <p className="font-bold text-white mb-2">ARCHITECTED BY</p>
            <p className="text-lg text-white font-black tracking-tighter">MOHAMED JIYATH R</p>
            <p>Manager & AI Specialist</p>
            <p>Haashiya Air Travels</p>
        </div>
        <div className="absolute bottom-10 right-10 z-50 text-right text-white/50 font-mono text-xs max-w-md hidden md:block">
            <p className="font-bold text-white mb-2">SYSTEM PARAMETERS</p>
            <p>Automated Neural Parsing • Gemini 1.5 Pro Integration • Real-time Firebase Sync</p>
            <p className="mt-2">Empowering recruitment with next-gen logic synthesis.</p>
        </div>

        <header className="fixed top-0 w-full p-10 flex justify-between items-center z-[100]">
          <div className="logo text-white font-mono text-xl font-extrabold uppercase tracking-tighter">HireVision.AI</div>
          <nav className="flex gap-10">
            <button onClick={() => setShowDeveloperProfile(true)} className="text-white font-mono text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Neural-Sync</button>
            <button onClick={() => setShowLanding(false)} className="text-white font-mono text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Logic-Flow</button>
          </nav>
        </header>
        <main className="relative z-10 h-screen flex flex-col justify-center px-[10%]">
          <h1 className="hero-title animate-in fade-in slide-in-from-bottom duration-1000"><span>Intelligent</span><span>Talent Pipeline.</span></h1>
          <button onClick={() => setShowLanding(false)} className="btn-mercury w-fit" onMouseEnter={() => setIsCursorActive(true)} onMouseLeave={() => setIsCursorActive(false)}>Initialize Core</button>
        </main>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="neural-container flex items-center justify-center">
        <NeuralStyles />
        <HighEndBackground />
        
        <div className="login-glass p-12 w-full max-w-md z-50 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[3rem]">
          <h2 className="text-white text-3xl font-black text-center uppercase mb-8">Secure Linkage</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-accent" placeholder="email@domain.com" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-accent" placeholder="Access Key" />
            {loginError && <p className="text-rose-500 text-xs text-center font-bold uppercase tracking-wide">{loginError}</p>}
            <button className="btn-mercury w-full py-4 text-[0.7rem] tracking-[6px]">{isLoginMode ? 'Connect' : 'Register'}</button>
          </form>
          <button onClick={() => { setIsLoginMode(!isLoginMode); setLoginError(''); }} className="mt-8 w-full text-center font-mono text-[0.5rem] opacity-30 uppercase hover:opacity-100 transition-opacity">
            {isLoginMode ? 'Need Access? Initialize Protocol (Sign Up)' : 'Return to Linkage (Login)'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="neural-container flex h-screen bg-black font-sans text-slate-200 overflow-hidden relative">
      <NeuralStyles />
      <HighEndBackground />
      <aside className="w-72 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 text-white font-black text-2xl mb-12 tracking-tighter cursor-pointer" onClick={() => setShowLanding(true)}>
            <Zap className="fill-white" /><span>HireVision</span>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'candidates', icon: Users, label: 'Talent Pool' },
              { id: 'emails', icon: Mail, label: 'Communication' },
              { id: 'settings', icon: Settings, label: 'Integrations' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === item.id ? 'bg-white text-black translate-x-2' : 'text-white/40 hover:bg-white/5'}`}>
                <item.icon size={20} />{item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 text-rose-400 hover:bg-rose-500/10 transition-all font-black text-sm">
             <LogOut size={18} /> Disconnect
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative z-10 dashboard-shell custom-scrollbar">
        <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-white/5 px-10 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">{activeTab}</h1>
          <div className="flex items-center gap-6">
            <div className="relative group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input type="text" placeholder="Scan pool..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-bold w-64 outline-none text-white focus:border-accent transition-all" />
            </div>
            <label className={`flex items-center gap-3 px-6 py-3 bg-white text-black rounded-full text-xs font-black cursor-pointer shadow-xl transition-all hover:scale-105 active:scale-95 ${isUploading ? 'opacity-70' : ''}`}>
              <Upload size={16} /> {isUploading ? 'SYNTHESIZING...' : 'UPLOAD PROTOCOL'}
              <input type="file" multiple hidden onChange={handleFileUpload} accept="*" />
            </label>
          </div>
        </header>

        <div className="p-10 pb-32">
          {activeTab === 'dashboard' && (
             <div className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Subjects', value: stats.total, icon: Users },
                      { label: 'Shortlisted', value: stats.selected, icon: CheckCircle },
                      { label: 'Standby', value: stats.pending, icon: Clock },
                      { label: 'Match Accuracy', value: `${stats.avgScore}%`, icon: Star },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-between group hover:scale-[1.02] transition-transform">
                         <div className="space-y-1"><p className="text-[11px] font-black text-white/30 uppercase tracking-widest">{stat.label}</p><p className="text-4xl font-black text-white">{stat.value}</p></div>
                         <div className="p-4 rounded-2xl bg-white/5 text-white group-hover:bg-accent group-hover:text-black transition-colors"><stat.icon size={28} /></div>
                      </div>
                    ))}
                 </div>
                 <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-8 backdrop-blur-md">
                    <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">Recent Synthesis Output</h2>
                    <div className="space-y-4">
                       {filteredCandidates.slice(0, 5).map(c => (
                         <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group" onClick={() => setSelectedCandidate(c)}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white group-hover:bg-accent group-hover:text-black transition-colors">{c.name.charAt(0)}</div>
                              <div><p className="font-bold text-white">{c.name}</p><p className="text-xs text-white/30">{c.email}</p></div>
                            </div>
                            <div className="flex items-center gap-6">
                              <span className="font-mono text-sm text-accent">{c.score}%</span>
                              <Badge color={c.status === 'Selected' ? 'emerald' : 'amber'}>{c.status}</Badge>
                            </div>
                         </div>
                       ))}
                       {filteredCandidates.length === 0 && <div className="p-10 text-center text-white/10 uppercase font-black">Waiting for neural input...</div>}
                    </div>
                 </div>
             </div>
          )}

          {activeTab === 'candidates' && (
            <div className="space-y-10">
               <div className="bg-white/5 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-md relative">
                  {/* Bulk Actions Toolbar */}
                  {selectedIds.size > 0 && (
                      <div className="absolute top-0 left-0 right-0 z-20 bg-accent text-black p-4 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-4 px-6">
                              <span className="font-black text-sm uppercase tracking-widest">{selectedIds.size} SELECTED</span>
                              <button onClick={() => setSelectedIds(new Set())} className="text-xs font-bold underline opacity-60 hover:opacity-100">Deselect All</button>
                          </div>
                          <div className="flex items-center gap-3 px-6">
                               <div className="flex items-center gap-2 mr-4">
                                   <span className="text-[10px] font-black uppercase">Set Status:</span>
                                   {['Pending', 'Selected', 'Rejected'].map(s => (
                                       <button key={s} onClick={() => handleBulkStatus(s as CandidateStatus)} className="px-3 py-1 bg-black/10 hover:bg-black/20 rounded-lg text-[10px] font-bold uppercase transition-all">{s}</button>
                                   ))}
                               </div>
                               <button onClick={prepareBulkEmail} className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black/80 transition-all">
                                   <Mail size={14} /> Send Email ({selectedIds.size})
                               </button>
                          </div>
                      </div>
                  )}

                  <div className="px-10 py-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 pt-20 md:pt-8">
                     <h2 className="text-xl font-black text-white uppercase">Neural Shortlist</h2>
                     <div className="flex flex-wrap items-center gap-4">
                        {/* Status Filter */}
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                            {['All', 'Pending', 'Selected', 'Rejected'].map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>{status}</button>
                            ))}
                        </div>
                        {/* Sort Controls */}
                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                            {[
                                { key: 'score' as SortKey, label: 'Score' },
                                { key: 'name' as SortKey, label: 'Name' },
                                { key: 'timestamp' as SortKey, label: 'Date' }
                            ].map(s => (
                                <button 
                                    key={s.key} 
                                    onClick={() => toggleSort(s.key)} 
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s.key ? 'bg-accent/10 text-accent' : 'text-white/40 hover:text-white'}`}
                                >
                                    {s.label}
                                    {sortBy === s.key ? (sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />) : <ArrowUpDown size={12} />}
                                </button>
                            ))}
                        </div>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] font-black text-white/30 uppercase tracking-widest border-b border-white/5 bg-black/20">
                            <tr>
                                <th className="px-10 py-4 w-12">
                                    <button onClick={toggleSelectAll} className="text-white hover:text-accent transition-colors">
                                        {selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                </th>
                                <th className="px-10 py-4">Candidate Identity</th>
                                <th className="px-10 py-4 hidden md:table-cell">Tags</th>
                                <th className="px-10 py-4 text-right">Metric</th>
                                <th className="px-10 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredCandidates.map(c => (
                            <tr key={c.id} className={`hover:bg-white/5 transition-colors cursor-pointer group ${selectedIds.has(c.id) ? 'bg-white/5' : ''}`} onClick={() => setSelectedCandidate(c)}>
                                <td className="px-10 py-6" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={(e) => toggleSelect(c.id, e)} className={`transition-colors ${selectedIds.has(c.id) ? 'text-accent' : 'text-white/20 hover:text-white'}`}>
                                        {selectedIds.has(c.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                                    </button>
                                </td>
                                <td className="px-10 py-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center font-black text-lg border border-white/10 group-hover:scale-110 transition-transform">{c.name.charAt(0)}</div>
                                    <div><p className="font-black text-white group-hover:text-accent transition-colors">{c.name}</p><p className="text-xs text-white/40 font-bold mt-1 flex items-center gap-1"><Mail size={12} /> {c.email}</p></div>
                                </div>
                                </td>
                                <td className="px-10 py-6 hidden md:table-cell"><div className="flex flex-wrap gap-2">{c.aiTags?.map((tag, i) => <Badge key={i} color="mercury">{tag}</Badge>)}</div></td>
                                <td className="px-10 py-6 text-right">
                                    <div className="flex flex-col items-end gap-1">
                                        <span className="font-black text-lg text-white">{c.score}%</span>
                                        <span className="text-[9px] font-mono text-white/20 uppercase">
                                            {new Date(c.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right"><Badge color={c.status === 'Selected' ? 'emerald' : c.status === 'Rejected' ? 'rose' : 'amber'}>{c.status}</Badge></td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                  {filteredCandidates.length === 0 && <div className="p-20 text-center opacity-20 uppercase font-black">No matching patterns mapped.</div>}
               </div>
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-6">
                   <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-10 backdrop-blur-md">
                      <h2 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase">Communication Hub</h2>
                      <div className="space-y-4">
                        {candidates.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-6 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-white/20 transition-all group">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-white group-hover:bg-accent group-hover:text-black transition-colors">{c.name.charAt(0)}</div>
                              <div><p className="font-black text-white">{c.name}</p><p className="text-xs text-white/40 font-bold">{c.email}</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                              {c.lastContacted && <span className="text-[9px] font-mono opacity-30 uppercase">Synced: {new Date(c.lastContacted).toLocaleDateString()}</span>}
                              <button onClick={() => prepareDraftEmail(c, c.status)} className="p-4 bg-white/5 rounded-2xl hover:bg-white text-white hover:text-black transition-all"><Mail size={18} /></button>
                            </div>
                          </div>
                        ))}
                        {candidates.length === 0 && <div className="py-24 text-center opacity-20 uppercase font-black tracking-widest"><Mail size={48} className="mx-auto mb-4" />Neural Silence</div>}
                      </div>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-10 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-white uppercase">Templates</h2>
                        <button onClick={() => { setEditingTemplate(null); setIsTemplateEditorOpen(true); }} className="p-2 bg-white/10 rounded-lg hover:bg-accent hover:text-black transition-all"><Plus size={18} /></button>
                      </div>
                      <div className="space-y-4">
                        {templates.map(t => (
                          <div key={t.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 group relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                             <div className="flex items-center justify-between mb-2">
                               <p className="font-bold text-sm text-white">{t.name}</p>
                               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={() => { setEditingTemplate(t); setIsTemplateEditorOpen(true); }} className="text-white/40 hover:text-white transition-all"><Edit3 size={14} /></button>
                                 <button onClick={() => deleteTemplate(t.id)} className="text-rose-500/40 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
                               </div>
                             </div>
                             <p className="text-[10px] text-white/30 truncate uppercase tracking-widest">{t.subject}</p>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-10">
              <div className="bg-white/5 rounded-[2.5rem] border border-white/5 p-10 max-w-2xl backdrop-blur-md">
                <h2 className="text-3xl font-black text-white mb-8 uppercase tracking-tighter">Integration Config</h2>
                <div className="space-y-10">
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-4">Job Manifest (JD)</h3>
                    <input type="text" value={jd.title} onChange={e => setJd({...jd, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-accent" placeholder="Role Manifest" />
                    <textarea rows={6} value={jd.requirements} onChange={e => setJd({...jd, requirements: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-accent resize-none" placeholder="Core Requirements" />
                    <button onClick={() => { 
                        if (user) {
                           setDoc(doc(db, 'users', user.uid), { jd }, { merge: true });
                           addNotification("Neural heuristics updated."); 
                        }
                    }} className="px-10 py-5 bg-white/10 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-white hover:text-black transition-all">Commit Configuration</button>
                  </section>
                  <section className="space-y-4 pt-6 border-t border-white/5">
                    <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.4em] mb-4">Mail Connection (Gmail API)</h3>
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl"><Mail /></div>
                            <div>
                                <p className="text-sm font-black text-white">Gmail Integration Protocol</p>
                                <p className="text-[10px] font-bold text-white/30">Connect to your executive terminal via GIS.</p>
                            </div>
                        </div>
                        <input type="text" value={gmailClientId} onChange={e => setGmailClientId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-white mb-4 outline-none focus:border-accent" placeholder="OAUTH_CLIENT_ID" />
                        <button onClick={connectToGmail} className={`w-full py-4 bg-white/5 text-white rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-white hover:text-black transition-all ${accessToken ? 'border border-emerald-500/50 text-emerald-400' : ''}`}>
                            {accessToken ? "LINK ESTABLISHED (RECONNECT)" : "COMMENCE HANDSHAKE"}
                        </button>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Candidate Detail Overlay */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end p-6">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedCandidate(null)} />
           <div className="relative w-full max-w-4xl h-full bg-[#080808] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                 <div className="flex items-center gap-8"><div className="w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center text-2xl font-black shadow-xl">{selectedCandidate.name.charAt(0)}</div>
                    <div><h2 className="text-2xl font-black text-white tracking-tight">{selectedCandidate.name}</h2><p className="text-[10px] font-black text-accent uppercase tracking-widest">{selectedCandidate.score}% Neural Match Sigma</p></div>
                 </div>
                 <button onClick={() => setSelectedCandidate(null)} className="p-4 bg-white/5 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="bg-white/5 p-8 rounded-[2rem] border border-white/5"><h3 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-6">Neural Logic Reasoning</h3><p className="text-lg font-medium text-white/80 italic leading-relaxed">"{selectedCandidate.reasoning}"</p></section>
                    <section className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex flex-col gap-4">
                      <button onClick={analyzePortfolio} className="w-full py-5 bg-accent/10 text-accent font-black rounded-2xl border border-accent/20 hover:bg-accent hover:text-black transition-all text-xs tracking-widest uppercase">{isAnalyzingImage ? 'ANALYZING...' : 'PORTFOLIO CRITIQUE'}</button>
                      <button onClick={generateVeoVideo} className="w-full py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white hover:text-black transition-all text-xs tracking-widest uppercase">{isGeneratingVideo ? 'GENERATING...' : 'GENERATE HIGHLIGHT VIDEO'}</button>
                    </section>
                 </div>
                 <section className="bg-white/5 p-8 rounded-[2rem] border border-white/5"><h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6">Candidate Interrogator</h3>
                    <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {candidateChatMessages.map((msg, i) => (
                           <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-5 rounded-[1.5rem] text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-white text-black' : 'bg-white/5 border border-white/5 text-white/80'}`}>{msg.text}</div></div>
                       ))}
                       {isCandidateChatLoading && <Loader2 className="animate-spin text-accent mx-auto" />}
                       <div ref={candidateChatEndRef} />
                    </div>
                    <form onSubmit={handleCandidateChatSubmit} className="relative">
                        <input type="text" value={candidateChatInput} onChange={e => setCandidateChatInput(e.target.value)} placeholder="Submit query to neural instance..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-accent transition-all" />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white text-black rounded-xl hover:scale-110 transition-transform"><ArrowRight size={20} /></button>
                    </form>
                 </section>
              </div>
              <div className="p-8 border-t border-white/5 grid grid-cols-2 gap-4 bg-black/40 backdrop-blur-xl">
                 <button onClick={() => handleDownloadResume(selectedCandidate)} className="py-5 bg-white text-black font-black rounded-2xl hover:scale-[1.02] transition-transform uppercase text-xs tracking-widest">Download Decode</button>
                 <button onClick={() => prepareDraftEmail(selectedCandidate, 'Selected')} className="py-5 bg-white/5 text-white font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase text-xs tracking-widest">Commence Contact</button>
              </div>
           </div>
        </div>
      )}

      {/* Email Draft Modal */}
      {isEmailDraftOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsEmailDraftOpen(false)} />
          <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Transmission Draft</h3>
              <div className="flex items-center gap-4">
                {!accessToken && (
                    <button onClick={connectToGmail} className="px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase rounded-lg hover:bg-white/20 transition-all flex items-center gap-2">
                        <LinkIcon size={12} /> Connect Gmail
                    </button>
                )}
                <button onClick={() => setIsEmailDraftOpen(false)} className="text-white/20 hover:text-white transition-colors"><X size={28} /></button>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-72 border-r border-white/5 p-8 bg-black/40 overflow-y-auto custom-scrollbar">
                 <p className="text-[10px] font-black text-accent uppercase mb-6 tracking-[0.4em]">Protocol Library</p>
                 <div className="space-y-3">
                    {templates.map(t => (
                      <button key={t.id} onClick={() => applyTemplate(t, candidates.find(c => c.id === (draftData.candidateId || selectedIds.values().next().value)) || candidates[0])} className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:border-accent hover:bg-accent/5 transition-all truncate">
                        {t.name}
                      </button>
                    ))}
                 </div>
              </div>
              <div className="flex-1 p-10 space-y-6 overflow-y-auto custom-scrollbar bg-black/20">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Destination Terminal</label>
                    <input type="text" value={draftData.to} disabled className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white/40" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Subject Manifest</label>
                    <input type="text" value={draftData.subject} onChange={e => setDraftData({...draftData, subject: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-accent transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Logic Payload</label>
                    <textarea rows={10} value={draftData.body} onChange={e => setDraftData({...draftData, body: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-accent resize-none custom-scrollbar transition-all" />
                </div>
                <button onClick={handleSendEmail} disabled={isSendingEmail} className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform disabled:opacity-50 uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-white/10">
                  {isSendingEmail ? <Loader2 className="animate-spin" /> : <Send size={20} />} 
                  {accessToken ? 'TRANSMIT VIA GMAIL' : 'LAUNCH LOCAL CLIENT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {isTemplateEditorOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsTemplateEditorOpen(false)} />
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 animate-in zoom-in-95 shadow-2xl">
             <h3 className="text-2xl font-black text-white mb-10 uppercase tracking-tight">{editingTemplate ? 'Modify Protocol' : 'New Protocol Pattern'}</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Protocol ID</label>
                    <input type="text" value={editingTemplate?.name || ''} onChange={e => setEditingTemplate(prev => ({ ...(prev || { id: '', name: '', subject: '', body: '' }), name: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-accent" placeholder="e.g. Reject-Senior" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Subject Syntax</label>
                    <input type="text" value={editingTemplate?.subject || ''} onChange={e => setEditingTemplate(prev => ({ ...(prev || { id: '', name: '', subject: '', body: '' }), subject: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-accent" placeholder="Re: {{job_title}}" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Body Logic (Variables: {"{{candidate_name}}"}, {"{{job_title}}"})</label>
                    <textarea rows={8} value={editingTemplate?.body || ''} onChange={e => setEditingTemplate(prev => ({ ...(prev || { id: '', name: '', subject: '', body: '' }), body: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white resize-none outline-none focus:border-accent" />
                </div>
                <div className="flex gap-4">
                    <button onClick={() => editingTemplate && saveTemplate(editingTemplate)} className="flex-1 py-5 bg-accent text-black font-black rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl shadow-accent/20">Commit Changes</button>
                    <button onClick={() => setIsTemplateEditorOpen(false)} className="px-10 py-5 bg-white/5 text-white/40 font-black rounded-2xl uppercase text-xs tracking-widest hover:text-white transition-all">Cancel</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Assistant */}
      {!isChatOpen && (
          <button onClick={() => setIsChatOpen(true)} className="fixed bottom-10 right-10 z-40 bg-white text-black p-6 rounded-full shadow-2xl hover:scale-110 transition-all animate-bounce shadow-white/10 border border-black/10">
              <Bot size={28} />
          </button>
      )}

      {isChatOpen && (
        <div className="fixed bottom-8 right-8 z-[200] w-[450px] h-[650px] bg-[#050505] border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-7 bg-white/5 border-b border-white/5 flex items-center justify-between backdrop-blur-xl">
                <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]" /><h3 className="font-black text-white text-lg tracking-tight uppercase">Neural Assistant Core</h3></div>
                <button onClick={() => setIsChatOpen(false)} className="text-white/20 hover:text-white transition-all"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/50">
                {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-sm leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-white text-black' : 'bg-white/5 border border-white/5 text-white/80 backdrop-blur-sm'}`}>{msg.text}</div>
                    </div>
                ))}
                {isChatLoading && <Loader2 className="animate-spin text-accent mx-auto" />}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="p-6 bg-black border-t border-white/5">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Submit global neural query..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-accent shadow-inner transition-all" />
            </form>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] space-y-3 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="bg-white text-black px-10 py-5 rounded-full shadow-2xl flex items-center gap-5 animate-in slide-in-from-bottom duration-500 pointer-events-auto border border-white/20 backdrop-blur-md">
            <Zap size={18} className="text-indigo-600 fill-indigo-600" /><span className="text-sm font-black tracking-tight">{n.msg}</span>
            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="ml-5 opacity-20 hover:opacity-100 transition-all"><X size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}