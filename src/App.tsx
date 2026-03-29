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
// KONFIGURASI FIREBASE CLOUD
// ==========================================
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, onSnapshot } from 'firebase/firestore';

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

// ==========================================
// KOMPONEN LOGO
// ==========================================
const LogoBPDAS = ({ className }) => (
  <img src="/logo-kemenhut.png" alt="Logo" className={`object-contain ${className}`} onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan_Republik_Indonesia.svg/200px-Logo_Kementerian_Lingkungan_Hidup_dan_Kehutanan_Republik_Indonesia.svg.png'; }} />
);

export default function App() {
  const [authView, setAuthView] = useState('landing');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [companiesData, setCompaniesData] = useState([]);
  const [obligationsData, setObligationsData] = useState({});
  const [dashboardCategory, setDashboardCategory] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthView('app');
      } else {
        setUser(null);
        setAuthView('landing');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setIsDbReady(true); return; }
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

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      setLoginError('Email atau password salah.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthView('landing');
  };

  const getTaskTotals = (task) => {
    const luas_rkp = (task.riwayat_rkp || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const realisasi_tanam = (task.riwayat_tanam || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    const luas_serah_terima = (task.riwayat_serah_terima || []).reduce((sum, item) => sum + (Number(item.luas) || 0), 0);
    return { luas_rkp, realisasi_tanam, luas_serah_terima };
  };

  const handleEditSelect = (company) => {
    setSelectedCompany(company);
    setEditFormData({ isNew: false, company: { ...company }, tasks: obligationsData[company.id] || [] });
  };

  const handleSaveChanges = async () => {
    const compId = editFormData.company.id.toString();
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'companies', compId), editFormData.company);
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'obligations', compId), { tasks: editFormData.tasks });
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const areaStats = useMemo(() => {
    let totalDAS = 0, totalReklamasi = 0, totalReboisasi = 0;
    companiesData.forEach((company) => {
      if (dashboardCategory === 'Semua' || company.category === dashboardCategory) {
        const obligations = obligationsData[company.id] || [];
        obligations.forEach((ob) => {
          if (ob.task === 'Rehabilitasi DAS') totalDAS += Number(ob.luas) || 0;
          if (ob.task === 'Reklamasi Hutan') totalReklamasi += Number(ob.luas) || 0;
          if (ob.task === 'Reboisasi Areal Pengganti') totalReboisasi += Number(ob.luas) || 0;
        });
      }
    });
    return { totalDAS, totalReklamasi, totalReboisasi };
  }, [dashboardCategory, companiesData, obligationsData]);

  if (!isDbReady && user) return <div className="h-screen flex items-center justify-center bg-green-900 text-white">Menghubungkan Data...</div>;

  if (authView === 'landing') {
    return (
      <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000')` }}></div>
        <div className="absolute inset-0 bg-green-950/80"></div>
        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          <div className="w-24 h-24 mb-8"><LogoBPDAS className="w-full h-full" /></div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Sistem Monitoring Kewajiban <br/><span className="text-green-400">PPKH dan PKTMKH</span></h1>
          <button onClick={() => setAuthView('login')} className="px-10 py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl text-lg shadow-xl transition-all">MASUK APLIKASI</button>
        </div>
      </div>
    );
  }

  if (authView === 'login') {
    return (
      <div className="h-screen flex items-center justify-center bg-green-950 p-6">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4"><LogoBPDAS className="w-full h-full" /></div>
            <h2 className="text-2xl font-black text-gray-800 uppercase">Login Portal</h2>
          </div>
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <input type="email" placeholder="Email" required onChange={(e) => setLoginEmail(e.target.value)} className="w-full px-5 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-green-600" />
            <input type="password" placeholder="Password" required onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-5 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-green-600" />
            <button type="submit" className="w-full py-4 bg-green-700 text-white font-black rounded-xl uppercase tracking-widest">Login</button>
          </form>
          <button onClick={() => setAuthView('landing')} className="w-full mt-4 text-gray-400 text-sm font-bold">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-green-900 flex flex-col shadow-2xl transition-all duration-300`}>
        <div className="p-6 border-b border-green-800 flex flex-col items-center">
          <div className="w-16 h-16 mb-2"><LogoBPDAS className="w-full h-full" /></div>
          {isSidebarOpen && <h1 className="text-white font-black text-sm uppercase">BPDAS KAHAYAN</h1>}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-green-700 text-white shadow-lg' : 'text-green-100 hover:bg-green-800'}`}><LayoutDashboard className="w-5 h-5 mr-3" /> {isSidebarOpen && "Dashboard"}</button>
          <button onClick={() => setActiveTab('companies')} className={`flex items-center w-full p-3 rounded-xl transition-all ${activeTab === 'companies' ? 'bg-green-700 text-white shadow-lg' : 'text-green-100 hover:bg-green-800'}`}><Database className="w-5 h-5 mr-3" /> {isSidebarOpen && "Manajemen Data"}</button>
          <button onClick={handleLogout} className="flex items-center w-full p-3 text-red-300 hover:bg-red-500 hover:text-white rounded-xl mt-10 transition-all font-bold"><ArrowLeft className="w-5 h-5 mr-3" /> {isSidebarOpen && "Keluar"}</button>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b p-6 flex justify-between items-center shadow-sm">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><Menu /></button>
          <h2 className="font-black text-gray-800 uppercase tracking-tight">Monitoring PPKH & PKTMKH</h2>
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-gray-400 uppercase">{user?.email}</span>
             <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-black text-green-800">A</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex bg-white p-1 rounded-xl border w-fit shadow-sm">
                  <button onClick={() => setDashboardCategory('Semua')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase ${dashboardCategory === 'Semua' ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500'}`}>Semua</button>
                  <button onClick={() => setDashboardCategory('PPKH')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase ${dashboardCategory === 'PPKH' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-500'}`}>PPKH</button>
                  <button onClick={() => setDashboardCategory('PKTMKH')} className={`px-6 py-2 rounded-lg font-bold text-xs uppercase ${dashboardCategory === 'PKTMKH' ? 'bg-green-700 text-white shadow-md' : 'text-gray-500'}`}>PKTMKH</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-8 rounded-3xl border shadow-sm border-b-8 border-b-green-600">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Rehabilitasi DAS</p>
                     <p className="text-4xl font-black text-green-800">{areaStats.totalDAS.toLocaleString('id-ID')} <span className="text-sm">Ha</span></p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border shadow-sm border-b-8 border-b-amber-500">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reklamasi Hutan</p>
                     <p className="text-4xl font-black text-amber-600">{areaStats.totalReklamasi.toLocaleString('id-ID')} <span className="text-sm">Ha</span></p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border shadow-sm border-b-8 border-b-blue-500">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reboisasi Pengganti</p>
                     <p className="text-4xl font-black text-blue-600">{areaStats.totalReboisasi.toLocaleString('id-ID')} <span className="text-sm">Ha</span></p>
                  </div>
               </div>

               <div className="bg-white p-10 rounded-3xl border shadow-xl">
                  <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2"><PieChart className="text-green-600"/> Rekapitulasi progres pemenuhan kewajiban pemegang PPKH dan PKTMKH</h3>
                  <div className="space-y-8">
                     <div>
                        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase mb-2"><span>RKP</span><span>{globalProgress.pctRKP.toFixed(1)}%</span></div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner"><div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${globalProgress.pctRKP}%` }}></div></div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase mb-2"><span>Tanam</span><span>{globalProgress.pctTanam.toFixed(1)}%</span></div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner"><div className="bg-green-600 h-full transition-all duration-1000" style={{ width: `${globalProgress.pctTanam}%` }}></div></div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase mb-2"><span>BAST</span><span>{globalProgress.pctST.toFixed(1)}%</span></div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden shadow-inner"><div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${globalProgress.pctST}%` }}></div></div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
               <div className={`bg-white rounded-3xl border shadow-xl flex flex-col transition-all duration-500 ${selectedCompany ? 'h-[300px]' : 'flex-1 min-h-[500px]'}`}>
                  <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                     <div className="relative w-full max-w-md">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Cari unit perusahaan..." className="w-full pl-12 pr-6 py-3 bg-white border rounded-2xl outline-none font-semibold shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                     </div>
                     <button onClick={handleAddCompany} className="px-6 py-3 bg-green-700 text-white font-black rounded-2xl text-xs tracking-widest shadow-lg">+ UNIT BARU</button>
                  </div>
                  <div className="overflow-auto flex-1 p-4">
                     <table className="w-full text-left">
                        <thead>
                           <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                              <th className="p-4">Unit Perusahaan</th>
                              <th className="p-4 text-center">Izin</th>
                              <th className="p-4 text-right">Luas (Ha)</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4"></th>
                           </tr>
                        </thead>
                        <tbody>
                           {companiesData.map((c, i) => (
                              <tr key={i} onClick={() => handleEditSelect(c)} className="hover:bg-green-50 transition-all cursor-pointer group">
                                 <td className="p-4 font-black text-gray-900 group-hover:text-green-800">{c.name}</td>
                                 <td className="p-4 text-center"><span className="text-[9px] font-black px-2 py-1 rounded-full border border-green-200 text-green-700 bg-green-50 uppercase">{c.category}</span></td>
                                 <td className="p-4 text-right font-black text-gray-600">{c.luas || 0}</td>
                                 <td className="p-4 text-center"><span className="px-4 py-1 rounded-full text-[10px] font-black bg-gray-100 text-gray-500 uppercase">{c.status}</span></td>
                                 <td className="p-4 text-right"><ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-600" /></td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {selectedCompany && (
                  <div className="bg-white rounded-3xl border shadow-2xl p-10 space-y-10 animate-in slide-in-from-bottom-10 duration-700">
                     <div className="flex justify-between items-center border-b pb-6">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detail Unit: <span className="text-green-700">{editFormData.company.name}</span></h3>
                        <div className="flex gap-4">
                           {showSaveSuccess && <span className="bg-green-600 text-white px-6 py-2 rounded-full text-[10px] font-black animate-pulse uppercase tracking-widest shadow-lg">Data Tersimpan</span>}
                           <button onClick={() => { setSelectedCompany(null); setEditFormData(null); }} className="p-3 text-gray-400 hover:text-red-600"><X /></button>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Nama Perusahaan</label>
                           <input type="text" className="w-full px-6 py-4 bg-gray-50 border rounded-2xl font-bold text-lg" value={editFormData.company.name} onChange={(e) => handleCompanyChange('name', e.target.value)} />
                        </div>
                        <div className="space-y-6">
                           <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Status Unit</label>
                           <select className="w-full px-6 py-4 bg-gray-50 border rounded-2xl font-black text-lg text-green-700" value={editFormData.company.status} onChange={(e) => handleCompanyChange('status', e.target.value)}>
                              <option value="Tertib">TERTIB</option><option value="SP1">SP1</option><option value="SP2">SP2</option><option value="SP3">SP3</option>
                           </select>
                        </div>
                     </div>
                     <button onClick={handleSaveChanges} className="w-full py-5 bg-green-700 hover:bg-green-800 text-white font-black rounded-2xl shadow-2xl transition-all transform active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2"><Save className="w-5 h-5"/> Simpan Perubahan Data</button>
                  </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
