import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// // import GlobalBackButton from '../Shared/GlobalBackButton';

// ─── Vehicle Data ──────────────────────────────────────────────────────────────
const VEHICLE_DATA = {
    car: {
        label: 'Car',
        icon: 'directions_car',
        color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-500',
        brands: [
            { id: 'toyota', name: 'Toyota', logo: 'https://logo.clearbit.com/toyota.com', tag: 'Popular', models: [
                {name:'Corolla'},{name:'Camry'},{name:'Fortuner'},{name:'Prius'},{name:'Land Cruiser'},{name:'Hilux'},{name:'Yaris'},{name:'Vios'},{name:'Innova'},{name:'Supra'},{name:'Avalon'},{name:'Crown'},{name:'RAV4'},{name:'Highlander'}
            ]},
            { id: 'honda', name: 'Honda', logo: 'https://logo.clearbit.com/honda.com', tag: 'Popular', models: [
                {name:'Civic'},{name:'Accord'},{name:'CR-V'},{name:'City'},{name:'HR-V'},{name:'BR-V'},{name:'Amaze'},{name:'Jazz'},{name:'Pilot'},{name:'Odyssey'}
            ]},
            { id: 'nissan', name: 'Nissan', logo: 'https://logo.clearbit.com/nissan.com', tag: 'Global', models: [
                {name:'Altima'},{name:'GT-R'},{name:'X-Trail'},{name:'Rogue'},{name:'Sentra'},{name:'Micra'},{name:'Patrol'},{name:'Pathfinder'},{name:'Armada'}
            ]},
            { id: 'bmw', name: 'BMW', logo: 'https://logo.clearbit.com/bmw.com', tag: 'Luxury', models: [
                {name:'1 Series'},{name:'2 Series'},{name:'3 Series'},{name:'5 Series'},{name:'7 Series'},{name:'8 Series'},{name:'X1'},{name:'X3'},{name:'X5'},{name:'X6'},{name:'X7'},{name:'Z4'}
            ]},
            { id: 'mercedes', name: 'Mercedes-Benz', logo: 'https://logo.clearbit.com/mercedes-benz.com', tag: 'Luxury', models: [
                {name:'A-Class'},{name:'B-Class'},{name:'C-Class'},{name:'E-Class'},{name:'S-Class'},{name:'CLA'},{name:'CLS'},{name:'GLA'},{name:'GLC'},{name:'GLE'},{name:'GLS'},{name:'G-Class'}
            ]},
            { id: 'audi', name: 'Audi', logo: 'https://logo.clearbit.com/audi.com', tag: 'Luxury', models: [
                {name:'A3'},{name:'A4'},{name:'A5'},{name:'A6'},{name:'A7'},{name:'A8'},{name:'Q2'},{name:'Q3'},{name:'Q5'},{name:'Q7'},{name:'Q8'},{name:'e-tron'}
            ]},
            { id: 'volkswagen', name: 'Volkswagen', logo: 'https://logo.clearbit.com/volkswagen.com', tag: 'Global', models: [
                {name:'Polo'},{name:'Golf'},{name:'Passat'},{name:'Tiguan'},{name:'Jetta'},{name:'Taigun'},{name:'Virtus'},{name:'Touareg'}
            ]},
            { id: 'ford', name: 'Ford', logo: 'https://logo.clearbit.com/ford.com', tag: 'Global', models: [
                {name:'Mustang'},{name:'F-150'},{name:'Explorer'},{name:'Endeavour'},{name:'EcoSport'},{name:'Escape'},{name:'Edge'},{name:'Bronco'}
            ]},
            { id: 'chevrolet', name: 'Chevrolet', logo: 'https://logo.clearbit.com/chevrolet.com', tag: 'Global', models: [
                {name:'Camaro'},{name:'Malibu'},{name:'Cruze'},{name:'Impala'},{name:'Tahoe'},{name:'Suburban'},{name:'Silverado'}
            ]},
            { id: 'tesla', name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com', tag: 'EV', models: [
                {name:'Model S'},{name:'Model 3'},{name:'Model X'},{name:'Model Y'},{name:'Cybertruck'}
            ]},
            { id: 'hyundai', name: 'Hyundai', logo: 'https://logo.clearbit.com/hyundai.com', tag: 'Popular', models: [
                {name:'i10'},{name:'i20'},{name:'Verna'},{name:'Elantra'},{name:'Sonata'},{name:'Creta'},{name:'Venue'},{name:'Tucson'},{name:'Santa Fe'},{name:'Kona'}
            ]},
            { id: 'kia', name: 'Kia', logo: 'https://logo.clearbit.com/kia.com', tag: 'Popular', models: [
                {name:'Sonet'},{name:'Seltos'},{name:'Carens'},{name:'Sportage'},{name:'Carnival'},{name:'EV6'},{name:'Rio'},{name:'Cerato'},{name:'Sorento'}
            ]},
            { id: 'tata', name: 'Tata Motors', logo: 'https://logo.clearbit.com/tatamotors.com', tag: 'Popular', models: [
                {name:'Tiago'},{name:'Tigor'},{name:'Altroz'},{name:'Nexon'},{name:'Punch'},{name:'Safari'},{name:'Harrier'}
            ]},
            { id: 'mahindra', name: 'Mahindra', logo: 'https://logo.clearbit.com/mahindra.com', tag: 'Popular', models: [
                {name:'Thar'},{name:'Scorpio'},{name:'Bolero'},{name:'XUV300'},{name:'XUV500'},{name:'XUV700'},{name:'Marazzo'}
            ]},
            { id: 'maruti', name: 'Maruti Suzuki', logo: 'https://logo.clearbit.com/marutisuzuki.com', tag: 'Popular', models: [
                {name:'Alto'},{name:'Swift'},{name:'Dzire'},{name:'Baleno'},{name:'Brezza'},{name:'Ertiga'},{name:'WagonR'},{name:'Ciaz'},{name:'Ignis'}
            ]},
            { id: 'skoda', name: 'Skoda', logo: 'https://logo.clearbit.com/skoda-auto.com', tag: 'Global', models: [
                {name:'Rapid'},{name:'Octavia'},{name:'Superb'},{name:'Kushaq'},{name:'Slavia'},{name:'Kodiaq'}
            ]},
            { id: 'renault', name: 'Renault', logo: 'https://logo.clearbit.com/renault.com', tag: 'Global', models: [
                {name:'Kwid'},{name:'Triber'},{name:'Duster'},{name:'Kiger'},{name:'Captur'},{name:'Koleos'}
            ]},
            { id: 'peugeot', name: 'Peugeot', logo: 'https://logo.clearbit.com/peugeot.com', tag: 'Global', models: [
                {name:'208'},{name:'308'},{name:'508'},{name:'2008'},{name:'3008'},{name:'5008'}
            ]},
            { id: 'fiat', name: 'Fiat', logo: 'https://logo.clearbit.com/fiat.com', tag: 'Global', models: [
                {name:'Punto'},{name:'Linea'},{name:'Tipo'},{name:'500'},{name:'Panda'}
            ]},
            { id: 'volvo', name: 'Volvo', logo: 'https://logo.clearbit.com/volvocars.com', tag: 'Luxury', models: [
                {name:'XC40'},{name:'XC60'},{name:'XC90'},{name:'S60'},{name:'S90'}
            ]},
            { id: 'jaguar', name: 'Jaguar', logo: 'https://logo.clearbit.com/jaguar.com', tag: 'Luxury', models: [
                {name:'XE'},{name:'XF'},{name:'XJ'},{name:'F-Pace'},{name:'E-Pace'},{name:'I-Pace'}
            ]},
            { id: 'landrover', name: 'Land Rover', logo: 'https://logo.clearbit.com/landrover.com', tag: 'Luxury', models: [
                {name:'Defender'},{name:'Discovery'},{name:'Discovery Sport'},{name:'Range Rover'},{name:'Range Rover Sport'},{name:'Evoque'}
            ]},
            { id: 'porsche', name: 'Porsche', logo: 'https://logo.clearbit.com/porsche.com', tag: 'Supercar', models: [
                {name:'911'},{name:'Cayenne'},{name:'Macan'},{name:'Panamera'},{name:'Taycan'}
            ]},
            { id: 'ferrari', name: 'Ferrari', logo: 'https://logo.clearbit.com/ferrari.com', tag: 'Supercar', models: [
                {name:'488'},{name:'F8 Tributo'},{name:'SF90'},{name:'Roma'},{name:'Portofino'}
            ]},
            { id: 'lamborghini', name: 'Lamborghini', logo: 'https://logo.clearbit.com/lamborghini.com', tag: 'Supercar', models: [
                {name:'Huracan'},{name:'Aventador'},{name:'Urus'}
            ]},
            { id: 'mitsubishi', name: 'Mitsubishi', logo: 'https://logo.clearbit.com/mitsubishi-motors.com', tag: 'Global', models: [
                {name:'Pajero'},{name:'Outlander'},{name:'Eclipse Cross'},{name:'Lancer'}
            ]},
            { id: 'subaru', name: 'Subaru', logo: 'https://logo.clearbit.com/subaru.com', tag: 'Global', models: [
                {name:'Impreza'},{name:'Legacy'},{name:'Forester'},{name:'Outback'},{name:'WRX'}
            ]},
            { id: 'suzuki', name: 'Suzuki', logo: 'https://logo.clearbit.com/globalsuzuki.com', tag: 'Global', models: [
                {name:'Swift'},{name:'Baleno'},{name:'Vitara'},{name:'Jimny'},{name:'Celerio'}
            ]},
            { id: 'rollsroyce', name: 'Rolls-Royce', logo: 'https://logo.clearbit.com/rolls-roycemotorcars.com', tag: 'Supercar', models: [
                {name:'Phantom'},{name:'Ghost'},{name:'Wraith'},{name:'Dawn'},{name:'Cullinan'},{name:'Spectre'}
            ]},
            { id: 'bentley', name: 'Bentley', logo: 'https://logo.clearbit.com/bentleymotors.com', tag: 'Supercar', models: [
                {name:'Continental GT'},{name:'Flying Spur'},{name:'Bentayga'}
            ]},
            { id: 'bugatti', name: 'Bugatti', logo: 'https://logo.clearbit.com/bugatti.com', tag: 'Supercar', models: [
                {name:'Veyron'},{name:'Chiron'},{name:'Mistral'}
            ]},
            { id: 'astonmartin', name: 'Aston Martin', logo: 'https://logo.clearbit.com/astonmartin.com', tag: 'Supercar', models: [
                {name:'DB11'},{name:'DBX'},{name:'Vantage'},{name:'DBS Superleggera'}
            ]},
            { id: 'maserati', name: 'Maserati', logo: 'https://logo.clearbit.com/maserati.com', tag: 'Supercar', models: [
                {name:'Ghibli'},{name:'Quattroporte'},{name:'Levante'},{name:'MC20'}
            ]}
        ]
    },
    cargo: {
        label: 'Cargo Van',
        icon: 'local_shipping',
        color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-500',
        brands: [
            { id: 'tata_cargo', name: 'Tata Motors', logo: 'https://logo.clearbit.com/tatamotors.com', tag: 'Popular', models: [
                {name:'Ace'},{name:'Super Ace'},{name:'Intra'},{name:'407'},{name:'709'},{name:'1109'},{name:'1512'},{name:'1612'},{name:'2518'}
            ]},
            { id: 'ashok_leyland', name: 'Ashok Leyland', logo: 'https://logo.clearbit.com/ashokleyland.com', tag: 'Popular', models: [
                {name:'Dost'},{name:'Bada Dost'},{name:'Partner'},{name:'Boss'},{name:'Guru'},{name:'U-Truck'}
            ]},
            { id: 'mahindra_cargo', name: 'Mahindra', logo: 'https://logo.clearbit.com/mahindra.com', tag: 'Popular', models: [
                {name:'Jeeto'},{name:'Supro'},{name:'Bolero Pickup'},{name:'Imperio'},{name:'Blazo Truck'}
            ]},
            { id: 'eicher', name: 'Eicher', logo: 'https://logo.clearbit.com/eicher.in', tag: 'Popular', models: [
                {name:'Pro 1049'},{name:'Pro 2049'},{name:'Pro 3015'},{name:'Pro 6019'}
            ]},
            { id: 'isuzu', name: 'Isuzu', logo: 'https://logo.clearbit.com/isuzu.com', tag: 'Global', models: [
                {name:'D-Max'},{name:'NPR'},{name:'NQR'},{name:'F-Series'}
            ]},
            { id: 'toyota_cargo', name: 'Toyota', logo: 'https://logo.clearbit.com/toyota.com', tag: 'Popular', models: [
                {name:'Hilux'},{name:'HiAce'}
            ]},
            { id: 'ford_cargo', name: 'Ford', logo: 'https://logo.clearbit.com/ford.com', tag: 'Global', models: [
                {name:'Transit'},{name:'Ranger'}
            ]},
            { id: 'volvo_cargo', name: 'Volvo Trucks', logo: 'https://logo.clearbit.com/volvotrucks.com', tag: 'Global', models: [
                {name:'FH16'},{name:'FM'},{name:'FMX'},{name:'FE'}
            ]},
            { id: 'scania', name: 'Scania', logo: 'https://logo.clearbit.com/scania.com', tag: 'Global', models: [
                {name:'R Series'},{name:'G Series'},{name:'P Series'}
            ]},
            { id: 'bharatbenz', name: 'BharatBenz', logo: 'https://logo.clearbit.com/bharatbenz.com', tag: 'Popular', models: [
                {name:'1217'},{name:'1617'},{name:'2523'},{name:'2823'}
            ]}
        ]
    }
};

// ─── Tag color map ──────────────────────────────────────────────────────────
const TAG_STYLES = {
    Popular:  'bg-cyan-500/10 text-cyan-500',
    Global:   'bg-blue-500/10 text-blue-400',
    Luxury:   'bg-amber-500/10 text-amber-400',
    Supercar: 'bg-purple-500/10 text-purple-400',
    EV:       'bg-emerald-500/10 text-emerald-400',
};

// ─── Brand initial avatar ────────────────────────────────────────────────────
const BrandAvatar = ({ name, logo, color }) => {
    if (logo) {
        return (
            <div className="w-full h-full rounded-xl overflow-hidden bg-white flex items-center justify-center p-2 shadow-sm">
                <img src={logo} alt={name} className="max-w-full max-h-full object-contain" />
            </div>
        );
    }
    const letters = name.split(' ').map(w => w[0]).slice(0, 2).join('');
    return (
        <div className={`w-full h-full flex items-center justify-center text-2xl font-black bg-gradient-to-br ${color} rounded-xl`}>
            {letters}
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────
const VehicleSelection = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('category');     // 'category' | 'brand' | 'model'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [customData, setCustomData] = useState({ brand: '', model: '', type: 'car' });

    const catData = selectedCategory ? VEHICLE_DATA[selectedCategory] : null;

    const filteredBrands = catData
        ? catData.brands.filter(b =>
            b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.models.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : [];

    const filteredModels = selectedBrand
        ? selectedBrand.models.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    const handleCategorySelect = (cat) => {
        setSelectedCategory(cat);
        setStep('brand');
        setSearchTerm('');
    };

    const handleBrandSelect = (brand) => {
        setSelectedBrand(brand);
        setStep('model');
        setSearchTerm('');
    };

    const handleModelSelect = (model) => {
        navigate(`/customer/add-vehicle?brand=${selectedBrand.name}&model=${model.name}&type=${selectedCategory}`);
    };

    const handleBack = () => {
        if (isCustomMode) { setIsCustomMode(false); }
        else if (step === 'model') { setStep('brand'); setSearchTerm(''); }
        else if (step === 'brand') { setStep('category'); setSelectedCategory(null); setSearchTerm(''); }
        else navigate(-1);
    };

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        if (!customData.brand || !customData.model) return;
        navigate(`/customer/add-vehicle?brand=${customData.brand}&model=${customData.model}&type=${customData.type}&is_custom=true`);
    };

    const stepTitle = isCustomMode 
        ? 'Custom Vehicle'
        : step === 'category'
            ? 'Select Vehicle Type'
            : step === 'brand'
                ? `Select ${catData?.label} Brand`
                : `Select ${selectedBrand?.name} Model`;

    const stepSubtitle = isCustomMode
        ? 'Manually enter your vehicle details below'
        : step === 'category'
            ? 'Choose the type of vehicle you want to register'
            : step === 'brand'
                ? `Browse all ${catData?.label.toLowerCase()} manufacturers`
                : `Choose the exact model of your ${selectedBrand?.name}`;

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <style>{`.custom-scroll::-webkit-scrollbar{width:4px}.custom-scroll::-webkit-scrollbar-thumb{background:rgba(6,182,212,.3);border-radius:99px}`}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button onClick={handleBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{stepTitle}</h2>
                        {step !== 'category' && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <span className="cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => { setStep('category'); setSelectedCategory(null); setSearchTerm(''); }}>
                                    Vehicle Type
                                </span>
                                {step === 'model' && (
                                    <>
                                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                                        <span className="capitalize cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => { setStep('brand'); setSearchTerm(''); }}>
                                            {catData?.label}
                                        </span>
                                    </>
                                )}
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                                <span className="text-cyan-400 font-semibold">
                                    {step === 'brand' ? catData?.label + ' Brands' : selectedBrand?.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
                {/* Title */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} key={step}>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stepTitle}</h1>
                    <p className="text-sm text-slate-500 mt-1">{stepSubtitle}</p>
                </motion.div>

                {/* SEARCH COMPONENT (brand/model step only) */}
                {step !== 'category' && !isCustomMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="relative max-w-lg">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={step === 'brand' ? `Search ${catData?.label} brands or models...` : `Search ${selectedBrand?.name} models...`}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-cyan-400 dark:focus:border-cyan-400 transition-all text-sm"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">

                    {/* ── STEP 1: Category ── */}
                    {step === 'category' && !isCustomMode && (
                        <motion.div key="category" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {Object.entries(VEHICLE_DATA).map(([key, val]) => (
                                    <motion.button key={key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                        onClick={() => handleCategorySelect(key)}
                                        className={`group relative overflow-hidden bg-gradient-to-br ${val.color} border rounded-2xl p-8 text-left transition-all hover:shadow-xl`}>
                                        <span className={`material-symbols-outlined text-6xl mb-4 block`} style={{ fontSize: '64px' }}>{val.icon}</span>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{val.label}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{val.brands.length} brands available</p>
                                        <span className="material-symbols-outlined absolute bottom-5 right-5 text-slate-300 dark:text-slate-600 group-hover:text-current transition-colors">arrow_forward</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Custom Vehicle Option */}
                            <motion.button 
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                                onClick={() => setIsCustomMode(true)}
                                className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                                        <span className="material-symbols-outlined text-2xl">add_circle</span>
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-slate-900 dark:text-white">Custom Vehicle</h4>
                                        <p className="text-xs text-slate-500">Don't see your brand or model? Add it manually.</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-cyan-400 transition-colors">chevron_right</span>
                            </motion.button>
                        </motion.div>
                    )}

                    {/* ── Custom Form ── */}
                    {isCustomMode && (
                        <motion.div key="custom" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl space-y-6">
                            <form onSubmit={handleCustomSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Vehicle Type</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['car', 'bike', 'cargo'].map(t => (
                                            <button key={t} type="button" onClick={() => setCustomData({...customData, type: t})}
                                                className={`py-3 rounded-xl border-2 font-bold text-xs capitalize transition-all ${customData.type === t ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Brand Name</label>
                                    <input required placeholder="e.g. Tesla, Tata, etc." 
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-cyan-400/50 transition-all font-medium text-sm"
                                        value={customData.brand} onChange={e => setCustomData({...customData, brand: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Model Name</label>
                                    <input required placeholder="e.g. Model 3, Nexon, etc." 
                                        className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 ring-cyan-400/50 transition-all font-medium text-sm"
                                        value={customData.model} onChange={e => setCustomData({...customData, model: e.target.value})}
                                    />
                                </div>
                                <button type="submit" 
                                    className="w-full py-4 rounded-xl bg-cyan-400 text-white font-black hover:brightness-110 shadow-lg shadow-cyan-400/20 active:scale-[0.98] transition-all">
                                    Continue to Details
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Brand ── */}
                    {step === 'brand' && (
                        <motion.div key="brand" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {filteredBrands.length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                                    No brands match your search.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredBrands.map((brand, i) => (
                                        <motion.button key={brand.id}
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                            onClick={() => handleBrandSelect(brand)}
                                            className="group flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-lg transition-all text-left">
                                            {/* Avatar */}
                                            <div className="w-full aspect-square">
                                                <BrandAvatar name={brand.name} logo={brand.logo} color={catData?.color?.replace('from-', 'bg-').split(' ')[0]} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{brand.name}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{brand.models.length} model{brand.models.length !== 1 ? 's' : ''}</p>
                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full mt-1 inline-block ${TAG_STYLES[brand.tag] || ''}`}>
                                                    {brand.tag}
                                                </span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── STEP 3: Model ── */}
                    {step === 'model' && (
                        <motion.div key="model" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20}}>
                            {filteredModels.length === 0 ? (
                                <div className="text-center py-16 text-slate-400">
                                    <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                                    No models match your search.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {filteredModels.map((model, i) => (
                                        <motion.button key={model.name}
                                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(i * 0.04, 0.4) }}
                                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                            onClick={() => handleModelSelect(model)}
                                            className="group flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-400 hover:shadow-md transition-all text-left">
                                            <div className="size-16 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                                {model.image ? (
                                                    <img src={model.image} alt={model.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-400 group-hover:text-cyan-400 transition-colors">
                                                        {selectedCategory === 'bike' ? 'motorcycle' : selectedCategory === 'cargo' ? 'local_shipping' : 'directions_car'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white text-sm">{model.name}</p>
                                                <p className="text-xs text-slate-400">{selectedBrand?.name}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-cyan-400 transition-colors">arrow_forward_ios</span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};
export default VehicleSelection;
