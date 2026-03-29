// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sprout, CheckCircle, Search, Leaf, BarChart3, Map, FileText, Activity, 
  Database, Edit3, Save, PlusCircle, X, ChevronRight, Mountain, 
  LayoutDashboard, PieChart, TrendingUp, Layers, Download, Menu, Bell, 
  Upload, ChevronLeft, Paperclip, Eye, Cloud, DatabaseZap, Lock, User, Mail, ArrowLeft,
  Users, ShieldAlert, CheckSquare, XSquare, Printer, UserPlus, ShieldCheck, Trash2
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

// EMAIL SUPERADMIN UTAMA (MASTER)
const MASTER_ADMIN_EMAIL = "agusbrt@gmail.com";

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
  // EFFECT: AUTENTIKASI FIREBASE
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (currentUser.isAnonymous) {
          signOut(auth);
          setUser(null);
          if (authView === 'app') setAuthView('landing');
        } else {
          setUser(currentUser);
          setAuthView('app');
        }
      } else {
        setUser(null);
        setUserProfile(null);
        if (authView === 'app') setAuthView('landing'); 
      }
    });
    return () => unsubscribe();
  }, [authView]);

  // ==========================================
  // EFFECT: SINKRONISASI DATABASE (SHARED DATA)
  // ==========================================
  useEffect(() => {
    if (!user) {
       setIsDbReady(true);
       return;
    }

    // Menggunakan path /public/data agar bisa diedit bersama oleh Admin
    const companiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'companies');
    const obligationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'obligations');
    const usersListRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');

    // Auto-Set Peran Superadmin jika email cocok
    if (user.email === MASTER_ADMIN_EMAIL) {
      const masterRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      setDoc(masterRef, {
        name: 'Superadmin SIMPEDAS',
        email: user.email,
        instance: 'BPDAS KAHAYAN',
        role: 'Superadmin',
        status: 'Active'
      }, { merge: true });
    }

    // Ambil Profil User yang sedang login
    const unsubProfile = onSnapshot(usersListRef, (snap) => {
      let found = false;
      snap.forEach(d => {
        if (d.id === user.uid) {
          setUserProfile(d.data());
          found = true;
        }
      });
      if (!found) {
        setUserProfile({ role: user.email === MASTER_ADMIN_EMAIL ? 'Superadmin' : 'User', status: 'Pending' });
      }
    });

    // Ambil Data Perusahaan
    const unsubCompanies = onSnapshot(companiesRef, (snap) => {
      const comps = [];
      snap.forEach(d => comps.push(d.data()));
      setCompaniesData(comps);
      setIsDbReady(true);
    });

    // Ambil Data Kewajiban
    const unsubObligations = onSnapshot(obligationsRef, (snap) => {
      const obs = {};
      snap.forEach(d => { obs[d.id] = d.data().tasks; });
      setObligationsData(obs);
    });

    // Ambil Daftar Semua Pengguna
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
  // FUNGSI AKSI
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      setLoginError('Email atau kata sandi salah!');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('landing');
    } catch (err) {
      console.error("Gagal Logout", err);
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
        role: registeredEmail === MASTER_ADMIN_EMAIL ? 'Superadmin' : 'User',
        status: registeredEmail === MASTER_ADMIN_EMAIL ? 'Active' : 'Pending',
        createdAt: new Date().toISOString()
      });
      setAuthView('pending');
    } catch(err) {
      alert("Gagal mendaftar. Email mungkin sudah digunakan.");
    }
  };

  const handleApproveUser = async (id) => {
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id);
    await updateDoc(userRef, { status: 'Active' });
    setDownloadToast('Pengguna Berhasil Disetujui!');
    setTimeout(() => setDownloadToast(''), 3000);
  };

  const handleToggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'Admin' ? 'User' : 'Admin';
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id);
    await updateDoc(userRef, { role: newRole });
    setDownloadToast(`Peran diubah menjadi ${newRole}`);
    setTimeout(() => setDownloadToast(''), 3000);
  };

  const handleRejectUser = async (id) => {
    const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id);
    await deleteDoc(userRef);
    setDownloadToast('Akun Pengguna Telah Dihapus.');
    setTimeout(() => setDownloadToast(''), 3000);
  };

  const getTaskTotals = (task) => {
    const luas_rkp = (task.riwayat_rkp || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const realisasi_tanam = (task.riwayat_tanam || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const luas_serah_terima = (task.riwayat_serah_terima || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    return { luas_rkp, realisasi_tanam, luas_serah_terima };
  };

  const handleEditSelect = (company) => {
    if (userProfile?.role !== 'Superadmin' && userProfile?.role !== 'Admin') {
      setDownloadToast('Hanya Admin yang dapat mengedit data.');
      setTimeout(() => setDownloadToast(''), 3000);
      return;
    }
    setSelectedCompany(company);
    setEditFormData({ isNew: false, company: { ...company }, tasks: obligationsData[company.id] ? JSON.parse(JSON.stringify(obligationsData[company.id])) : [] });
    setShowSaveSuccess(false);
  };

  const handleAddCompany = () => {
    if (userProfile?.role !== 'Superadmin' && userProfile?.role !== 'Admin') {
      setDownloadToast('Hanya Admin yang dapat menambah data.');
      setTimeout(() => setDownloadToast(''), 3000);
      return;
    }
    const newId = Date.now();
    const newCategory = filterCategory === 'PPKH' || filterCategory === 'PKTMKH' ? filterCategory : 'PPKH';
    const newCompany = { id: newId, name: '', category: newCategory, sector: '', status: 'Tertib', score: 0 };
    const newTask = { id: newId + 1, task: newCategory === 'PPKH' ? 'Rehabilitasi DAS' : 'Reboisasi Areal Pengganti', sk_lokasi: '', lokasi: '', luas: '', status: 'Tertib', file_sk_name: '', file_bast_name: '', riwayat_rkp: [], riwayat_tanam: [], riwayat_serah_terima: [] };
    setSelectedCompany(newCompany);
    setEditFormData({ isNew: true, company: newCompany, tasks: [newTask] });
    setShowSaveSuccess(false);
  };

  const handleCompanyChange = (field, value) => setEditFormData((prev) => ({ ...prev, company: { ...prev.company, [field]: value } }));
  const handleTaskChange = (index, field, value) => {
    setEditFormData((prev) => { const newTasks = [...prev.tasks]; newTasks[index] = { ...newTasks[index], [field]: value }; return { ...prev, tasks: newTasks }; });
  };

  const handleSimulateDownload = (fileName) => { setDownloadToast(`Mengunduh: ${fileName}`); setTimeout(() => setDownloadToast(''), 3500); };
  const handleDownloadFromTable = (e, fileName) => { e.stopPropagation(); handleSimulateDownload(fileName); };

  const handleFileUpload = (taskIndex, field, file) => {
    if (!file) return;
    setEditFormData((prev) => { const newTasks = [...prev.tasks]; newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: file.name }; return { ...prev, tasks: newTasks }; });
  };

  const handleAddTaskBlock = () => {
    setEditFormData((prev) => ({ ...prev, tasks: [ ...prev.tasks, { id: Date.now(), task: 'Rehabilitasi DAS', sk_lokasi: '', lokasi: '', luas: '', status: 'Tertib', file_sk_name: '', file_bast_name: '', riwayat_rkp: [], riwayat_tanam: [], riwayat_serah_terima: [] } ] }));
  };

  const addHistory = (taskIndex, type) => {
    setEditFormData((prev) => {
      const newTasks = [...prev.tasks]; const newHistory = [...(newTasks[taskIndex][type] || [])];
      newHistory.push(type === 'riwayat_tanam' ? { id: Date.now(), tahun: new Date().getFullYear(), luas: '', status: 'P0' } : { id: Date.now(), tahun: new Date().getFullYear(), luas: '' });
      newTasks[taskIndex][type] = newHistory; return { ...prev, tasks: newTasks };
    });
  };

  const updateHistory = (taskIndex, type, histIndex, field, value) => {
    setEditFormData((prev) => {
      const newTasks = [...prev.tasks]; const newHistory = [...newTasks[taskIndex][type]];
      newHistory[histIndex] = { ...newHistory[histIndex], [field]: value };
      newTasks[taskIndex][type] = newHistory; return { ...prev, tasks: newTasks };
    });
  };

  const removeHistory = (taskIndex, type, histIndex) => {
    setEditFormData((prev) => {
      const newTasks = [...prev.tasks]; const newHistory = [...newTasks[taskIndex][type]];
      newHistory.splice(histIndex, 1); newTasks[taskIndex][type] = newHistory; return { ...prev, tasks: newTasks };
    });
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
      alert("Gagal menyimpan ke database bersama.");
    }
  };

  const exportToCSV = () => {
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Luas SK (Ha)", "Total RKP (Ha)", "Realisasi Tanam (Ha)", "Realisasi P0 (Ha)", "Realisasi P1 (Ha)", "Realisasi P2 (Ha)", "Serah Terima (Ha)", "Status"];
    let csvContent = headers.join(",") + "\n";
    filteredCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      if (tasks.length === 0) {
          csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","-","-","0","0","0","0","0","0","0","${c.status}"\n`;
      } else {
          tasks.forEach(task => {
              const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0;
              let p0 = 0, p1 = 0, p2 = 0;
              if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const l = Number(r.luas) || 0; if (r.status === 'P0') p0 += l; else if (r.status === 'P1') p1 += l; else if (r.status === 'P2') p2 += l; else p0 += l; }); }
              csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${luasSK}","${totals.luas_rkp}","${totals.realisasi_tanam}","${p0}","${p1}","${p2}","${totals.luas_serah_terima}","${task.status || c.status}"\n`;
          });
      }
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", `SIMPEDAS_Data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getStats = (cat) => {
    const data = cat === 'Semua' ? companiesData : companiesData.filter((c) => c.category === cat);
    return { total: data.length, tertib: data.filter((c) => c.status === 'Tertib').length, sp1: data.filter((c) => c.status === 'SP1').length, sp2: data.filter((c) => c.status === 'SP2').length, sp3: data.filter((c) => c.status === 'SP3').length };
  };

  const areaStats = useMemo(() => {
    let totalDAS = 0; let totalReklamasi = 0; let totalReboisasi = 0;
    let countDAS = 0; let countReklamasi = 0; let countReboisasi = 0;
    companiesData.forEach((company) => {
      if (dashboardCategory === 'Semua' || company.category === dashboardCategory) {
        const obligations = obligationsData[company.id] || [];
        let hasDAS = false; let hasReklamasi = false; let hasReboisasi = false;
        obligations.forEach((ob) => {
          if (ob.task === 'Rehabilitasi DAS') { totalDAS += Number(ob.luas) || 0; hasDAS = true; }
          if (ob.task === 'Reklamasi Hutan') { totalReklamasi += Number(ob.luas) || 0; hasReklamasi = true; }
          if (ob.task === 'Reboisasi Areal Pengganti' || ob.task === 'Reboisasi') { totalReboisasi += Number(ob.luas) || 0; hasReboisasi = true; }
        });
        if (hasDAS) countDAS++; if (hasReklamasi) countReklamasi++; if (hasReboisasi) countReboisasi++;
      }
    });
    return { totalDAS, totalReklamasi, totalReboisasi, countDAS, countReklamasi, countReboisasi };
  }, [dashboardCategory, companiesData, obligationsData]);

  const currentStats = getStats(dashboardCategory);

  const filteredCompanies = companiesData.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Semua' || company.category === filterCategory;
    const matchesStatus = filterStatus === 'Semua' || company.status === filterStatus;
    const matchesDashboardCat = activeTab === 'dashboard' ? (dashboardCategory === 'Semua' || company.category === dashboardCategory) : true;
    return matchesSearch && matchesCategory && matchesStatus && matchesDashboardCat;
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const currentCompanies = filteredCompanies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const globalProgress = useMemo(() => {
    let sumSK = 0, sumRKP = 0, sumTanam = 0, sumST = 0;
    filteredCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(task => {
        sumSK += Number(task.luas) || 0;
        const totals = getTaskTotals(task);
        sumRKP += totals.luas_rkp; sumTanam += totals.realisasi_tanam; sumST += totals.luas_serah_terima;
      });
    });
    const pctRKP = sumSK > 0 ? Math.min(100, (sumRKP / sumSK) * 100) : 0;
    const pctTanam = sumSK > 0 ? Math.min(100, (sumTanam / sumSK) * 100) : 0;
    const pctST = sumSK > 0 ? Math.min(100, (sumST / sumSK) * 100) : 0;
    return { sumSK, sumRKP, sumTanam, sumST, pctRKP, pctTanam, pctST };
  }, [filteredCompanies, obligationsData]);

  const yearlyProgress = useMemo(() => {
    const data = { rkp: {}, tanam: {}, st: {} };
    let minYear = 2021; let maxYear = new Date().getFullYear();
    filteredCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(task => {
        (task.riwayat_rkp || []).forEach(r => { const yr = Number(r.tahun); if (yr) { data.rkp[yr] = (data.rkp[yr] || 0) + Number(r.luas); if (yr < minYear) minYear = yr; if (yr > maxYear) maxYear = yr; } });
        (task.riwayat_tanam || []).forEach(r => { const yr = Number(r.tahun); if (yr) { data.tanam[yr] = (data.tanam[yr] || 0) + Number(r.luas); if (yr < minYear) minYear = yr; if (yr > maxYear) maxYear = yr; } });
        (task.riwayat_serah_terima || []).forEach(r => { const yr = Number(r.tahun); if (yr) { data.st[yr] = (data.st[yr] || 0) + Number(r.luas); if (yr < minYear) minYear = yr; if (yr > maxYear) maxYear = yr; } });
      });
    });
    const yearsList = []; for (let y = minYear; y <= maxYear; y++) yearsList.push(y);
    const maxRKP = Math.max(...yearsList.map(y => data.rkp[y] || 0), 10);
    const maxTanam = Math.max(...yearsList.map(y => data.tanam[y] || 0), 10);
    const maxST = Math.max(...yearsList.map(y => data.st[y] || 0), 10);
    return { data, yearsList, maxRKP, maxTanam, maxST };
  }, [filteredCompanies, obligationsData]);

  const plantStatusStats = useMemo(() => {
    let p0 = 0, p1 = 0, p2 = 0;
    filteredCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(task => {
        if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const l = Number(r.luas) || 0; if (r.status === 'P0') p0 += l; else if (r.status === 'P1') p1 += l; else if (r.status === 'P2') p2 += l; else p0 += l; }); }
      });
    });
    const total = p0 + p1 + p2;
    return { p0, p1, p2, total, pctP0: total > 0 ? (p0 / total) * 100 : 0, pctP1: total > 0 ? (p1 / total) * 100 : 0, pctP2: total > 0 ? (p2 / total) * 100 : 0 };
  }, [filteredCompanies, obligationsData]);

  const smartAlerts = useMemo(() => {
    const alerts = []; const currentYear = new Date().getFullYear();
    companiesData.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(task => {
        if (task.task === 'Rehabilitasi DAS') {
          const currentStatus = task.status || c.status;
          const tanamYears = (task.riwayat_tanam || []).map(r => Number(r.tahun) || 0);
          const latestTanamYear = tanamYears.length > 0 ? Math.max(...tanamYears) : 0;
          if (currentStatus === 'Tertib') {
             if (latestTanamYear === 0) { alerts.push({ id: `${c.id}-${task.id}-sp1-new`, company: c.name, type: 'SP1', message: `Belum ada realisasi tanam (P0) sejak SK diterbitkan. Evaluasi semester berpotensi SP1.` }); } 
             else if (latestTanamYear < currentYear - 1) { alerts.push({ id: `${c.id}-${task.id}-sp1`, company: c.name, type: 'SP1', message: `Tidak ada progres tanam baru sejak ${latestTanamYear}. Evaluasi semester berpotensi SP1.` }); }
          } else if (currentStatus === 'SP1' && latestTanamYear < currentYear - 1) { alerts.push({ id: `${c.id}-${task.id}-sp2`, company: c.name, type: 'SP2', message: `Masa peringatan SP1 habis tanpa progres tanam baru. Segera tingkatkan ke SP2.` });
          } else if (currentStatus === 'SP2' && latestTanamYear < currentYear - 1) { alerts.push({ id: `${c.id}-${task.id}-sp3`, company: c.name, type: 'SP3', message: `PERINGATAN KERAS! Status SP2 tanpa progres. Rekomendasi naik ke SP3.` }); }
        }
      });
    });
    return alerts;
  }, [companiesData, obligationsData]);

  const printDashboardStatus = () => {
    const title = "LAPORAN STATUS PEMENUHAN KEWAJIBAN"; 
    const subtitle = `Filter Status: ${selectedDashboardStatus} | Total Unit: ${dashboardDetailCompanies.length}`;
    const headers = ["No", "Nama Perusahaan", "Kategori", "Luas SK (Ha)", "Status"];
    let rows = dashboardDetailCompanies.map((c, idx) => [idx + 1, c.name, c.category, (c.luas || 0).toLocaleString('id-ID'), c.status]);
    printReport(title, subtitle, headers, rows);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Tertib': return 'bg-green-100 text-green-800 border-green-200'; case 'SP1': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SP2': return 'bg-orange-100 text-orange-800 border-orange-200'; case 'SP3': return 'bg-red-100 text-red-800 border-red-200';
      case 'Active': return 'bg-green-100 text-green-800 border-green-200'; case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; 
      case 'Admin': return 'bg-blue-100 text-blue-800 border-blue-200'; case 'Superadmin': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // ==========================================
  // RENDER: HALAMAN LOADING
  // ==========================================
  if (!isDbReady && user) {
    return (
      <div className="flex flex-col h-screen w-screen bg-green-950 items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10 flex flex-col items-center">
          <DatabaseZap className="w-20 h-20 text-green-400 mb-6 animate-pulse drop-shadow-lg" />
          <h1 className="text-2xl font-black tracking-[0.2em] mb-2 drop-shadow-md">BPDAS KAHAYAN</h1>
          <p className="text-green-300 font-semibold uppercase tracking-wider text-[12px] flex items-center gap-2"><Cloud className="w-4 h-4 animate-bounce" /> Menghubungkan Data...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: HALAMAN DEPAN (LANDING PAGE)
  // ==========================================
  if (authView === 'landing') {
    return (
      <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden font-sans">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}></div>
        <div className="absolute inset-0 bg-green-950/70 bg-gradient-to-b from-green-900/80 to-green-950/90"></div>
        <div className="relative z-10 text-center px-6 max-w-5xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center mb-8 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <LogoBPDAS className="w-full h-full" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6 drop-shadow-lg">Sistem Monitoring dan Pengawasan Pemenuhan Kewajiban <br className="hidden lg:block"/><span className="text-green-400">Pemegang PPKH dan PKTMKH</span></h1>
          <p className="text-lg md:text-xl text-green-100 mb-12 tracking-wide font-medium max-w-3xl">Di Wilayah Kerja BPDAS Kahayan</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => setAuthView('login')} className="px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-all shadow-md flex items-center justify-center gap-2"><Lock className="w-5 h-5" /> Masuk Aplikasi</button>
            <button onClick={() => setAuthView('register')} className="px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-lg text-lg transition-all flex items-center justify-center gap-2"><User className="w-5 h-5" /> Daftar Akun Baru</button>
          </div>
        </div>
        <div className="absolute bottom-6 text-white/50 text-xs font-semibold tracking-widest uppercase">Kementerian Kehutanan RI</div>
      </div>
    );
  }

  // ==========================================
  // RENDER: HALAMAN LOGIN / REGISTER
  // ==========================================
  if (authView === 'login' || authView === 'register') {
    return (
      <div className="relative w-full h-screen flex items-center justify-center bg-gray-100 font-sans p-6">
        <div className="absolute inset-0 bg-green-950/90"></div>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-green-800 p-6 text-center relative">
            <button onClick={() => setAuthView('landing')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-green-200 hover:text-white hover:bg-green-700 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3 drop-shadow-md">
               <LogoBPDAS className="w-full h-full" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">{authView === 'login' ? 'Login Portal' : 'Registrasi Akun'}</h2>
          </div>
          <div className="p-8">
            {loginError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <ShieldAlert className="w-5 h-5" /> {loginError}
              </div>
            )}
            {authView === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Email Terdaftar</label><div className="relative"><Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" /><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50" placeholder="agusbrt@gmail.com" /></div></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Kata Sandi</label><div className="relative"><Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" /><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50" placeholder="••••••••" /></div></div>
                <button type="submit" className="w-full py-3 mt-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Masuk Sekarang</button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Nama Lengkap</label><input type="text" required onChange={(e) => setRegisteredName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="Nama Anda" /></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Email Kantor</label><input type="email" required onChange={(e) => setRegisteredEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="email@perusahaan.com" /></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Asal Instansi/Perusahaan</label><input type="text" required onChange={(e) => setRegisteredInstance(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="PT. Contoh Makmur" /></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Kata Sandi (Min 6 Karakter)</label><input type="password" required minLength={6} onChange={(e) => setRegisteredPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="Buat kata sandi" /></div>
                <button type="submit" className="w-full py-3 mt-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg transition-colors shadow-md">Ajukan Pendaftaran</button>
              </form>
            )}
            <p className="text-center text-xs text-gray-500 mt-6 font-semibold">{authView === 'login' ? "Belum punya akun?" : "Sudah memiliki akun?"} <button onClick={() => {setAuthView(authView === 'login' ? 'register' : 'login'); setLoginError('');}} className="ml-1 text-green-700 hover:underline">{authView === 'login' ? "Daftar di sini" : "Login di sini"}</button></p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: HALAMAN MENUNGGU PERSETUJUAN
  // ==========================================
  if (authView === 'pending') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
         <div className="bg-white p-10 rounded-2xl shadow-lg max-w-lg text-center border border-gray-200 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6"><Activity className="w-10 h-10 text-yellow-600 animate-pulse" /></div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">Pendaftaran Berhasil!</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">Halo <strong>{registeredName || 'Pengguna'}</strong>, akun Anda sedang dalam proses verifikasi. Dashboard hanya akan tampil setelah disetujui oleh Superadmin.</p>
            <button onClick={handleLogout} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">Kembali ke Halaman Depan</button>
         </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: APLIKASI UTAMA
  // ==========================================
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden text-[14px] animate-in fade-in duration-500">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-green-900 flex flex-col shadow-xl shrink-0 z-20 text-white relative transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-green-800 shrink-0 h-[150px]">
          <div className={`${isSidebarOpen ? 'w-20 h-20 mb-3' : 'w-10 h-10'} flex items-center justify-center drop-shadow-md transition-all duration-300`}>
             <LogoBPDAS className="w-full h-full" />
          </div>
          {isSidebarOpen && (<h1 className="font-bold text-[16px] text-white tracking-[0.1em] text-center">BPDAS KAHAYAN</h1>)}
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'dashboard' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`}><LayoutDashboard className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Dashboard</span>}</button>
          <button onClick={() => setActiveTab('companies')} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'companies' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`}><Database className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Manajemen Data</span>}</button>
          <button onClick={() => setActiveTab('visualization')} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'visualization' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`}><BarChart3 className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Progres per Unit</span>}</button>
          <button onClick={() => setActiveTab('users')} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'users' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`}><Users className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Manajemen Pengguna</span>}</button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-100">
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-4 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-5">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"><Menu className="w-6 h-6" /></button>
             <div className="flex flex-col">
                <h2 className="text-[16px] md:text-[19px] font-black text-gray-800 uppercase leading-tight">Sistem Pengawasan PPKH & PKTMKH</h2>
                <p className="text-[11px] font-bold text-green-700 tracking-widest mt-0.5 uppercase flex items-center gap-1.5">BPDAS KAHAYAN <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[9px]"><Lock className="w-2.5 h-2.5 inline"/> Login Resmi v2.0</span></p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {downloadToast && <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-[12px] font-bold border border-blue-300 animate-pulse">{downloadToast}</span>}
             <div className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer group relative">
               <div className="hidden md:flex flex-col text-right">
                 <span className="text-[13px] font-bold text-gray-800 truncate max-w-[120px]">{user?.email}</span>
                 <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{userProfile?.role || 'User'}</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center font-bold text-green-800 shadow-sm group-hover:bg-green-200 transition-colors">
                 {(user?.email || 'A').substring(0,1).toUpperCase()}
               </div>
               <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                  <div className="bg-white rounded-md shadow-xl border border-gray-200 py-1">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Keluar / Logout</button>
                  </div>
               </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="main-scroll-area">
          
          {/* MANAJEMEN PENGGUNA */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
               <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-50 rounded-md text-purple-700 border border-purple-100"><ShieldAlert className="w-6 h-6" /></div>
                     <div>
                       <h3 className="font-bold text-gray-900 text-lg">Manajemen Hak Akses Pengguna</h3>
                       <p className="text-xs text-gray-500">Kelola izin masuk staf dan berikan hak akses editor (Admin).</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center min-w-[100px]">
                        <p className="text-xl font-black text-gray-800">{usersData.length}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Total Akun</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap text-[14px]">
                    <thead className="bg-gray-100 border-b border-gray-300">
                       <tr>
                          <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs">Identitas Pengguna</th>
                          <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs text-center">Hak Akses</th>
                          <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs text-center">Status</th>
                          <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs text-right">Tindakan Admin</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {usersData.map((usr) => (
                          <tr key={usr.id} className="hover:bg-gray-50">
                             <td className="px-6 py-4">
                                <p className="font-bold text-gray-900">{usr.name}</p>
                                <p className="text-[12px] text-gray-500 mt-0.5">{usr.email}</p>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(usr.role)}`}>{usr.role}</span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded text-[11px] font-bold border uppercase ${getStatusColor(usr.status)}`}>{usr.status}</span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                {userProfile?.role === 'Superadmin' ? (
                                  <div className="flex justify-end gap-2">
                                     {usr.status === 'Pending' && (
                                        <button onClick={() => handleApproveUser(usr.id)} className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 px-3 py-1.5 rounded text-[11px] font-bold transition-colors"><CheckSquare className="w-3.5 h-3.5" /> Setujui</button>
                                     )}
                                     {usr.role !== 'Superadmin' && (
                                        <button onClick={() => handleToggleRole(usr.id, usr.role)} className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-3 py-1.5 rounded text-[11px] font-bold transition-colors"><ShieldCheck className="w-3.5 h-3.5" /> {usr.role === 'Admin' ? 'User' : 'Admin'}</button>
                                     )}
                                     {usr.role !== 'Superadmin' && (
                                       <button onClick={() => handleRejectUser(usr.id)} className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 px-3 py-1.5 rounded text-[11px] font-bold transition-colors"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                                     )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic">No Access</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 pb-10 animate-in fade-in duration-500">
              <div className="flex bg-white p-1 rounded-md border border-gray-300 w-fit shadow-sm">
                <button onClick={() => setDashboardCategory('Semua')} className={`px-6 py-2 rounded-md font-semibold transition-all ${dashboardCategory === 'Semua' ? 'bg-gray-700 text-white shadow' : 'text-gray-600'}`}>Semua</button>
                <button onClick={() => setDashboardCategory('PPKH')} className={`px-6 py-2 rounded-md font-semibold transition-all ${dashboardCategory === 'PPKH' ? 'bg-amber-600 text-white shadow' : 'text-gray-600'}`}>PPKH</button>
                <button onClick={() => setDashboardCategory('PKTMKH')} className={`px-6 py-2 rounded-md font-semibold transition-all ${dashboardCategory === 'PKTMKH' ? 'bg-green-700 text-white shadow' : 'text-gray-600'}`}>PKTMKH</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-green-600">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Rehabilitasi DAS</p>
                  <p className="text-3xl font-bold text-green-700">{areaStats.totalDAS.toLocaleString('id-ID')} <span className="text-xs text-gray-400 font-semibold">Ha</span></p>
                  <p className="text-[11px] text-gray-400 mt-1">{areaStats.countDAS} Unit Aktif</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-amber-500">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Reklamasi Hutan</p>
                  <p className="text-3xl font-bold text-amber-600">{areaStats.totalReklamasi.toLocaleString('id-ID')} <span className="text-xs text-gray-400 font-semibold">Ha</span></p>
                  <p className="text-[11px] text-gray-400 mt-1">{areaStats.countReklamasi} Unit Aktif</p>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-blue-500">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Reboisasi Pengganti</p>
                  <p className="text-3xl font-bold text-blue-600">{areaStats.totalReboisasi.toLocaleString('id-ID')} <span className="text-xs text-gray-400 font-semibold">Ha</span></p>
                  <p className="text-[11px] text-gray-400 mt-1">{areaStats.countReboisasi} Unit Aktif</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow p-6">
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-blue-600" /> Rekapitulasi progres pemenuhan kewajiban pemegang PPKH dan PKTMKH</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-700">Penyusunan RKP</span>
                      <span className="text-blue-700">{globalProgress.pctRKP.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${globalProgress.pctRKP}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-700">Realisasi Penanaman</span>
                      <span className="text-green-700">{globalProgress.pctTanam.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-full transition-all duration-1000" style={{ width: `${globalProgress.pctTanam}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-700">Serah Terima BAST</span>
                      <span className="text-orange-700">{globalProgress.pctST.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${globalProgress.pctST}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 px-1"><ShieldAlert className="w-5 h-5 text-rose-600" /> Peringatan Smart EWS ({smartAlerts.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {smartAlerts.slice(0, 6).map(alert => (
                    <div key={alert.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-red-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-[13px] text-gray-900 truncate pr-2">{alert.company}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${alert.type === 'SP3' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>{alert.type}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 leading-tight">{alert.message}</p>
                    </div>
                  ))}
                  {smartAlerts.length === 0 && <p className="text-sm text-gray-400 italic">Tidak ada peringatan kepatuhan saat ini.</p>}
                </div>
              </div>
            </div>
          )}

          {/* MANAJEMEN DATA */}
          {activeTab === 'companies' && (
            <div className="flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
              <div className={`bg-white rounded-lg border border-gray-200 shadow flex flex-col transition-all duration-500 ${selectedCompany ? 'h-[300px] shrink-0' : 'flex-1 min-h-[500px]'}`}>
                <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-gray-50">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input type="text" placeholder="Cari perusahaan..." className="w-full pl-10 pr-4 py-2 text-[14px] bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={exportToCSV} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md text-[13px] shadow flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
                    {(userProfile?.role === 'Superadmin' || userProfile?.role === 'Admin') && (
                      <button onClick={handleAddCompany} className="px-4 py-2 bg-green-700 text-white font-bold rounded-md text-[13px] shadow flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Tambah Unit</button>
                    )}
                  </div>
                </div>

                <div className="overflow-auto flex-1 text-[14px] bg-white relative">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs">Unit Perusahaan</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs text-center">Tipe</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs text-right">Luas SK (Ha)</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs text-center">Status</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentCompanies.flatMap((c) => {
                        const tasks = obligationsData[c.id] || [];
                        return tasks.map((taskData, idx) => (
                          <tr key={`${c.id}-${idx}`} onClick={() => handleEditSelect(c)} className="hover:bg-green-50 cursor-pointer transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{c.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{c.sector} • {taskData.sk_lokasi}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{c.category}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-800">{(Number(taskData.luas) || 0).toLocaleString('id-ID')}</td>
                            <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded text-[11px] font-bold border uppercase ${getStatusColor(taskData.status || c.status)}`}>{taskData.status || c.status}</span></td>
                            <td className="px-6 py-4 text-right"><ChevronRight className="w-5 h-5 text-gray-400" /></td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedCompany && editFormData && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-md flex flex-col shrink-0 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0 rounded-t-lg">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {editFormData.isNew ? <PlusCircle className="w-5 h-5 text-green-700" /> : <Edit3 className="w-5 h-5 text-green-700" />} 
                        Formulir Manajemen Data Bersama
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Mengedit: <strong className="text-green-700">{editFormData.company.name || 'Baru'}</strong></p>
                    </div>
                    <div className="flex items-center gap-4">
                      {showSaveSuccess && <span className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-[13px] font-bold border border-green-300">Disimpan ke Database</span>}
                      <button onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="p-2 text-gray-500 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-8 bg-white overflow-y-auto max-h-[600px]">
                    <section>
                      <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Data Dasar Unit</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-600 mb-1.5">Nama Perusahaan</label><input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px]" value={editFormData.company.name} onChange={(e) => handleCompanyChange('name', e.target.value)} /></div>
                        <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-600 mb-1.5">Sektor Industri</label><input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px]" value={editFormData.company.sector || ''} onChange={(e) => handleCompanyChange('sector', e.target.value)} /></div>
                        <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori Izin</label><select className="w-full px-4 py-2 border border-gray-300 rounded-md text-[14px]" value={editFormData.company.category} onChange={(e) => handleCompanyChange('category', e.target.value)}><option value="PPKH">PPKH</option><option value="PKTMKH">PKTMKH</option></select></div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Rincian Kewajiban Penanaman</h4>
                      {editFormData.tasks.map((task, index) => (
                        <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                             <div className="md:col-span-2"><label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">No. SK Penetapan</label><input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md" value={task.sk_lokasi} onChange={(e) => handleTaskChange(index, 'sk_lokasi', e.target.value)} /></div>
                             <div><label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">Luas SK (Ha)</label><input type="number" step="any" className="w-full px-4 py-2 border border-gray-300 rounded-md" value={task.luas || ''} onChange={(e) => handleTaskChange(index, 'luas', e.target.value)} /></div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="bg-white p-5 rounded-lg border border-gray-200">
                               <label className="text-[12px] font-bold text-gray-800 uppercase mb-4 block">Riwayat RKP</label>
                               {(task.riwayat_rkp || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-2 mb-2">
                                    <input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-[12px]" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_rkp', hi, 'tahun', e.target.value)} />
                                    <input type="number" className="flex-1 px-2 py-1 border border-gray-300 rounded text-[12px]" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_rkp', hi, 'luas', e.target.value)} />
                                    <button onClick={() => removeHistory(index, 'riwayat_rkp', hi)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_rkp')} className="text-[11px] text-blue-600 font-bold hover:underline">+ Tambah Tahun</button>
                             </div>
                             <div className="bg-white p-5 rounded-lg border border-gray-200">
                               <label className="text-[12px] font-bold text-gray-800 uppercase mb-4 block">Realisasi Tanam</label>
                               {(task.riwayat_tanam || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-2 mb-2">
                                    <input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-[12px]" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_tanam', hi, 'tahun', e.target.value)} />
                                    <input type="number" className="flex-1 px-2 py-1 border border-gray-300 rounded text-[12px]" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_tanam', hi, 'luas', e.target.value)} />
                                    <button onClick={() => removeHistory(index, 'riwayat_tanam', hi)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_tanam')} className="text-[11px] text-green-600 font-bold hover:underline">+ Tambah Tahun</button>
                             </div>
                             <div className="bg-white p-5 rounded-lg border border-gray-200">
                               <label className="text-[12px] font-bold text-gray-800 uppercase mb-4 block">Serah Terima BAST</label>
                               {(task.riwayat_serah_terima || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-2 mb-2">
                                    <input type="number" className="w-20 px-2 py-1 border border-gray-300 rounded text-[12px]" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', hi, 'tahun', e.target.value)} />
                                    <input type="number" className="flex-1 px-2 py-1 border border-gray-300 rounded text-[12px]" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', hi, 'luas', e.target.value)} />
                                    <button onClick={() => removeHistory(index, 'riwayat_serah_terima', hi)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_serah_terima')} className="text-[11px] text-orange-600 font-bold hover:underline">+ Tambah Tahun</button>
                             </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={handleAddTaskBlock} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-md font-bold hover:bg-gray-50 transition-colors">+ Tambah Blok Kewajiban (SK Lain)</button>
                    </section>
                  </div>

                  <div className="p-6 md:p-8 border-t border-gray-200 bg-gray-50 flex justify-end gap-4 rounded-b-lg">
                    <button type="button" onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="px-6 py-2 bg-white border border-gray-300 rounded-md font-bold text-gray-600">Batal</button>
                    <button type="button" onClick={handleSaveChanges} className="px-8 py-2 bg-green-700 text-white font-bold rounded-md shadow-md flex items-center gap-2"><Save className="w-4 h-4" /> Simpan Database Bersama</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISUALIZATION TAB */}
          {activeTab === 'visualization' && (
            <div className="space-y-6 pb-10 animate-in fade-in duration-500">
               <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sticky top-0 z-20 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200 w-full md:w-fit">
                    <button onClick={() => setFilterCategory('Semua')} className={`flex-1 md:flex-none px-5 py-1.5 rounded-md font-semibold transition-all text-[13px] ${filterCategory === 'Semua' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Semua</button>
                    <button onClick={() => setFilterCategory('PPKH')} className={`flex-1 md:flex-none px-5 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 text-[13px] ${filterCategory === 'PPKH' ? 'bg-white text-amber-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}><Mountain className="w-3.5 h-3.5" /> PPKH</button>
                    <button onClick={() => setFilterCategory('PKTMKH')} className={`flex-1 md:flex-none px-5 py-1.5 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 text-[13px] ${filterCategory === 'PKTMKH' ? 'bg-white text-green-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}><Leaf className="w-3.5 h-3.5" /> PKTMKH</button>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input type="text" placeholder="Cari nama unit perusahaan..." className="w-full pl-10 pr-4 py-2 text-[13px] bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredCompanies.flatMap(company => {
                    const tasks = obligationsData[company.id] || [];
                    return tasks.map((task, idx) => {
                      const luasSK = Number(task.luas) || 1; 
                      const totals = getTaskTotals(task);
                      const pctRKP = Math.min(100, (totals.luas_rkp / luasSK) * 100);
                      const pctTanam = Math.min(100, (totals.realisasi_tanam / luasSK) * 100);
                      const pctST = Math.min(100, (totals.luas_serah_terima / luasSK) * 100);

                      return (
                        <div key={`${company.id}-${task.id || idx}`} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                              <p className="font-bold text-gray-900 text-lg mb-1">{company.name}</p>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{task.task}</p>
                            </div>
                            <div className="text-right">
                               <span className={`px-2.5 py-1 rounded border text-[11px] font-bold uppercase mb-2 inline-block ${getStatusColor(task.status || company.status)}`}>{task.status || company.status}</span>
                               <p className="text-[12px] font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">SK: {luasSK.toLocaleString('id-ID')} Ha</p>
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-gray-700">RKP <span className="text-gray-500">({totals.luas_rkp} Ha)</span></span>
                                <span className="text-blue-700">{pctRKP.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${pctRKP}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-gray-700">Tanam <span className="text-gray-500">({totals.realisasi_tanam} Ha)</span></span>
                                <span className="text-green-700">{pctTanam.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-green-600 h-full transition-all duration-1000" style={{ width: `${pctTanam}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-gray-700">Serah Terima <span className="text-gray-500">({totals.luas_serah_terima} Ha)</span></span>
                                <span className="text-orange-700">{pctST.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${pctST}%` }}></div>
                              </div>
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

// Fungsi bantu cetak mandiri
function printReport(title, subtitle, headers, dataRows) {
  const printWindow = window.open('', '_blank');
  const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const htmlContent = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #f4f4f4; }
          .footer { margin-top: 40px; text-align: right; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>BPDAS KAHAYAN</h2>
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${dataRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <div class="footer">
          <p>Dicetak pada: ${currentDate}</p>
          <br><br><br>
          <p>( ........................................ )</p>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
}
