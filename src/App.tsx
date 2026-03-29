// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sprout, CheckCircle, Search, Leaf, BarChart3, Map, FileText, Activity, 
  Database, Edit3, Save, PlusCircle, X, ChevronRight, Mountain, 
  LayoutDashboard, PieChart, TrendingUp, Layers, Download, Menu, Bell, 
  Upload, ChevronLeft, Paperclip, Eye, Cloud, DatabaseZap, Lock, User, Mail, ArrowLeft,
  Users, ShieldAlert, CheckSquare, XSquare, Printer, UserPlus, ShieldCheck, Trash2, Clock
} from 'lucide-react';

// ==========================================
// KONFIGURASI FIREBASE CLOUD (RESMI)
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5rlD3kcSVHunf6MasrMRVhlQuNKDk0yw",
  authDomain: "simpedas-b275c.firebaseapp.com",
  projectId: "simpedas-b275c",
  storageBucket: "simpedas-b275c.firebasestorage.app",
  messagingSenderId: "114623622977",
  appId: "1:114623622977:web:e068a70d79775218083bc0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'simpedas-b275c';

// DAFTAR AKSES KHUSUS (MASTER)
const SUPERADMIN_EMAIL = "agusbrt@gmail.com";
const ADMIN_EMAIL = "rhl.khykhy@gmail.com";

// ==========================================
// KOMPONEN PINTAR: LOGO BPDAS / KEMENHUT
// ==========================================
const LogoBPDAS = ({ className }) => {
  return (
    <img 
      src="/logo-kemenhut.png" 
      alt="Logo Kementerian" 
      className={`object-contain ${className}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = 'https://1.bp.blogspot.com/-G-RjU3gNf40/YV3z0e3s5GI/AAAAAAAAE8o/1O8-H9V-m6o7D03bB4Pz-A7n8f4-m8VpQCLcBGAsYHQ/s1000/Logo%2BKLHK%2B%2528Kementerian%2BLingkungan%2BHidup%2Bdan%2BKehutanan%2529.png';
      }}
    />
  );
};

export default function App() {
  const [authView, setAuthView] = useState('landing');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [registeredName, setRegisteredName] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredInstance, setRegisteredInstance] = useState('');
  const [registeredPassword, setRegisteredPassword] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  
  const [companiesData, setCompaniesData] = useState([]);
  const [obligationsData, setObligationsData] = useState({});
  const [usersData, setUsersData] = useState([]);

  const [dashboardCategory, setDashboardCategory] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [downloadToast, setDownloadToast] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedDashboardStatus, setSelectedDashboardStatus] = useState(null);
  const [selectedPlantStatus, setSelectedPlantStatus] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // ==========================================
  // EFFECT: AUTENTIKASI
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.isAnonymous) {
          signOut(auth);
          setUser(null);
          setAuthView('landing');
        } else {
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setAuthView('landing'); 
      }
    });
    return () => unsubscribe();
  }, []);

  // ==========================================
  // EFFECT: SINKRONISASI DATABASE (PUBLIC STORAGE)
  // ==========================================
  useEffect(() => {
    if (!user) {
       setIsDbReady(true);
       return;
    }

    const companiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'companies');
    const obligationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'obligations');
    const usersListRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');

    // INITIALIZE MASTER ACCOUNTS
    if (user.email === SUPERADMIN_EMAIL || user.email === ADMIN_EMAIL) {
      const masterRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      setDoc(masterRef, {
        name: user.email === SUPERADMIN_EMAIL ? 'Ir. Agus (Superadmin)' : 'Admin SIMPEDAS',
        email: user.email,
        instance: 'BPDAS KAHAYAN',
        role: user.email === SUPERADMIN_EMAIL ? 'Superadmin' : 'Admin',
        status: 'Active'
      }, { merge: true });
    }

    // Ambil Profil User
    const unsubProfile = onSnapshot(usersListRef, (snap) => {
      let currentFound = false;
      snap.forEach(d => {
        if (d.id === user.uid) {
          const profile = d.data();
          setUserProfile(profile);
          currentFound = true;
          if (profile.status === 'Pending' && user.email !== SUPERADMIN_EMAIL && user.email !== ADMIN_EMAIL) {
            setAuthView('pending');
          } else {
            setAuthView('app');
          }
        }
      });
      if (!currentFound) {
        setAuthView(user.email === SUPERADMIN_EMAIL || user.email === ADMIN_EMAIL ? 'app' : 'pending');
      }
    });

    // Data Perusahaan
    const unsubCompanies = onSnapshot(companiesRef, (snap) => {
      const comps = [];
      snap.forEach(d => comps.push(d.data()));
      setCompaniesData(comps);
      setIsDbReady(true);
    });

    // Data Kewajiban
    const unsubObligations = onSnapshot(obligationsRef, (snap) => {
      const obs = {};
      snap.forEach(d => { obs[d.id] = d.data().tasks; });
      setObligationsData(obs);
    });

    // Daftar User
    const unsubUsers = onSnapshot(usersListRef, (snap) => {
      const ulist = [];
      snap.forEach(d => ulist.push({ ...d.data(), id: d.id }));
      setUsersData(ulist);
    });

    return () => { 
      unsubCompanies(); 
      unsubObligations(); 
      unsubUsers(); 
      unsubProfile();
    };
  }, [user]);

  // ==========================================
  // LOGIKA AKSI
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      setLoginError('Kredensial salah, silakan cek kembali.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('landing');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createUserWithEmailAndPassword(auth, registeredEmail, registeredPassword);
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', res.user.uid);
      await setDoc(userRef, {
        name: registeredName,
        email: registeredEmail,
        instance: registeredInstance,
        role: 'User',
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
    } catch(err) {
      alert("Email sudah terdaftar atau sandi terlalu lemah.");
    }
  };

  const handleApproveUser = async (id) => {
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id);
    await updateDoc(userRef, { status: 'Active' });
    setDownloadToast('Pengguna telah diaktifkan!');
    setTimeout(() => setDownloadToast(''), 3000);
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'User' : 'Admin';
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id);
    await updateDoc(userRef, { role: newRole });
  };

  const handleRejectUser = async (id) => {
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id);
    await deleteDoc(userRef);
  };

  const getTaskTotals = (task) => {
    const luas_rkp = (task.riwayat_rkp || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const realisasi_tanam = (task.riwayat_tanam || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const luas_serah_terima = (task.riwayat_serah_terima || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    return { luas_rkp, realisasi_tanam, luas_serah_terima };
  };

  const handleEditSelect = (company) => {
    if (userProfile?.role !== 'Superadmin' && userProfile?.role !== 'Admin') return;
    setSelectedCompany(company);
    setEditFormData({ isNew: false, company: { ...company }, tasks: obligationsData[company.id] ? JSON.parse(JSON.stringify(obligationsData[company.id])) : [] });
    setShowSaveSuccess(false);
  };

  const handleAddCompany = () => {
    if (userProfile?.role !== 'Superadmin' && userProfile?.role !== 'Admin') return;
    const newId = Date.now();
    const newCategory = filterCategory === 'PPKH' || filterCategory === 'PKTMKH' ? filterCategory : 'PPKH';
    const newCompany = { id: newId, name: '', category: newCategory, sector: '', status: 'Tertib', score: 0 };
    const newTask = { id: newId + 1, task: 'Rehabilitasi DAS', sk_lokasi: '', lokasi: '', luas: '', status: 'Tertib', file_sk_name: '', file_bast_name: '', riwayat_rkp: [], riwayat_tanam: [], riwayat_serah_terima: [] };
    setSelectedCompany(newCompany);
    setEditFormData({ isNew: true, company: newCompany, tasks: [newTask] });
    setShowSaveSuccess(false);
  };

  const handleCompanyChange = (field, value) => setEditFormData((prev) => ({ ...prev, company: { ...prev.company, [field]: value } }));
  const handleTaskChange = (index, field, value) => {
    setEditFormData((prev) => { const newTasks = [...prev.tasks]; newTasks[index] = { ...newTasks[index], [field]: value }; return { ...prev, tasks: newTasks }; });
  };

  const handleSaveChanges = async () => {
    if (!editFormData || !user) return;
    try {
      const compId = editFormData.company.id.toString();
      const compRef = doc(db, 'artifacts', appId, 'public', 'data', 'companies', compId);
      const obsRef = doc(db, 'artifacts', appId, 'public', 'data', 'obligations', compId);
      await setDoc(compRef, editFormData.company);
      await setDoc(obsRef, { tasks: editFormData.tasks });
      setEditFormData((prev) => ({ ...prev, isNew: false }));
      setSelectedCompany(editFormData.company);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      alert("Gagal melakukan sinkronisasi data.");
    }
  };

  // ==========================================
  // LOGIKA ANALITIK
  // ==========================================
  const areaStats = useMemo(() => {
    let totalDAS = 0; let totalReklamasi = 0; let totalReboisasi = 0;
    let countDAS = 0; let countReklamasi = 0; let countReboisasi = 0;
    companiesData.forEach((company) => {
      if (dashboardCategory === 'Semua' || company.category === dashboardCategory) {
        const obligations = obligationsData[company.id] || [];
        obligations.forEach((ob) => {
          if (ob.task === 'Rehabilitasi DAS') { totalDAS += Number(ob.luas) || 0; countDAS++; }
          if (ob.task === 'Reklamasi Hutan') { totalReklamasi += Number(ob.luas) || 0; countReklamasi++; }
          if (ob.task === 'Reboisasi Areal Pengganti' || ob.task === 'Reboisasi') { totalReboisasi += Number(ob.luas) || 0; countReboisasi++; }
        });
      }
    });
    return { totalDAS, totalReklamasi, totalReboisasi, countDAS, countReklamasi, countReboisasi };
  }, [dashboardCategory, companiesData, obligationsData]);

  const globalProgress = useMemo(() => {
    let sumSK = 0, sumRKP = 0, sumTanam = 0, sumST = 0;
    companiesData.forEach(c => {
        if (dashboardCategory === 'Semua' || c.category === dashboardCategory) {
            const tasks = obligationsData[c.id] || [];
            tasks.forEach(t => {
                sumSK += Number(t.luas) || 0;
                const totals = getTaskTotals(t);
                sumRKP += totals.luas_rkp; sumTanam += totals.realisasi_tanam; sumST += totals.luas_serah_terima;
            });
        }
    });
    return { 
        pctRKP: sumSK > 0 ? (sumRKP / sumSK) * 100 : 0, 
        pctTanam: sumSK > 0 ? (sumTanam / sumSK) * 100 : 0, 
        pctST: sumSK > 0 ? (sumST / sumSK) * 100 : 0 
    };
  }, [companiesData, obligationsData, dashboardCategory]);

  const filteredCompanies = companiesData.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Semua' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'Semua' || c.status === filterStatus;
    const matchesDashboard = dashboardCategory === 'Semua' || c.category === dashboardCategory;
    return matchesSearch && matchesCategory && matchesStatus && matchesDashboard;
  });

  const currentCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const smartAlerts = useMemo(() => {
    const alerts = [];
    companiesData.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(t => {
        if (t.status === 'SP2' || t.status === 'SP3') {
          alerts.push({ id: `${c.id}-${t.task}`, company: c.name, type: t.status, message: `Segera evaluasi kewajiban ${t.task}.` });
        }
      });
    });
    return alerts;
  }, [companiesData, obligationsData]);

  // ==========================================
  // RENDER: PENDING VIEW
  // ==========================================
  if (authView === 'pending') {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-gray-50 p-6 overflow-hidden">
         <div className="absolute inset-0 bg-green-900/5"></div>
         <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-lg text-center border border-gray-100 animate-in zoom-in-95 relative z-10">
            <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-md">
                <Clock className="w-12 h-12 text-amber-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-4 uppercase tracking-tight">Menunggu Verifikasi Akun</h2>
            <div className="space-y-4 text-gray-600 mb-8 leading-relaxed">
                <p>Halo, <strong>{userProfile?.name || 'Pendaftar'}</strong>.</p>
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-blue-800 text-[14px] font-semibold shadow-sm text-left">
                    Pengajuan akun baru Anda sedang dalam proses validasi oleh Administrator BPDAS Kahayan.
                </div>
                <p className="text-[14px]">Untuk alasan keamanan data strategis, hak akses aplikasi hanya akan terbuka setelah akun Anda dinyatakan <strong>AKTIF</strong>.</p>
            </div>
            <div className="pt-6 border-t border-gray-100">
                <button onClick={handleLogout} className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg tracking-widest uppercase text-xs">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
                </button>
            </div>
         </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LANDING VIEW
  // ==========================================
  if (authView === 'landing') {
    return (
      <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden font-sans">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}></div>
        <div className="absolute inset-0 bg-green-950/70 bg-gradient-to-b from-green-900/80 to-green-950/90"></div>
        <div className="relative z-10 text-center px-6 max-w-5xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <LogoBPDAS className="w-full h-full" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6 drop-shadow-xl">Sistem Monitoring dan Pengawasan Pemenuhan Kewajiban <br className="hidden lg:block"/><span className="text-green-400">Pemegang PPKH dan PKTMKH</span></h1>
          <p className="text-lg md:text-xl text-green-100 mb-12 tracking-wide font-medium max-w-3xl">Balai Pengelolaan Daerah Aliran Sungai Kahayan</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => setAuthView('login')} className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl text-lg transition-all shadow-[0_0_20px_rgba(22,163,74,0.4)] flex items-center justify-center gap-2"><Lock className="w-5 h-5" /> MASUK APLIKASI</button>
            <button onClick={() => setAuthView('register')} className="px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-black rounded-xl text-lg transition-all flex items-center justify-center gap-2"><UserPlus className="w-5 h-5" /> DAFTAR BARU</button>
          </div>
        </div>
        <div className="absolute bottom-6 text-white/50 text-xs font-semibold tracking-[0.3em] uppercase">Kementerian Kehutanan RI</div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LOGIN/REGISTER VIEW
  // ==========================================
  if (authView === 'login' || authView === 'register') {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-gray-100 font-sans p-6">
        <div className="absolute inset-0 bg-green-950"></div>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-green-800 p-8 text-center relative">
            <button onClick={() => setAuthView('landing')} className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-green-200 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6" /></button>
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 drop-shadow-md">
               <LogoBPDAS className="w-full h-full" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">{authView === 'login' ? 'Login Portal' : 'Registrasi'}</h2>
          </div>
          <div className="p-10">
            {loginError && <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-2 animate-pulse"><ShieldAlert className="w-4 h-4"/> {loginError}</div>}
            {authView === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Email Terdaftar</label><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 font-semibold" /></div>
                <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Kata Sandi</label><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-5 py-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 font-semibold" /></div>
                <button type="submit" className="w-full py-4 bg-green-700 hover:bg-green-800 text-white font-black rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest">MASUK SEKARANG <ChevronRight className="w-4 h-4"/></button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <input type="text" required placeholder="NAMA LENGKAP" onChange={(e) => setRegisteredName(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600 font-semibold text-sm" />
                <input type="email" required placeholder="EMAIL KANTOR" onChange={(e) => setRegisteredEmail(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600 font-semibold text-sm" />
                <input type="text" required placeholder="INSTANSI / PERUSAHAAN" onChange={(e) => setRegisteredInstance(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600 font-semibold text-sm" />
                <input type="password" required minLength={6} placeholder="BUAT KATA SANDI" onChange={(e) => setRegisteredPassword(e.target.value)} className="w-full px-5 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-600 font-semibold text-sm" />
                <button type="submit" className="w-full py-4 bg-green-700 hover:bg-green-800 text-white font-black rounded-xl transition-all shadow-lg uppercase tracking-widest mt-4">DAFTAR AKUN</button>
              </form>
            )}
            <p className="text-center text-[11px] text-gray-500 mt-8 font-bold uppercase tracking-wider">{authView === 'login' ? "Belum punya akses?" : "Sudah punya akun?"} <button onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')} className="ml-1 text-green-700 hover:underline">{authView === 'login' ? "Daftar di sini" : "Login di sini"}</button></p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN APP VIEW
  // ==========================================
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden text-[14px]">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-green-900 flex flex-col shadow-2xl shrink-0 z-20 text-white relative transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-green-800 shrink-0 h-[160px]">
          <div className={`${isSidebarOpen ? 'w-20 h-20 mb-3' : 'w-12 h-12'} flex items-center justify-center drop-shadow-xl transition-all duration-300`}>
             <LogoBPDAS className="w-full h-full" />
          </div>
          {isSidebarOpen && (<h1 className="font-black text-[15px] text-white tracking-[0.1em] text-center uppercase">BPDAS KAHAYAN</h1>)}
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center w-full py-3.5 rounded-xl transition-all ${isSidebarOpen ? 'px-5 justify-start' : 'justify-center'} ${activeTab === 'dashboard' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-lg font-bold' : 'text-green-100 hover:bg-green-800/50'}`}><LayoutDashboard className="w-5 h-5 mr-3" /> {isSidebarOpen && <span>Dashboard</span>}</button>
          <button onClick={() => setActiveTab('companies')} className={`flex items-center w-full py-3.5 rounded-xl transition-all ${isSidebarOpen ? 'px-5 justify-start' : 'justify-center'} ${activeTab === 'companies' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-lg font-bold' : 'text-green-100 hover:bg-green-800/50'}`}><Database className="w-5 h-5 mr-3" /> {isSidebarOpen && <span>Manajemen Data</span>}</button>
          <button onClick={() => setActiveTab('visualization')} className={`flex items-center w-full py-3.5 rounded-xl transition-all ${isSidebarOpen ? 'px-5 justify-start' : 'justify-center'} ${activeTab === 'visualization' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-lg font-bold' : 'text-green-100 hover:bg-green-800/50'}`}><BarChart3 className="w-5 h-5 mr-3" /> {isSidebarOpen && <span>Progres per Unit</span>}</button>
          <button onClick={() => setActiveTab('users')} className={`flex items-center w-full py-3.5 rounded-xl transition-all ${isSidebarOpen ? 'px-5 justify-start relative' : 'justify-center'} ${activeTab === 'users' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-lg font-bold' : 'text-green-100 hover:bg-green-800/50'}`}>
            <Users className="w-5 h-5 mr-3" /> {isSidebarOpen && <span>Persetujuan User</span>}
            {usersData.filter(u => u.status === 'Pending').length > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-green-900 animate-pulse">
                    {usersData.filter(u => u.status === 'Pending').length}
                </span>
            )}
          </button>
        </nav>
        <div className="p-4 border-t border-green-800">
            <button onClick={handleLogout} className="flex items-center w-full py-3 px-5 rounded-xl text-red-300 hover:bg-red-500 hover:text-white transition-all font-bold uppercase text-[11px] tracking-widest"><ArrowLeft className="w-4 h-4 mr-3"/> Keluar</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-8 py-5 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-5">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-all focus:outline-none"><Menu className="w-6 h-6" /></button>
             <div>
                <h2 className="text-[18px] font-black text-gray-800 uppercase leading-none tracking-tight">Sistem Pengawasan PPKH & PKTMKH</h2>
                <p className="text-[11px] font-bold text-green-700 tracking-[0.2em] mt-1 uppercase flex items-center gap-1.5">BPDAS KAHAYAN <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[9px] border border-green-200">DATABASE AKTIF</span></p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {downloadToast && <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-[11px] font-black shadow-lg animate-bounce uppercase tracking-widest">{downloadToast}</span>}
             <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
               <div className="hidden md:flex flex-col text-right">
                 <span className="text-[13px] font-black text-gray-800 truncate max-w-[150px] uppercase leading-none">{userProfile?.name || 'Loading...'}</span>
                 <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${userProfile?.role === 'Superadmin' ? 'text-purple-600' : 'text-blue-600'}`}>{userProfile?.role || 'User'}</span>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400 flex items-center justify-center font-black text-green-800 shadow-md transform hover:rotate-6 transition-all cursor-pointer">
                 {(user?.email || 'A').substring(0,1).toUpperCase()}
               </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8" id="main-scroll-area">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 pb-10 animate-in fade-in duration-700">
              <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-sm">
                <button onClick={() => setDashboardCategory('Semua')} className={`px-8 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${dashboardCategory === 'Semua' ? 'bg-gray-800 text-white shadow-xl scale-105' : 'text-gray-500 hover:bg-gray-50'}`}>SEMUA UNIT</button>
                <button onClick={() => setDashboardCategory('PPKH')} className={`px-8 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${dashboardCategory === 'PPKH' ? 'bg-amber-600 text-white shadow-xl scale-105' : 'text-gray-500 hover:bg-gray-50'}`}>UNIT PPKH</button>
                <button onClick={() => setDashboardCategory('PKTMKH')} className={`px-8 py-2.5 rounded-xl font-bold transition-all text-xs uppercase tracking-widest ${dashboardCategory === 'PKTMKH' ? 'bg-green-700 text-white shadow-xl scale-105' : 'text-gray-500 hover:bg-gray-50'}`}>UNIT PKTMKH</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group border-b-8 border-b-green-600">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rehabilitasi DAS</p>
                    <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:rotate-12 transition-transform"><Mountain className="w-5 h-5"/></div>
                  </div>
                  <p className="text-4xl font-black text-green-800 tracking-tight">{areaStats.totalDAS.toLocaleString('id-ID')} <span className="text-sm text-gray-300 font-bold uppercase ml-1">Ha</span></p>
                  <p className="text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-widest">{areaStats.countDAS} Unit Terdaftar</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group border-b-8 border-b-amber-500">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reklamasi Hutan</p>
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:rotate-12 transition-transform"><Layers className="w-5 h-5"/></div>
                  </div>
                  <p className="text-4xl font-black text-amber-600 tracking-tight">{areaStats.totalReklamasi.toLocaleString('id-ID')} <span className="text-sm text-gray-300 font-bold uppercase ml-1">Ha</span></p>
                  <p className="text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-widest">{areaStats.countReklamasi} Unit Terdaftar</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group border-b-8 border-b-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reboisasi Pengganti</p>
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:rotate-12 transition-transform"><Sprout className="w-5 h-5"/></div>
                  </div>
                  <p className="text-4xl font-black text-blue-600 tracking-tight">{areaStats.totalReboisasi.toLocaleString('id-ID')} <span className="text-sm text-gray-300 font-bold uppercase ml-1">Ha</span></p>
                  <p className="text-[11px] text-gray-400 font-bold mt-2 uppercase tracking-widest">{areaStats.countReboisasi} Unit Terdaftar</p>
                </div>
              </div>

              {/* PERUBAHAN LABEL SESUAI PERMINTAAN BAPAK */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><BarChart3 className="w-64 h-64 text-green-900" /></div>
                <h3 className="text-xl font-black text-gray-900 mb-10 flex items-center gap-3 tracking-tight">
                    <PieChart className="w-6 h-6 text-green-600" /> 
                    Rekapitulasi progres pemenuhan kewajiban pemegang PPKH dan PKTMKH
                </h3>
                <div className="space-y-10 max-w-5xl">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em]">Progres Penyusunan RKP</span>
                      <span className="text-lg font-black text-blue-700">{globalProgress.pctRKP.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner border border-gray-50">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1500 shadow-lg" style={{ width: `${globalProgress.pctRKP}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em]">Progres Realisasi Penanaman</span>
                      <span className="text-lg font-black text-green-700">{globalProgress.pctTanam.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner border border-gray-50">
                      <div className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full transition-all duration-1500 shadow-lg" style={{ width: `${globalProgress.pctTanam}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em]">Progres Serah Terima (BAST)</span>
                      <span className="text-lg font-black text-orange-700">{globalProgress.pctST.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden shadow-inner border border-gray-50">
                      <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-1500 shadow-lg" style={{ width: `${globalProgress.pctST}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-green-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Status Tertib</p>
                    <p className="text-2xl font-black text-green-700">{companiesData.filter(c => c.status === 'Tertib').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-yellow-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Status SP1</p>
                    <p className="text-2xl font-black text-yellow-600">{companiesData.filter(c => c.status === 'SP1').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-orange-500">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Status SP2</p>
                    <p className="text-2xl font-black text-orange-600">{companiesData.filter(c => c.status === 'SP2').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-t-4 border-t-red-600">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Status SP3</p>
                    <p className="text-2xl font-black text-red-600">{companiesData.filter(c => c.status === 'SP3').length}</p>
                </div>
              </div>
            </div>
          )}

          {/* MANAJEMEN PENGGUNA TAB */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-8 pb-10 animate-in fade-in duration-500">
               <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-4 bg-purple-50 rounded-2xl text-purple-700 border border-purple-100 shadow-sm"><ShieldAlert className="w-8 h-8" /></div>
                     <div>
                       <h3 className="font-black text-gray-900 text-2xl tracking-tight">Otoritas Pengguna</h3>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Akses Verifikasi & Manajemen Peran Administrator</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center min-w-[120px] shadow-sm">
                        <p className="text-3xl font-black text-red-600 leading-none">{usersData.filter(u => u.status === 'Pending').length}</p>
                        <p className="text-[9px] font-black text-red-400 uppercase mt-2 tracking-widest">Butuh Approval</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap text-[14px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                       <tr>
                          <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Informasi Pendaftar</th>
                          <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] text-center">Hak Akses</th>
                          <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] text-center">Status</th>
                          <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] text-right">Aksi Administrator</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {usersData.map((usr) => (
                          <tr key={usr.id} className="hover:bg-gray-50/80 transition-colors">
                             <td className="px-8 py-6">
                                <p className="font-black text-gray-900 text-base">{usr.name}</p>
                                <p className="text-[12px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{usr.email} • {usr.instance}</p>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${getStatusColor(usr.role)}`}>{usr.role}</span>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm ${getStatusColor(usr.status)}`}>{usr.status}</span>
                             </td>
                             <td className="px-8 py-6 text-right">
                                {userProfile?.role === 'Superadmin' ? (
                                  <div className="flex justify-end gap-3">
                                     {usr.status === 'Pending' && (
                                        <button onClick={() => handleApproveUser(usr.id)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border border-green-700 px-5 py-2 rounded-xl text-[11px] font-black transition-all shadow-md active:scale-95 uppercase tracking-widest"><CheckSquare className="w-4 h-4" /> Aktifkan</button>
                                     )}
                                     {usr.role !== 'Superadmin' && (
                                        <>
                                          <button onClick={() => handleToggleRole(usr.id, usr.role)} className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-5 py-2 rounded-xl text-[11px] font-black transition-all shadow-sm active:scale-95 uppercase tracking-widest"><ShieldCheck className="w-4 h-4" /> {usr.role === 'Admin' ? 'SET USER' : 'SET ADMIN'}</button>
                                          <button onClick={() => handleRejectUser(usr.id)} className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 px-5 py-2 rounded-xl text-[11px] font-black transition-all shadow-sm active:scale-95 uppercase tracking-widest"><Trash2 className="w-4 h-4" /> Hapus</button>
                                        </>
                                     )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-gray-300 italic font-bold">Terproteksi</span>
                                )}
                             </td>
                          </tr>
                       ))}
                       {usersData.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">Belum ada pengguna terdaftar</td></tr>}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* MANAJEMEN DATA TAB */}
          {activeTab === 'companies' && (
            <div className="flex flex-col gap-8 pb-10 animate-in fade-in duration-500">
              <div className={`bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col transition-all duration-700 ${selectedCompany ? 'h-[300px] shrink-0' : 'flex-1 min-h-[600px]'}`}>
                <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between xl:items-center gap-6 bg-gray-50/50">
                  <div className="relative w-full sm:w-96">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Pencarian Unit Perusahaan..." className="w-full pl-12 pr-6 py-3.5 text-[14px] bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 outline-none font-semibold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={exportToCSV} className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-2xl text-[12px] shadow-lg flex items-center gap-2 transition-all uppercase tracking-widest"><Download className="w-4 h-4" /> EXPORT DATA</button>
                    {(userProfile?.role === 'Superadmin' || userProfile?.role === 'Admin') && (
                      <button onClick={handleAddCompany} className="px-6 py-3.5 bg-green-700 hover:bg-green-800 text-white font-black rounded-2xl text-[12px] shadow-lg flex items-center gap-2 transition-all uppercase tracking-widest"><PlusCircle className="w-4 h-4" /> TAMBAH UNIT</button>
                    )}
                  </div>
                </div>

                <div className="overflow-auto flex-1 text-[14px] bg-white relative">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b-2 border-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em]">Entitas & SK</th>
                        <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] text-center">Izin</th>
                        <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] text-right">Luas SK (Ha)</th>
                        <th className="px-8 py-5 font-black text-gray-500 uppercase text-[10px] tracking-[0.2em] text-center">Status</th>
                        <th className="px-8 py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {currentCompanies.flatMap((c) => {
                        const tasks = obligationsData[c.id] || [];
                        return tasks.map((t, idx) => (
                          <tr key={`${c.id}-${idx}`} onClick={() => handleEditSelect(c)} className="hover:bg-green-50/50 cursor-pointer transition-all group">
                            <td className="px-8 py-6">
                              <p className="font-black text-gray-900 group-hover:text-green-800 transition-colors text-base">{c.name}</p>
                              <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{c.sector} • {t.sk_lokasi || 'Tanpa SK'}</p>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-[0.1em] ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                            </td>
                            <td className="px-8 py-6 text-right font-black text-gray-700">{(Number(t.luas) || 0).toLocaleString('id-ID')}</td>
                            <td className="px-8 py-6 text-center">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-widest shadow-sm ${getStatusColor(t.status || c.status)}`}>{t.status || c.status}</span>
                            </td>
                            <td className="px-8 py-6 text-right"><ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600 transition-all" /></td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* EDIT FORM (BAGIAN DESAIN YANG BAGUS) */}
              {selectedCompany && editFormData && (
                <div className="bg-white rounded-[2rem] border border-gray-200 shadow-2xl flex flex-col shrink-0 animate-in slide-in-from-bottom-6 duration-700">
                  <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0 rounded-t-[2rem]">
                    <div>
                      <h3 className="font-black text-gray-900 text-2xl tracking-tight flex items-center gap-3">
                        <Edit3 className="w-7 h-7 text-green-700" /> 
                        Panel Kontrol Data Unit
                      </h3>
                      <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Mengelola: <span className="text-green-700 font-black">{editFormData.company.name || 'DATA BARU'}</span></p>
                    </div>
                    <div className="flex items-center gap-4">
                      {showSaveSuccess && <span className="bg-green-600 text-white px-6 py-2.5 rounded-full text-[11px] font-black animate-pulse shadow-lg uppercase tracking-widest">SINKRONISASI BERHASIL</span>}
                      <button onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="p-3 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-2xl transition-all border border-gray-100 shadow-sm"><X className="w-6 h-6" /></button>
                    </div>
                  </div>

                  <div className="p-10 space-y-10 bg-white overflow-y-auto max-h-[650px]">
                    <section className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 border-b pb-4">Identitas Dasar Perusahaan</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nama Unit / Perusahaan</label><input type="text" className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 font-bold" value={editFormData.company.name} onChange={(e) => handleCompanyChange('name', e.target.value)} /></div>
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Sektor Industri</label><input type="text" className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 font-bold" value={editFormData.company.sector || ''} onChange={(e) => handleCompanyChange('sector', e.target.value)} /></div>
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Kategori Perizinan</label><select className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 font-black" value={editFormData.company.category} onChange={(e) => handleCompanyChange('category', e.target.value)}><option value="PPKH">PPKH</option><option value="PKTMKH">PKTMKH</option></select></div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 px-1">Manajemen Rincian Kewajiban Penanaman</h4>
                      {editFormData.tasks.map((task, index) => (
                        <div key={task.id} className="bg-white border-2 border-gray-100 rounded-3xl p-8 mb-8 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-2 h-full bg-green-700"></div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                             <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nomor SK Penetapan Lokasi DAS</label><input type="text" className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl font-mono font-bold" value={task.sk_lokasi} onChange={(e) => handleTaskChange(index, 'sk_lokasi', e.target.value)} /></div>
                             <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total Luas SK (Ha)</label><input type="number" step="any" className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl font-black text-green-700 text-lg" value={task.luas || ''} onChange={(e) => handleTaskChange(index, 'luas', e.target.value)} /></div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                               <label className="text-[11px] font-black text-blue-800 uppercase mb-4 block border-b pb-3 tracking-widest">RIWAYAT RKP</label>
                               {(task.riwayat_rkp || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-2 mb-3 items-center">
                                    <input type="number" className="w-20 px-3 py-2 border border-gray-200 rounded-xl font-bold text-xs" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_rkp', hi, 'tahun', e.target.value)} />
                                    <input type="number" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl font-black text-blue-700 text-xs" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_rkp', hi, 'luas', e.target.value)} />
                                    <button onClick={() => removeHistory(index, 'riwayat_rkp', hi)} className="text-red-300 hover:text-red-600 transition-colors"><XSquare className="w-5 h-5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_rkp')} className="w-full mt-3 py-2 border-2 border-dashed border-blue-200 text-[10px] text-blue-600 font-black rounded-xl hover:bg-blue-100 transition-all uppercase tracking-widest">+ TAHUN RKP</button>
                             </div>
                             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                               <label className="text-[11px] font-black text-green-800 uppercase mb-4 block border-b pb-3 tracking-widest">REALISASI TANAM</label>
                               {(task.riwayat_tanam || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-2 mb-3 items-center">
                                    <input type="number" className="w-20 px-3 py-2 border border-gray-200 rounded-xl font-bold text-xs" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_tanam', hi, 'tahun', e.target.value)} />
                                    <input type="number" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl font-black text-green-700 text-xs" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_tanam', hi, 'luas', e.target.value)} />
                                    <button onClick={() => removeHistory(index, 'riwayat_tanam', hi)} className="text-red-300 hover:text-red-600 transition-colors"><XSquare className="w-5 h-5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_tanam')} className="w-full mt-3 py-2 border-2 border-dashed border-green-200 text-[10px] text-green-600 font-black rounded-xl hover:bg-green-100 transition-all uppercase tracking-widest">+ TAHUN TANAM</button>
                             </div>
                             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                               <label className="text-[11px] font-black text-orange-800 uppercase mb-4 block border-b pb-3 tracking-widest">SERAH TERIMA</label>
                               {(task.riwayat_serah_terima || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-2 mb-3 items-center">
                                    <input type="number" className="w-20 px-3 py-2 border border-gray-200 rounded-xl font-bold text-xs" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', hi, 'tahun', e.target.value)} />
                                    <input type="number" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl font-black text-orange-700 text-xs" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', hi, 'luas', e.target.value)} />
                                    <button onClick={() => removeHistory(index, 'riwayat_serah_terima', hi)} className="text-red-300 hover:text-red-600 transition-colors"><XSquare className="w-5 h-5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_serah_terima')} className="w-full mt-3 py-2 border-2 border-dashed border-orange-200 text-[10px] text-orange-600 font-black rounded-xl hover:bg-orange-100 transition-all uppercase tracking-widest">+ TAHUN BAST</button>
                             </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={handleAddTaskBlock} className="w-full py-5 border-2 border-dashed border-gray-200 text-gray-400 rounded-3xl font-black hover:bg-gray-50 hover:text-green-700 hover:border-green-300 transition-all uppercase tracking-[0.2em] text-xs">+ TAMBAH BLOK SK BARU</button>
                    </section>
                  </div>

                  <div className="p-10 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-5 rounded-b-[2rem]">
                    <button type="button" onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="px-10 py-4 bg-white border border-gray-200 rounded-2xl font-black text-gray-500 transition-all hover:bg-gray-100 uppercase tracking-widest text-xs">BATAL</button>
                    <button type="button" onClick={handleSaveChanges} className="px-12 py-4 bg-green-700 hover:bg-green-800 text-white font-black rounded-2xl shadow-2xl flex items-center gap-3 transition-all transform active:scale-95 uppercase tracking-[0.1em] text-xs">
                        <Save className="w-5 h-5" /> SIMPAN KE DATABASE
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISUALIZATION TAB */}
          {activeTab === 'visualization' && (
            <div className="space-y-8 pb-10 animate-in fade-in duration-700">
               <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-fit">
                    <button onClick={() => setFilterCategory('Semua')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterCategory === 'Semua' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>SEMUA</button>
                    <button onClick={() => setFilterCategory('PPKH')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterCategory === 'PPKH' ? 'bg-white text-amber-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>PPKH</button>
                    <button onClick={() => setFilterCategory('PKTMKH')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filterCategory === 'PKTMKH' ? 'bg-white text-green-700 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>PKTMKH</button>
                  </div>
                  <div className="relative w-full md:w-96">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Cari Unit Spesifik..." className="w-full pl-12 pr-6 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl shadow-inner focus:ring-2 focus:ring-green-600 outline-none font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {filteredCompanies.flatMap(company => {
                    const tasks = obligationsData[company.id] || [];
                    return tasks.map((t, idx) => {
                      const totals = getTaskTotals(t);
                      const baseLuas = Number(t.luas) || 1;
                      const pRKP = Math.min(100, (totals.luas_rkp / baseLuas) * 100);
                      const pTanam = Math.min(100, (totals.realisasi_tanam / baseLuas) * 100);
                      const pST = Math.min(100, (totals.luas_serah_terima / baseLuas) * 100);

                      return (
                        <div key={`${company.id}-${idx}`} className="bg-white border border-gray-100 rounded-[2rem] shadow-lg p-10 hover:shadow-2xl transition-all transform hover:-translate-y-1">
                          <div className="flex justify-between items-start mb-8 border-b border-gray-50 pb-6">
                            <div>
                              <p className="font-black text-gray-900 text-lg mb-1 uppercase tracking-tight">{company.name}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t.task} • {t.sk_lokasi}</p>
                            </div>
                            <div className="text-right">
                               <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm inline-block mb-3 ${getStatusColor(t.status || company.status)}`}>{t.status || company.status}</span>
                               <p className="text-xs font-black text-gray-800 bg-gray-100 px-4 py-2 rounded-xl">SK: {baseLuas.toLocaleString('id-ID')} Ha</p>
                            </div>
                          </div>
                          <div className="space-y-8">
                            <div>
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-gray-500"><span>Penyusunan RKP ({totals.luas_rkp} Ha)</span><span className="text-blue-700">{pRKP.toFixed(1)}%</span></div>
                              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner"><div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${pRKP}%` }}></div></div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-gray-500"><span>Realisasi Tanam ({totals.realisasi_tanam} Ha)</span><span className="text-green-700">{pTanam.toFixed(1)}%</span></div>
                              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner"><div className="bg-green-600 h-full rounded-full transition-all duration-1000" style={{ width: `${pTanam}%` }}></div></div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-gray-500"><span>Serah Terima BAST ({totals.luas_serah_terima} Ha)</span><span className="text-orange-700">{pST.toFixed(1)}%</span></div>
                              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner"><div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${pST}%` }}></div></div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
