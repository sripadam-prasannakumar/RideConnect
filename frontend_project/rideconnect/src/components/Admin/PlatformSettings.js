import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Landmark, ShieldCheck, Percent, CreditCard, User } from 'lucide-react';
import { authorizedFetch } from '../../utils/apiUtils';
import API_BASE_URL from '../../apiConfig';
import GlobalBackButton from '../Shared/GlobalBackButton';

const PlatformSettings = () => {
    const [settings, setSettings] = useState({
        account_holder: '',
        account_number: '',
        ifsc: '',
        upi_id: '',
        commission_percent: 8.0
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        authorizedFetch(`${API_BASE_URL}/api/admin/platform-settings/`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log("Fetched platform settings:", data);
                setSettings({
                    account_holder: data.account_holder || '',
                    account_number: data.account_number || '',
                    ifsc: data.ifsc || '',
                    upi_id: data.upi_id || '',
                    commission_percent: parseFloat(data.commission_percent || 8.0)
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await authorizedFetch(`${API_BASE_URL}/api/admin/platform-settings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                const data = await res.json();
                alert('Platform settings updated successfully!');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error("Save error:", errData);
                alert(`Failed to update settings: ${errData.error || res.statusText}`);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-900/50">
                <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-10 bg-slate-900/50 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-10">
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <GlobalBackButton variant="ghost" className="hover:text-primary border-slate-700" />
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                            <Settings className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight uppercase">Platform Settings</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Configure Admin Payouts & Commission</p>
                        </div>
                    </div>
                </header>

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Bank Details Section */}
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        
                        <div className="flex items-center gap-4 pb-4 border-b border-white/5 relative">
                            <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                <Landmark className="size-5" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-widest">Admin Bank Info</h3>
                        </div>

                        <div className="space-y-6 relative">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Holder Name</label>
                                <div className="relative">
                                    <input 
                                        className="w-full bg-background-dark border-none rounded-2xl px-12 py-4 text-sm font-bold focus:ring-2 focus:ring-primary h-14" 
                                        value={settings.account_holder}
                                        onChange={e => setSettings({...settings, account_holder: e.target.value})}
                                        placeholder="Admin Account Name"
                                        required
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-5" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                                <div className="relative">
                                    <input 
                                        className="w-full bg-background-dark border-none rounded-2xl px-12 py-4 text-sm font-bold focus:ring-2 focus:ring-primary h-14" 
                                        value={settings.account_number}
                                        onChange={e => setSettings({...settings, account_number: e.target.value})}
                                        placeholder="Enter Bank Account Number"
                                        required
                                    />
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-5" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IFSC Code</label>
                                <div className="relative">
                                    <input 
                                        className="w-full bg-background-dark border-none rounded-2xl px-12 py-4 text-sm font-bold focus:ring-2 focus:ring-primary h-14 uppercase" 
                                        value={settings.ifsc}
                                        onChange={e => setSettings({...settings, ifsc: e.target.value.toUpperCase()})}
                                        placeholder="SBIN0001234"
                                        required
                                    />
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 size-5" />
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    {/* Commission & UPI Section */}
                    <div className="space-y-10">
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-8 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl"
                        >
                            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                                <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Percent className="size-5" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-widest">Commission Logic</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commission Percentage (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="range" min="0" max="30" step="0.5"
                                            className="flex-1 accent-primary"
                                            value={settings.commission_percent}
                                            onChange={e => setSettings({...settings, commission_percent: parseFloat(e.target.value)})}
                                        />
                                        <div className="size-14 rounded-2xl bg-primary text-background-dark flex items-center justify-center font-black italic shadow-lg shadow-primary/20">
                                            {settings.commission_percent}%
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase ml-1 italic tracking-tight">This 8% (default) will be deducted from each ride's total amount.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin UPI ID (Optional)</label>
                                    <input 
                                        className="w-full bg-background-dark border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary h-14" 
                                        value={settings.upi_id}
                                        onChange={e => setSettings({...settings, upi_id: e.target.value})}
                                        placeholder="admin@upi"
                                    />
                                </div>
                            </div>
                        </motion.section>

                        <button 
                            type="submit"
                            disabled={saving}
                            className="w-full py-6 bg-primary text-background-dark font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                            {saving ? (
                                <div className="size-6 border-2 border-background-dark border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save className="size-6 group-hover:rotate-12 transition-transform" />
                            )}
                            Save All Settings
                        </button>
                    </div>
                </form>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 flex items-start gap-6">
                    <div className="size-12 rounded-2xl bg-amber-500 text-background-dark flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined font-black">info</span>
                    </div>
                    <div>
                        <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm">Payout Security Note</h4>
                        <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
                            These bank details are used only for offline reconciliation and settlement displays. Ensure the Account Number and IFSC code are double-checked as they will be displayed to drivers during payout cycles.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default PlatformSettings;
