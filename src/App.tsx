// @ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sprout, CheckCircle, Search, Leaf, BarChart3, Map, FileText, Activity, 
  Database, Edit3, Save, PlusCircle, X, ChevronRight, Mountain, 
  LayoutDashboard, PieChart, TrendingUp, Layers, Download, Menu, Bell, 
  Upload, ChevronLeft, Paperclip, Eye, Cloud, DatabaseZap, Lock, User, Mail, ArrowLeft,
  Users, ShieldAlert, CheckSquare, XSquare, Printer, UserPlus, ShieldCheck, Trash2,
  Settings, Key, AlertTriangle, Loader2, UserCircle
} from 'lucide-react';

// ==========================================
// KONFIGURASI FIREBASE CLOUD (RESMI)
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; 

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
const storage = getStorage(app);
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

  const [selectedMainCard, setSelectedMainCard] = useState(null);
  const [selectedDashboardStatus, setSelectedDashboardStatus] = useState(null);
  const [selectedPlantStatus, setSelectedPlantStatus] = useState(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [execCategory, setExecCategory] = useState('PPKH');
  const [execTask, setExecTask] = useState('Rehabilitasi DAS');
  const [selectedExecStatus, setSelectedExecStatus] = useState(null);

  // STATE BARU: Manajemen Pengguna & Pengaturan Akun Gabungan
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

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

    const companiesRef = collection(db, 'artifacts', appId, 'public', 'data', 'companies');
    const obligationsRef = collection(db, 'artifacts', appId, 'public', 'data', 'obligations');
    const usersListRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');

    if (user.email === MASTER_ADMIN_EMAIL) {
      const masterRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      setDoc(masterRef, { name: 'Superadmin SIMPEDAS', email: user.email, instance: 'BPDAS KAHAYAN', role: 'Superadmin', status: 'Active' }, { merge: true });
    }

    const unsubProfile = onSnapshot(usersListRef, (snap) => {
      let found = false;
      snap.forEach(d => {
        if (d.id === user.uid) { setUserProfile({ ...d.data(), id: d.id }); found = true; }
      });
      if (!found) setUserProfile({ id: user.uid, role: user.email === MASTER_ADMIN_EMAIL ? 'Superadmin' : 'User', status: 'Pending' });
    });

    const unsubCompanies = onSnapshot(companiesRef, (snap) => {
      const comps = []; snap.forEach(d => comps.push(d.data()));
      setCompaniesData(comps); setIsDbReady(true);
    });

    const unsubObligations = onSnapshot(obligationsRef, (snap) => {
      const obs = {}; snap.forEach(d => { obs[d.id] = d.data().tasks; });
      setObligationsData(obs);
    });

    const unsubUsers = onSnapshot(usersListRef, (snap) => {
      const ulist = []; snap.forEach(d => ulist.push({ ...d.data(), id: d.id }));
      setUsersData(ulist);
    });

    return () => { unsubCompanies(); unsubObligations(); unsubUsers(); unsubProfile(); };
  }, [user]);

  // ==========================================
  // FUNGSI AKSI: AUTENTIKASI & USER
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault(); setLoginError('');
    try { await signInWithEmailAndPassword(auth, loginEmail, loginPassword); } 
    catch (err) { setLoginError('Email atau kata sandi salah!'); }
  };

  const handleLogout = async () => {
    try { await signOut(auth); setAuthView('landing'); } catch (err) { console.error(err); }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createUserWithEmailAndPassword(auth, registeredEmail, registeredPassword);
      const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', res.user.uid);
      await setDoc(userRef, { name: registeredName, email: registeredEmail, instance: registeredInstance, role: registeredEmail === MASTER_ADMIN_EMAIL ? 'Superadmin' : 'User', status: registeredEmail === MASTER_ADMIN_EMAIL ? 'Active' : 'Pending', createdAt: new Date().toISOString() });
      setAuthView('pending');
    } catch(err) { alert("Gagal mendaftar. Email mungkin sudah digunakan."); }
  };

  // Digunakan untuk membuka profil
  const openProfile = (usr) => {
     setPasswordMessage('');
     setNewPassword('');
     setSelectedUserForProfile(usr);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if(newPassword.length < 6) { setPasswordMessage('Kata sandi minimal 6 karakter!'); return; }
    try {
      await updatePassword(user, newPassword);
      setPasswordMessage('Kata sandi berhasil diubah!');
      setNewPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch(error) {
      setPasswordMessage('Gagal mengubah. Silakan logout dan login ulang terlebih dahulu demi keamanan.');
    }
  };

  const handleApproveUser = async (id) => { const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id); await updateDoc(userRef, { status: 'Active' }); setDownloadToast('Pengguna Berhasil Disetujui!'); setTimeout(() => setDownloadToast(''), 3000); };
  const handleToggleRole = async (id, currentRole) => { const newRole = currentRole === 'Admin' ? 'User' : 'Admin'; const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id); await updateDoc(userRef, { role: newRole }); setDownloadToast(`Peran diubah menjadi ${newRole}`); setTimeout(() => setDownloadToast(''), 3000); };
  const handleRejectUser = async (id) => { const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', id); await deleteDoc(userRef); setDownloadToast('Akun Pengguna Telah Dihapus.'); setTimeout(() => setDownloadToast(''), 3000); };

  // ==========================================
  // FUNGSI AKSI: MANAJEMEN DATA & UPLOAD
  // ==========================================
  const getTaskTotals = (task) => {
    const luas_rkp = (task.riwayat_rkp || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const realisasi_tanam = (task.riwayat_tanam || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const luas_serah_terima = (task.riwayat_serah_terima || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    return { luas_rkp, realisasi_tanam, luas_serah_terima };
  };

  const handleEditSelect = (company) => {
    if (userProfile?.role !== 'Superadmin' && userProfile?.role !== 'Admin') {
      setDownloadToast('Hanya Admin yang dapat mengedit data.'); setTimeout(() => setDownloadToast(''), 3000); return;
    }
    setSelectedCompany(company); setValidationError('');
    setEditFormData({ isNew: false, company: { ...company }, tasks: obligationsData[company.id] ? JSON.parse(JSON.stringify(obligationsData[company.id])) : [] });
    setShowSaveSuccess(false);
  };

  const handleAddCompany = () => {
    if (userProfile?.role !== 'Superadmin' && userProfile?.role !== 'Admin') {
      setDownloadToast('Hanya Admin yang dapat menambah data.'); setTimeout(() => setDownloadToast(''), 3000); return;
    }
    const newId = Date.now(); const newCategory = filterCategory === 'PPKH' || filterCategory === 'PKTMKH' ? filterCategory : 'PPKH';
    const newCompany = { id: newId, name: '', category: newCategory, sector: '', status: 'Tertib', score: 0 };
    const newTask = { id: newId + 1, task: newCategory === 'PPKH' ? 'Rehabilitasi DAS' : 'Reboisasi Areal Pengganti', sk_lokasi: '', tanggal_sk: '', lokasi: '', luas: '', status: 'Tertib', file_sk_name: '', file_sk_url: '', file_bast_name: '', file_bast_url: '', riwayat_rkp: [], riwayat_tanam: [], riwayat_serah_terima: [] };
    setSelectedCompany(newCompany); setValidationError('');
    setEditFormData({ isNew: true, company: newCompany, tasks: [newTask] });
    setShowSaveSuccess(false);
  };

  const handleCompanyChange = (field, value) => setEditFormData((prev) => ({ ...prev, company: { ...prev.company, [field]: value } }));
  const handleTaskChange = (index, field, value) => { setEditFormData((prev) => { const newTasks = [...prev.tasks]; newTasks[index] = { ...newTasks[index], [field]: value }; return { ...prev, tasks: newTasks }; }); };

  const handleSimulateDownload = (fileName) => { setDownloadToast(`Mencari dokumen historis: ${fileName}`); setTimeout(() => setDownloadToast(''), 3500); };
  
  const handleOpenDocument = (e, url, fileName) => {
    e.stopPropagation();
    if (url) { window.open(url, '_blank'); } else { handleSimulateDownload(fileName); }
  };

  const handleFileUpload = async (taskIndex, fieldPrefix, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Ukuran file terlalu besar! Maksimal 5MB."); return; }

    setIsUploading(true);
    try {
      const fileRef = ref(storage, `dokumen_simpedas/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      const snapshot = await uploadBytesResumable(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setEditFormData((prev) => {
        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], [fieldPrefix + '_name']: file.name, [fieldPrefix + '_url']: downloadURL };
        return { ...prev, tasks: newTasks };
      });
      setDownloadToast(`Berhasil unggah: ${file.name}`);
    } catch (error) {
      console.error("Gagal unggah", error);
      alert("Peringatan: Gagal terhubung ke Cloud. Menyimpan nama file dalam mode luring (offline) sementara.");
      setEditFormData((prev) => {
        const newTasks = [...prev.tasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], [fieldPrefix + '_name']: file.name, [fieldPrefix + '_url']: '' };
        return { ...prev, tasks: newTasks };
      });
    } finally {
      setIsUploading(false); setTimeout(() => setDownloadToast(''), 3000);
    }
  };

  const handleAddTaskBlock = () => { setEditFormData((prev) => ({ ...prev, tasks: [ ...prev.tasks, { id: Date.now(), task: 'Rehabilitasi DAS', sk_lokasi: '', tanggal_sk: '', lokasi: '', luas: '', status: 'Tertib', file_sk_name: '', file_sk_url: '', file_bast_name: '', file_bast_url: '', riwayat_rkp: [], riwayat_tanam: [], riwayat_serah_terima: [] } ] })); };
  const removeTaskBlock = (taskIndex) => { setEditFormData((prev) => { const newTasks = [...prev.tasks]; newTasks.splice(taskIndex, 1); return { ...prev, tasks: newTasks }; }); };

  const addHistory = (taskIndex, type) => { setEditFormData((prev) => { const newTasks = [...prev.tasks]; const newHistory = [...(newTasks[taskIndex][type] || [])]; newHistory.push(type === 'riwayat_tanam' ? { id: Date.now(), tahun: new Date().getFullYear(), luas: '', status: 'P0' } : { id: Date.now(), tahun: new Date().getFullYear(), luas: '' }); newTasks[taskIndex][type] = newHistory; return { ...prev, tasks: newTasks }; }); };
  const updateHistory = (taskIndex, type, histIndex, field, value) => { setEditFormData((prev) => { const newTasks = [...prev.tasks]; const newHistory = [...newTasks[taskIndex][type]]; newHistory[histIndex] = { ...newHistory[histIndex], [field]: value }; newTasks[taskIndex][type] = newHistory; return { ...prev, tasks: newTasks }; }); };
  const removeHistory = (taskIndex, type, histIndex) => { setEditFormData((prev) => { const newTasks = [...prev.tasks]; const newHistory = [...newTasks[taskIndex][type]]; newHistory.splice(histIndex, 1); newTasks[taskIndex][type] = newHistory; return { ...prev, tasks: newTasks }; }); };

  const handleSaveChanges = async () => {
    if (!editFormData || !user) return;
    if (isUploading) { alert("Harap tunggu, proses unggah dokumen sedang berjalan."); return; }

    setValidationError('');
    if (!editFormData.company.name.trim()) { setValidationError('Nama Unit / Perusahaan wajib diisi!'); return; }
    if (!editFormData.company.category) { setValidationError('Kategori Perizinan wajib dipilih!'); return; }

    for (let i = 0; i < editFormData.tasks.length; i++) {
      const task = editFormData.tasks[i];
      if (!task.sk_lokasi || !task.sk_lokasi.trim()) { setValidationError(`Nomor SK Penetapan wajib diisi pada blok kewajiban ke-${i + 1}`); return; }
      if (!task.tanggal_sk) { setValidationError(`Tanggal SK wajib diisi pada blok kewajiban ke-${i + 1} agar Sistem EWS Akurat.`); return; }
      if (!task.luas || Number(task.luas) <= 0) { setValidationError(`Total Luas SK (Ha) wajib diisi dengan angka valid (di atas 0) pada blok kewajiban ke-${i + 1}`); return; }
    }

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
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Total RKP (Ha)", "Realisasi Tanam (Ha)", "Realisasi P0 (Ha)", "Realisasi P1 (Ha)", "Realisasi P2 (Ha)", "Serah Terima (Ha)", "Status"];
    let csvContent = headers.join(",") + "\n";
    filteredCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      if (tasks.length === 0) {
          csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","-","-","-","0","0","0","0","0","0","0","${c.status}"\n`;
      } else {
          tasks.forEach(task => {
              const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0;
              let p0 = 0, p1 = 0, p2 = 0;
              if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const l = Number(r.luas) || 0; if (r.status === 'P0') p0 += l; else if (r.status === 'P1') p1 += l; else if (r.status === 'P2') p2 += l; else p0 += l; }); }
              csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${task.lokasi || '-'}","${luasSK}","${totals.luas_rkp}","${totals.realisasi_tanam}","${p0}","${p1}","${p2}","${totals.luas_serah_terima}","${task.status || c.status}"\n`;
          });
      }
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", `SIMPEDAS_Data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
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

  const currentStats = useMemo(() => {
    let tertib = 0, sp1 = 0, sp2 = 0, sp3 = 0;
    companiesData.forEach((c) => {
      if (dashboardCategory === 'Semua' || c.category === dashboardCategory) {
        const tasks = obligationsData[c.id] || [];
        let status = c.status || 'Tertib';
        if (tasks.length > 0) {
          const statuses = tasks.map(t => t.status || 'Tertib');
          if (statuses.includes('SP3')) status = 'SP3';
          else if (statuses.includes('SP2')) status = 'SP2';
          else if (statuses.includes('SP1')) status = 'SP1';
          else status = 'Tertib';
        }
        if (status === 'Tertib') tertib++;
        else if (status === 'SP1') sp1++;
        else if (status === 'SP2') sp2++;
        else if (status === 'SP3') sp3++;
      }
    });
    return { tertib, sp1, sp2, sp3 };
  }, [dashboardCategory, companiesData, obligationsData]);

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
    const alerts = []; 
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); 

    companiesData.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(task => {
        const luasSK = Number(task.luas) || 0;
        if (luasSK <= 0) return; 

        const totals = getTaskTotals(task);
        if (totals.luas_serah_terima >= luasSK) return; 

        const hasRKP = totals.luas_rkp > 0;
        const hasTanam = totals.realisasi_tanam > 0;

        if (task.tanggal_sk) {
            const skDate = new Date(task.tanggal_sk);
            const diffTime = today.getTime() - skDate.getTime();
            const daysSinceSK = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 

            let generatedSP = null;
            let message = "";

            if (!hasRKP) {
                if (daysSinceSK > 90) { generatedSP = 'SP3'; message = `Lewat 90 hari sejak SK terbit dan belum menyusun RKP.`; }
                else if (daysSinceSK > 60) { generatedSP = 'SP2'; message = `Lewat 60 hari sejak SK terbit dan belum menyusun RKP.`; }
                else if (daysSinceSK > 30) { generatedSP = 'SP1'; message = `Lewat 30 hari sejak SK terbit dan belum menyusun RKP.`; }
            }
            else if (hasRKP && !hasTanam) {
                if (daysSinceSK > 120) { generatedSP = 'SP3'; message = `Lewat 90 hari dari batas toleransi RKP tanpa realisasi tanam.`; }
                else if (daysSinceSK > 90) { generatedSP = 'SP2'; message = `Lewat 60 hari dari batas toleransi RKP tanpa realisasi tanam.`; }
                else if (daysSinceSK > 60) { generatedSP = 'SP1'; message = `Lewat 30 hari dari batas toleransi RKP tanpa realisasi tanam.`; }
            }
            else if (hasRKP && hasTanam && totals.realisasi_tanam < luasSK) {
                const tanamYears = (task.riwayat_tanam || []).map(r => Number(r.tahun) || 0);
                const latestTanamYear = tanamYears.length > 0 ? Math.max(...tanamYears) : 0;
                const yearDiff = currentYear - latestTanamYear;

                if (yearDiff >= 2) { generatedSP = 'SP3'; message = `Stagnan! Tidak ada laporan progres penanaman selama > 1 tahun.`; } 
                else if (yearDiff === 1 && currentMonth >= 8) { generatedSP = 'SP2'; message = `Progres penanaman stagnan. Melewati toleransi teguran SP1.`; } 
                else if (yearDiff === 1 && currentMonth >= 5) { generatedSP = 'SP1'; message = `Progres penanaman stagnan selama > 6 bulan tanpa laporan penambahan.`; }
            }

            if (generatedSP) { alerts.push({ id: `${c.id}-${task.id}-${generatedSP}`, company: c.name, type: generatedSP, message: message }); }
        } else {
            let skYear = currentYear;
            const yearMatch = task.sk_lokasi?.match(/(20\d{2})/);
            if (yearMatch) skYear = parseInt(yearMatch[1]);
            else if (task.riwayat_rkp && task.riwayat_rkp.length > 0) skYear = Math.min(...task.riwayat_rkp.map(r => Number(r.tahun)));

            if (!hasRKP && (currentYear - skYear >= 1)) {
               alerts.push({ id: `${c.id}-${task.id}-sp1`, company: c.name, type: 'SP1', message: `Belum RKP sejak tahun SK (${skYear}). Mohon isi Tanggal SK untuk kalkulasi akurat.` });
            } else if (hasRKP && !hasTanam && (currentYear - skYear >= 1)) {
               alerts.push({ id: `${c.id}-${task.id}-sp1`, company: c.name, type: 'SP1', message: `Belum ada tanam sejak tahun SK (${skYear}). Mohon isi Tanggal SK.` });
            }
        }
      });
    });
    return alerts;
  }, [companiesData, obligationsData]);

  const executiveReportData = useMemo(() => {
    let metrics = {
      st_full: { count: 0, areaSK: 0 }, st_partial: { count: 0, areaSK: 0 },
      tanam_full: { count: 0, areaSK: 0 }, tanam_partial: { count: 0, areaSK: 0 },
      belum_tanam_telat: { count: 0, areaSK: 0 }
    };
    const currentYear = new Date().getFullYear();

    companiesData.forEach(c => {
      if (c.category !== execCategory) return;
      const tasks = obligationsData[c.id] || [];
      
      tasks.forEach(t => {
        if (t.task !== execTask) return;
        const luasSK = Number(t.luas) || 0;
        if (luasSK <= 0) return;

        const totals = getTaskTotals(t);
        const luasTanam = totals.realisasi_tanam;
        const luasST = totals.luas_serah_terima;

        let skYear = currentYear; let isTelat = false;
        
        if (t.tanggal_sk) {
          const skDate = new Date(t.tanggal_sk);
          const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          isTelat = skDate <= oneYearAgo;
        } else {
          const yearMatch = t.sk_lokasi?.match(/(20\d{2})/);
          if (yearMatch) { skYear = parseInt(yearMatch[1]); } 
          else if (t.riwayat_rkp && t.riwayat_rkp.length > 0) { skYear = Math.min(...t.riwayat_rkp.map(r => Number(r.tahun))); }
          isTelat = (currentYear - skYear) >= 1;
        }

        if (luasST >= luasSK) { metrics.st_full.count++; metrics.st_full.areaSK += luasSK; }
        else if (luasST > 0) { metrics.st_partial.count++; metrics.st_partial.areaSK += luasSK; }
        else if (luasTanam >= luasSK) { metrics.tanam_full.count++; metrics.tanam_full.areaSK += luasSK; }
        else if (luasTanam > 0) { metrics.tanam_partial.count++; metrics.tanam_partial.areaSK += luasSK; }
        else if (luasTanam === 0 && isTelat) { metrics.belum_tanam_telat.count++; metrics.belum_tanam_telat.areaSK += luasSK; }
      });
    });
    return metrics;
  }, [companiesData, obligationsData, execCategory, execTask]);

  const getTaskExecStatus = (c, t, currentYear) => {
      if (c.category !== execCategory) return null;
      if (t.task !== execTask) return null;
      const luasSK = Number(t.luas) || 0;
      if (luasSK <= 0) return null;

      const totals = getTaskTotals(t);
      const luasTanam = totals.realisasi_tanam;
      const luasST = totals.luas_serah_terima;

      let skYear = currentYear; let isTelat = false;
      if (t.tanggal_sk) {
          const skDate = new Date(t.tanggal_sk);
          const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          isTelat = skDate <= oneYearAgo;
      } else {
          const yearMatch = t.sk_lokasi?.match(/(20\d{2})/);
          if (yearMatch) { skYear = parseInt(yearMatch[1]); }
          else if (t.riwayat_rkp && t.riwayat_rkp.length > 0) { skYear = Math.min(...t.riwayat_rkp.map(r => Number(r.tahun))); }
          isTelat = (currentYear - skYear) >= 1;
      }

      if (luasST >= luasSK) return 'st_full';
      if (luasST > 0) return 'st_partial';
      if (luasTanam >= luasSK) return 'tanam_full';
      if (luasTanam > 0) return 'tanam_partial';
      if (luasTanam === 0 && isTelat) return 'belum_tanam_telat';
      return null;
  };

  const getExecStatusLabel = (key) => {
      switch(key) {
          case 'st_full': return `${execCategory} Selesai Kewajiban`;
          case 'st_partial': return `${execCategory} Serah Terima Sebagian`;
          case 'tanam_full': return `${execCategory} Menanam 1 : 1`;
          case 'tanam_partial': return `${execCategory} Menanam Sebagian`;
          case 'belum_tanam_telat': return `${execCategory} Belum Menanam > 1 Thn`;
          default: return '';
      }
  };

  const dashboardExecCompanies = useMemo(() => {
      if (!selectedExecStatus) return [];
      const currentYear = new Date().getFullYear();
      return companiesData.filter(c => {
          const tasks = obligationsData[c.id] || [];
          return tasks.some(t => getTaskExecStatus(c, t, currentYear) === selectedExecStatus);
      });
  }, [companiesData, obligationsData, selectedExecStatus, execCategory, execTask]);

  const dashboardMainCardCompanies = useMemo(() => {
    if (!selectedMainCard) return [];
    return companiesData.filter(c => {
       const matchesCat = dashboardCategory === 'Semua' || c.category === dashboardCategory;
       if (!matchesCat) return false;
       const tasks = obligationsData[c.id] || [];
       return tasks.some(t => t.task === selectedMainCard || (selectedMainCard === 'Reboisasi Areal Pengganti' && t.task === 'Reboisasi'));
    });
  }, [companiesData, obligationsData, dashboardCategory, selectedMainCard]);

  const dashboardDetailCompanies = useMemo(() => {
    if (!selectedDashboardStatus) return [];
    return companiesData.filter((c) => {
      const matchesCat = dashboardCategory === 'Semua' || c.category === dashboardCategory;
      if (!matchesCat) return false;

      let derivedStatus = c.status || 'Tertib';
      const tasks = obligationsData[c.id] || [];
      if (tasks.length > 0) {
        const statuses = tasks.map(t => t.status || 'Tertib');
        if (statuses.includes('SP3')) derivedStatus = 'SP3';
        else if (statuses.includes('SP2')) derivedStatus = 'SP2';
        else if (statuses.includes('SP1')) derivedStatus = 'SP1';
        else derivedStatus = 'Tertib';
      }

      const matchesStat = selectedDashboardStatus === 'Semua' ? true : derivedStatus === selectedDashboardStatus;
      return matchesStat;
    });
  }, [companiesData, dashboardCategory, selectedDashboardStatus, obligationsData]);

  const dashboardPlantStatusCompanies = useMemo(() => {
    if (!selectedPlantStatus) return [];
    return companiesData.filter((c) => {
      const matchesCat = dashboardCategory === 'Semua' || c.category === dashboardCategory;
      if (!matchesCat) return false;
      
      const tasks = obligationsData[c.id] || [];
      return tasks.some(task => {
        if (!task.riwayat_tanam) return false;
        return task.riwayat_tanam.some(r => {
          const status = r.status || 'P0';
          return status === selectedPlantStatus && Number(r.luas) > 0;
        });
      });
    });
  }, [companiesData, dashboardCategory, obligationsData, selectedPlantStatus]);

  const exportMainCardCSV = () => {
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Realisasi Tanam (Ha)", "Serah Terima (Ha)", "Status"];
    let csvContent = headers.join(",") + "\n";
    dashboardMainCardCompanies.forEach(c => {
       const tasks = obligationsData[c.id] || [];
       tasks.forEach(task => {
          if (task.task === selectedMainCard || (selectedMainCard === 'Reboisasi Areal Pengganti' && task.task === 'Reboisasi')) {
             const totals = getTaskTotals(task);
             const luasSK = Number(task.luas) || 0;
             csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${task.lokasi || '-'}","${luasSK}","${totals.realisasi_tanam}","${totals.luas_serah_terima}","${task.status || c.status}"\n`;
          }
       });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", `Daftar_${selectedMainCard.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportDashboardCSV = () => {
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Realisasi Tanam (Ha)", "Realisasi P0 (Ha)", "Realisasi P1 (Ha)", "Realisasi P2 (Ha)", "Serah Terima (Ha)", "Status"];
    let csvContent = headers.join(",") + "\n";
    dashboardDetailCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      if (tasks.length === 0) {
          csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","-","-","-","0","0","0","0","0","0","${c.status}"\n`;
      } else {
          tasks.forEach(task => {
              const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0;
              let p0 = 0, p1 = 0, p2 = 0;
              if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const l = Number(r.luas) || 0; if (r.status === 'P0') p0 += l; else if (r.status === 'P1') p1 += l; else if (r.status === 'P2') p2 += l; else p0 += l; }); }
              csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${task.lokasi || '-'}","${luasSK}","${totals.realisasi_tanam}","${p0}","${p1}","${p2}","${totals.luas_serah_terima}","${task.status || c.status}"\n`;
          });
      }
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); const safeStatus = selectedDashboardStatus ? selectedDashboardStatus.replace(/\s+/g, '_') : 'Semua';
    link.setAttribute("download", `Daftar_Perusahaan_${safeStatus}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportPlantStatusCSV = () => {
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Realisasi Tanam Total (Ha)", `Realisasi Khusus ${selectedPlantStatus} (Ha)`, "Status"];
    let csvContent = headers.join(",") + "\n";
    dashboardPlantStatusCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(task => {
        let specificArea = 0;
        if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const s = r.status || 'P0'; if (s === selectedPlantStatus) specificArea += (Number(r.luas) || 0); }); }
        if (specificArea > 0) {
           const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0;
           csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${task.lokasi || '-'}","${luasSK}","${totals.realisasi_tanam}","${specificArea}","${task.status || c.status}"\n`;
        }
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", `Daftar_Perusahaan_${selectedPlantStatus}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const exportExecCSV = () => {
    const headers = ["Nama Perusahaan", "Kategori", "Sektor Industri", "Jenis Kewajiban", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Realisasi Tanam (Ha)", "Serah Terima (Ha)", "Status Eksekutif"];
    let csvContent = headers.join(",") + "\n";
    const currentYear = new Date().getFullYear();
    dashboardExecCompanies.forEach(c => {
      const tasks = obligationsData[c.id] || [];
      tasks.forEach(task => {
        const statusKey = getTaskExecStatus(c, task, currentYear);
        if (statusKey === selectedExecStatus) {
           const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0;
           csvContent += `"${c.name}","${c.category}","${c.sector || '-'}","${task.task}","${task.sk_lokasi || '-'}","${task.lokasi || '-'}","${luasSK}","${totals.realisasi_tanam}","${totals.luas_serah_terima}","${getExecStatusLabel(statusKey)}"\n`;
        }
      });
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); const url = URL.createObjectURL(blob);
    link.setAttribute("href", url); link.setAttribute("download", `Daftar_Eksekutif_${selectedExecStatus}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const printMainCardStatus = () => {
    const title = `LAPORAN RINCIAN KEWAJIBAN - ${selectedMainCard.toUpperCase()}`;
    const subtitle = `Filter Kategori: ${dashboardCategory} | Total Unit: ${dashboardMainCardCompanies.length}`;
    const headers = ["No", "Nama Perusahaan", "Kategori", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Tanam (Ha)", "Serah Terima (Ha)", "Status"];
    let rows = []; let counter = 1;
    dashboardMainCardCompanies.forEach(c => {
       const tasks = obligationsData[c.id] || [];
       tasks.forEach(task => {
          if (task.task === selectedMainCard || (selectedMainCard === 'Reboisasi Areal Pengganti' && task.task === 'Reboisasi')) {
             const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0;
             rows.push([counter++, c.name, c.category, task.sk_lokasi || '-', task.lokasi || '-', luasSK.toLocaleString('id-ID'), totals.realisasi_tanam.toLocaleString('id-ID'), totals.luas_serah_terima.toLocaleString('id-ID'), task.status || c.status]);
          }
       });
    });
    printReport(title, subtitle, headers, rows);
  };

  const printDashboardStatus = () => {
    const title = "LAPORAN STATUS PEMENUHAN KEWAJIBAN"; 
    const subtitle = `Filter Status: ${selectedDashboardStatus} | Total Unit: ${dashboardDetailCompanies.length}`;
    const headers = ["No", "Nama Perusahaan", "Kategori", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Tanam (Ha)", "Serah Terima (Ha)", "Status"];
    let rows = []; let counter = 1;
    dashboardDetailCompanies.forEach(c => {
       const tasks = obligationsData[c.id] || [];
       if (tasks.length === 0) { rows.push([counter++, c.name, c.category, '-', '-', '0', '0', '0', c.status]); } 
       else {
          tasks.forEach(task => {
             const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0;
             rows.push([counter++, c.name, c.category, task.sk_lokasi || '-', task.lokasi || '-', luasSK.toLocaleString('id-ID'), totals.realisasi_tanam.toLocaleString('id-ID'), totals.luas_serah_terima.toLocaleString('id-ID'), task.status || c.status]);
          });
       }
    });
    printReport(title, subtitle, headers, rows);
  };

  const printPlantStatus = () => {
    const title = "LAPORAN RINCIAN STATUS PEMELIHARAAN TANAMAN"; 
    const statusName = selectedPlantStatus === 'P0' ? 'Tanaman Baru (P0)' : (selectedPlantStatus === 'P1' ? 'Pemeliharaan 1 (P1)' : 'Pemeliharaan 2+ (P2)'); 
    const subtitle = `Filter Status: ${statusName} | Total Unit: ${dashboardPlantStatusCompanies.length}`;
    const headers = ["No", "Nama Perusahaan", "Kategori", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Tanam Total (Ha)", `Luas ${selectedPlantStatus} (Ha)`, "Status Kepatuhan"];
    let rows = []; let counter = 1;
    dashboardPlantStatusCompanies.forEach(c => { 
      const tasks = obligationsData[c.id] || []; 
      tasks.forEach(task => { 
        let specificArea = 0; 
        if (task.riwayat_tanam) { task.riwayat_tanam.forEach(r => { const s = r.status || 'P0'; if (s === selectedPlantStatus) specificArea += (Number(r.luas) || 0); }); } 
        if (specificArea > 0) { 
          const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0; 
          rows.push([ counter++, c.name, c.category, task.sk_lokasi || '-', task.lokasi || '-', luasSK.toLocaleString('id-ID'), totals.realisasi_tanam.toLocaleString('id-ID'), specificArea.toLocaleString('id-ID'), task.status || c.status ]); 
        } 
      }); 
    });
    printReport(title, subtitle, headers, rows);
  };

  const printExecStatus = () => {
    const statusLabel = getExecStatusLabel(selectedExecStatus);
    const title = `LAPORAN RINCIAN EKSEKUTIF - ${statusLabel.toUpperCase()}`; 
    const subtitle = `Kategori Izin: ${execCategory} | Jenis Kewajiban: ${execTask}`;
    const headers = ["No", "Nama Perusahaan", "Kategori", "No. SK Penetapan", "Lokasi Penanaman", "Luas SK (Ha)", "Tanam (Ha)", "Serah Terima (Ha)", "Status"];
    let rows = []; let counter = 1; const currentYear = new Date().getFullYear();
    
    dashboardExecCompanies.forEach(c => { 
      const tasks = obligationsData[c.id] || []; 
      tasks.forEach(task => { 
        const statusKey = getTaskExecStatus(c, task, currentYear);
        if (statusKey === selectedExecStatus) { 
          const totals = getTaskTotals(task); const luasSK = Number(task.luas) || 0; 
          rows.push([ counter++, c.name, c.category, task.sk_lokasi || '-', task.lokasi || '-', luasSK.toLocaleString('id-ID'), totals.realisasi_tanam.toLocaleString('id-ID'), totals.luas_serah_terima.toLocaleString('id-ID'), statusLabel ]); 
        } 
      }); 
    });
    printReport(title, subtitle, headers, rows);
  };

  const printExecutiveReport = () => {
    const title = "LAPORAN EKSEKUTIF - REHABILITASI DAS";
    const subtitle = `Kategori Izin: ${execCategory} | Jenis Kewajiban: ${execTask}`;
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: portrait; margin: 20mm; }
            body { font-family: 'Tahoma', sans-serif; font-size: 12pt; padding: 0 20px; color: #000; line-height: 1.6; }
            .kop-surat { display: flex; flex-direction: column; align-items: center; border-bottom: 4px solid #000; padding-bottom: 15px; margin-bottom: 25px; text-align: center; }
            .kop-text h2 { margin: 0 0 5px 0; font-size: 15pt; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
            .kop-text p { margin: 0; font-size: 12pt; }
            .doc-title { text-align: center; margin-bottom: 30px; }
            .doc-title h1 { margin: 0 0 5px 0; font-size: 14pt; text-transform: uppercase; text-decoration: underline; }
            .doc-title p { margin: 0; font-size: 12pt; color: #333; }
            .content-list { margin-bottom: 40px; }
            .content-list p { margin-bottom: 15px; text-align: justify; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12pt; }
            .report-table td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
            .report-table tr:last-child td { border-bottom: none; }
            .highlight { font-weight: bold; }
            .text-red { color: #dc2626; }
            .footer { margin-top: 60px; display: flex; justify-content: flex-end; padding-right: 40px; }
            .ttd-box { text-align: center; width: 240px; }
            .ttd-box p { margin: 0; font-size: 12pt; }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            <div class="kop-text">
              <h2>KEMENTERIAN KEHUTANAN</h2>
              <h2>BPDAS KAHAYAN</h2>
              <p>Sistem Pengawasan Pemenuhan Kewajiban PPKH</p>
            </div>
          </div>
          <div class="doc-title">
            <h1>${title}</h1>
            <p>${subtitle}</p>
          </div>
          <div class="content-list">
            <p>Berdasarkan data Sistem Monitoring BPDAS Kahayan pada tanggal ${currentDate}, bersama ini dilaporkan rincian data progres pemenuhan kewajiban <span class="highlight">${execTask}</span> untuk entitas pemegang izin <span class="highlight">${execCategory}</span> sebagai berikut:</p>
            <table class="report-table">
               <tr><td style="width: 45%;"><span class="highlight">${execCategory} Selesai Kewajiban</span></td><td style="width: 25%;"> = <span class="highlight">${executiveReportData.st_full.count}</span> Unit</td><td style="width: 30%;">Luas = <span class="highlight">${executiveReportData.st_full.areaSK.toLocaleString('id-ID')}</span> Ha</td></tr>
               <tr><td><span class="highlight">${execCategory} Serah Terima Sebagian</span></td><td> = <span class="highlight">${executiveReportData.st_partial.count}</span> Unit</td><td>Luas = <span class="highlight">${executiveReportData.st_partial.areaSK.toLocaleString('id-ID')}</span> Ha</td></tr>
               <tr><td><span class="highlight">${execCategory} Menanam 1 : 1</span></td><td> = <span class="highlight">${executiveReportData.tanam_full.count}</span> Unit</td><td>Luas = <span class="highlight">${executiveReportData.tanam_full.areaSK.toLocaleString('id-ID')}</span> Ha</td></tr>
               <tr><td><span class="highlight">${execCategory} Menanam Sebagian</span></td><td> = <span class="highlight">${executiveReportData.tanam_partial.count}</span> Unit</td><td>Luas = <span class="highlight">${executiveReportData.tanam_partial.areaSK.toLocaleString('id-ID')}</span> Ha</td></tr>
               <tr class="text-red"><td><span class="highlight">${execCategory} Belum Menanam > 1 Thn</span></td><td> = <span class="highlight">${executiveReportData.belum_tanam_telat.count}</span> Unit</td><td>Luas = <span class="highlight">${executiveReportData.belum_tanam_telat.areaSK.toLocaleString('id-ID')}</span> Ha</td></tr>
            </table>
            <p style="margin-top: 30px;">Demikian laporan data ini disusun untuk dapat dipergunakan sebagaimana mestinya untuk bahan evaluasi kepatuhan pemegang izin ${execCategory} di wilayah kerja BPDAS Kahayan.</p>
          </div>
          <div class="footer">
            <div class="ttd-box">
              <p style="text-align: left; margin-bottom: 80px;">Dicetak pada: ${currentDate}</p>
              <p style="font-weight: bold;">( ........................ )</p>
              <p>NIP. ........................</p>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
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
            <button onClick={() => setAuthView('login')} className="px-8 py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-lg transition-all shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)] flex items-center justify-center gap-2">
              <Lock className="w-5 h-5" /> Masuk Aplikasi
            </button>
            <button onClick={() => setAuthView('register')} className="px-8 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-lg text-lg transition-all flex items-center justify-center gap-2">
              <User className="w-5 h-5" /> Daftar Akun Baru
            </button>
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
      {/* SIDEBAR DENGAN OPTIMALISASI MOBILE */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0 md:w-20'} bg-green-900 flex flex-col shadow-xl shrink-0 z-30 text-white absolute md:relative h-full transition-all duration-300 ease-in-out overflow-hidden`}>
        <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-green-800 shrink-0 h-[150px]">
          <div className={`${isSidebarOpen ? 'w-20 h-20 mb-3' : 'w-10 h-10'} flex items-center justify-center drop-shadow-md transition-all duration-300`}>
             <LogoBPDAS className="w-full h-full" />
          </div>
          {isSidebarOpen && (<h1 className="font-bold text-[16px] text-white tracking-[0.1em] text-center whitespace-nowrap">BPDAS KAHAYAN</h1>)}
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto w-full">
          <button onClick={() => { setActiveTab('dashboard'); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'dashboard' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`} title="Dashboard"><LayoutDashboard className={`w-5 h-5 shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Dashboard</span>}</button>
          <button onClick={() => { setActiveTab('companies'); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'companies' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`} title="Manajemen Data"><Database className={`w-5 h-5 shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Manajemen Data</span>}</button>
          <button onClick={() => { setActiveTab('visualization'); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'visualization' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`} title="Progres per Unit"><BarChart3 className={`w-5 h-5 shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Progres per Unit</span>}</button>
          <button onClick={() => { setActiveTab('users'); setSelectedUserForProfile(null); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className={`flex items-center w-full py-3 rounded-md transition-all ${isSidebarOpen ? 'px-4 justify-start' : 'justify-center'} ${activeTab === 'users' ? 'bg-green-800 text-white border-l-4 border-green-400' : 'text-green-100 hover:bg-green-800/50'}`} title="Manajemen Pengguna"><Users className={`w-5 h-5 shrink-0 ${isSidebarOpen ? 'mr-3' : ''}`} /> {isSidebarOpen && <span>Manajemen Pengguna</span>}</button>
        </nav>
      </aside>

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden animate-in fade-in"></div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-100 w-full">
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 py-4 shrink-0 z-10 shadow-sm w-full">
          <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 md:-ml-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none shrink-0"><Menu className="w-6 h-6" /></button>
             <div className="flex flex-col truncate">
                <h2 className="text-[14px] md:text-[19px] font-black text-gray-800 uppercase leading-tight truncate">Sistem Pengawasan PPKH</h2>
                <p className="text-[10px] md:text-[11px] font-bold text-green-700 tracking-widest mt-0.5 uppercase flex items-center gap-1.5">BPDAS KAHAYAN <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[9px] hidden sm:inline-flex items-center"><Lock className="w-2.5 h-2.5 mr-1"/> Login Resmi v2.1</span></p>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
             {downloadToast && <span className="hidden md:inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-md text-[12px] font-bold border border-blue-300 animate-pulse truncate max-w-xs">{downloadToast}</span>}
             <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-200 cursor-pointer group relative">
               <div className="hidden md:flex flex-col text-right">
                 <span className="text-[13px] font-bold text-gray-800 truncate max-w-[120px]">{user?.email}</span>
                 <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">{userProfile?.role || 'User'}</span>
               </div>
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center font-bold text-green-800 shadow-sm group-hover:bg-green-200 transition-colors shrink-0">
                 {(userProfile?.name || user?.email || 'A').substring(0,1).toUpperCase()}
               </div>
               <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                  <div className="bg-white rounded-md shadow-xl border border-gray-200 py-1">
                    <button onClick={() => { setActiveTab('users'); openProfile(userProfile); }} className="w-full text-left px-4 py-2 text-[13px] font-bold text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors flex items-center gap-2"><Settings className="w-4 h-4"/> Profil Saya</button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Keluar / Logout</button>
                  </div>
               </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8" id="main-scroll-area">

          {/* ================= MANAJEMEN PENGGUNA & PROFIL GABUNGAN ================= */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-6 pb-10 animate-in fade-in duration-500 max-w-full">
               
               {/* JIKA ADA PENGGUNA YANG DIKLIK -> TAMPILKAN PROFILNYA */}
               {selectedUserForProfile ? (
                 <div className="max-w-4xl mx-auto w-full space-y-6">
                    <button onClick={() => setSelectedUserForProfile(null)} className="flex items-center gap-2 text-gray-500 hover:text-green-700 font-bold mb-2 transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pengguna
                    </button>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-green-800 to-green-600"></div>
                        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 mt-8">
                          <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg border-4 border-gray-100 flex items-center justify-center">
                              <div className="w-full h-full bg-green-100 rounded-full flex items-center justify-center text-5xl font-black text-green-800 uppercase">
                                {(selectedUserForProfile.name || selectedUserForProfile.email || 'A').substring(0,1)}
                              </div>
                          </div>
                          <div className="flex-1 text-center sm:text-left pb-2">
                              <h2 className="text-3xl font-black text-gray-900">{selectedUserForProfile.name || 'Administrator'}</h2>
                              <p className="text-gray-500 font-semibold mt-1 flex items-center justify-center sm:justify-start gap-2"><Mail className="w-4 h-4"/> {selectedUserForProfile.email}</p>
                          </div>
                          <div className="pb-2 text-center sm:text-right">
                              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(selectedUserForProfile.role)}`}>Peran: {selectedUserForProfile.role || 'User'}</span>
                          </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 border-b pb-4"><Database className="w-5 h-5 text-green-600"/> Informasi Instansi</h3>
                          <div className="space-y-5">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                                <p className="text-[14px] font-bold text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedUserForProfile.name || '-'}</p>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Asal Instansi / Perusahaan</label>
                                <p className="text-[14px] font-bold text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedUserForProfile.instance || 'BPDAS KAHAYAN'}</p>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status Akun</label>
                                <p className="text-[14px] font-bold text-green-700 bg-green-50 p-3 rounded-lg border border-green-100">{selectedUserForProfile.status === 'Active' ? 'Terverifikasi & Aktif' : 'Menunggu Persetujuan'}</p>
                              </div>
                          </div>
                        </div>

                        {/* Tampilkan Ganti Password HANYA JIKA profil yang dibuka adalah dirinya sendiri */}
                        {selectedUserForProfile.id === user.uid ? (
                          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2 border-b pb-4"><Key className="w-5 h-5 text-amber-600"/> Keamanan Akun</h3>
                              {passwordMessage && (
                                <div className={`p-3 rounded-lg text-sm font-bold mb-4 ${passwordMessage.includes('berhasil') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {passwordMessage}
                                </div>
                              )}
                              <form onSubmit={handleChangePassword} className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kata Sandi Baru (Min 6 Karakter)</label>
                                    <div className="relative">
                                      <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                      <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-sm font-bold" placeholder="••••••••" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3.5 mt-2 bg-gray-900 hover:bg-black text-white font-black uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95 text-xs">Simpan Kata Sandi</button>
                                <p className="text-[11px] text-gray-400 italic text-center mt-3">Untuk alasan keamanan, Anda mungkin akan diminta login ulang setelah mengubah kata sandi.</p>
                              </form>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-2xl border border-gray-200 shadow-inner p-8 flex flex-col items-center justify-center text-center">
                              <UserCircle className="w-16 h-16 text-gray-300 mb-4" />
                              <h4 className="text-gray-500 font-black uppercase tracking-widest text-sm mb-2">Akses Terbatas</h4>
                              <p className="text-gray-400 text-xs leading-relaxed max-w-xs">Pengaturan keamanan dan kata sandi hanya dapat diakses oleh pemilik akun secara mandiri untuk alasan privasi.</p>
                          </div>
                        )}
                    </div>
                 </div>
               ) : (
                 /* JIKA TIDAK ADA YANG DIKLIK -> TAMPILKAN DAFTAR PENGGUNA */
                 <>
                   <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-md text-purple-700 border border-purple-100 shrink-0"><ShieldAlert className="w-6 h-6" /></div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base md:text-lg">Manajemen Pengguna</h3>
                          <p className="text-[11px] md:text-xs text-gray-500">Klik nama pengguna untuk melihat detail profil atau kelola hak akses di tabel.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 w-full md:w-auto">
                        <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center flex-1 md:min-w-[100px]">
                            <p className="text-xl font-black text-gray-800">{usersData.length}</p>
                            <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Total Akun</p>
                        </div>
                      </div>
                   </div>

                   <div className="bg-white rounded-lg border border-gray-200 shadow w-full overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left whitespace-nowrap text-[13px] md:text-[14px]">
                          <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                                <th className="px-4 md:px-6 py-4 font-bold text-gray-700 uppercase text-xs">Identitas Pengguna</th>
                                <th className="px-4 md:px-6 py-4 font-bold text-gray-700 uppercase text-xs text-center">Hak Akses</th>
                                <th className="px-4 md:px-6 py-4 font-bold text-gray-700 uppercase text-xs text-center">Status</th>
                                <th className="px-4 md:px-6 py-4 font-bold text-gray-700 uppercase text-xs text-right">Tindakan Admin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {usersData.map((usr) => (
                                <tr key={usr.id} onClick={() => openProfile(usr)} className="hover:bg-green-50/70 cursor-pointer transition-colors group">
                                  <td className="px-4 md:px-6 py-4">
                                      <p className="font-bold text-gray-900 group-hover:text-green-800">{usr.name}</p>
                                      <p className="text-[11px] md:text-[12px] text-gray-500 mt-0.5">{usr.email}</p>
                                  </td>
                                  <td className="px-4 md:px-6 py-4 text-center">
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusColor(usr.role)}`}>{usr.role}</span>
                                  </td>
                                  <td className="px-4 md:px-6 py-4 text-center">
                                      <span className={`px-2 py-1 rounded text-[10px] md:text-[11px] font-bold border uppercase ${getStatusColor(usr.status)}`}>{usr.status}</span>
                                  </td>
                                  <td className="px-4 md:px-6 py-4 text-right">
                                      {userProfile?.role === 'Superadmin' ? (
                                        <div className="flex justify-end gap-2">
                                          {usr.status === 'Pending' && (
                                              <button onClick={(e) => { e.stopPropagation(); handleApproveUser(usr.id); }} className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 px-2 md:px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold transition-colors"><CheckSquare className="w-3 h-3 md:w-3.5 md:h-3.5" /> Setujui</button>
                                          )}
                                          {usr.role !== 'Superadmin' && (
                                              <button onClick={(e) => { e.stopPropagation(); handleToggleRole(usr.id, usr.role); }} className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 px-2 md:px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold transition-colors"><ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5" /> {usr.role === 'Admin' ? 'User' : 'Admin'}</button>
                                          )}
                                          {usr.role !== 'Superadmin' && (
                                            <button onClick={(e) => { e.stopPropagation(); handleRejectUser(usr.id); }} className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 px-2 md:px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold transition-colors"><Trash2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> Hapus</button>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] md:text-[11px] text-gray-400 italic">No Access</span>
                                      )}
                                  </td>
                                </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                   </div>
                 </>
               )}
            </div>
          )}

          {/* ================= DASHBOARD ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 md:space-y-8 pb-10 animate-in fade-in duration-500 w-full">
              
              {/* FILTER KATEGORI */}
              <div className="flex bg-white p-1 rounded-md border border-gray-300 w-full md:w-fit shadow-sm overflow-x-auto whitespace-nowrap">
                <button onClick={() => {setDashboardCategory('Semua'); setSelectedMainCard(null);}} className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md font-semibold transition-all ${dashboardCategory === 'Semua' ? 'bg-gray-700 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>Semua</button>
                <button onClick={() => {setDashboardCategory('PPKH'); setSelectedMainCard(null);}} className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${dashboardCategory === 'PPKH' ? 'bg-amber-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Mountain className="w-4 h-4" /> PPKH</button>
                <button onClick={() => {setDashboardCategory('PKTMKH'); setSelectedMainCard(null);}} className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${dashboardCategory === 'PKTMKH' ? 'bg-green-700 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}><Leaf className="w-4 h-4" /> PKTMKH</button>
              </div>

              {/* 1. TOTAL GENERAL */}
              <div className={`grid grid-cols-1 gap-4 md:gap-6 ${dashboardCategory === 'Semua' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                <div onClick={() => setSelectedMainCard(selectedMainCard === 'Rehabilitasi DAS' ? null : 'Rehabilitasi DAS')} className={`bg-white p-6 md:p-8 rounded-2xl border shadow-sm border-t-4 border-t-green-600 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${selectedMainCard === 'Rehabilitasi DAS' ? 'ring-2 ring-green-500 border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                  <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Rehabilitasi DAS</p>
                  <p className="text-3xl md:text-4xl font-black text-green-700">{areaStats.totalDAS.toLocaleString('id-ID')} <span className="text-xs md:text-sm text-gray-400 font-semibold">Ha</span></p>
                  <p className="text-[10px] md:text-[11px] text-gray-400 mt-2 font-semibold tracking-wider">{areaStats.countDAS} UNIT AKTIF</p>
                </div>
                
                {dashboardCategory !== 'PKTMKH' && (
                  <div onClick={() => setSelectedMainCard(selectedMainCard === 'Reklamasi Hutan' ? null : 'Reklamasi Hutan')} className={`bg-white p-6 md:p-8 rounded-2xl border shadow-sm border-t-4 border-t-amber-500 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in zoom-in-95 duration-300 ${selectedMainCard === 'Reklamasi Hutan' ? 'ring-2 ring-amber-500 border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Reklamasi Hutan</p>
                    <p className="text-3xl md:text-4xl font-black text-amber-600">{areaStats.totalReklamasi.toLocaleString('id-ID')} <span className="text-xs md:text-sm text-gray-400 font-semibold">Ha</span></p>
                    <p className="text-[10px] md:text-[11px] text-gray-400 mt-2 font-semibold tracking-wider">{areaStats.countReklamasi} UNIT AKTIF</p>
                  </div>
                )}

                {dashboardCategory !== 'PPKH' && (
                  <div onClick={() => setSelectedMainCard(selectedMainCard === 'Reboisasi Areal Pengganti' ? null : 'Reboisasi Areal Pengganti')} className={`bg-white p-6 md:p-8 rounded-2xl border shadow-sm border-t-4 border-t-blue-500 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-in zoom-in-95 duration-300 ${selectedMainCard === 'Reboisasi Areal Pengganti' ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest">Reboisasi Areal Pengganti</p>
                    <p className="text-3xl md:text-4xl font-black text-blue-600">{areaStats.totalReboisasi.toLocaleString('id-ID')} <span className="text-xs md:text-sm text-gray-400 font-semibold">Ha</span></p>
                    <p className="text-[10px] md:text-[11px] text-gray-400 mt-2 font-semibold tracking-wider">{areaStats.countReboisasi} UNIT AKTIF</p>
                  </div>
                )}
              </div>

              {/* TABEL DETAIL TOTAL GENERAL SAAT KARTU DI-KLIK */}
              {selectedMainCard && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-inner p-4 md:p-6 mt-4 md:mt-6 animate-in slide-in-from-top-4 duration-500 w-full overflow-hidden">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 tracking-tight text-base md:text-lg flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        Daftar Perusahaan: Kewajiban {selectedMainCard}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                      <button onClick={printMainCardStatus} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm whitespace-nowrap">
                        <Printer className="w-4 h-4" /> Cetak
                      </button>
                      <button onClick={exportMainCardCSV} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap">
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <button onClick={() => setSelectedMainCard(null)} className="p-2.5 bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors shadow-sm shrink-0">
                        <X className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto w-full border border-gray-200 rounded-xl bg-white max-h-[400px]">
                    <table className="min-w-full text-left whitespace-nowrap text-[12px] md:text-[14px]">
                      <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Unit Perusahaan</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-center">Tipe</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">No. SK Penetapan</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Lokasi Penanaman</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Luas SK (Ha)</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Tanam (Ha)</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Serah Terima (Ha)</th>
                          <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dashboardMainCardCompanies.flatMap((c) => {
                          const tasks = obligationsData[c.id] || [];
                          return tasks.map((taskData, idx) => {
                            const isMatch = taskData.task === selectedMainCard || (selectedMainCard === 'Reboisasi Areal Pengganti' && taskData.task === 'Reboisasi');
                            if (!isMatch) return null;
                            
                            const totals = getTaskTotals(taskData);
                            const luasSK = Number(taskData.luas) || 0;
                            const currentStatus = taskData.status || c.status;
                            
                            return (
                              <tr key={`${c.id}-${taskData.id || idx}`} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 md:px-6 py-3 md:py-4">
                                  <p className="font-bold text-gray-900">{c.name}</p>
                                  <p className="text-[10px] md:text-[11px] text-gray-500 mt-1">{c.sector}</p>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                  <div className="flex flex-col items-center gap-1.5">
                                    <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                                  </div>
                                </td>
                                <td className="px-4 md:px-6 py-3 md:py-4"><span className="font-mono text-[10px] md:text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">{taskData.sk_lokasi || '-'}</span></td>
                                <td className="px-4 md:px-6 py-3 md:py-4"><span className="text-[10px] md:text-[11px] font-bold text-gray-600">{taskData.lokasi || '-'}</span></td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-gray-800">{luasSK.toLocaleString('id-ID')}</td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-right"><span className="font-bold text-green-700">{totals.realisasi_tanam.toLocaleString('id-ID')}</span></td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-right"><span className="font-bold text-orange-700">{totals.luas_serah_terima.toLocaleString('id-ID')}</span></td>
                                <td className="px-4 md:px-6 py-3 md:py-4 text-center"><span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-[11px] font-bold border uppercase ${getStatusColor(currentStatus)}`}>{currentStatus}</span></td>
                              </tr>
                            );
                          }).filter(Boolean);
                        })}
                        {dashboardMainCardCompanies.length === 0 && (
                          <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">Tidak ada data untuk kategori ini</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. REKAPITULASI PROGRES PEMENUHAN KEWAJIBAN */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 md:p-8">
                <h3 className="text-base md:text-lg font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-3">
                  <PieChart className="w-5 h-5 md:w-6 md:h-6 text-blue-600" /> 
                  <span className="truncate">Rekapitulasi progres {dashboardCategory === 'Semua' ? 'PPKH dan PKTMKH' : dashboardCategory}</span>
                </h3>
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <div className="flex justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 mb-2 md:mb-3">
                      <span>Penyusunan RKP</span>
                      <span className="text-blue-700 text-xs md:text-sm">{globalProgress.pctRKP.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 md:h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${globalProgress.pctRKP}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 mb-2 md:mb-3">
                      <span>Realisasi Penanaman</span>
                      <span className="text-green-700 text-xs md:text-sm">{globalProgress.pctTanam.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 md:h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-green-600 h-full rounded-full transition-all duration-1000" style={{ width: `${globalProgress.pctTanam}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 mb-2 md:mb-3">
                      <span>Serah Terima</span>
                      <span className="text-orange-700 text-xs md:text-sm">{globalProgress.pctST.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 md:h-4 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${globalProgress.pctST}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. TREN KINERJA TAHUNAN */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 md:p-8 w-full">
                <h3 className="text-base md:text-lg font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-3"><TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600"/> Tren Kinerja Tahunan</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
                   <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-100 shadow-inner">
                      <p className="text-[10px] md:text-[12px] font-black text-gray-500 uppercase tracking-widest text-center mb-6 border-b border-gray-200 pb-3">Penyusunan RKP</p>
                      <div className="h-48 md:h-64 flex items-end gap-1 md:gap-2">
                         {yearlyProgress.yearsList.map(y => {
                            const val = yearlyProgress.data.rkp[y] || 0;
                            const pct = yearlyProgress.maxRKP > 0 ? (val / yearlyProgress.maxRKP) * 100 : 0;
                            return (
                               <div key={`rkp-${y}`} className="flex-1 flex flex-col items-center justify-end group relative h-full pt-5">
                                  <div className="w-full bg-blue-100 rounded-t-md flex-1 flex items-end justify-center relative">
                                     <div className="w-full bg-blue-500 rounded-t-md transition-all duration-1000 hover:bg-blue-400 absolute bottom-0 flex justify-center" style={{height: `${pct}%`}}>
                                        <span className={`absolute -top-4 md:-top-5 text-[8px] md:text-[10px] font-black tracking-tight ${val > 0 ? 'text-blue-700' : 'text-gray-400'}`}>{val > 0 ? val.toLocaleString('id-ID') : '0'}</span>
                                     </div>
                                  </div>
                                  <span className="text-[8px] md:text-[10px] font-bold text-gray-400 mt-2 md:mt-3">{y}</span>
                               </div>
                            )
                         })}
                      </div>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-100 shadow-inner">
                      <p className="text-[10px] md:text-[12px] font-black text-gray-500 uppercase tracking-widest text-center mb-6 border-b border-gray-200 pb-3">Realisasi Penanaman</p>
                      <div className="h-48 md:h-64 flex items-end gap-1 md:gap-2">
                         {yearlyProgress.yearsList.map(y => {
                            const val = yearlyProgress.data.tanam[y] || 0;
                            const pct = yearlyProgress.maxTanam > 0 ? (val / yearlyProgress.maxTanam) * 100 : 0;
                            return (
                               <div key={`tnm-${y}`} className="flex-1 flex flex-col items-center justify-end group relative h-full pt-5">
                                  <div className="w-full bg-green-100 rounded-t-md flex-1 flex items-end justify-center relative">
                                     <div className="w-full bg-green-500 rounded-t-md transition-all duration-1000 hover:bg-green-400 absolute bottom-0 flex justify-center" style={{height: `${pct}%`}}>
                                        <span className={`absolute -top-4 md:-top-5 text-[8px] md:text-[10px] font-black tracking-tight ${val > 0 ? 'text-green-700' : 'text-gray-400'}`}>{val > 0 ? val.toLocaleString('id-ID') : '0'}</span>
                                     </div>
                                  </div>
                                  <span className="text-[8px] md:text-[10px] font-bold text-gray-400 mt-2 md:mt-3">{y}</span>
                               </div>
                            )
                         })}
                      </div>
                   </div>
                   <div className="bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-100 shadow-inner">
                      <p className="text-[10px] md:text-[12px] font-black text-gray-500 uppercase tracking-widest text-center mb-6 border-b border-gray-200 pb-3">Serah Terima</p>
                      <div className="h-48 md:h-64 flex items-end gap-1 md:gap-2">
                         {yearlyProgress.yearsList.map(y => {
                            const val = yearlyProgress.data.st[y] || 0;
                            const pct = yearlyProgress.maxST > 0 ? (val / yearlyProgress.maxST) * 100 : 0;
                            return (
                               <div key={`st-${y}`} className="flex-1 flex flex-col items-center justify-end group relative h-full pt-5">
                                  <div className="w-full bg-orange-100 rounded-t-md flex-1 flex items-end justify-center relative">
                                     <div className="w-full bg-orange-500 rounded-t-md transition-all duration-1000 hover:bg-orange-400 absolute bottom-0 flex justify-center" style={{height: `${pct}%`}}>
                                        <span className={`absolute -top-4 md:-top-5 text-[8px] md:text-[10px] font-black tracking-tight ${val > 0 ? 'text-orange-700' : 'text-gray-400'}`}>{val > 0 ? val.toLocaleString('id-ID') : '0'}</span>
                                     </div>
                                  </div>
                                  <span className="text-[8px] md:text-[10px] font-bold text-gray-400 mt-2 md:mt-3">{y}</span>
                               </div>
                            )
                         })}
                      </div>
                   </div>
                </div>
              </div>

              {/* 4. KOMPOSISI UMUR TANAMAN */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 md:p-8 w-full">
                 <h3 className="text-base md:text-lg font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-3"><Layers className="w-5 h-5 md:w-6 md:h-6 text-teal-600"/> Komposisi Umur Tanaman</h3>
                 
                 <div className="bg-gray-50 rounded-xl p-4 md:p-8 border border-gray-100 shadow-inner mb-6 md:mb-8">
                    <div className="flex justify-between text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest mb-3 md:mb-4">
                       <span>Realisasi Tanam: {plantStatusStats.total.toLocaleString('id-ID')} Ha</span><span>100%</span>
                    </div>
                    <div className="w-full h-6 md:h-8 flex rounded-full overflow-hidden shadow-inner bg-gray-200 mb-4 md:mb-8">
                       {plantStatusStats.pctP0 > 0 && <div className="h-full bg-sky-500 flex items-center justify-center text-[10px] md:text-xs font-black text-white" style={{width: `${plantStatusStats.pctP0}%`}} title={`P0: ${plantStatusStats.pctP0.toFixed(1)}%`}>{plantStatusStats.pctP0 > 5 ? `${plantStatusStats.pctP0.toFixed(0)}%` : ''}</div>}
                       {plantStatusStats.pctP1 > 0 && <div className="h-full bg-teal-500 flex items-center justify-center text-[10px] md:text-xs font-black text-white" style={{width: `${plantStatusStats.pctP1}%`}} title={`P1: ${plantStatusStats.pctP1.toFixed(1)}%`}>{plantStatusStats.pctP1 > 5 ? `${plantStatusStats.pctP1.toFixed(0)}%` : ''}</div>}
                       {plantStatusStats.pctP2 > 0 && <div className="h-full bg-emerald-600 flex items-center justify-center text-[10px] md:text-xs font-black text-white" style={{width: `${plantStatusStats.pctP2}%`}} title={`P2: ${plantStatusStats.pctP2.toFixed(1)}%`}>{plantStatusStats.pctP2 > 5 ? `${plantStatusStats.pctP2.toFixed(0)}%` : ''}</div>}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div onClick={() => setSelectedPlantStatus(selectedPlantStatus === 'P0' ? null : 'P0')} className={`bg-sky-50 border p-4 md:p-5 rounded-xl flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${selectedPlantStatus === 'P0' ? 'ring-2 ring-sky-400 border-sky-300 shadow-md transform scale-[1.02]' : 'border-sky-100'}`}>
                      <div className="w-2 md:w-3 h-12 md:h-16 bg-sky-500 rounded-full"></div>
                      <div>
                        <p className="text-[10px] md:text-xs font-bold text-sky-800 uppercase tracking-wide">Tanaman Baru (P0)</p>
                        <p className="text-2xl md:text-3xl font-black text-sky-900 mt-1">{plantStatusStats.p0.toLocaleString('id-ID')} <span className="text-xs md:text-sm font-semibold text-sky-700">Ha</span></p>
                      </div>
                    </div>
                    <div onClick={() => setSelectedPlantStatus(selectedPlantStatus === 'P1' ? null : 'P1')} className={`bg-teal-50 border p-4 md:p-5 rounded-xl flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${selectedPlantStatus === 'P1' ? 'ring-2 ring-teal-400 border-teal-300 shadow-md transform scale-[1.02]' : 'border-teal-100'}`}>
                      <div className="w-2 md:w-3 h-12 md:h-16 bg-teal-500 rounded-full"></div>
                      <div>
                        <p className="text-[10px] md:text-xs font-bold text-teal-800 uppercase tracking-wide">Pemeliharaan 1 (P1)</p>
                        <p className="text-2xl md:text-3xl font-black text-teal-900 mt-1">{plantStatusStats.p1.toLocaleString('id-ID')} <span className="text-xs md:text-sm font-semibold text-teal-700">Ha</span></p>
                      </div>
                    </div>
                    <div onClick={() => setSelectedPlantStatus(selectedPlantStatus === 'P2' ? null : 'P2')} className={`bg-emerald-50 border p-4 md:p-5 rounded-xl flex items-center gap-4 cursor-pointer hover:shadow-md transition-all ${selectedPlantStatus === 'P2' ? 'ring-2 ring-emerald-400 border-emerald-300 shadow-md transform scale-[1.02]' : 'border-emerald-100'}`}>
                      <div className="w-2 md:w-3 h-12 md:h-16 bg-emerald-600 rounded-full"></div>
                      <div>
                        <p className="text-[10px] md:text-xs font-bold text-emerald-900 uppercase tracking-wide">Pemeliharaan 2+ (P2)</p>
                        <p className="text-2xl md:text-3xl font-black text-emerald-950 mt-1">{plantStatusStats.p2.toLocaleString('id-ID')} <span className="text-xs md:text-sm font-semibold text-emerald-800">Ha</span></p>
                      </div>
                    </div>
                 </div>

                 {/* TABEL DETAIL STATUS TANAMAN */}
                 {selectedPlantStatus && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-4 md:p-8 mt-6 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden w-full">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 tracking-tight text-base md:text-lg flex items-center gap-2">
                            <Layers className="w-5 h-5 text-teal-600" />
                            Daftar Perusahaan: Status {selectedPlantStatus === 'P0' ? 'Tanaman Baru (P0)' : (selectedPlantStatus === 'P1' ? 'Pemeliharaan 1 (P1)' : 'Pemeliharaan 2+ (P2)')}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                          <button onClick={printPlantStatus} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm whitespace-nowrap">
                            <Printer className="w-4 h-4" /> Cetak
                          </button>
                          <button onClick={exportPlantStatusCSV} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-teal-200 shadow-sm whitespace-nowrap">
                            <Download className="w-4 h-4" /> Export
                          </button>
                          <button onClick={() => setSelectedPlantStatus(null)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 shrink-0">
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto w-full border border-gray-200 rounded-xl max-h-[400px]">
                        <table className="min-w-full text-left whitespace-nowrap text-[12px] md:text-[14px]">
                          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Unit Perusahaan</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-center">Tipe</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">No. SK Penetapan</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Lokasi Penanaman</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Luas SK (Ha)</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Total Tanam (Ha)</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-teal-700 uppercase text-[10px] md:text-xs tracking-wide text-right bg-teal-50/50">Luas {selectedPlantStatus} (Ha)</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-center">Status</th>
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
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <p className="font-bold text-gray-900">{c.name}</p>
                                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">{c.sector}</p>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                      <div className="flex flex-col items-center gap-1.5">
                                        <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4"><span className="font-mono text-[10px] md:text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">{taskData.sk_lokasi || '-'}</span></td>
                                    <td className="px-4 md:px-6 py-3 md:py-4"><span className="text-[10px] md:text-[11px] font-bold text-gray-600">{taskData.lokasi || '-'}</span></td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-gray-800">{luasSK.toLocaleString('id-ID')}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right"><span className="font-bold text-green-700">{totals.realisasi_tanam.toLocaleString('id-ID')}</span></td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right bg-teal-50/30"><span className="font-bold text-teal-700 bg-teal-100 px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-teal-200">{specificArea.toLocaleString('id-ID')}</span></td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center"><span className={`px-2 md:px-3 py-1 rounded-md text-[10px] md:text-[11px] font-bold border uppercase ${getStatusColor(currentStatus)}`}>{currentStatus}</span></td>
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

              {/* 5. STATUS PEMENUHAN KEWAJIBAN & EWS (DIGABUNG) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 md:p-8 w-full">
                <h3 className="text-base md:text-lg font-black text-gray-900 mb-2 flex items-center gap-3"><ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-rose-600" /> Status Kepatuhan</h3>
                <p className="text-[11px] md:text-[13px] text-gray-500 mb-6 md:mb-8 italic">Klik pada kartu status untuk memfilter daftar perusahaan di bawahnya.</p>
                
                {/* Kartu Status Admin */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
                   <div onClick={() => setSelectedDashboardStatus(selectedDashboardStatus === 'Tertib' ? null : 'Tertib')} className={`bg-green-50 p-4 md:p-6 rounded-xl border-2 shadow-sm cursor-pointer transition-all ${selectedDashboardStatus === 'Tertib' ? 'border-green-500 ring-2 ring-green-200 transform scale-105' : 'border-green-200 hover:border-green-400'}`}>
                      <p className="text-[10px] md:text-xs font-black text-green-700 uppercase mb-2 tracking-widest">Status Tertib</p>
                      <p className="text-2xl md:text-4xl font-black text-green-800">{currentStats.tertib} <span className="text-[10px] md:text-sm font-bold text-green-600">Unit</span></p>
                   </div>
                   <div onClick={() => setSelectedDashboardStatus(selectedDashboardStatus === 'SP1' ? null : 'SP1')} className={`bg-yellow-50 p-4 md:p-6 rounded-xl border-2 shadow-sm cursor-pointer transition-all ${selectedDashboardStatus === 'SP1' ? 'border-yellow-500 ring-2 ring-yellow-200 transform scale-105' : 'border-yellow-200 hover:border-yellow-400'}`}>
                      <p className="text-[10px] md:text-xs font-black text-yellow-700 uppercase mb-2 tracking-widest">Peringatan SP1</p>
                      <p className="text-2xl md:text-4xl font-black text-yellow-800">{currentStats.sp1} <span className="text-[10px] md:text-sm font-bold text-yellow-600">Unit</span></p>
                   </div>
                   <div onClick={() => setSelectedDashboardStatus(selectedDashboardStatus === 'SP2' ? null : 'SP2')} className={`bg-orange-50 p-4 md:p-6 rounded-xl border-2 shadow-sm cursor-pointer transition-all ${selectedDashboardStatus === 'SP2' ? 'border-orange-500 ring-2 ring-orange-200 transform scale-105' : 'border-orange-200 hover:border-orange-400'}`}>
                      <p className="text-[10px] md:text-xs font-black text-orange-700 uppercase mb-2 tracking-widest">Peringatan SP2</p>
                      <p className="text-2xl md:text-4xl font-black text-orange-800">{currentStats.sp2} <span className="text-[10px] md:text-sm font-bold text-orange-600">Unit</span></p>
                   </div>
                   <div onClick={() => setSelectedDashboardStatus(selectedDashboardStatus === 'SP3' ? null : 'SP3')} className={`bg-red-50 p-4 md:p-6 rounded-xl border-2 shadow-sm cursor-pointer transition-all ${selectedDashboardStatus === 'SP3' ? 'border-red-500 ring-2 ring-red-200 transform scale-105' : 'border-red-200 hover:border-red-400'}`}>
                      <p className="text-[10px] md:text-xs font-black text-red-700 uppercase mb-2 tracking-widest">Peringatan SP3</p>
                      <p className="text-2xl md:text-4xl font-black text-red-800">{currentStats.sp3} <span className="text-[10px] md:text-sm font-bold text-red-600">Unit</span></p>
                   </div>
                </div>

                {/* TABEL DETAIL STATUS */}
                {selectedDashboardStatus && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-inner p-4 md:p-6 mb-8 md:mb-10 animate-in slide-in-from-top-4 duration-500 overflow-hidden w-full">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 tracking-tight text-base md:text-lg flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-600" />
                          Daftar Perusahaan: {selectedDashboardStatus === 'Semua' ? 'Seluruh Unit Aktif' : (selectedDashboardStatus === 'Tertib' ? 'Status Tertib' : `Peringatan ${selectedDashboardStatus}`)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                        <button onClick={printDashboardStatus} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm whitespace-nowrap">
                          <Printer className="w-4 h-4" /> Cetak
                        </button>
                        <button onClick={exportDashboardCSV} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap">
                          <Download className="w-4 h-4" /> Export
                        </button>
                        <button onClick={() => setSelectedDashboardStatus(null)} className="p-2.5 bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors shadow-sm shrink-0">
                          <X className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto w-full border border-gray-200 rounded-xl bg-white max-h-[400px]">
                      <table className="min-w-full text-left whitespace-nowrap text-[12px] md:text-[14px]">
                        <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Unit Perusahaan</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-center">Tipe</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">No. SK Penetapan</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Lokasi Penanaman</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Luas SK (Ha)</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Realisasi (Ha)</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Serah Terima (Ha)</th>
                            <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {dashboardDetailCompanies.flatMap((c) => {
                            const tasks = obligationsData[c.id] || [];
                            if (tasks.length === 0) return (
                              <tr key={c.id} className="hover:bg-gray-50">
                                 <td className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-900">{c.name}</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-center"><span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span></td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-gray-400 text-center">-</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-gray-400 text-center">-</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-right">0</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-right">0</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-right">0</td>
                                 <td className="px-4 md:px-6 py-3 md:py-4 text-center"><span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-[11px] font-bold border uppercase ${getStatusColor(c.status)}`}>{c.status}</span></td>
                              </tr>
                            );
                            
                            return tasks.map((taskData, idx) => {
                              const totals = getTaskTotals(taskData);
                              const luasSK = Number(taskData.luas) || 0;
                              const currentStatus = taskData.status || c.status;
                              
                              return (
                                <tr key={`${c.id}-${taskData.id || idx}`} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 md:px-6 py-3 md:py-4">
                                    <p className="font-bold text-gray-900">{c.name}</p>
                                    <p className="text-[10px] md:text-[11px] text-gray-500 mt-1">{c.sector}</p>
                                  </td>
                                  <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 md:px-6 py-3 md:py-4"><span className="font-mono text-[10px] md:text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">{taskData.sk_lokasi || '-'}</span></td>
                                  <td className="px-4 md:px-6 py-3 md:py-4"><span className="text-[10px] md:text-[11px] font-bold text-gray-600">{taskData.lokasi || '-'}</span></td>
                                  <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-gray-800">{luasSK.toLocaleString('id-ID')}</td>
                                  <td className="px-4 md:px-6 py-3 md:py-4 text-right"><span className="font-bold text-green-700">{totals.realisasi_tanam.toLocaleString('id-ID')}</span></td>
                                  <td className="px-4 md:px-6 py-3 md:py-4 text-right"><span className="font-bold text-blue-700">{totals.luas_serah_terima.toLocaleString('id-ID')}</span></td>
                                  <td className="px-4 md:px-6 py-3 md:py-4 text-center"><span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[10px] md:text-[11px] font-bold border uppercase ${getStatusColor(currentStatus)}`}>{currentStatus}</span></td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. MODUL LAPORAN EKSEKUTIF PIMPINAN */}
              {dashboardCategory === 'PPKH' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-500 w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 border-b border-gray-100 pb-4 md:pb-6">
                    <div>
                      <h3 className="text-base md:text-lg font-black text-gray-900 flex items-center gap-3">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /> Laporan Eksekutif - Rehabilitasi DAS
                      </h3>
                      <p className="text-[11px] md:text-xs text-gray-500 mt-1">Rangkuman otomatis khusus progres Rehabilitasi DAS untuk entitas PPKH.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                       <button onClick={printExecutiveReport} className="px-4 md:px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] md:text-[13px] shadow-md flex items-center justify-center gap-2 transition-all w-full md:w-auto whitespace-nowrap">
                         <Printer className="w-4 h-4"/> Cetak Laporan
                       </button>
                    </div>
                  </div>
                  
                  {/* KARTU/TOMBOL DATA LAPORAN */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-5">
                     
                     <div onClick={() => setSelectedExecStatus(selectedExecStatus === 'st_full' ? null : 'st_full')} className={`bg-emerald-50 border border-emerald-200 rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${selectedExecStatus === 'st_full' ? 'ring-2 ring-emerald-500 transform scale-[1.02]' : 'hover:border-emerald-400'}`}>
                        <p className="text-[9px] md:text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-2 md:mb-3 leading-tight md:h-8">{execCategory} Selesai Kewajiban</p>
                        <div>
                           <p className="text-xl md:text-3xl font-black text-emerald-700 mb-2">{executiveReportData.st_full.count} <span className="text-[8px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Unit</span></p>
                           <div className="bg-white border border-emerald-100 rounded-md px-2 py-1 md:px-3 md:py-2 inline-block w-full">
                             <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Luas: </span><span className="text-[10px] md:text-[13px] font-black text-emerald-800">{executiveReportData.st_full.areaSK.toLocaleString('id-ID')} Ha</span>
                           </div>
                        </div>
                     </div>
                     
                     <div onClick={() => setSelectedExecStatus(selectedExecStatus === 'st_partial' ? null : 'st_partial')} className={`bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${selectedExecStatus === 'st_partial' ? 'ring-2 ring-blue-500 transform scale-[1.02]' : 'hover:border-blue-400'}`}>
                        <p className="text-[9px] md:text-[11px] font-black text-blue-800 uppercase tracking-widest mb-2 md:mb-3 leading-tight md:h-8">{execCategory} Serah Terima Sebagian</p>
                        <div>
                           <p className="text-xl md:text-3xl font-black text-blue-700 mb-2">{executiveReportData.st_partial.count} <span className="text-[8px] md:text-[10px] font-bold text-blue-600 uppercase tracking-widest">Unit</span></p>
                           <div className="bg-white border border-blue-100 rounded-md px-2 py-1 md:px-3 md:py-2 inline-block w-full">
                             <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Luas: </span><span className="text-[10px] md:text-[13px] font-black text-blue-800">{executiveReportData.st_partial.areaSK.toLocaleString('id-ID')} Ha</span>
                           </div>
                        </div>
                     </div>

                     <div onClick={() => setSelectedExecStatus(selectedExecStatus === 'tanam_full' ? null : 'tanam_full')} className={`bg-indigo-50 border border-indigo-200 rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${selectedExecStatus === 'tanam_full' ? 'ring-2 ring-indigo-500 transform scale-[1.02]' : 'hover:border-indigo-400'}`}>
                        <p className="text-[9px] md:text-[11px] font-black text-indigo-800 uppercase tracking-widest mb-2 md:mb-3 leading-tight md:h-8">{execCategory} Menanam 1 : 1</p>
                        <div>
                           <p className="text-xl md:text-3xl font-black text-indigo-700 mb-2">{executiveReportData.tanam_full.count} <span className="text-[8px] md:text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Unit</span></p>
                           <div className="bg-white border border-indigo-100 rounded-md px-2 py-1 md:px-3 md:py-2 inline-block w-full">
                             <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Luas: </span><span className="text-[10px] md:text-[13px] font-black text-indigo-800">{executiveReportData.tanam_full.areaSK.toLocaleString('id-ID')} Ha</span>
                           </div>
                        </div>
                     </div>

                     <div onClick={() => setSelectedExecStatus(selectedExecStatus === 'tanam_partial' ? null : 'tanam_partial')} className={`bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${selectedExecStatus === 'tanam_partial' ? 'ring-2 ring-amber-500 transform scale-[1.02]' : 'hover:border-amber-400'}`}>
                        <p className="text-[9px] md:text-[11px] font-black text-amber-800 uppercase tracking-widest mb-2 md:mb-3 leading-tight md:h-8">{execCategory} Menanam Sebagian</p>
                        <div>
                           <p className="text-xl md:text-3xl font-black text-amber-700 mb-2">{executiveReportData.tanam_partial.count} <span className="text-[8px] md:text-[10px] font-bold text-amber-600 uppercase tracking-widest">Unit</span></p>
                           <div className="bg-white border border-amber-100 rounded-md px-2 py-1 md:px-3 md:py-2 inline-block w-full">
                             <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Luas: </span><span className="text-[10px] md:text-[13px] font-black text-amber-800">{executiveReportData.tanam_partial.areaSK.toLocaleString('id-ID')} Ha</span>
                           </div>
                        </div>
                     </div>

                     <div onClick={() => setSelectedExecStatus(selectedExecStatus === 'belum_tanam_telat' ? null : 'belum_tanam_telat')} className={`bg-rose-50 border border-rose-200 rounded-xl p-3 md:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between col-span-2 lg:col-span-1 xl:col-span-1 ${selectedExecStatus === 'belum_tanam_telat' ? 'ring-2 ring-rose-500 transform scale-[1.02]' : 'hover:border-rose-400'}`}>
                        <p className="text-[9px] md:text-[11px] font-black text-rose-800 uppercase tracking-widest mb-2 md:mb-3 leading-tight md:h-8">{execCategory} Belum Menanam &gt; 1 Thn</p>
                        <div>
                           <p className="text-xl md:text-3xl font-black text-rose-700 mb-2">{executiveReportData.belum_tanam_telat.count} <span className="text-[8px] md:text-[10px] font-bold text-rose-600 uppercase tracking-widest">Unit</span></p>
                           <div className="bg-white border border-rose-100 rounded-md px-2 py-1 md:px-3 md:py-2 inline-block w-full">
                             <span className="text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Luas: </span><span className="text-[10px] md:text-[13px] font-black text-rose-800">{executiveReportData.belum_tanam_telat.areaSK.toLocaleString('id-ID')} Ha</span>
                           </div>
                        </div>
                     </div>

                  </div>

                  {/* TABEL DETAIL EKSEKUTIF SAAT KARTU DI-KLIK */}
                  {selectedExecStatus && (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 shadow-inner p-4 md:p-6 mt-6 md:mt-8 animate-in slide-in-from-top-4 duration-500 w-full overflow-hidden">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                        <div>
                          <h3 className="font-bold text-gray-900 tracking-tight text-base md:text-lg flex items-center gap-2">
                            <Database className="w-5 h-5 text-indigo-600" />
                            Daftar Perusahaan: {getExecStatusLabel(selectedExecStatus)}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                          <button onClick={printExecStatus} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 border border-rose-200 shadow-sm whitespace-nowrap">
                            <Printer className="w-4 h-4" /> Cetak Rincian
                          </button>
                          <button onClick={exportExecCSV} className="flex-1 lg:flex-none px-3 md:px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-lg text-[11px] md:text-[13px] transition-colors flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap">
                            <Download className="w-4 h-4" /> Export
                          </button>
                          <button onClick={() => setSelectedExecStatus(null)} className="p-2.5 bg-white text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors shadow-sm shrink-0">
                            <X className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto w-full border border-gray-200 rounded-xl bg-white max-h-[400px]">
                        <table className="min-w-full text-left whitespace-nowrap text-[12px] md:text-[14px]">
                          <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Unit Perusahaan</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-center">Tipe</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">No. SK Penetapan</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide">Lokasi Penanaman</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Luas SK (Ha)</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Tanam (Ha)</th>
                              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-gray-700 uppercase text-[10px] md:text-xs tracking-wide text-right">Serah Terima (Ha)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {dashboardExecCompanies.flatMap((c) => {
                              const tasks = obligationsData[c.id] || [];
                              const currentYear = new Date().getFullYear();
                              return tasks.map((taskData, idx) => {
                                const statusKey = getTaskExecStatus(c, taskData, currentYear);
                                if (statusKey !== selectedExecStatus) return null;
                                
                                const totals = getTaskTotals(taskData);
                                const luasSK = Number(taskData.luas) || 0;
                                
                                return (
                                  <tr key={`${c.id}-${taskData.id || idx}`} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 md:px-6 py-3 md:py-4">
                                      <p className="font-bold text-gray-900">{c.name}</p>
                                      <p className="text-[10px] md:text-[11px] text-gray-500 mt-1">{c.sector}</p>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                                      <span className={`text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                                    </td>
                                    <td className="px-4 md:px-6 py-3 md:py-4"><span className="font-mono text-[10px] md:text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded border border-gray-200">{taskData.sk_lokasi || '-'}</span></td>
                                    <td className="px-4 md:px-6 py-3 md:py-4"><span className="text-[10px] md:text-[11px] font-bold text-gray-600">{taskData.lokasi || '-'}</span></td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right font-bold text-gray-800">{luasSK.toLocaleString('id-ID')}</td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right"><span className="font-bold text-indigo-700">{totals.realisasi_tanam.toLocaleString('id-ID')}</span></td>
                                    <td className="px-4 md:px-6 py-3 md:py-4 text-right"><span className="font-bold text-emerald-700">{totals.luas_serah_terima.toLocaleString('id-ID')}</span></td>
                                  </tr>
                                );
                              }).filter(Boolean);
                            })}
                            {dashboardExecCompanies.length === 0 && (
                              <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">Tidak ada data untuk kategori ini</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ================= MANAJEMEN DATA (TABEL & FORM) ================= */}
          {activeTab === 'companies' && (
            <div className="flex flex-col gap-6 pb-10 animate-in fade-in duration-500 w-full">
              
              {/* MODUL PERINGATAN CERDAS (SMART EWS) */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8">
                <h3 className="text-base md:text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                  <Activity className="w-5 h-5 md:w-6 md:h-6 text-rose-600 shrink-0" />
                  <span className="truncate">Rincian Peringatan Cerdas (EWS)</span>
                  <span className="bg-rose-100 text-rose-700 px-2.5 md:px-3 py-1 rounded-md text-[10px] md:text-xs shrink-0 whitespace-nowrap">{smartAlerts.length} Peringatan</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {smartAlerts.map(alert => (
                    <div key={alert.id} className="bg-gray-50 p-4 md:p-5 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                         style={{ borderLeftColor: alert.type === 'SP3' ? '#ef4444' : (alert.type === 'SP2' ? '#f97316' : '#eab308') }}>
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <span className="font-bold text-[12px] md:text-[14px] text-gray-900 line-clamp-2">{alert.company}</span>
                          <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-md border uppercase tracking-widest shrink-0 ${alert.type === 'SP3' ? 'bg-red-50 text-red-700 border-red-200' : (alert.type === 'SP2' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200')}`}>{alert.type}</span>
                        </div>
                        <p className="text-[11px] md:text-[13px] text-gray-600 leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                  {smartAlerts.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center p-6 md:p-8 bg-green-50 rounded-2xl border border-green-200 border-dashed">
                      <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-500 mb-3 opacity-50" />
                      <p className="text-base md:text-lg font-black text-green-800 tracking-tight">Kondisi Terkendali</p>
                      <p className="text-xs md:text-sm text-green-600 font-semibold mt-1 text-center">Semua unit perusahaan dalam batas aman. Tidak ada peringatan EWS.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* TABEL MANAJEMEN DATA */}
              <div className={`bg-white rounded-3xl border border-gray-100 shadow-xl flex flex-col transition-all duration-700 w-full overflow-hidden ${selectedCompany ? 'h-[300px] shrink-0' : 'flex-1 min-h-[600px]'}`}>
                <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between xl:items-center gap-4 md:gap-6 bg-gray-50/50">
                  <div className="relative w-full xl:w-96">
                    <Search className="w-4 h-4 md:w-5 md:h-5 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Pencarian Unit Perusahaan..." className="w-full pl-10 md:pl-12 pr-4 md:pr-6 py-3 text-[12px] md:text-[14px] bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 outline-none font-semibold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="flex flex-row items-center gap-2 md:gap-4 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0">
                    <button onClick={exportToCSV} className="flex-1 xl:flex-none px-4 md:px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl md:rounded-2xl text-[10px] md:text-[12px] shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-widest whitespace-nowrap"><Download className="w-3 h-3 md:w-4 md:h-4" /> EXPORT</button>
                    {(userProfile?.role === 'Superadmin' || userProfile?.role === 'Admin') && (
                      <button onClick={handleAddCompany} className="flex-1 xl:flex-none px-4 md:px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-black rounded-xl md:rounded-2xl text-[10px] md:text-[12px] shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-widest whitespace-nowrap"><PlusCircle className="w-3 h-3 md:w-4 md:h-4" /> TAMBAH UNIT</button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto flex-1 text-[12px] md:text-[14px] bg-white w-full relative">
                  <table className="min-w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-50 border-b-2 border-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 md:px-8 py-4 md:py-5 font-black text-gray-500 uppercase text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em]">Entitas & SK</th>
                        <th className="px-4 md:px-8 py-4 md:py-5 font-black text-gray-500 uppercase text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] text-center">Izin</th>
                        <th className="px-4 md:px-8 py-4 md:py-5 font-black text-gray-500 uppercase text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] text-right">Luas SK (Ha)</th>
                        <th className="px-4 md:px-8 py-4 md:py-5 font-black text-gray-500 uppercase text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] text-center">Status</th>
                        <th className="px-4 md:px-8 py-4 md:py-5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {currentCompanies.flatMap((c) => {
                        const tasks = obligationsData[c.id] || [];
                        return tasks.map((t, idx) => (
                          <tr key={`${c.id}-${idx}`} onClick={() => handleEditSelect(c)} className="hover:bg-green-50/50 cursor-pointer transition-all group">
                            <td className="px-4 md:px-8 py-4 md:py-6 max-w-[200px] md:max-w-xs truncate">
                              <p className="font-black text-gray-900 group-hover:text-green-800 transition-colors text-[13px] md:text-base truncate">{c.name}</p>
                              <p className="text-[9px] md:text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest truncate">{c.sector} • SK: {t.sk_lokasi || 'Tanpa SK'} • Lokasi: {t.lokasi || '-'}</p>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 text-center">
                              <span className={`text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 rounded-full border uppercase tracking-[0.1em] ${c.category === 'PPKH' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200'}`}>{c.category}</span>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 text-right font-black text-gray-700">{(Number(t.luas) || 0).toLocaleString('id-ID')}</td>
                            <td className="px-4 md:px-8 py-4 md:py-6 text-center">
                              <span className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black border uppercase tracking-widest shadow-sm ${getStatusColor(t.status || c.status)}`}>{t.status || c.status}</span>
                            </td>
                            <td className="px-4 md:px-8 py-4 md:py-6 text-right"><ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-green-600 transition-all" /></td>
                          </tr>
                        ));
                      })}
                      {currentCompanies.length === 0 && (
                        <tr><td colSpan="5" className="p-8 md:p-10 text-center text-gray-400 font-bold uppercase tracking-widest">Belum Ada Data Unit</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PANEL KONTROL EDIT (MUNCUL SAAT BARIS DI-KLIK) */}
              {selectedCompany && editFormData && (
                <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-200 shadow-2xl flex flex-col shrink-0 animate-in slide-in-from-bottom-6 duration-700 mt-2 md:mt-4 w-full overflow-hidden">
                  <div className="p-4 md:p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div>
                      <h3 className="font-black text-gray-900 text-lg md:text-2xl tracking-tight flex items-center gap-2 md:gap-3">
                        <Edit3 className="w-5 h-5 md:w-7 md:h-7 text-green-700 shrink-0" /> 
                        Panel Kontrol Data Unit
                      </h3>
                      <p className="text-[11px] md:text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Mengelola: <span className="text-green-700 font-black">{editFormData.company.name || 'DATA BARU'}</span></p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end">
                      {showSaveSuccess && <span className="bg-green-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[9px] md:text-[11px] font-black animate-pulse shadow-lg uppercase tracking-widest whitespace-nowrap">SINKRONISASI BERHASIL</span>}
                      <button onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="p-2 md:p-3 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-xl md:rounded-2xl transition-all border border-gray-100 shadow-sm"><X className="w-5 h-5 md:w-6 md:h-6" /></button>
                    </div>
                  </div>

                  <div className="p-4 md:p-10 space-y-6 md:space-y-10 bg-white overflow-y-auto max-h-[70vh] md:max-h-[650px] overflow-x-hidden">
                    
                    {/* ALERT VALIDASI DATA KOSONG */}
                    {validationError && (
                       <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-in zoom-in-95">
                          <AlertTriangle className="w-6 h-6 shrink-0" />
                          <p className="text-sm font-bold">{validationError}</p>
                       </div>
                    )}

                    <section className="bg-gray-50/50 p-4 md:p-8 rounded-2xl md:rounded-3xl border border-gray-100">
                      <h4 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 md:mb-6 border-b pb-3 md:pb-4">Identitas Dasar Perusahaan</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                        <div>
                           <label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Nama Unit / Perusahaan</label>
                           <input type="text" className={`w-full px-4 py-3 border rounded-xl md:rounded-2xl shadow-sm text-sm font-bold ${validationError && !editFormData.company.name.trim() ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-green-600'}`} value={editFormData.company.name} onChange={(e) => handleCompanyChange('name', e.target.value)} />
                        </div>
                        <div><label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Sektor Industri</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl md:rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 font-bold text-sm" value={editFormData.company.sector || ''} onChange={(e) => handleCompanyChange('sector', e.target.value)} /></div>
                        <div>
                           <label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Kategori Perizinan</label>
                           <select className={`w-full px-4 py-3 border rounded-xl md:rounded-2xl shadow-sm text-sm font-black ${validationError && !editFormData.company.category ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-green-600'}`} value={editFormData.company.category} onChange={(e) => handleCompanyChange('category', e.target.value)}><option value="PPKH">PPKH</option><option value="PKTMKH">PKTMKH</option></select>
                        </div>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 md:mb-6 px-1">Manajemen Rincian Kewajiban Penanaman</h4>
                      {editFormData.tasks.map((task, index) => (
                        <div key={task.id} className="bg-white border-2 border-gray-100 rounded-2xl md:rounded-3xl p-4 md:p-8 mb-6 md:mb-8 shadow-sm relative overflow-hidden w-full">
                          <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-green-700"></div>
                          {editFormData.tasks.length > 1 && (
                            <button onClick={() => removeTaskBlock(index)} className="absolute top-3 right-3 md:top-6 md:right-6 text-red-400 hover:text-red-600 bg-white rounded-full p-1.5 md:p-2 shadow-sm border border-gray-200 transition-colors" title="Hapus Kewajiban Ini"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10 pt-4 md:pt-0 pr-4 md:pr-10">
                             <div>
                               <label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Jenis Kewajiban</label>
                               <select className="w-full px-4 py-3 border border-gray-200 rounded-xl md:rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 font-bold text-sm" value={task.task} onChange={(e) => handleTaskChange(index, 'task', e.target.value)}>
                                 <option value="Rehabilitasi DAS">Rehabilitasi DAS</option>
                                 <option value="Reklamasi Hutan">Reklamasi Hutan</option>
                                 <option value="Reboisasi Areal Pengganti">Reboisasi Areal Pengganti</option>
                               </select>
                             </div>
                             <div>
                               <label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">No. SK Penetapan</label>
                               <input type="text" className={`w-full px-4 py-3 border rounded-xl md:rounded-2xl font-mono font-bold shadow-sm text-sm ${validationError && (!task.sk_lokasi || !task.sk_lokasi.trim()) ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-green-600'}`} value={task.sk_lokasi} onChange={(e) => handleTaskChange(index, 'sk_lokasi', e.target.value)} placeholder="No. SK" />
                             </div>
                             <div>
                               <label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Tanggal SK (Untuk EWS)</label>
                               <input type="date" className={`w-full px-4 py-3 border rounded-xl md:rounded-2xl font-bold shadow-sm text-xs md:text-sm uppercase ${validationError && !task.tanggal_sk ? 'border-red-500 ring-2 ring-red-200 text-red-700' : 'border-gray-200 focus:ring-2 focus:ring-green-600 text-gray-700'}`} value={task.tanggal_sk || ''} onChange={(e) => handleTaskChange(index, 'tanggal_sk', e.target.value)} />
                             </div>
                             
                             <div><label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Lokasi Penanaman</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl md:rounded-2xl font-bold shadow-sm focus:ring-2 focus:ring-green-600 text-sm" value={task.lokasi || ''} onChange={(e) => handleTaskChange(index, 'lokasi', e.target.value)} placeholder="Nama Hutan/Desa" /></div>
                             <div>
                               <label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Total Luas SK (Ha)</label>
                               <input type="number" step="any" className={`w-full px-4 py-3 border rounded-xl md:rounded-2xl font-black text-base md:text-lg shadow-sm ${validationError && (!task.luas || Number(task.luas) <= 0) ? 'border-red-500 ring-2 ring-red-200 text-red-700' : 'border-gray-200 focus:ring-2 focus:ring-green-600 text-green-700'}`} value={task.luas || ''} onChange={(e) => handleTaskChange(index, 'luas', e.target.value)} placeholder="0.00" />
                             </div>
                             <div>
                               <label className="block text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 md:mb-2">Sanksi Admin</label>
                               <select className="w-full px-4 py-3 border border-gray-200 rounded-xl md:rounded-2xl shadow-sm focus:ring-2 focus:ring-green-600 font-black text-sm" value={task.status || 'Tertib'} onChange={(e) => handleTaskChange(index, 'status', e.target.value)}>
                                 <option value="Tertib" className="text-green-700">TERTIB</option>
                                 <option value="SP1" className="text-yellow-700">SP1</option>
                                 <option value="SP2" className="text-orange-700">SP2</option>
                                 <option value="SP3" className="text-red-700">SP3</option>
                               </select>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                             {/* Upload Dokumen SK ke Cloud */}
                             <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col justify-center">
                                <label className="block text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5"/> Scan SK Penetapan (PDF)</label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-3 bg-white border border-gray-100 rounded-xl shadow-sm gap-3">
                                   <span className="text-[11px] md:text-[12px] font-semibold text-gray-700 truncate w-full sm:max-w-[150px] xl:max-w-[250px]" title={task.file_sk_name}>{task.file_sk_name || 'Belum ada dokumen PDF'}</span>
                                   <div className="flex gap-2 w-full sm:w-auto justify-end">
                                      {task.file_sk_name && (
                                         <button type="button" onClick={(e) => handleOpenDocument(e, task.file_sk_url, task.file_sk_name)} className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-colors" title="Buka Dokumen">
                                            <Eye className="w-4 h-4 md:w-4 md:h-4" />
                                         </button>
                                      )}
                                      <input type="file" accept=".pdf" className="hidden" id={`upload-sk-${index}`} onChange={(e) => handleFileUpload(index, 'file_sk', e.target.files[0])} disabled={isUploading} />
                                      <label htmlFor={`upload-sk-${index}`} className={`px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] md:text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-100'}`}>
                                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>} 
                                        {task.file_sk_name ? 'Ubah File' : 'Upload Cloud'}
                                      </label>
                                   </div>
                                </div>
                             </div>

                             {/* Upload Dokumen Serah Terima ke Cloud */}
                             <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col justify-center">
                                <label className="block text-[10px] md:text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5"/> Dokumen Serah Terima (PDF)</label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-3 bg-white border border-gray-100 rounded-xl shadow-sm gap-3">
                                   <span className="text-[11px] md:text-[12px] font-semibold text-gray-700 truncate w-full sm:max-w-[150px] xl:max-w-[250px]" title={task.file_bast_name}>{task.file_bast_name || 'Belum ada dokumen PDF'}</span>
                                   <div className="flex gap-2 w-full sm:w-auto justify-end">
                                      {task.file_bast_name && (
                                         <button type="button" onClick={(e) => handleOpenDocument(e, task.file_bast_url, task.file_bast_name)} className="p-1.5 md:p-2 text-orange-600 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-200 transition-colors" title="Buka Dokumen">
                                            <Eye className="w-4 h-4 md:w-4 md:h-4" />
                                         </button>
                                      )}
                                      <input type="file" accept=".pdf" className="hidden" id={`upload-bast-${index}`} onChange={(e) => handleFileUpload(index, 'file_bast', e.target.files[0])} disabled={isUploading}/>
                                      <label htmlFor={`upload-bast-${index}`} className={`px-3 py-1.5 md:px-4 md:py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-[10px] md:text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-orange-100'}`}>
                                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>} 
                                        {task.file_bast_name ? 'Ubah File' : 'Upload Cloud'}
                                      </label>
                                   </div>
                                </div>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 overflow-x-hidden">
                             <div className="bg-gray-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm w-full">
                               <label className="text-[10px] md:text-[11px] font-black text-blue-800 uppercase mb-3 md:mb-4 block border-b pb-2 md:pb-3 tracking-widest">RIWAYAT RKP</label>
                               {(task.riwayat_rkp || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-1.5 md:gap-2 mb-2 md:mb-3 items-center w-full">
                                    <input type="number" className="w-14 md:w-20 px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_rkp', hi, 'tahun', e.target.value)} placeholder="Thn" />
                                    <input type="number" className="flex-1 px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl font-black text-blue-700 text-[10px] md:text-xs min-w-0" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_rkp', hi, 'luas', e.target.value)} placeholder="Luas" />
                                    <button onClick={() => removeHistory(index, 'riwayat_rkp', hi)} className="text-red-300 hover:text-red-600 transition-colors p-1 shrink-0"><XSquare className="w-4 h-4 md:w-5 md:h-5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_rkp')} className="w-full mt-2 md:mt-3 py-1.5 md:py-2 border-2 border-dashed border-blue-200 text-[9px] md:text-[10px] text-blue-600 font-black rounded-lg md:rounded-xl hover:bg-blue-100 transition-all uppercase tracking-widest">+ TAHUN RKP</button>
                             </div>
                             
                             <div className="bg-gray-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm w-full">
                               <label className="text-[10px] md:text-[11px] font-black text-green-800 uppercase mb-3 md:mb-4 block border-b pb-2 md:pb-3 tracking-widest">REALISASI TANAM</label>
                               {(task.riwayat_tanam || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-1.5 md:gap-2 mb-2 md:mb-3 items-center w-full">
                                    <input type="number" placeholder="Thn" className="w-12 md:w-16 px-1.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_tanam', hi, 'tahun', e.target.value)} />
                                    <input type="number" placeholder="Luas" className="w-14 md:w-16 px-1.5 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl font-black text-green-700 text-[10px] md:text-xs min-w-0" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_tanam', hi, 'luas', e.target.value)} />
                                    <select className="flex-1 px-1 md:px-2 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black text-gray-700 min-w-0" value={r.status || 'P0'} onChange={(e) => updateHistory(index, 'riwayat_tanam', hi, 'status', e.target.value)}>
                                       <option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option>
                                    </select>
                                    <button onClick={() => removeHistory(index, 'riwayat_tanam', hi)} className="text-red-300 hover:text-red-600 transition-colors p-1 shrink-0"><XSquare className="w-4 h-4 md:w-5 md:h-5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_tanam')} className="w-full mt-2 md:mt-3 py-1.5 md:py-2 border-2 border-dashed border-green-200 text-[9px] md:text-[10px] text-green-600 font-black rounded-lg md:rounded-xl hover:bg-green-100 transition-all uppercase tracking-widest">+ TAHUN TANAM</button>
                             </div>
                             
                             <div className="bg-gray-50 p-4 md:p-6 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm w-full">
                               <label className="text-[10px] md:text-[11px] font-black text-orange-800 uppercase mb-3 md:mb-4 block border-b pb-2 md:pb-3 tracking-widest">SERAH TERIMA</label>
                               {(task.riwayat_serah_terima || []).map((r, hi) => (
                                 <div key={hi} className="flex gap-1.5 md:gap-2 mb-2 md:mb-3 items-center w-full">
                                    <input type="number" className="w-14 md:w-20 px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl font-bold text-[10px] md:text-xs" value={r.tahun} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', hi, 'tahun', e.target.value)} placeholder="Thn" />
                                    <input type="number" className="flex-1 px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl font-black text-orange-700 text-[10px] md:text-xs min-w-0" value={r.luas} onChange={(e) => updateHistory(index, 'riwayat_serah_terima', hi, 'luas', e.target.value)} placeholder="Luas" />
                                    <button onClick={() => removeHistory(index, 'riwayat_serah_terima', hi)} className="text-red-300 hover:text-red-600 transition-colors p-1 shrink-0"><XSquare className="w-4 h-4 md:w-5 md:h-5"/></button>
                                 </div>
                               ))}
                               <button type="button" onClick={() => addHistory(index, 'riwayat_serah_terima')} className="w-full mt-2 md:mt-3 py-1.5 md:py-2 border-2 border-dashed border-orange-200 text-[9px] md:text-[10px] text-orange-600 font-black rounded-lg md:rounded-xl hover:bg-orange-100 transition-all uppercase tracking-widest">+ TAHUN SERAH TERIMA</button>
                             </div>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={handleAddTaskBlock} className="w-full py-4 md:py-5 border-2 border-dashed border-gray-200 text-gray-400 rounded-2xl md:rounded-3xl font-black hover:bg-gray-50 hover:text-green-700 hover:border-green-300 transition-all uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs">+ TAMBAH BLOK SK BARU</button>
                    </section>
                  </div>

                  <div className="p-4 md:p-10 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3 md:gap-5 shrink-0">
                    <button type="button" onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="w-full sm:w-auto px-6 md:px-10 py-3 md:py-4 bg-white border border-gray-200 rounded-xl md:rounded-2xl font-black text-gray-500 transition-all hover:bg-gray-100 uppercase tracking-widest text-[10px] md:text-xs">BATAL</button>
                    <button type="button" onClick={handleSaveChanges} disabled={isUploading} className={`w-full sm:w-auto px-8 md:px-12 py-3 md:py-4 text-white font-black rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl flex items-center justify-center gap-2 md:gap-3 transition-all uppercase tracking-[0.1em] text-[10px] md:text-xs ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 transform active:scale-95'}`}>
                        {isUploading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />} 
                        {isUploading ? 'MENGUNGGAH DOKUMEN...' : 'SIMPAN KE DATABASE'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISUALIZATION TAB (PROGRES PER UNIT) */}
          {activeTab === 'visualization' && (
            <div className="space-y-6 pb-10 animate-in fade-in duration-500 w-full">
               <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sticky top-0 z-20 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200 w-full md:w-fit overflow-x-auto whitespace-nowrap">
                    <button onClick={() => setFilterCategory('Semua')} className={`flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-md font-semibold transition-all text-xs md:text-[13px] ${filterCategory === 'Semua' ? 'bg-white text-gray-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Semua</button>
                    <button onClick={() => setFilterCategory('PPKH')} className={`flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 text-xs md:text-[13px] ${filterCategory === 'PPKH' ? 'bg-white text-amber-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}><Mountain className="w-3 h-3 md:w-3.5 md:h-3.5" /> PPKH</button>
                    <button onClick={() => setFilterCategory('PKTMKH')} className={`flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 text-xs md:text-[13px] ${filterCategory === 'PKTMKH' ? 'bg-white text-green-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}><Leaf className="w-3 h-3 md:w-3.5 md:h-3.5" /> PKTMKH</button>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Cari nama unit perusahaan..." className="w-full pl-9 pr-4 py-2 md:py-2.5 text-xs md:text-[13px] bg-gray-50 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {filteredCompanies.flatMap(company => {
                    const tasks = obligationsData[company.id] || [];
                    return tasks.map((task, idx) => {
                      const luasSK = Number(task.luas) || 1; 
                      const totals = getTaskTotals(task);
                      const pctRKP = Math.min(100, (totals.luas_rkp / luasSK) * 100);
                      const pctTanam = Math.min(100, (totals.realisasi_tanam / luasSK) * 100);
                      const pctST = Math.min(100, (totals.luas_serah_terima / luasSK) * 100);

                      return (
                        <div key={`${company.id}-${task.id || idx}`} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4 md:mb-6 border-b border-gray-100 pb-3 md:pb-4">
                            <div className="pr-2">
                              <p className="font-bold text-gray-900 text-base md:text-lg mb-1">{company.name}</p>
                              <p className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">{task.task} {task.lokasi ? `• ${task.lokasi}` : ''}</p>
                            </div>
                            <div className="text-right shrink-0">
                               <span className={`px-2 py-1 md:px-2.5 md:py-1 rounded border text-[9px] md:text-[11px] font-bold uppercase mb-2 inline-block ${getStatusColor(task.status || company.status)}`}>{task.status || company.status}</span>
                               <p className="text-[10px] md:text-[12px] font-bold text-gray-700 bg-gray-50 px-2 py-1 md:px-3 md:py-1.5 rounded-md border border-gray-200 whitespace-nowrap">SK: {luasSK.toLocaleString('id-ID')} Ha</p>
                            </div>
                          </div>

                          <div className="space-y-4 md:space-y-5">
                            <div>
                              <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1.5 md:mb-2">
                                <span className="text-gray-700">RKP <span className="text-gray-500">({totals.luas_rkp} Ha)</span></span>
                                <span className="text-blue-700">{pctRKP.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 md:h-2.5 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${pctRKP}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1.5 md:mb-2">
                                <span className="text-gray-700">Tanam <span className="text-gray-500">({totals.realisasi_tanam} Ha)</span></span>
                                <span className="text-green-700">{pctTanam.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 md:h-2.5 rounded-full overflow-hidden">
                                <div className="bg-green-600 h-full transition-all duration-1000" style={{ width: `${pctTanam}%` }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1.5 md:mb-2">
                                <span className="text-gray-700">Serah Terima <span className="text-gray-500">({totals.luas_serah_terima} Ha)</span></span>
                                <span className="text-orange-700">{pctST.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 h-2 md:h-2.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${pctST}%` }}></div>
                              </div>
                            </div>
                            
                            {/* Download Dokumen Section (Card) */}
                            <div className="flex flex-wrap gap-2 md:gap-3 pt-3 border-t border-gray-100 mt-2">
                               {task.file_sk_name && (
                                  <button onClick={(e) => handleOpenDocument(e, task.file_sk_url, task.file_sk_name)} className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors" title={`Buka SK: ${task.file_sk_name}`}>
                                     <Cloud className="w-3 h-3" /> Buka SK Asli
                                  </button>
                               )}
                               {task.file_bast_name && (
                                  <button onClick={(e) => handleOpenDocument(e, task.file_bast_url, task.file_bast_name)} className="flex items-center gap-1.5 text-[10px] md:text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1.5 rounded border border-orange-100 hover:bg-orange-100 transition-colors" title={`Buka Dokumen Serah Terima: ${task.file_bast_name}`}>
                                     <Cloud className="w-3 h-3" /> Buka BAST Asli
                                  </button>
                               )}
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
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body { 
            font-family: 'Tahoma', sans-serif; 
            font-size: 11pt; 
            padding: 10px 20px; 
            color: #000; 
            line-height: 1.5;
          }
          .kop-surat {
            display: flex;
            flex-direction: column;
            align-items: center;
            border-bottom: 4px solid #000;
            padding-bottom: 15px;
            margin-bottom: 25px;
            text-align: center;
          }
          .kop-text h2 { margin: 0 0 5px 0; font-size: 15pt; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
          .kop-text p { margin: 0; font-size: 12pt; }
          .doc-title { text-align: center; margin-bottom: 25px; }
          .doc-title h1 { margin: 0 0 5px 0; font-size: 14pt; text-transform: uppercase; text-decoration: underline; }
          .doc-title p { margin: 0; font-size: 12pt; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: middle; word-wrap: break-word;}
          th { background-color: #e5e7eb; font-weight: bold; text-align: center; text-transform: uppercase; font-size: 9pt; }
          .footer { margin-top: 50px; display: flex; justify-content: flex-end; padding-right: 40px; }
          .ttd-box { text-align: center; width: 240px; }
          .ttd-box p { margin: 0; font-size: 12pt; }
        </style>
      </head>
      <body>
        <div class="kop-surat">
          <div class="kop-text">
            <h2>KEMENTERIAN KEHUTANAN</h2>
            <h2>BPDAS KAHAYAN</h2>
            <p>Sistem Pengawasan Pemenuhan Kewajiban PPKH dan PKTMKH</p>
          </div>
        </div>
        
        <div class="doc-title">
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>

        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${dataRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>

        <div class="footer">
          <div class="ttd-box">
            <p style="text-align: left; margin-bottom: 80px;">Dicetak pada: ${currentDate}</p>
            <p style="font-weight: bold;">( ........................ )</p>
            <p>NIP. ........................</p>
          </div>
        </div>
      </body>
    </html>
  `;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
