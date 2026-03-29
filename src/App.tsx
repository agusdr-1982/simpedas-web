// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sprout, CheckCircle, Search, Leaf, BarChart3, Map, FileText, Activity, 
  Database, Edit3, Save, PlusCircle, X, ChevronRight, Mountain, 
  LayoutDashboard, PieChart, TrendingUp, Layers, Download, Menu, Bell, 
  Upload, ChevronLeft, Paperclip, Eye, Cloud, DatabaseZap, Lock, User, Mail, ArrowLeft,
  Users, ShieldAlert, CheckSquare, XSquare, Printer
} from 'lucide-react';

// ==========================================
// KONFIGURASI FIREBASE CLOUD (RESMI)
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, writeBatch } from 'firebase/firestore';

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

// Data kosong untuk Production
const INITIAL_USERS = [
  { id: 'u1', name: 'Superadmin BPDAS', email: 'admin@bpdas.go.id', instance: 'Internal BPDAS', role: 'Superadmin', status: 'Active' },
];

export default function App() {
  const [authView, setAuthView] = useState('landing');
  
  // STATE BARU UNTUK FORM LOGIN
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
  const [isDbReady, setIsDbReady] = useState(false);
  
  const [companiesData, setCompaniesData] = useState([]);
  const [obligationsData, setObligationsData] = useState({});
  const [usersData, setUsersData] = useState(INITIAL_USERS);

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
  // EFFECT: AUTENTIKASI FIREBASE KETAT
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // KODE BARU: Blokir sisa-sisa login anonim (bypass) dari memori browser Bapak
        if (currentUser.isAnonymous) {
          signOut(auth);
          setUser(null);
          if (authView === 'app') setAuthView('landing');
        } else {
          setUser(currentUser);
          setAuthView('app'); // Langsung masuk aplikasi jika terdeteksi login resmi
        }
      } else {
        setUser(null);
        // Jika tidak ada user, pastikan berada di layar pendaftaran/login
        if (authView === 'app') setAuthView('landing'); 
      }
    });
    return () => unsubscribe();
  }, [authView]);

  // ==========================================
  // EFFECT: SINKRONISASI FIRESTORE DATABASE
  // ==========================================
  useEffect(() => {
    if (!user) {
       setIsDbReady(true);
       return;
    }
    const companiesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'companies');
    const obligationsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'obligations');

    const unsubCompanies = onSnapshot(companiesRef, (snap) => {
      const comps = [];
      snap.forEach(d => comps.push(d.data()));
      setCompaniesData(comps);
      setIsDbReady(true);
    });

    const unsubObligations = onSnapshot(obligationsRef, (snap) => {
      const obs = {};
      snap.forEach(d => { obs[d.id] = d.data().tasks; });
      setObligationsData(obs);
    });

    return () => { unsubCompanies(); unsubObligations(); };
  }, [user]);

  // ==========================================
  // FUNGSI LOGIN RESMI
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      console.error(err);
      setLoginError('Email atau kata sandi salah / tidak ditemukan!');
    }
  };

  // ==========================================
  // FUNGSI LOGOUT RESMI
  // ==========================================
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthView('landing');
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Gagal Logout", err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, registeredEmail, registeredPassword);
      const newUser = { id: Date.now().toString(), name: registeredName, email: registeredEmail, instance: registeredInstance, role: 'User', status: 'Pending' };
      setUsersData(prev => [newUser, ...prev]);
      setAuthView('pending');
    } catch(err) {
      alert("Gagal mendaftar. Email mungkin sudah digunakan atau password terlalu pendek (min. 6 karakter).");
    }
  };

  const handleApproveUser = (id) => {
    setUsersData(prev => prev.map(u => u.id === id ? { ...u, status: 'Active' } : u));
    setDownloadToast('Akun Pengguna Berhasil Disetujui!');
    setTimeout(() => setDownloadToast(''), 3000);
  };

  const handleRejectUser = (id) => {
    setUsersData(prev => prev.filter(u => u.id !== id));
    setDownloadToast('Akun Pengguna Telah Ditolak/Dihapus.');
    setTimeout(() => setDownloadToast(''), 3000);
  };

  const getTaskTotals = (task) => {
    const luas_rkp = (task.riwayat_rkp || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const realisasi_tanam = (task.riwayat_tanam || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const luas_serah_terima = (task.riwayat_serah_terima || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    return { luas_rkp, realisasi_tanam, luas_serah_terima };
  };

  const handleEditSelect = (company) => {
    setSelectedCompany(company);
    setEditFormData({ isNew: false, company: { ...company }, tasks: obligationsData[company.id] ? JSON.parse(JSON.stringify(obligationsData[company.id])) : [] });
    setShowSaveSuccess(false);
  };

  const handleAddCompany = () => {
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

  const handleSimulateDownload = (fileName) => { setDownloadToast(`Mengunduh dokumen: ${fileName}`); setTimeout(() => setDownloadToast(''), 3500); };
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
      const compRef = doc(db, 'artifacts', appId, 'users', user.uid, 'companies', compId);
      const obsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'obligations', compId);
      await setDoc(compRef, editFormData.company);
      await setDoc(obsRef, { tasks: editFormData.tasks });
      setEditFormData((prev) => ({ ...prev, isNew: false }));
      setSelectedCompany(editFormData.company);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data ke server.");
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
    link.setAttribute("href", url); link.setAttribute("download", `Data_Pemenuhan_Kewajiban_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getStats = (cat) => {
    const data = cat === 'Semua' ? companiesData : companiesData.filter((c) => c.category === cat);
    return { total: data.length, tertib: data.filter((c) => c.status === 'Tertib').length, sp1: data.filter((c) => c.status === 'SP1').length, sp2: data.filter((c) => c.status === 'SP2').length, sp3: data.filter((c) => c.status === 'SP3').length };
  };

  const entityCounts = useMemo(() => {
    let ppkh = 0; let pktmkh = 0;
    companiesData.forEach((c) => {
      if (dashboardCategory === 'Semua' || c.category === dashboardCategory) { if (c.category === 'PPKH') ppkh++; if (c.category === 'PKTMKH') pktmkh++; }
    });
    return { ppkh, pktmkh };
  }, [dashboardCategory, companiesData]);

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
          } else if (currentStatus === 'SP2' && latestTanamYear < currentYear - 1) { alerts.push({ id: `${c.id}-${task.id}-sp3`, company: c.name, type: 'SP3', message: `PERINGATAN KERAS! Status SP2 tanpa progres. Rekomendasi naik ke SP3 (Pencabutan Izin).` }); }
        }
      });
    });
    return alerts;
  }, [companiesData, obligationsData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Tertib': return 'bg-green-100 text-green-800 border-green-200'; case 'SP1': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SP2': return 'bg-orange-100 text-orange-800 border-orange-200'; case 'SP3': return 'bg-red-100 text-red-800 border-red-200';
      case 'Active': return 'bg-green-100 text-green-800 border-green-200'; case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; 
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const printReport = (title, subtitle, headers, dataRows) => {
    const printWindow = window.open('', '_blank'); const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const htmlContent = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Cetak Laporan - ${title}</title><style>body { font-family: 'Tahoma', sans-serif; color: #000; margin: 0; padding: 20px; font-size: 12px; } .header-kop { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px; } .header-kop h1 { font-size: 16px; margin: 0; font-weight: bold; text-transform: uppercase; } .header-kop h2 { font-size: 18px; margin: 5px 0; font-weight: bold; text-transform: uppercase; } .header-kop p { font-size: 12px; margin: 0; } .title-section { text-align: center; margin-bottom: 20px; } .title-section h3 { font-size: 14px; margin: 0; text-decoration: underline; font-weight: bold; text-transform: uppercase; } .title-section p { font-size: 12px; margin: 5px 0 0 0; } table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 11px; } th, td { border: 1px solid #000; padding: 6px; text-align: left; } th { background-color: #f2f2f2; text-align: center; font-weight: bold; vertical-align: middle; } .text-center { text-align: center; } .text-right { text-align: right; } .footer-ttd { width: 100%; margin-top: 40px; display: flex; justify-content: flex-end; } .signature-box { text-align: center; width: 250px; float: right; margin-right: 50px; } .signature-box p { margin: 0; } .signature-space { height: 70px; } .signature-name { text-decoration: underline; font-weight: bold; } @media print { @page { size: A4 landscape; margin: 15mm; } body { -webkit-print-color-adjust: exact; } }</style></head><body><div class="header-kop"><h1>KEMENTERIAN KEHUTANAN</h1><h1>DIREKTORAT JENDERAL PENGELOLAAN DAERAH ALIRAN SUNGAI DAN REHABILITASI HUTAN</h1><h2>BALAI PENGELOLAAN DAERAH ALIRAN SUNGAI KAHAYAN</h2><p>Jalan RTA. Milono Km 2,5 Kota Palangkaraya, Kalimantan Tengah</p></div><div class="title-section"><h3>${title}</h3><p>${subtitle}</p></div><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${dataRows.map(row => `<tr>${row.map((cell, idx) => { const isNum = !isNaN(cell) && cell !== '' && cell !== '-'; const alignClass = isNum ? 'text-right' : (idx === 0 || idx === 1 || idx === row.length-1 ? 'text-center' : ''); return `<td class="${alignClass}">${cell}</td>`; }).join('')}</tr>`).join('')}</tbody></table><div class="footer-ttd"><div class="signature-box"><p>Palangka Raya, ${currentDate}</p><p>Kepala BPDAS Kahayan,</p><div class="signature-space"></div><p class="signature-name">( .................................................... )</p><p>NIP. ...............................................</p></div></div></body></html>`;
    printWindow.document.write(htmlContent); printWindow.document.close(); printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const dashboardDetailCompanies = useMemo(() => {
    if (!selectedDashboardStatus) return [];
    return companiesData.filter((c) => { const matchesCat = dashboardCategory === 'Semua' || c.category === dashboardCategory; const matchesStat = selectedDashboardStatus === 'Semua' ? true : c.status === selectedDashboardStatus; return matchesCat && matchesStat; });
  }, [companiesData, dashboardCategory, selectedDashboardStatus]);

  const dashboardPlantStatusCompanies = useMemo(() => {
    if (!selectedPlantStatus) return [];
    return companiesData.filter((c) => {
      const matchesCat = dashboardCategory === 'Semua' || c.category === dashboardCategory;
      if (!matchesCat) return false;
      const tasks = obligationsData[c.id] || [];
      return tasks.some(task => { if (!task.riwayat_tanam) return false; return task.riwayat_tanam.some(r => { const status = r.status || 'P0'; return status === selectedPlantStatus && Number(r.luas) > 0; }); });
    });
  }, [companiesData, dashboardCategory, obligationsData, selectedPlantStatus]);

  const exportDashboardCSV = () => {
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Luas SK (Ha)", "Realisasi Tanam (Ha)", "Realisasi P0 (Ha)", "Realisasi P1 (Ha)", "Realisasi P2 (Ha)", "Serah Terima (Ha)", "Status"];
    let csvContent = headers.join(",") + "\n";
    dashboardDetailCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      if (tasks.length === 0) { csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","-","-","0","0","0","0","0","0","${c.status}"\n`;
      } else { tasks.forEach(task => { const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0; let p0 = 0, p1 = 0, p2 = 0; if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const l = Number(r.luas) || 0; if (r.status === 'P0') p0 += l; else if (r.status === 'P1') p1 += l; else if (r.status === 'P2') p2 += l; else p0 += l; }); } csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${luasSK}","${totals.realisasi_tanam}","${p0}","${p1}","${p2}","${totals.luas_serah_terima}","${task.status || c.status}"\n`; }); }
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); const safeStatus = selectedDashboardStatus ? selectedDashboardStatus.replace(/\s+/g, '_') : 'Semua'; link.setAttribute("download", `Daftar_Perusahaan_${safeStatus}_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const printDashboardStatus = () => {
    const title = "LAPORAN STATUS PEMENUHAN KEWAJIBAN PPKH DAN PKTMKH"; const safeStatus = selectedDashboardStatus === 'Semua' ? 'Seluruh Unit Aktif' : (selectedDashboardStatus === 'Tertib' ? 'Status Tertib' : `Peringatan ${selectedDashboardStatus}`); const subtitle = `Filter Status: ${safeStatus} | Total Unit: ${dashboardDetailCompanies.length}`;
    const headers = ["No", "Nama Perusahaan", "Kategori", "No. SK Penetapan", "Luas SK (Ha)", "Tanam Total", "Luas P0", "Luas P1", "Luas P2", "Serah Terima", "Status"];
    let rows = []; let counter = 1;
    dashboardDetailCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      if (tasks.length === 0) { rows.push([counter++, c.name, c.category, '-', '0', '0', '0', '0', '0', '0', c.status]);
      } else { tasks.forEach(task => { const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0; let p0 = 0, p1 = 0, p2 = 0; if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const l = Number(r.luas) || 0; if (r.status === 'P0') p0 += l; else if (r.status === 'P1') p1 += l; else if (r.status === 'P2') p2 += l; else p0 += l; }); } rows.push([ counter++, c.name, c.category, task.sk_lokasi || '-', luasSK.toLocaleString('id-ID'), totals.realisasi_tanam.toLocaleString('id-ID'), p0.toLocaleString('id-ID'), p1.toLocaleString('id-ID'), p2.toLocaleString('id-ID'), totals.luas_serah_terima.toLocaleString('id-ID'), task.status || c.status ]); }); }
    });
    printReport(title, subtitle, headers, rows);
  };

  const exportPlantStatusCSV = () => {
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Luas SK (Ha)", "Realisasi Tanam Total (Ha)", `Realisasi Khusus ${selectedPlantStatus} (Ha)`, "Status"]; let csvContent = headers.join(",") + "\n";
    dashboardPlantStatusCompanies.forEach(c => { const tasks = obligationsData[c.id] || []; tasks.forEach(task => { let specificArea = 0; if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const s = r.status || 'P0'; if (s === selectedPlantStatus) specificArea += (Number(r.luas) || 0); }); } if (specificArea > 0) { const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0; csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${luasSK}","${totals.realisasi_tanam}","${specificArea}","${task.status || c.status}"\n`; } }); });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", `Daftar_Perusahaan_${selectedPlantStatus}_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const printPlantStatus = () => {
    const title = "LAPORAN RINCIAN STATUS PEMELIHARAAN TANAMAN"; const statusName = selectedPlantStatus === 'P0' ? 'Tanaman Baru (P0)' : (selectedPlantStatus === 'P1' ? 'Pemeliharaan 1 (P1)' : 'Pemeliharaan 2+ (P2)'); const subtitle = `Filter Status: ${statusName} | Total Unit: ${dashboardPlantStatusCompanies.length}`;
    const headers = ["No", "Nama Perusahaan", "Kategori", "No. SK Penetapan", "Luas SK (Ha)", "Tanam Total (Ha)", `Luas ${selectedPlantStatus} (Ha)`, "Status Kepatuhan"];
    let rows = []; let counter = 1;
    dashboardPlantStatusCompanies.forEach(c => { const tasks = obligationsData[c.id] || []; tasks.forEach(task => { let specificArea = 0; if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const s = r.status || 'P0'; if (s === selectedPlantStatus) specificArea += (Number(r.luas) || 0); }); } if (specificArea > 0) { const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0; rows.push([ counter++, c.name, c.category, task.sk_lokasi || '-', luasSK.toLocaleString('id-ID'), totals.realisasi_tanam.toLocaleString('id-ID'), specificArea.toLocaleString('id-ID'), task.status || c.status ]); } }); });
    printReport(title, subtitle, headers, rows);
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
            <button onClick={() => setAuthView('login')} className="px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] flex items-center justify-center gap-2"><Lock className="w-5 h-5" /> Masuk Aplikasi</button>
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
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div><div className="absolute inset-0 bg-green-950/90"></div>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="bg-green-800 p-6 text-center relative">
            <button onClick={() => setAuthView('landing')} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-green-200 hover:text-white hover:bg-green-700 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-3 drop-shadow-md">
               <LogoBPDAS className="w-full h-full" />
            </div>

            <h2 className="text-xl font-bold text-white uppercase tracking-wider">{authView === 'login' ? 'Login Portal' : 'Registrasi Akun'}</h2>
          </div>
          <div className="p-8">
            {/* Peringatan Error Login */}
            {loginError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <ShieldAlert className="w-5 h-5" /> {loginError}
              </div>
            )}

            {authView === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Email Terdaftar</label><div className="relative"><Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" /><input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50" placeholder="admin@bpdas.go.id" /></div></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-2">Kata Sandi</label><div className="relative"><Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" /><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50" placeholder="••••••••" /></div></div>
                <button type="submit" className="w-full py-3 mt-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Masuk Sekarang</button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Nama Lengkap</label><div className="relative"><User className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="text" required onChange={(e) => setRegisteredName(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="Nama Anda" /></div></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Asal Instansi/Perusahaan</label><div className="relative"><Database className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="text" required onChange={(e) => setRegisteredInstance(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="PT. Contoh Makmur" /></div></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Email Kantor</label><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="email" required onChange={(e) => setRegisteredEmail(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="email@perusahaan.com" /></div></div>
                <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Kata Sandi (Min 6 Karakter)</label><div className="relative"><Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><input type="password" required minLength={6} onChange={(e) => setRegisteredPassword(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-[13px]" placeholder="Buat kata sandi" /></div></div>
                <button type="submit" className="w-full py-3 mt-4 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg transition-colors shadow-md">Ajukan Pendaftaran</button>
              </form>
            )}
            <p className="text-center text-xs text-gray-500 mt-6 font-semibold">{authView === 'login' ? "Belum punya akun?" : "Sudah memiliki akun?"} <button onClick={() => {setAuthView(authView === 'login' ? 'register' : 'login'); setLoginError('');}} className="ml-1 text-green-700 hover:underline focus:outline-none">{authView === 'login' ? "Daftar di sini" : "Login di sini"}</button></p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: HALAMAN MENUNGGU PERSETUJUAN ADMIN
  // ==========================================
  if (authView === 'pending') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
         <div className="bg-white p-10 rounded-2xl shadow-lg max-w-lg text-center border border-gray-200 animate-in zoom-in-95">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6"><Activity className="w-10 h-10 text-yellow-600 animate-pulse" /></div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">Pendaftaran Berhasil!</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">Halo <strong>{registeredName || 'Pengguna'}</strong>, akun Anda sedang dalam proses verifikasi. Untuk alasan keamanan, <strong>data Dashboard hanya akan tampil setelah disetujui oleh Admin BPDAS Kahayan.</strong><br/><br/>Harap cek email Anda secara berkala.</p>
            <button onClick={handleLogout} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">Kembali ke Halaman Depan</button>
         </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: APLIKASI UTAMA (DASHBOARD & ADMIN PANEL)
  // ==========================================
  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden text-[14px] animate-in fade-in duration-500">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-green-900 flex flex-col shadow-xl shrink-0 z-20 text-white relative transition-all duration-300 ease-in-out`}>
        <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-green-800 shrink-0 group cursor-default h-[140px]">
          
          <div className={`${isSidebarOpen ? 'w-20 h-20 mb-3' : 'w-10 h-10'} flex items-center justify-center drop-shadow-md transition-all duration-300`}>
             <LogoBPDAS className="w-full h-full" />
          </div>

          {isSidebarOpen && (<h1 className="font-bold text-[16px] text-white tracking-[0.1em] text-center whitespace-nowrap overflow-hidden opacity-100 transition-opacity duration-300" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}>BPDAS KAHAYAN</h1>)}
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {isSidebarOpen ? (<p className="px-3 text-[11px] font-semibold text-green-300 uppercase tracking-widest mb-3 mt-2 whitespace-nowrap">Menu Utama</p>) : (<div className="h-px bg-green-700 w-8 mx-auto my-4"></div>)}
          
          <button onClick={() => { setActiveTab('dashboard'); setSelectedCompany(null); setEditFormData(null); }} title="Dashboard" className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'dashboard' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-md font-semibold' : 'text-green-100 hover:bg-green-800/50 hover:text-white'}`}>
             <LayoutDashboard className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> 
             {isSidebarOpen && <span className="whitespace-nowrap">Dashboard</span>}
          </button>
          
          <button onClick={() => { setActiveTab('companies'); setSelectedCompany(null); setEditFormData(null); }} title="Manajemen Data" className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'companies' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-md font-semibold' : 'text-green-100 hover:bg-green-800/50 hover:text-white'}`}>
             <Database className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> 
             {isSidebarOpen && <span className="whitespace-nowrap">Manajemen Data</span>}
          </button>

          {isSidebarOpen ? (<p className="px-3 text-[11px] font-semibold text-green-300 uppercase tracking-widest mb-3 mt-6 whitespace-nowrap">Analitik</p>) : (<div className="h-px bg-green-700 w-8 mx-auto my-6"></div>)}
          
          <button onClick={() => { setActiveTab('visualization'); setSelectedCompany(null); setEditFormData(null); }} title="Progres per Unit" className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'visualization' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-md font-semibold' : 'text-green-100 hover:bg-green-800/50 hover:text-white'}`}>
             <BarChart3 className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> 
             {isSidebarOpen && <span className="whitespace-nowrap">Progres per Unit</span>}
          </button>

          {isSidebarOpen ? (<p className="px-3 text-[11px] font-semibold text-green-300 uppercase tracking-widest mb-3 mt-6 whitespace-nowrap">Sistem</p>) : (<div className="h-px bg-green-700 w-8 mx-auto my-6"></div>)}
          
          <button onClick={() => { setActiveTab('users'); setSelectedCompany(null); setEditFormData(null); }} title="Manajemen Pengguna" className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'users' ? 'bg-green-800 text-white border-l-4 border-green-400 shadow-md font-semibold' : 'text-green-100 hover:bg-green-800/50 hover:text-white'}`}>
             <Users className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : ''}`} /> 
             {isSidebarOpen && <span className="whitespace-nowrap">Manajemen Pengguna</span>}
             {isSidebarOpen && usersData.filter(u => u.status === 'Pending').length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                   {usersData.filter(u => u.status === 'Pending').length}
                </span>
             )}
          </button>

        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-100">
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-6 py-4 shrink-0 z-10 shadow-sm transition-all">
          <div className="flex items-center gap-5">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-green-700 transition-colors focus:outline-none">
               <Menu className="w-6 h-6" />
             </button>
             <div className="flex flex-col">
                <h2 className="text-[16px] md:text-[19px] font-black text-gray-800 uppercase tracking-tight leading-tight hidden sm:block">
                  Sistem Pengawasan PPKH & PKTMKH
                </h2>
                <h2 className="text-[15px] font-black text-gray-800 uppercase tracking-tight leading-tight sm:hidden">
                  Pengawasan PPKH
                </h2>
                <p className="text-[11px] md:text-[12px] font-bold text-green-700 tracking-widest mt-0.5 flex items-center gap-1.5">
                  BPDAS KAHAYAN <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[9px] uppercase border border-green-200"><Lock className="w-2.5 h-2.5 inline"/> Login Resmi v2.0</span>
                </p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {downloadToast && (
                 <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-[13px] font-bold border border-blue-300 flex items-center gap-2 shadow-sm animate-pulse">
                    <CheckSquare className="w-4 h-4" /> {downloadToast}
                 </span>
             )}
             
             <div className="relative">
               <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 relative text-gray-400 hover:text-green-600 transition-colors focus:outline-none hidden sm:block">
                  <Bell className="w-[22px] h-[22px]" />
                  {(usersData.filter(u => u.status === 'Pending').length > 0 || smartAlerts.length > 0) && (
                     <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                     </span>
                  )}
               </button>

               {isNotifOpen && (
                 <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                   <div className="bg-red-50 p-3 border-b border-red-100 flex justify-between items-center">
                     <h4 className="font-bold text-red-800 text-[13px] flex items-center gap-1.5"><ShieldAlert className="w-4 h-4"/> Peringatan Dini (Smart EWS)</h4>
                     <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{smartAlerts.length}</span>
                   </div>
                   <div className="max-h-80 overflow-y-auto">
                     {smartAlerts.length > 0 ? smartAlerts.map(alert => (
                       <div key={alert.id} className="p-3 border-b border-gray-50 hover:bg-red-50/50 transition-colors cursor-pointer" onClick={() => { setActiveTab('companies'); setSearchTerm(alert.company); setIsNotifOpen(false); }}>
                         <div className="flex justify-between items-start mb-1">
                           <p className="font-bold text-[12px] text-gray-800 truncate pr-2">{alert.company}</p>
                           <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase whitespace-nowrap ${alert.type === 'SP3' ? 'bg-red-100 text-red-700 border-red-200' : (alert.type === 'SP2' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200')}`}>
                             Potensi {alert.type}
                           </span>
                         </div>
                         <p className="text-[11px] text-gray-600 leading-tight">{alert.message}</p>
                       </div>
                     )) : (
                       <div className="p-6 text-center flex flex-col items-center">
                         <CheckCircle className="w-8 h-8 text-green-400 mb-2 opacity-50"/>
                         <p className="text-gray-500 font-semibold text-[12px]">Kondisi Terkendali</p>
                         <p className="text-gray-400 text-[11px]">Tidak ada peringatan evaluasi semester saat ini.</p>
                       </div>
                     )}
                   </div>
                 </div>
               )}
             </div>
             
             <div className="flex items-center gap-3 pl-4 border-l border-gray-200 cursor-pointer group relative">
               <div className="hidden md:flex flex-col text-right">
                 <span className="text-[13px] font-bold text-gray-800 leading-none truncate max-w-[120px]">{user?.email || 'Admin'}</span>
                 <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider mt-1 flex items-center gap-1 justify-end"><ShieldAlert className="w-3 h-3"/> Akses Penuh</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center font-bold text-green-800 shadow-sm group-hover:bg-green-200 group-hover:border-green-400 transition-colors">
                 {(user?.email || 'A').substring(0,1).toUpperCase()}
               </div>
               
               {/* PERBAIKAN: Menambahkan jembatan padding (pt-2) agar menu tidak hilang saat di-hover */}
               <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                  <div className="bg-white rounded-md shadow-xl border border-gray-200 py-1">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4"/> Keluar / Logout
                    </button>
                  </div>
               </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="main-scroll-area">
          
          {/* ================= PANEL ADMIN: MANAJEMEN PENGGUNA ================= */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
               
               <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-2 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-50 rounded-md text-purple-700 border border-purple-100"><ShieldAlert className="w-6 h-6" /></div>
                     <div>
                       <h3 className="font-bold text-gray-900 tracking-tight text-lg">Manajemen Hak Akses Pengguna</h3>
                       <p className="text-xs text-gray-500">Setujui atau tolak permintaan akun staf / perwakilan perusahaan untuk mengakses sistem.</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center min-w-[100px]">
                        <p className="text-xl font-black text-gray-800">{usersData.length}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Total Akun</p>
                     </div>
                     <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center min-w-[100px]">
                        <p className="text-xl font-black text-yellow-700">{usersData.filter(u => u.status === 'Pending').length}</p>
                        <p className="text-[10px] font-bold text-yellow-600 uppercase mt-1">Menunggu</p>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-lg border border-gray-200 shadow overflow-hidden">
                  <div className="overflow-auto w-full">
                     <table className="w-full text-left whitespace-nowrap text-[14px]">
                        <thead className="bg-gray-100 border-b border-gray-300">
                           <tr>
                              <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide">Identitas Pengguna</th>
                              <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide">Asal Instansi</th>
                              <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Hak Akses</th>
                              <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Status</th>
                              <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Tindakan Admin</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {usersData.map((usr) => (
                              <tr key={usr.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{usr.name}</p>
                                    <p className="text-[12px] text-gray-500 mt-0.5">{usr.email}</p>
                                 </td>
                                 <td className="px-6 py-4 font-semibold text-gray-700">{usr.instance}</td>
                                 <td className="px-6 py-4 text-center">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${usr.role === 'Superadmin' ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                       {usr.role}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-1 rounded text-[11px] font-bold border uppercase ${getStatusColor(usr.status)}`}>
                                       {usr.status === 'Pending' ? 'Menunggu Persetujuan' : 'Aktif'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    {usr.status === 'Pending' ? (
                                       <div className="flex justify-end gap-2">
                                          <button onClick={() => handleApproveUser(usr.id)} className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 hover:border-green-600 px-3 py-1.5 rounded text-[11px] font-bold transition-colors shadow-sm">
                                             <CheckSquare className="w-3.5 h-3.5" /> Setujui
                                          </button>
                                          <button onClick={() => handleRejectUser(usr.id)} className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 px-3 py-1.5 rounded text-[11px] font-bold transition-colors shadow-sm">
                                             <XSquare className="w-3.5 h-3.5" /> Tolak
                                          </button>
                                       </div>
                                    ) : (
                                       <span className="text-[12px] font-semibold text-gray-400 italic">Disetujui</span>
                                    )}
                                 </td>
                              </tr>
                           ))}
                           {usersData.length === 0 && (
                              <tr>
                                 <td colSpan="5" className="text-center py-10 text-gray-400">Tidak ada data pengguna terdaftar.</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {/* ================= DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 pb-10 animate-in fade-in duration-500">
              
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex bg-white p-1 rounded-md border border-gray-300 w-fit shadow-sm">
                  <button onClick={() => setDashboardCategory('Semua')} className={`px-6 py-2 rounded-md font-semibold transition-all ${dashboardCategory === 'Semua' ? 'bg-gray-700 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Semua</button>
                  <button onClick={() => setDashboardCategory('PPKH')} className={`px-6 py-2 rounded-md font-semibold transition-all flex items-center gap-2 ${dashboardCategory === 'PPKH' ? 'bg-amber-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Mountain className="w-4 h-4" /> PPKH</button>
                  <button onClick={() => setDashboardCategory('PKTMKH')} className={`px-6 py-2 rounded-md font-semibold transition-all flex items-center gap-2 ${dashboardCategory === 'PKTMKH' ? 'bg-green-700 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Leaf className="w-4 h-4" /> PKTMKH</button>
                </div>
              </div>

              {/* SEBARAN LUAS PENETAPAN */}
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                   <div className="p-2 bg-amber-50 rounded-md text-amber-700 border border-amber-100"><Map className="w-5 h-5" /></div>
                   <h3 className="font-bold text-gray-900 tracking-tight text-lg">Luas Penetapan</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-gray-50 p-5 rounded-md border border-gray-200 hover:border-green-300 transition-colors flex justify-between items-center shadow-sm">
                      <div>
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Rehabilitasi DAS</p>
                         <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-green-700">{areaStats.totalDAS.toLocaleString('id-ID')}</span><span className="text-xs font-semibold text-gray-400 uppercase">Ha</span>
                         </div>
                      </div>
                      <div className="text-center bg-white p-2.5 rounded-md border border-gray-200 shadow-sm min-w-[60px]">
                         <p className="text-lg font-bold text-gray-800 leading-none">{areaStats.countDAS}</p>
                         <p className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Unit</p>
                      </div>
                   </div>

                   {(dashboardCategory === 'Semua' || dashboardCategory === 'PPKH') && (
                     <div className="bg-gray-50 p-5 rounded-md border border-gray-200 hover:border-amber-300 transition-colors flex justify-between items-center shadow-sm">
                        <div>
                           <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reklamasi Hutan</p>
                           <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-amber-600">{areaStats.totalReklamasi.toLocaleString('id-ID')}</span><span className="text-xs font-semibold text-gray-400 uppercase">Ha</span>
                           </div>
                        </div>
                        <div className="text-center bg-white p-2.5 rounded-md border border-gray-200 shadow-sm min-w-[60px]">
                           <p className="text-lg font-bold text-gray-800 leading-none">{areaStats.countReklamasi}</p>
                           <p className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Unit</p>
                        </div>
                     </div>
                   )}

                   {(dashboardCategory === 'Semua' || dashboardCategory === 'PKTMKH') && (
                     <div className="bg-gray-50 p-5 rounded-md border border-gray-200 hover:border-green-300 transition-colors flex justify-between items-center shadow-sm">
                        <div>
                           <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Reboisasi Areal Pengganti</p>
                           <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-green-700">{areaStats.totalReboisasi.toLocaleString('id-ID')}</span><span className="text-xs font-semibold text-gray-400 uppercase">Ha</span>
                           </div>
                        </div>
                        <div className="text-center bg-white p-2.5 rounded-md border border-gray-200 shadow-sm min-w-[60px]">
                           <p className="text-lg font-bold text-gray-800 leading-none">{areaStats.countReboisasi}</p>
                           <p className="text-[10px] font-semibold text-gray-500 uppercase mt-1">Unit</p>
                        </div>
                     </div>
                   )}
                </div>
              </div>

              {/* REKAPITULASI PROGRES GLOBAL */}
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                   <div className="p-2 bg-blue-50 rounded-md text-blue-700 border border-blue-100"><PieChart className="w-5 h-5" /></div>
                   <div>
                     <h3 className="font-bold text-gray-900 tracking-tight text-lg">Rekapitulasi Progres Pemenuhan Kewajiban</h3>
                     <p className="text-xs text-gray-500">Persentase penyelesaian RKP, Tanam, dan Serah Terima dari seluruh {entityCounts.ppkh + entityCounts.pktmkh} unit aktif.</p>
                   </div>
                </div>

                <div className="space-y-6 max-w-4xl">
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-700">Total Penyusunan RKP <span className="text-gray-400 font-semibold ml-1">({globalProgress.sumRKP.toLocaleString('id-ID')} / {globalProgress.sumSK.toLocaleString('id-ID')} Ha)</span></span>
                      <span className="text-blue-700">{globalProgress.pctRKP.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${globalProgress.pctRKP}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-100 rounded-md p-4">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-700">Total Realisasi Tanam <span className="text-gray-400 font-semibold ml-1">({globalProgress.sumTanam.toLocaleString('id-ID')} / {globalProgress.sumSK.toLocaleString('id-ID')} Ha)</span></span>
                      <span className="text-green-700">{globalProgress.pctTanam.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-green-600 h-full rounded-full transition-all duration-1000" style={{ width: `${globalProgress.pctTanam}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-100 rounded-md p-4">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-700">Total Serah Terima <span className="text-gray-400 font-semibold ml-1">({globalProgress.sumST.toLocaleString('id-ID')} / {globalProgress.sumSK.toLocaleString('id-ID')} Ha)</span></span>
                      <span className="text-orange-700">{globalProgress.pctST.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${globalProgress.pctST}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TREN TAHUNAN */}
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                   <div className="p-2 bg-purple-50 rounded-md text-purple-700 border border-purple-100"><TrendingUp className="w-5 h-5" /></div>
                   <div>
                     <h3 className="font-bold text-gray-900 tracking-tight text-lg">Tren Pemenuhan Kewajiban Tahunan</h3>
                     <p className="text-xs text-gray-500">Visualisasi jumlah luasan lahan yang berhasil direalisasikan dari tahun ke tahun.</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="bg-gray-50 border border-gray-200 rounded-md p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-4 h-4 text-blue-600"/>
                        <h4 className="font-bold text-gray-800 text-[13px]">Penyusunan RKP</h4>
                      </div>
                      <div className="h-40 flex items-end gap-2 pt-4 border-b border-gray-300">
                        {yearlyProgress.yearsList.map(year => {
                          const val = yearlyProgress.data.rkp[year] || 0;
                          const heightPct = yearlyProgress.maxRKP > 0 ? (val / yearlyProgress.maxRKP) * 100 : 0;
                          return (
                            <div key={`rkp-${year}`} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                              <span className={`text-[10px] font-bold text-blue-700 absolute -top-5 transition-opacity ${val > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{val.toLocaleString()}</span>
                              <div className="w-full bg-blue-100 rounded-t-sm relative flex items-end justify-center" style={{ height: '100%' }}>
                                 <div className="w-full bg-blue-600 rounded-t-sm transition-all duration-1000" style={{ height: `${heightPct}%` }}></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-2 mt-2">
                         {yearlyProgress.yearsList.map(year => (
                            <div key={`lbl-rkp-${year}`} className="flex-1 text-center text-[11px] font-semibold text-gray-500">{year}</div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-green-50 border border-green-200 rounded-md p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Sprout className="w-4 h-4 text-green-600"/>
                        <h4 className="font-bold text-gray-800 text-[13px]">Realisasi Penanaman</h4>
                      </div>
                      <div className="h-40 flex items-end gap-2 pt-4 border-b border-gray-300">
                        {yearlyProgress.yearsList.map(year => {
                          const val = yearlyProgress.data.tanam[year] || 0;
                          const heightPct = yearlyProgress.maxTanam > 0 ? (val / yearlyProgress.maxTanam) * 100 : 0;
                          return (
                            <div key={`tnm-${year}`} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                              <span className={`text-[10px] font-bold text-green-700 absolute -top-5 transition-opacity ${val > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{val.toLocaleString()}</span>
                              <div className="w-full bg-green-200 rounded-t-sm relative flex items-end justify-center" style={{ height: '100%' }}>
                                 <div className="w-full bg-green-600 rounded-t-sm transition-all duration-1000" style={{ height: `${heightPct}%` }}></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-2 mt-2">
                         {yearlyProgress.yearsList.map(year => (
                            <div key={`lbl-tnm-${year}`} className="flex-1 text-center text-[11px] font-semibold text-gray-500">{year}</div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-orange-50 border border-orange-200 rounded-md p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 text-orange-600"/>
                        <h4 className="font-bold text-gray-800 text-[13px]">Serah Terima</h4>
                      </div>
                      <div className="h-40 flex items-end gap-2 pt-4 border-b border-gray-300">
                        {yearlyProgress.yearsList.map(year => {
                          const val = yearlyProgress.data.st[year] || 0;
                          const heightPct = yearlyProgress.maxST > 0 ? (val / yearlyProgress.maxST) * 100 : 0;
                          return (
                            <div key={`st-${year}`} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                              <span className={`text-[10px] font-bold text-orange-700 absolute -top-5 transition-opacity ${val > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>{val.toLocaleString()}</span>
                              <div className="w-full bg-orange-200 rounded-t-sm relative flex items-end justify-center" style={{ height: '100%' }}>
                                 <div className="w-full bg-orange-500 rounded-t-sm transition-all duration-1000" style={{ height: `${heightPct}%` }}></div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-2 mt-2">
                         {yearlyProgress.yearsList.map(year => (
                            <div key={`lbl-st-${year}`} className="flex-1 text-center text-[11px] font-semibold text-gray-500">{year}</div>
                         ))}
                      </div>
                   </div>

                </div>
              </div>

              {/* KOMPOSISI STATUS TANAMAN */}
              <div className="bg-white rounded-lg border border-gray-200 shadow p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                   <div className="p-2 bg-teal-50 rounded-md text-teal-700 border border-teal-100"><Layers className="w-5 h-5" /></div>
                   <div>
                     <h3 className="font-bold text-gray-900 tracking-tight text-lg">Komposisi Umur & Status Tanaman</h3>
                     <p className="text-xs text-gray-500">Distribusi luasan lahan yang telah direalisasikan berdasarkan status tanaman.</p>
                   </div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="w-full relative pt-2">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      <span>Total Realisasi: {plantStatusStats.total.toLocaleString('id-ID')} Ha</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full h-6 flex rounded-full overflow-hidden shadow-inner bg-gray-100">
                      {plantStatusStats.pctP0 > 0 && (
                        <div className="h-full bg-sky-500 transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${plantStatusStats.pctP0}%` }} title={`P0: ${plantStatusStats.pctP0.toFixed(1)}%`}>
                           {plantStatusStats.pctP0 > 5 ? `${plantStatusStats.pctP0.toFixed(0)}%` : ''}
                        </div>
                      )}
                      {plantStatusStats.pctP1 > 0 && (
                        <div className="h-full bg-teal-500 transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${plantStatusStats.pctP1}%` }} title={`P1: ${plantStatusStats.pctP1.toFixed(1)}%`}>
                           {plantStatusStats.pctP1 > 5 ? `${plantStatusStats.pctP1.toFixed(0)}%` : ''}
                        </div>
                      )}
                      {plantStatusStats.pctP2 > 0 && (
                        <div className="h-full bg-emerald-700 transition-all duration-1000 flex items-center justify-center text-[10px] text-white font-bold" style={{ width: `${plantStatusStats.pctP2}%` }} title={`P2: ${plantStatusStats.pctP2.toFixed(1)}%`}>
                           {plantStatusStats.pctP2 > 5 ? `${plantStatusStats.pctP2.toFixed(0)}%` : ''}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] text-gray-500 mb-3 italic">Klik salah satu kartu di bawah ini untuk melihat detail perusahaan berdasarkan status tanaman.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div onClick={() => setSelectedPlantStatus(selectedPlantStatus === 'P0' ? null : 'P0')} className={`bg-sky-50 border p-4 rounded-md flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${selectedPlantStatus === 'P0' ? 'ring-2 ring-sky-400 border-sky-300' : 'border-sky-100'}`}>
                        <div className="w-3 h-12 bg-sky-500 rounded-full"></div>
                        <div>
                          <p className="text-xs font-bold text-sky-800 uppercase tracking-wide">Tanaman Baru (P0)</p>
                          <p className="text-2xl font-black text-sky-900 mt-0.5">{plantStatusStats.p0.toLocaleString('id-ID')} <span className="text-sm font-semibold text-sky-700">Ha</span></p>
                        </div>
                      </div>
                      <div onClick={() => setSelectedPlantStatus(selectedPlantStatus === 'P1' ? null : 'P1')} className={`bg-teal-50 border p-4 rounded-md flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${selectedPlantStatus === 'P1' ? 'ring-2 ring-teal-400 border-teal-300' : 'border-teal-100'}`}>
                        <div className="w-3 h-12 bg-teal-500 rounded-full"></div>
                        <div>
                          <p className="text-xs font-bold text-teal-800 uppercase tracking-wide">Pemeliharaan 1 (P1)</p>
                          <p className="text-2xl font-black text-teal-900 mt-0.5">{plantStatusStats.p1.toLocaleString('id-ID')} <span className="text-sm font-semibold text-teal-700">Ha</span></p>
                        </div>
                      </div>
                      <div onClick={() => setSelectedPlantStatus(selectedPlantStatus === 'P2' ? null : 'P2')} className={`bg-emerald-50 border p-4 rounded-md flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${selectedPlantStatus === 'P2' ? 'ring-2 ring-emerald-400 border-emerald-300' : 'border-emerald-100'}`}>
                        <div className="w-3 h-12 bg-emerald-700 rounded-full"></div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Pemeliharaan 2+ (P2)</p>
                          <p className="text-2xl font-black text-emerald-950 mt-0.5">{plantStatusStats.p2.toLocaleString('id-ID')} <span className="text-sm font-semibold text-emerald-800">Ha</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedPlantStatus && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mt-2 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 tracking-tight text-lg flex items-center gap-2">
                            <Layers className="w-5 h-5 text-teal-600" />
                            Daftar Perusahaan: Status {selectedPlantStatus === 'P0' ? 'Tanaman Baru (P0)' : (selectedPlantStatus === 'P1' ? 'Pemeliharaan 1 (P1)' : 'Pemeliharaan 2+ (P2)')}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Menampilkan unit yang telah merealisasikan penanaman dengan status {selectedPlantStatus} ({dashboardPlantStatusCompanies.length} Unit).</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={printPlantStatus} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-md text-[12px] transition-colors flex items-center gap-2 border border-gray-300 shadow-sm">
                            <Printer className="w-4 h-4" /> Cetak Laporan (PDF)
                          </button>
                          <button onClick={exportPlantStatusCSV} className="px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 font-bold rounded-md text-[12px] transition-colors flex items-center gap-2 border border-teal-200 shadow-sm">
                            <Download className="w-4 h-4" /> Export CSV
                          </button>
                          <button onClick={() => setSelectedPlantStatus(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Tutup Tabel">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-auto w-full border border-gray-200 rounded-lg max-h-[400px]">
                        <table className="w-full text-left whitespace-nowrap text-[13px]">
                          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide">Unit Perusahaan</th>
                              <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Tipe</th>
                              <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide">No. SK Penetapan</th>
                              <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Luas SK (Ha)</th>
                              <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Total Tanam (Ha)</th>
                              <th className="px-4 py-3 font-bold text-teal-700 uppercase text-xs tracking-wide text-right">Luas {selectedPlantStatus} (Ha)</th>
                              <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {dashboardPlantStatusCompanies.flatMap((c) => {
                              const tasks = obligationsData[c.id] || [];
                              
                              return tasks.map((taskData, idx) => {
                                let specificArea = 0;
                                if (taskData.riwayat_tanam) {
                                  taskData.riwayat_tanam.forEach(r => {
                                    const s = r.status || 'P0';
                                    if (s === selectedPlantStatus) specificArea += (Number(r.luas) || 0);
                                  });
                                }
                                if (specificArea === 0) return null;

                                const totals = getTaskTotals(taskData);
                                const luasSK = Number(taskData.luas) || 0;
                                const currentStatus = taskData.status || c.status;
                                
                                return (
                                  <tr key={`${c.id}-${taskData.id || idx}`} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                      <p className="font-bold text-gray-900">{c.name}</p>
                                      <p className="text-[11px] text-gray-500 mt-0.5">{c.sector} {tasks.length > 1 ? <span className="text-amber-600 font-semibold">• Kew. {idx + 1}</span> : ''}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                                        <span className="text-[10px] text-gray-500 font-semibold">{taskData.task === 'Rehabilitasi DAS' ? 'DAS' : taskData.task === 'Reklamasi Hutan' ? 'Reklamasi' : 'Reboisasi'}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3"><span className="font-mono text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">{taskData.sk_lokasi || '-'}</span></td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-800">{luasSK.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right"><span className="font-bold text-green-700">{totals.realisasi_tanam.toLocaleString('id-ID')}</span></td>
                                    <td className="px-4 py-3 text-right"><span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-100">{specificArea.toLocaleString('id-ID')}</span></td>
                                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getStatusColor(currentStatus)}`}>{currentStatus}</span></td>
                                  </tr>
                                );
                              }).filter(Boolean);
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Kepatuhan & FITUR KLIK UNTUK DETAIL */}
              <div>
                <div className="flex items-center gap-2 mb-5 px-1">
                   <div className="p-2 bg-rose-50 rounded-md text-rose-700 border border-rose-100"><Activity className="w-5 h-5" /></div>
                   <div>
                     <h3 className="font-bold text-gray-900 tracking-tight text-lg">Status Kepatuhan Pemenuhan Kewajiban</h3>
                     <p className="text-[12px] text-gray-500 mt-0.5 italic">Klik salah satu kartu di bawah ini untuk melihat detail daftar perusahaan.</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  <div onClick={() => setSelectedDashboardStatus('Semua')} className={`bg-white p-5 rounded-lg border shadow-sm border-t-4 border-t-gray-500 col-span-2 md:col-span-1 lg:col-span-1 cursor-pointer hover:shadow-md transition-all ${selectedDashboardStatus === 'Semua' ? 'ring-2 ring-gray-400 bg-gray-50' : 'border-gray-200'}`}>
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">Total Unit Aktif</p>
                    <p className="text-3xl font-bold text-gray-900">{currentStats.total}</p>
                  </div>
                  <div onClick={() => setSelectedDashboardStatus('Tertib')} className={`bg-white p-5 rounded-lg border shadow-sm border-t-4 border-t-green-500 cursor-pointer hover:shadow-md transition-all ${selectedDashboardStatus === 'Tertib' ? 'ring-2 ring-green-400 bg-green-50' : 'border-gray-200'}`}>
                    <p className="text-[11px] font-bold text-green-700 uppercase mb-2">Tertib</p>
                    <p className="text-3xl font-bold text-gray-900">{currentStats.tertib}</p>
                  </div>
                  <div onClick={() => setSelectedDashboardStatus('SP1')} className={`bg-white p-5 rounded-lg border shadow-sm border-t-4 border-t-yellow-500 cursor-pointer hover:shadow-md transition-all ${selectedDashboardStatus === 'SP1' ? 'ring-2 ring-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                    <p className="text-[11px] font-bold text-yellow-700 uppercase mb-2">Peringatan SP1</p>
                    <p className="text-3xl font-bold text-gray-900">{currentStats.sp1}</p>
                  </div>
                  <div onClick={() => setSelectedDashboardStatus('SP2')} className={`bg-white p-5 rounded-lg border shadow-sm border-t-4 border-t-orange-500 cursor-pointer hover:shadow-md transition-all ${selectedDashboardStatus === 'SP2' ? 'ring-2 ring-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                    <p className="text-[11px] font-bold text-orange-700 uppercase mb-2">Peringatan SP2</p>
                    <p className="text-3xl font-bold text-gray-900">{currentStats.sp2}</p>
                  </div>
                  <div onClick={() => setSelectedDashboardStatus('SP3')} className={`bg-white p-5 rounded-lg border shadow-sm border-t-4 border-t-red-600 cursor-pointer hover:shadow-md transition-all ${selectedDashboardStatus === 'SP3' ? 'ring-2 ring-red-400 bg-red-50' : 'border-gray-200'}`}>
                    <p className="text-[11px] font-bold text-red-700 uppercase mb-2">Peringatan SP3</p>
                    <p className="text-3xl font-bold text-gray-900">{currentStats.sp3}</p>
                  </div>
                </div>

                {selectedDashboardStatus && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mt-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 tracking-tight text-lg flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-600" />
                          Daftar Perusahaan: {selectedDashboardStatus === 'Semua' ? 'Seluruh Unit Aktif' : (selectedDashboardStatus === 'Tertib' ? 'Status Tertib' : `Peringatan ${selectedDashboardStatus}`)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Bahan laporan/rapat berdasarkan filter status yang Anda pilih ({dashboardDetailCompanies.length} Unit).</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={printDashboardStatus} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold rounded-md text-[12px] transition-colors flex items-center gap-2 border border-gray-300 shadow-sm">
                          <Printer className="w-4 h-4" /> Cetak Laporan (PDF)
                        </button>
                        <button onClick={exportDashboardCSV} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold rounded-md text-[12px] transition-colors flex items-center gap-2 border border-blue-200 shadow-sm">
                          <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={() => setSelectedDashboardStatus(null)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Tutup Tabel">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-auto w-full border border-gray-200 rounded-lg max-h-[400px]">
                      <table className="w-full text-left whitespace-nowrap text-[13px]">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide">Unit Perusahaan</th>
                            <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Tipe</th>
                            <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide">No. SK Penetapan</th>
                            <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Luas SK (Ha)</th>
                            <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Realisasi (Ha)</th>
                            <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Serah Terima (Ha)</th>
                            <th className="px-4 py-3 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {dashboardDetailCompanies.flatMap((c) => {
                            const tasks = obligationsData[c.id] || [];
                            if (tasks.length === 0) return (
                              <tr key={c.id} className="hover:bg-gray-50">
                                 <td className="px-4 py-3 font-bold text-gray-900">{c.name}</td>
                                 <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span></td>
                                 <td className="px-4 py-3 text-gray-400 text-center">-</td>
                                 <td className="px-4 py-3 text-right">0</td>
                                 <td className="px-4 py-3 text-right">0</td>
                                 <td className="px-4 py-3 text-right">0</td>
                                 <td className="px-4 py-3 text-center"><span className={`px-2.5 py-1 rounded text-[11px] font-bold border uppercase ${getStatusColor(c.status)}`}>{c.status}</span></td>
                              </tr>
                            );
                            
                            return tasks.map((taskData, idx) => {
                              const totals = getTaskTotals(taskData);
                              const luasSK = Number(taskData.luas) || 0;
                              const currentStatus = taskData.status || c.status;
                              
                              return (
                                <tr key={`${c.id}-${taskData.id || idx}`} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-gray-900">{c.name}</p>
                                    <p className="text-[11px] text-gray-500 mt-0.5">{c.sector} {tasks.length > 1 ? <span className="text-amber-600 font-semibold">• Kew. {idx + 1}</span> : ''}</p>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                                      <span className="text-[10px] text-gray-500 font-semibold">{taskData.task === 'Rehabilitasi DAS' ? 'DAS' : taskData.task === 'Reklamasi Hutan' ? 'Reklamasi' : 'Reboisasi'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3"><span className="font-mono text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">{taskData.sk_lokasi || '-'}</span></td>
                                  <td className="px-4 py-3 text-right font-bold text-gray-800">{luasSK.toLocaleString('id-ID')}</td>
                                  <td className="px-4 py-3 text-right"><span className="font-bold text-green-700">{totals.realisasi_tanam.toLocaleString('id-ID')}</span></td>
                                  <td className="px-4 py-3 text-right"><span className="font-bold text-blue-700">{totals.luas_serah_terima.toLocaleString('id-ID')}</span></td>
                                  <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getStatusColor(currentStatus)}`}>{currentStatus}</span></td>
                                </tr>
                              );
                            });
                          })}
                          {dashboardDetailCompanies.length === 0 && (
                             <tr><td colSpan="7" className="text-center py-8 text-gray-400 italic">Tidak ada data perusahaan untuk status ini.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VISUALISASI PROGRES PER UNIT ================= */}
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
                      <input type="text" placeholder="Cari nama unit perusahaan..." className="w-full pl-10 pr-4 py-2 text-[13px] bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="flex-1 md:w-auto px-3 py-2 text-[13px] bg-gray-50 border border-gray-300 rounded-md font-semibold text-gray-700 outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="Semua">Semua Status</option><option value="Tertib">Tertib</option><option value="SP1">SP1</option><option value="SP2">SP2</option><option value="SP3">SP3</option>
                    </select>
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
                              <p className="font-bold text-gray-900 text-lg mb-1">{company.name} {tasks.length > 1 ? <span className="text-gray-400 text-sm ml-1">(SK #{idx + 1})</span> : ''}</p>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                 {company.category === 'PPKH' ? <Mountain className="w-3.5 h-3.5"/> : <Leaf className="w-3.5 h-3.5"/>}
                                 {task.task}
                              </p>
                            </div>
                            <div className="text-right">
                               <span className={`px-2.5 py-1 rounded border text-[11px] font-bold uppercase mb-2 inline-block ${getStatusColor(task.status || company.status)}`}>{(task.status || company.status) === 'SP1' || (task.status || company.status) === 'SP2' || (task.status || company.status) === 'SP3' ? `Peringatan ${(task.status || company.status)}` : (task.status || company.status)}</span>
                               <p className="text-[12px] font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">SK: {luasSK.toLocaleString('id-ID')} Ha</p>
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-gray-700">Penyusunan RKP <span className="text-gray-500 font-semibold">({totals.luas_rkp.toLocaleString('id-ID')} Ha)</span></span>
                                <span className="text-blue-700">{pctRKP.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${pctRKP}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-gray-700">Realisasi Tanam <span className="text-gray-500 font-semibold">({totals.realisasi_tanam.toLocaleString('id-ID')} Ha)</span></span>
                                <span className="text-green-700">{pctTanam.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-green-600 h-full rounded-full transition-all duration-1000" style={{ width: `${pctTanam}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-gray-700">Serah Terima <span className="text-gray-500 font-semibold">({totals.luas_serah_terima.toLocaleString('id-ID')} Ha)</span></span>
                                <span className="text-orange-700">{pctST.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${pctST}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })}
                  {filteredCompanies.length === 0 && (
                     <div className="col-span-1 lg:col-span-2 text-center p-12 text-gray-400 border border-dashed border-gray-300 rounded-lg">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-[14px]">Tidak ada data visualisasi yang sesuai dengan filter.</p>
                     </div>
                  )}
               </div>
            </div>
          )}

          {/* ================= MANAJEMEN DATA ================= */}
          {activeTab === 'companies' && (
            <div className="flex flex-col gap-6 pb-10 animate-in fade-in duration-500">
              
              <div className={`bg-white rounded-lg border border-gray-200 shadow flex flex-col transition-all duration-500 ease-in-out ${selectedCompany ? 'h-[300px] shrink-0' : 'flex-1 min-h-[500px]'}`}>
                <div className="p-4 border-b border-gray-200 flex flex-col gap-4 bg-gray-50 shrink-0 rounded-t-lg">
                  <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                    
                    <div className="flex bg-white p-1 rounded-md border border-gray-300 w-fit shadow-sm">
                      <button onClick={() => { setFilterCategory('Semua'); setSelectedCompany(null); }} className={`px-5 py-1.5 rounded-md font-semibold transition-all text-[13px] ${filterCategory === 'Semua' ? 'bg-gray-700 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Semua Data</button>
                      <button onClick={() => { setFilterCategory('PPKH'); setSelectedCompany(null); }} className={`px-5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-2 text-[13px] ${filterCategory === 'PPKH' ? 'bg-amber-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Mountain className="w-4 h-4" /> PPKH</button>
                      <button onClick={() => { setFilterCategory('PKTMKH'); setSelectedCompany(null); }} className={`px-5 py-1.5 rounded-md font-semibold transition-all flex items-center gap-2 text-[13px] ${filterCategory === 'PKTMKH' ? 'bg-green-700 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Leaf className="w-4 h-4" /> PKTMKH</button>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full xl:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input type="text" placeholder="Cari unit perusahaan..." className="w-full pl-10 pr-4 py-2 text-[14px] bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 focus:border-green-600 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                      </div>
                      <select className="px-3 py-2 text-[14px] bg-white border border-gray-300 rounded-md font-semibold outline-none focus:ring-1 focus:ring-green-600" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="Semua">Semua Status</option><option value="Tertib">Tertib</option><option value="SP1">SP1</option><option value="SP2">SP2</option><option value="SP3">SP3</option>
                      </select>
                      <button onClick={exportToCSV} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md text-[14px] hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap border border-blue-700">
                        <Download className="w-4 h-4" /> Ekspor CSV
                      </button>
                      <button onClick={handleAddCompany} className="px-4 py-2 bg-green-700 text-white font-bold rounded-md text-[14px] hover:bg-green-800 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap border border-green-800">
                        <PlusCircle className="w-4 h-4" /> Tambah Data
                      </button>
                    </div>
                  </div>
                  {!selectedCompany && <p className="hidden md:flex text-[12px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-2 rounded-md animate-pulse items-center gap-2 w-fit"><Edit3 className="w-4 h-4" /> Klik baris tabel untuk mengedit status & luasan.</p>}
                </div>

                <div className="overflow-auto flex-1 text-[14px] bg-white relative">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide">Unit Perusahaan</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Tipe</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide">No. SK Penetapan</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Luas SK (Ha)</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Realisasi (Ha)</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-right">Serah Terima (Ha)</th>
                        <th className="px-6 py-4 font-bold text-gray-700 uppercase text-xs tracking-wide text-center">Status</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentCompanies.flatMap((c) => {
                        const tasks = obligationsData[c.id] || [];
                        if (tasks.length === 0) return [];
                        
                        return tasks.map((taskData, idx) => {
                          const totals = getTaskTotals(taskData);
                          const luasSK = Number(taskData.luas) || 0;
                          
                          const realisasiColor = totals.realisasi_tanam < luasSK ? 'text-amber-600' : 'text-green-700';
                          const serahTerimaColor = totals.luas_serah_terima < luasSK ? 'text-amber-600' : 'text-blue-700';
                          
                          const isSelected = selectedCompany && selectedCompany.id === c.id;
                          const currentStatus = taskData.status || c.status;

                          return (
                            <tr key={`${c.id}-${taskData.id || idx}`} onClick={() => handleEditSelect(c)} className={`hover:bg-green-50 cursor-pointer transition-colors ${isSelected ? 'bg-green-50 border-l-4 border-l-green-600 shadow-sm relative z-0' : ''}`}>
                              <td className="px-6 py-4">
                                <p className={`font-bold ${isSelected ? 'text-green-800' : 'text-gray-900'}`}>{c.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{c.sector} {tasks.length > 1 ? <span className="text-amber-600 font-semibold">• Kewajiban {idx + 1}</span> : ''}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                                  <span className="text-[10px] text-gray-500 font-semibold">{taskData.task === 'Rehabilitasi DAS' ? 'DAS' : taskData.task === 'Reklamasi Hutan' ? 'Reklamasi' : 'Reboisasi'}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-mono text-[12px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded border border-gray-200 block w-fit mb-1">{taskData.sk_lokasi || '-'}</span>
                                {taskData.file_sk_name && (
                                   <button onClick={(e) => handleDownloadFromTable(e, taskData.file_sk_name)} className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-bold bg-blue-50 hover:bg-blue-100 border border-blue-200 w-fit px-1.5 py-0.5 rounded transition-colors" title={`Unduh Dokumen SK dari Cloud: ${taskData.file_sk_name}`}>
                                      <Paperclip className="w-3 h-3" /> File SK
                                   </button>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right font-bold text-gray-800">{luasSK.toLocaleString('id-ID')}</td>
                              <td className="px-6 py-4 text-right"><span className={`font-bold ${realisasiColor}`}>{totals.realisasi_tanam.toLocaleString('id-ID')}</span></td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end">
                                   <span className={`font-bold ${serahTerimaColor}`}>{totals.luas_serah_terima.toLocaleString('id-ID')}</span>
                                   {taskData.file_bast_name && (
                                      <button onClick={(e) => handleDownloadFromTable(e, taskData.file_bast_name)} className="flex items-center gap-1 mt-1 text-[10px] text-orange-600 font-bold bg-orange-50 hover:bg-orange-100 border border-orange-200 w-fit px-1.5 py-0.5 rounded transition-colors" title={`Unduh BAST dari Cloud: ${taskData.file_bast_name}`}>
                                         <Paperclip className="w-3 h-3" /> File BAST
                                      </button>
                                   )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center"><span className={`px-2.5 py-1 rounded text-[11px] font-bold border uppercase ${getStatusColor(currentStatus)}`}>{currentStatus === 'SP1' || currentStatus === 'SP2' || currentStatus === 'SP3' ? `Peringatan ${currentStatus}` : currentStatus}</span></td>
                              <td className="px-6 py-4 text-right"><ChevronRight className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} /></td>
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-lg shrink-0">
                  <div className="text-[13px] text-gray-500">
                    Menampilkan <span className="font-bold text-gray-800">{filteredCompanies.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, filteredCompanies.length)}</span> dari <span className="font-bold text-gray-800">{filteredCompanies.length}</span> Perusahaan
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-[13px] font-semibold transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Sebelumnya
                    </button>
                    <span className="text-[13px] font-bold px-3 text-gray-700">Hal {currentPage} / {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-[13px] font-semibold transition-colors">
                      Selanjutnya <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {selectedCompany && editFormData && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-md flex flex-col shrink-0 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0 rounded-t-lg">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {editFormData.isNew ? <PlusCircle className="w-5 h-5 text-green-700" /> : <Edit3 className="w-5 h-5 text-green-700" />} 
                        {editFormData.isNew ? 'Formulir Tambah Data Baru' : 'Formulir Manajemen Data'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {editFormData.isNew ? 'Silakan isi identitas perusahaan dan rincian kewajibannya di bawah ini.' : <>Mengedit data unit: <strong className="text-green-700">{editFormData.company.name}</strong></>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {downloadToast && (
                        <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-[13px] font-bold border border-blue-300 flex items-center gap-2 shadow-sm animate-pulse">
                          <Eye className="w-4 h-4" /> {downloadToast}
                        </span>
                      )}
                      {showSaveSuccess && (
                        <span className="bg-green-100 text-green-800 px-4 py-2 rounded-md text-[13px] font-bold border border-green-300 flex items-center gap-2 shadow-sm">
                          <CheckCircle className="w-4 h-4" /> Disimpan ke Cloud
                        </span>
                      )}
                      <button onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Tutup Mode Edit"><X className="w-5 h-5" /></button>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-8 bg-white">
                    <section>
                      <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Identitas & Status Pemenuhan Kewajiban</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-600 mb-1.5">Nama Perusahaan</label><input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-md outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 text-[14px] font-semibold text-gray-900" value={editFormData.company.name} onChange={(e) => handleCompanyChange('name', e.target.value)} placeholder="Contoh: PT Sawit Nusantara" /></div>
                        <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-600 mb-1.5">Sektor Industri</label><input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-md outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 text-[14px] font-semibold text-gray-900" value={editFormData.company.sector || ''} onChange={(e) => handleCompanyChange('sector', e.target.value)} placeholder="Misal: Tambang Batu Bara" /></div>
                        <div className="md:col-span-1"><label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori Izin</label><select className="w-full px-4 py-2.5 border border-gray-300 rounded-md outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 text-[14px] font-semibold text-gray-900" value={editFormData.company.category} onChange={(e) => handleCompanyChange('category', e.target.value)}><option value="PPKH">PPKH</option><option value="PKTMKH">PKTMKH</option></select></div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Manajemen Data Pemenuhan Kewajiban</h4>
                      {editFormData.tasks.map((task, index) => {
                        const isDAS = task.task === 'Rehabilitasi DAS';
                        return (
                          <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                               
                               <select 
                                  className="font-bold text-gray-900 bg-white px-4 py-2 rounded-md border border-gray-300 shadow-sm uppercase tracking-tight m-0 outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
                                  value={task.task}
                                  onChange={(e) => handleTaskChange(index, 'task', e.target.value)}
                               >
                                  <option value="Rehabilitasi DAS">Rehabilitasi DAS</option>
                                  <option value="Reklamasi Hutan">Reklamasi Hutan</option>
                                  <option value="Reboisasi Areal Pengganti">Reboisasi Areal Pengganti</option>
                                  <option value="Reboisasi">Reboisasi</option>
                               </select>

                               <div className="flex items-center gap-2">
                                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Status:</label>
                                  <select 
                                     className={`px-4 py-2 border rounded-md outline-none text-[13px] font-bold shadow-sm ${!isDAS ? 'bg-gray-200 cursor-not-allowed text-gray-500 border-gray-300' : 'bg-white focus:ring-1 focus:ring-green-600 focus:border-green-600 border-gray-300 text-gray-900'}`}
                                     value={task.status} 
                                     onChange={(e) => handleTaskChange(index, 'status', e.target.value)}
                                     disabled={!isDAS}
                                     title={!isDAS ? 'Status Peringatan (SP) hanya berlaku untuk Rehabilitasi DAS' : ''}
                                  >
                                     <option value="Tertib">Tertib</option>
                                     {isDAS && (
                                        <>
                                           <option value="SP1">Peringatan SP1</option>
                                           <option value="SP2">Peringatan SP2</option>
                                           <option value="SP3">Peringatan SP3</option>
                                        </>
                                     )}
                                  </select>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                               <div className="flex flex-col gap-4">
                                  <div><label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">No. SK Penetapan</label><input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-md font-mono text-[14px] outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white" value={task.sk_lokasi} onChange={(e) => handleTaskChange(index, 'sk_lokasi', e.target.value)} /></div>
                                  <div className="grid grid-cols-2 gap-4">
                                     <div><label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Lokasi Penanaman</label><input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-md text-[14px] outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 bg-white" value={task.lokasi} onChange={(e) => handleTaskChange(index, 'lokasi', e.target.value)} /></div>
                                     <div><label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1.5">Luas SK Awal (Ha)</label><input type="number" step="any" className="w-full px-4 py-2.5 border border-gray-300 rounded-md font-bold outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600 text-[15px] bg-white" value={task.luas || ''} onChange={(e) => handleTaskChange(index, 'luas', e.target.value)} /></div>
                                  </div>
                               </div>

                               <div className="bg-white border border-gray-200 border-dashed rounded-md p-4 flex flex-col justify-center">
                                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5"/> Arsip Dokumen Digital</label>
                                  
                                  <div className="flex flex-col gap-3">
                                     <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded">
                                        <span className="text-[12px] font-semibold text-gray-700 w-1/3">Scan SK Penetapan</span>
                                        <div className="flex-1 flex items-center gap-2 justify-end">
                                           <span className="text-[11px] text-gray-500 truncate max-w-[120px] xl:max-w-[200px]" title={task.file_sk_name}>{task.file_sk_name || 'Belum ada file'}</span>
                                           {task.file_sk_name && (
                                              <button type="button" onClick={() => handleSimulateDownload(task.file_sk_name)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded border border-transparent hover:border-blue-200 transition-colors" title="Lihat/Unduh Dokumen"><Eye className="w-4 h-4" /></button>
                                           )}
                                           <input type="file" accept=".pdf" className="hidden" id={`upload-sk-${index}`} onChange={(e) => handleFileUpload(index, 'file_sk_name', e.target.files[0])} />
                                           <label htmlFor={`upload-sk-${index}`} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold cursor-pointer hover:bg-blue-100 flex items-center gap-1 transition-colors"><Upload className="w-3.5 h-3.5"/> {task.file_sk_name ? 'Ubah' : 'Upload'}</label>
                                        </div>
                                     </div>

                                     <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded">
                                        <span className="text-[12px] font-semibold text-gray-700 w-1/3">Dokumen BAST (Serah Terima)</span>
                                        <div className="flex-1 flex items-center gap-2 justify-end">
                                           <span className="text-[11px] text-gray-500 truncate max-w-[120px] xl:max-w-[200px]" title={task.file_bast_name}>{task.file_bast_name || 'Belum ada file'}</span>
                                           {task.file_bast_name && (
                                              <button type="button" onClick={() => handleSimulateDownload(task.file_bast_name)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded border border-transparent hover:border-blue-200 transition-colors" title="Lihat/Unduh Dokumen"><Eye className="w-4 h-4" /></button>
                                           )}
                                           <input type="file" accept=".pdf" className="hidden" id={`upload-bast-${index}`} onChange={(e) => handleFileUpload(index, 'file_bast_name', e.target.files[0])} />
                                           <label htmlFor={`upload-bast-${index}`} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold cursor-pointer hover:bg-blue-100 flex items-center gap-1 transition-colors"><Upload className="w-3.5 h-3.5"/> {task.file_bast_name ? 'Ubah' : 'Upload'}</label>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                               <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                 <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                    <label className="text-[12px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5"><FileText className="w-4 h-4 text-blue-600"/> Penyusunan RKP</label>
                                    <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">Total: {getTaskTotals(task).luas_rkp} Ha</span>
                                 </div>
                                 <div className="space-y-3 mb-4">
                                    {(task.riwayat_rkp || []).map((r, histIndex) => (
                                      <div key={r.id || histIndex} className="flex gap-2 items-center">
                                          <input type="number" placeholder="Thn" className="w-20 px-3 py-2 border border-gray-300 rounded-md text-[13px] outline-none focus:ring-1 font-semibold focus:ring-blue-600 focus:border-blue-600" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_rkp', histIndex, 'tahun', e.target.value)} />
                                          <input type="number" step="any" placeholder="Luas" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-[13px] font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_rkp', histIndex, 'luas', e.target.value)} />
                                          <button type="button" onClick={() => removeHistory(index, 'riwayat_rkp', histIndex)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                 </div>
                                 <button type="button" onClick={() => addHistory(index, 'riwayat_rkp')} className="flex items-center gap-1.5 text-[12px] font-bold text-blue-700 hover:text-blue-900"><PlusCircle className="w-4 h-4" /> Tambah Data Tahunan</button>
                               </div>

                               <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                                 <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3 mt-1">
                                    <label className="text-[12px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5"><Sprout className="w-4 h-4 text-green-600"/> Realisasi Tanam</label>
                                    <span className="text-[11px] font-bold bg-green-50 text-green-800 px-2 py-1 rounded border border-green-200">Total: {getTaskTotals(task).realisasi_tanam} Ha</span>
                                 </div>
                                 <div className="space-y-3 mb-4">
                                    {(task.riwayat_tanam || []).map((r, histIndex) => (
                                      <div key={r.id || histIndex} className="flex gap-2 items-center">
                                          <input type="number" placeholder="Thn" className="w-16 px-2 py-2 border border-gray-300 rounded-md text-[13px] outline-none focus:ring-1 font-semibold focus:ring-green-600 focus:border-green-600" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_tanam', histIndex, 'tahun', e.target.value)} />
                                          <select className="w-16 px-1 py-2 border border-gray-300 rounded-md text-[13px] outline-none focus:ring-1 font-semibold focus:ring-green-600 focus:border-green-600 bg-white" value={r.status || 'P0'} onChange={(e) => updateHistory(index, 'riwayat_tanam', histIndex, 'status', e.target.value)}>
                                            <option value="P0">P0</option>
                                            <option value="P1">P1</option>
                                            <option value="P2">P2</option>
                                          </select>
                                          <input type="number" step="any" placeholder="Luas" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-[13px] font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_tanam', histIndex, 'luas', e.target.value)} />
                                          <button type="button" onClick={() => removeHistory(index, 'riwayat_tanam', histIndex)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                 </div>
                                 <button type="button" onClick={() => addHistory(index, 'riwayat_tanam')} className="flex items-center gap-1.5 text-[12px] font-bold text-green-700 hover:text-green-900"><PlusCircle className="w-4 h-4" /> Tambah Data Tahunan</button>
                               </div>

                               <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                                 <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3 mt-1">
                                    <label className="text-[12px] font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-orange-600"/> Serah Terima</label>
                                    <span className="text-[11px] font-bold bg-orange-50 text-orange-800 px-2 py-1 rounded border border-orange-200">Total: {getTaskTotals(task).luas_serah_terima} Ha</span>
                                 </div>
                                 <div className="space-y-3 mb-4">
                                    {(task.riwayat_serah_terima || []).map((r, histIndex) => (
                                      <div key={r.id || histIndex} className="flex gap-2 items-center">
                                          <input type="number" placeholder="Thn" className="w-20 px-3 py-2 border border-gray-300 rounded-md text-[13px] outline-none focus:ring-1 font-semibold focus:ring-orange-500 focus:border-orange-500" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', histIndex, 'tahun', e.target.value)} />
                                          <input type="number" step="any" placeholder="Luas" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-[13px] font-semibold text-gray-800 outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', histIndex, 'luas', e.target.value)} />
                                          <button type="button" onClick={() => removeHistory(index, 'riwayat_serah_terima', histIndex)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                      </div>
                                    ))}
                                 </div>
                                 <button type="button" onClick={() => addHistory(index, 'riwayat_serah_terima')} className="flex items-center gap-1.5 text-[12px] font-bold text-orange-700 hover:text-orange-900"><PlusCircle className="w-4 h-4" /> Tambah Data Tahunan</button>
                               </div>

                            </div>
                          </div>
                        );
                      })}
                      
                      <button type="button" onClick={handleAddTaskBlock} className="flex items-center gap-2 text-[13px] font-bold text-green-700 hover:text-green-900 bg-green-50 px-4 py-3 rounded-md border border-green-200 border-dashed w-full justify-center hover:bg-green-100 transition-colors">
                        <PlusCircle className="w-5 h-5" /> Tambah Blok Kewajiban Baru (SK Lain)
                      </button>
                    </section>
                  </div>

                  <div className="p-6 md:p-8 border-t border-gray-200 bg-gray-50 flex justify-end gap-4 rounded-b-lg">
                    <button type="button" onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-md text-[14px] hover:bg-gray-100 transition-colors shadow-sm">Batal</button>
                    <button type="button" onClick={handleSaveChanges} className="px-8 py-2.5 bg-green-700 text-white font-bold rounded-md text-[14px] hover:bg-green-800 transition-colors shadow-md flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> Simpan ke Server
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
