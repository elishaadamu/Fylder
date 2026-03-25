import React, { useState, useEffect } from "react";
import axios from "axios";
import { config } from "../../config/config.jsx";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  CreditCard, 
  History, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { 
  Card, 
  Progress, 
  Tag, 
  Button, 
  Skeleton, 
  Row, 
  Col,
  Typography
} from "antd";
import { toast } from "react-toastify";
import {
  FiCopy,
  FiKey
} from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { format } from "date-fns";

const { Title, Text } = Typography;

const ApiUserHome = ({ user, userId }) => {
  const [loading, setLoading] = useState(true);
  const [basicInfo, setBasicInfo] = useState(null);
  const [walletInfo, setWalletInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [targets, setTargets] = useState([]);
  const [salesVolume, setSalesVolume] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositVisible, setDepositVisible] = useState(false);

  const openDeposit = () => {
    setIsDepositOpen(true);
    setTimeout(() => setDepositVisible(true), 10);
  };

  const closeDeposit = () => {
    setDepositVisible(false);
    setTimeout(() => setIsDepositOpen(false), 300);
  };

  const handlePaystack = () => {
    if (!window.PaystackPop) {
      toast.error("Paystack is not loaded. Please refresh the page.");
      return;
    }
    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_URL,
      email: user?.email,
      amount: Number(depositAmount) * 100,
      currency: "NGN",
      ref: `AY-${Date.now()}`,
      metadata: {
        userId: user?._id || user?.id || userId,
        name: `${user?.firstName} ${user?.lastName}`,
      },
      callback: function (response) {
        toast.success("Payment successful. Processing...");
        closeDeposit();
      },
      onClose: function () {
        toast.error("Payment closed by user.");
      },
    });
    closeDeposit();
    handler.openIframe();
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (!depositAmount || Number(depositAmount) < 100) {
      toast.error("Minimum deposit amount is ₦100");
      return;
    }
    handlePaystack();
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [infoRes, walletRes, transRes, targetsRes, salesRes, perfRes] = await Promise.all([
          axios.get(`${config.apiBaseUrl}${config.endpoints.ApiUserDashboardInfo}`, { withCredentials: true }),
          axios.get(`${config.apiBaseUrl}${config.endpoints.ApiUserDashboardWallet}`, { withCredentials: true }),
          axios.get(`${config.apiBaseUrl}${config.endpoints.ApiUserDashboardTransactions}`, { withCredentials: true }),
          axios.get(`${config.apiBaseUrl}${config.endpoints.ApiUserTargets}`, { withCredentials: true }),
          axios.get(`${config.apiBaseUrl}${config.endpoints.ApiUserSalesVolume}`, { withCredentials: true }),
          axios.get(`${config.apiBaseUrl}${config.endpoints.ApiUserPerformance}`, { withCredentials: true })
        ]);
        console.log("API Dashboard Responses:", {
          infoRes,
          walletRes,
          transRes,
          targetsRes,
          salesRes,
          perfRes
        });
        const infoData = infoRes.data?.data || infoRes.data;
        const walletData = walletRes.data?.data || walletRes.data;
        const transData = transRes.data?.data || transRes.data;
        const perfData = perfRes.data?.data || perfRes.data;
        const targetsData = targetsRes.data?.data || targetsRes.data;
        const salesData = salesRes.data?.data || salesRes.data;

        setBasicInfo(infoData);
        setWalletInfo(walletData);
        setTransactions(transData?.recentTransactions || transData?.transactions || []);
        setTargets((targetsData?.targets || targetsData || []).map((t, i) => ({
          ...t,
          name: t.name || t.transactionType?.replace(/-/g, ' ') || 'Unnamed Target',
          target: t.defaultWeeklyTarget ?? t.target ?? 100,
          current: t.current ?? 0,
          color: [
            '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', 
            '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'
          ][i % 10]
        })));
        setSalesVolume(salesData || salesData?.volumes);
        setPerformance({
          ...(perfData || perfData?.performance),
          successCount: transData?.totalSuccessful || perfData?.successCount || infoData?.successCount,
          failedCount: transData?.totalFailed || perfData?.failedCount || infoData?.failedCount,
          successRate: perfData?.successRate || (transData?.totalSuccessful !== undefined ? 
            (`${((transData.totalSuccessful / ((transData.totalSuccessful + (transData.totalFailed || 0)) || 1)) * 100).toFixed(1)}%`) 
            : null)
        });
      } catch (error) {
        console.error("Error fetching API dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchAllData();
  }, [userId]);

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`, { position: "top-center" });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[16, 16]}>
          <Col span={8}><Skeleton.Button active block style={{ height: 120 }} /></Col>
          <Col span={8}><Skeleton.Button active block style={{ height: 120 }} /></Col>
          <Col span={8}><Skeleton.Button active block style={{ height: 120 }} /></Col>
        </Row>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  // Calculate Volumes from salesVolume or basicInfo
  const volumes = {
    daily: salesVolume?.dailyVolume ?? salesVolume?.daily ?? basicInfo?.dailyVolume ?? 0,
    weekly: salesVolume?.weeklyVolume ?? salesVolume?.weekly ?? basicInfo?.weeklyVolume ?? 0,
    monthly: salesVolume?.monthlyVolume ?? salesVolume?.monthly ?? basicInfo?.monthlyVolume ?? 0
  };

  const salesVolumeCards = [
    { title: "Daily Volume", amount: volumes.daily, trend: "+12%", color: "blue", icon: <Calendar className="w-5 h-5" /> },
    { title: "Weekly Volume", amount: volumes.weekly, trend: "+8%", color: "indigo", icon: <TrendingUp className="w-5 h-5" /> },
    { title: "Monthly Volume", amount: volumes.monthly, trend: "+15%", color: "purple", icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden bg-[#fafafa]">
      {/* Premium Header */}
      <div className="relative">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-[900] text-slate-900 tracking-tight leading-none">
              API Portal <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600">Pro</span>
            </h1>
            <p className="text-sm text-slate-400 font-medium max-w-xl">Enterprise-grade API management with real-time analytics and shared wallet infrastructure.</p>
          </div>
          
          {basicInfo && (
            <div className="flex flex-wrap items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm flex items-center gap-2 ${
                basicInfo.canProcessVerification 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                  : "bg-rose-50 text-rose-600 border-rose-100"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${basicInfo.canProcessVerification ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                {basicInfo.canProcessVerification ? "Active" : "Restricted"}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-white text-slate-600 border border-slate-200 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <Award size={12} className="text-amber-500" />
                {basicInfo.targetAchievements || 0} Badges
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Volumes Grid — Full Width Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {salesVolumeCards.map((card, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-sky-200 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-slate-50 text-slate-500 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                {card.icon}
              </div>
              {card.amount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black flex items-center gap-1 border border-emerald-100">
                   <TrendingUp className="w-3 h-3" /> {card.trend}
                </span>
              )}
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{card.title}</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight font-mono">
              <span className="text-lg opacity-40 mr-1 font-sans">₦</span>
              {card.amount.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Wallet Card */}
          <div className="relative overflow-hidden bg-[#0F172A] rounded-2xl p-5 md:p-8 text-white shadow-2xl shadow-slate-900/30 group border border-slate-800">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] bg-sky-600/20 blur-[120px] rounded-full group-hover:bg-sky-500/30 transition-all duration-1000"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-1000"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sky-400 uppercase tracking-[0.2em] text-[9px] font-black">
                    <Wallet className="w-3.5 h-3.5" />
                    Shared Wallet
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-400 text-xl font-light">₦</span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                      {(walletInfo?.balance ?? 0).toLocaleString()}
                    </h2>
                  </div>
                </div>
                <div className="p-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
                  <CreditCard className="w-6 h-6 text-sky-400" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-3 border border-white/5 space-y-1.5 hover:border-white/20 transition-all">
                  <p className="text-slate-400 text-[8px] uppercase font-bold tracking-widest">Account No.</p>
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-sm text-white tracking-wide">{walletInfo?.accountNumber || '—'}</span>
                    <button onClick={() => copyToClipboard(walletInfo?.accountNumber, 'Account Number')} className="text-slate-500 hover:text-sky-400 p-1 rounded-lg hover:bg-white/5 transition-all">
                      <FiCopy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-3 border border-white/5 space-y-1.5 hover:border-white/20 transition-all">
                  <p className="text-slate-400 text-[8px] uppercase font-bold tracking-widest">Beneficiary</p>
                  <p className="font-bold text-xs text-white truncate uppercase" title={walletInfo?.accountName}>{walletInfo?.accountName || '—'}</p>
                </div>

                <div className="bg-slate-800/40 backdrop-blur-md rounded-xl p-3 border border-white/5 space-y-1.5 hover:border-white/20 transition-all">
                  <p className="text-slate-400 text-[8px] uppercase font-bold tracking-widest">Bank</p>
                  <p className="font-bold text-sm text-white">{walletInfo?.bankName || 'WEMA BANK'}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button block type="primary" size="large" onClick={openDeposit} className="bg-sky-500 hover:bg-sky-400 border-none h-11 px-8 font-black text-[10px] uppercase tracking-widest shadow-[0_4px_15px_rgba(14,165,233,0.3)] hover:scale-[1.02] transition-all rounded-xl">
                  Add Funds via Card
                </Button>
                <div className="flex items-center gap-3 text-[9px] text-slate-400 font-bold uppercase tracking-widest px-3 py-2 bg-white/5 rounded-lg border border-white/5 whitespace-nowrap">
                  <span className="text-sky-400">Paystack</span> | <span className="text-indigo-400">Monnify</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Count & Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Activity className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Overview</p>
                    <span className="font-black text-[11px] md:text-[13px] text-slate-800 uppercase tracking-widest">Total Transactions</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">
                    {((performance?.successCount || 0) + (performance?.failedCount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              {/* Recent Activity */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm font-black text-slate-900 tracking-tight">Recent Activity</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">API transaction logs</p>
                </div>
                <a href="/dashboard/all-history" className="px-3 py-1.5 rounded-lg bg-slate-50 text-sky-600 text-[9px] font-black uppercase tracking-widest hover:bg-sky-50 transition-colors border border-slate-100">
                  View All
                </a>
              </div>
              <div className="space-y-3">
                {transactions.length > 0 ? transactions.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-sky-200 transition-all cursor-default group gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {item.status === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] bg-slate-50 text-slate-400 py-0.5 px-1.5 rounded font-mono border border-slate-100 truncate max-w-[140px]">{item.transactionReference}</span>
                          <span className="text-[9px] text-slate-300 font-bold uppercase">{item.TransactionType || item.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-black tracking-tight font-mono ${item.type === 'debit' ? 'text-slate-900' : 'text-emerald-500'}`}>
                        {item.type === 'debit' ? '-' : '+'}₦{item.amount.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold tracking-tighter uppercase">{format(new Date(item.createdAt), "HH:mm | MMM dd")}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-medium text-xs">No recent API activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Targets & Resources */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Performance Milestones */}
          <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <span className="font-black text-[11px] md:text-[12px] text-slate-800 uppercase tracking-widest">Milestones</span>
              </div>
              {basicInfo?.targetAchievements >= 0 && (
                <div className="bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  <span className="text-[9px] font-black text-amber-700">{basicInfo.targetAchievements} WON</span>
                </div>
              )}
            </div>

            {/* Tier Banner */}
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 mb-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-sky-100 shrink-0">
                <Target className="w-5 h-5 text-sky-600" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[11px] font-black text-sky-900">Master Verification Tier</p>
                <p className="text-[9px] text-sky-600 font-bold uppercase tracking-widest opacity-70">Weekly Targets</p>
                {basicInfo?.canProcessVerification === false && (
                  <p className="text-[9px] font-bold text-sky-800 mt-1.5 bg-white/60 rounded-lg p-2 border border-sky-200 leading-relaxed">
                    Restricted — Complete targets to restore access.
                  </p>
                )}
              </div>
            </div>

            {/* Target Cards */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {Array.isArray(targets) && targets.length > 0 ? targets.map((target, idx) => (
                <div key={idx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3 hover:border-slate-200 transition-all">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider truncate">{target.name}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 whitespace-nowrap">{(target.current || 0).toLocaleString()} / {(target.target || 0).toLocaleString()}</span>
                  </div>
                  <div className="relative h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${Math.min(100, Math.round(((target.current || 0) / (target.target || 1)) * 100))}%`,
                        backgroundColor: target.color 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.15em]">{Math.min(100, Math.round(((target.current || 0) / (target.target || 1)) * 100))}% Complete</p>
                     <Tag bordered={false} className={`rounded-full px-2 text-[8px] font-black tracking-wider ${(target.current || 0) >= (target.target || 0) ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                       {(target.current || 0) >= (target.target || 0) ? "WON" : "ACTIVE"}
                     </Tag>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-300 italic font-medium text-xs">
                  Loading milestones...
                </div>
              )}
            </div>
          </div>

          {/* Portal Ecosystem */}
          <div className="bg-[#0F172A] p-5 md:p-6 rounded-2xl shadow-xl shadow-slate-900/10 space-y-5 border border-slate-800">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Portal Ecosystem</h3>
            
            <div className="space-y-4">
              {[
                { title: "API Config", desc: "Endpoints & SDKs", icon: <FiKey className="text-sky-400" size={16} />, color: "bg-sky-500/10" },
                { title: "Network", desc: "Node Health", icon: <Activity className="text-indigo-400" size={16} />, color: "bg-indigo-500/10" },
                { title: "Support", desc: "24/7 Ticketing", icon: <TrendingUp className="text-emerald-400" size={16} />, color: "bg-emerald-500/10" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-wider group-hover:text-sky-400 transition-colors">{item.title}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-slate-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              ))}
            </div>

            {walletInfo?.customerId && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.25em]">Identity Token</p>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] text-slate-400 truncate">{walletInfo.customerId}</span>
                  <button onClick={() => copyToClipboard(walletInfo.customerId, 'Token')} className="p-1.5 bg-white/10 rounded-lg hover:bg-sky-500 transition-all text-white">
                    <FiCopy size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Deposit Modal */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50">
          <div
            className={`bg-white rounded-2xl w-[450px] max-w-[90%] p-6 shadow-2xl transform transition-all duration-300 ${
              depositVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-900">Fund Your Wallet</h2>
              <button onClick={closeDeposit} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <IoClose size={22} />
              </button>
            </div>

            <p className="text-sm text-slate-500 mb-5">
              Add funds to your <span className="text-sky-600 font-bold">shared wallet</span> via Paystack.
            </p>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Amount (₦)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  min="100"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg font-bold text-slate-800"
                />
              </div>

              {depositAmount && Number(depositAmount) >= 100 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Deposit</span>
                    <span className="font-bold text-slate-800">₦{Number(depositAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Fee</span>
                    <span className="font-bold text-emerald-600">₦0.00</span>
                  </div>
                  <hr className="my-2 border-slate-100" />
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-600">Total</span>
                    <span className="font-black text-slate-900">₦{Number(depositAmount).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDeposit}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 font-bold text-sm transition-colors shadow-lg shadow-sky-200"
                >
                  Pay with Paystack
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiUserHome;
