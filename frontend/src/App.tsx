import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  MapPin, Navigation, QrCode, Bot, CalendarDays,
  PackageSearch, Route, Building2, GraduationCap,
  ChevronDown, ChevronRight, ArrowRight, Smartphone,
  Star, Search, Locate, Map, Menu, X, Check,
  Footprints, Clock, Users, Zap,
} from 'lucide-react';

// ── fade-up variant reused across sections ─────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};
const stagger = (delay = 0.08) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
});

// ── Inline animated counter ────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const links = ['Features', 'How it works', 'For Students', 'Download'];

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'py-2' : 'py-4'
    }`}>
      <div className={`mx-auto max-w-6xl px-5 flex items-center justify-between rounded-2xl transition-all duration-300 py-3 ${
        scrolled ? 'glass card-shadow mx-4' : ''
      }`}>
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#0D8C60] flex items-center justify-center green-glow-sm">
            <MapPin size={16} color="#fff" />
          </div>
          <span className="font-['Poppins'] font-800 text-lg text-[#102418] font-extrabold">
            Path<span className="text-[#0D8C60]">Findr</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g,'-')}`}
              className="text-sm font-medium text-[#5E7367] hover:text-[#102418] transition-colors">
              {l}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="#download"
            className="px-5 py-2.5 rounded-full bg-[#0D8C60] text-white text-sm font-semibold hover:bg-[#066848] transition-colors green-glow-sm">
            Get the app
          </a>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-[#102418]" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="md:hidden mx-4 mt-2 glass rounded-2xl p-5 flex flex-col gap-4 card-shadow">
            {links.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s/g,'-')}`}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-[#5E7367] hover:text-[#102418] transition-colors">
                {l}
              </a>
            ))}
            <a href="#download"
              className="px-5 py-3 rounded-full bg-[#0D8C60] text-white text-sm font-semibold text-center hover:bg-[#066848] transition-colors">
              Get the app
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────
function Hero() {
  const [activePin, setActivePin] = useState<string | null>(null);

  const pins = [
    { id: 'ict',   label: 'ICT Centre',     x: '38%', y: '28%', color: '#0D8C60' },
    { id: 'lib',   label: 'Library Complex', x: '62%', y: '44%', color: '#7C5CFA' },
    { id: 'eng',   label: 'Eng. Block',      x: '72%', y: '22%', color: '#2078B4' },
    { id: 'admin', label: 'Admin Tower',     x: '28%', y: '56%', color: '#2D5B4B' },
    { id: 'hub',   label: 'Student Hub',     x: '50%', y: '66%', color: '#F27C42' },
  ];

  return (
    <section id="features" className="hero-gradient min-h-screen pt-28 pb-20 px-5 md:px-10 flex flex-col items-center text-center relative overflow-hidden">
      {/* Background dot grid */}
      <div className="dot-grid absolute inset-0 pointer-events-none" />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="pill-badge bg-[#E8F2E6] text-[#0D8C60] mb-6">
        <Star size={10} fill="#0D8C60" /> Built for LASUSTECH campus
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-3xl text-[#102418] mb-5">
        Never get lost on campus{' '}
        <span className="text-[#0D8C60]">again.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        className="max-w-xl text-lg text-[#5E7367] mb-10 font-['DM_Sans'] leading-relaxed">
        PathFindr is your smart campus companion — interactive maps, turn-by-turn
        directions, QR code scanning, AI chat, events, and more. All offline-ready.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
        className="flex flex-col sm:flex-row gap-4 mb-16">
        <a href="#download"
          className="flex items-center gap-2 px-7 py-4 bg-[#0D8C60] text-white rounded-full font-semibold text-base hover:bg-[#066848] transition-all green-glow group">
          <Smartphone size={18} />
          Download Free
          <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
        <a href="#how-it-works"
          className="flex items-center gap-2 px-7 py-4 bg-white border border-[#D4E1D4] text-[#102418] rounded-full font-semibold text-base hover:bg-[#F4F7F2] transition-all soft-shadow">
          <Route size={18} className="text-[#0D8C60]" />
          See how it works
        </a>
      </motion.div>

      {/* Map card hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.55, duration: 0.8 }}
        className="relative w-full max-w-2xl">

        {/* Map container */}
        <div className="relative bg-[#E8F5E9] rounded-[28px] overflow-hidden card-shadow border border-[#D4E1D4]" style={{ height: 360 }}>

          {/* Fake map grid */}
          <svg className="absolute inset-0 w-full h-full opacity-20" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={`${i * 14.3}%`} x2="100%" y2={`${i * 14.3}%`} stroke="#0D8C60" strokeWidth="1" />
            ))}
            {Array.from({ length: 10 }).map((_, i) => (
              <line key={`v${i}`} x1={`${i * 11.1}%`} y1="0" x2={`${i * 11.1}%`} y2="100%" stroke="#0D8C60" strokeWidth="1" />
            ))}
          </svg>

          {/* Animated route path */}
          <svg className="absolute inset-0 w-full h-full" aria-hidden>
            <path
              d="M 140 240 Q 200 180 290 160 Q 360 140 420 100"
              fill="none" stroke="#0D8C60" strokeWidth="3"
              strokeDasharray="8 6"
              className="animate-route-dash"
              style={{ strokeDashoffset: 0 }}
            />
          </svg>

          {/* Map pins */}
          {pins.map(pin => (
            <button
              key={pin.id}
              className="absolute flex flex-col items-center cursor-pointer group"
              style={{ left: pin.x, top: pin.y, transform: 'translate(-50%,-100%)' }}
              onClick={() => setActivePin(p => p === pin.id ? null : pin.id)}
            >
              {/* Ping ring */}
              {activePin === pin.id && (
                <span
                  className="absolute -inset-2 rounded-full animate-map-ping"
                  style={{ background: pin.color + '30' }}
                />
              )}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                style={{ backgroundColor: pin.color }}>
                <MapPin size={16} color="#fff" />
              </div>
              {/* Tooltip */}
              <AnimatePresence>
                {activePin === pin.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-full mb-2 bg-white rounded-xl px-3 py-2 soft-shadow text-xs font-semibold text-[#102418] whitespace-nowrap"
                    style={{ fontFamily: 'Poppins' }}>
                    {pin.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 shadow-sm" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          ))}

          {/* "You are here" indicator */}
          <div className="absolute" style={{ left: '38%', top: '28%', transform: 'translate(-50%,8px)' }}>
            <div className="w-4 h-4 rounded-full bg-[#0D8C60] border-2 border-white shadow" />
            <div className="absolute inset-0 rounded-full bg-[#0D8C60] opacity-30 animate-pulse-ring" />
          </div>

          {/* Search bar overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[86%] bg-white rounded-2xl px-4 py-3 flex items-center gap-3 card-shadow">
            <Search size={16} className="text-[#0D8C60] shrink-0" />
            <span className="text-sm text-[#5E7367] font-['DM_Sans'] flex-1 text-left">
              Find a building, lecture hall, lab…
            </span>
            <div className="w-7 h-7 rounded-full bg-[#0D8C60] flex items-center justify-center">
              <Locate size={12} color="#fff" />
            </div>
          </div>

          {/* Distance chip */}
          <motion.div
            animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            className="absolute bottom-5 right-5 bg-white rounded-2xl px-4 py-3 card-shadow flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E8F2E6] flex items-center justify-center">
              <Footprints size={14} className="text-[#0D8C60]" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[#102418]" style={{ fontFamily: 'Poppins' }}>Library Complex</div>
              <div className="text-[11px] text-[#5E7367]">~4 min walk · 320 m</div>
            </div>
          </motion.div>

          {/* Step chip */}
          <motion.div
            animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
            className="absolute bottom-5 left-5 glass rounded-2xl px-4 py-3 flex items-center gap-2">
            <Navigation size={14} className="text-[#0D8C60]" />
            <span className="text-xs font-semibold text-[#102418]" style={{ fontFamily: 'Poppins' }}>Turn right at the fountain</span>
          </motion.div>
        </div>

        {/* Tap hint */}
        <p className="mt-3 text-xs text-[#5E7367] text-center">
          Tap any pin to explore ↑
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        variants={stagger(0.1)} initial="hidden" animate="show"
        className="mt-14 grid grid-cols-3 gap-6 md:gap-12 max-w-lg w-full">
        {[
          { n: 60,  s: '+', label: 'Campus buildings mapped' },
          { n: 500, s: '+', label: 'Students onboarded' },
          { n: 98,  s: '%', label: 'Navigation accuracy' },
        ].map((stat, i) => (
          <motion.div key={i} variants={fadeUp} className="flex flex-col items-center gap-1">
            <div className="text-3xl font-extrabold text-[#0D8C60]" style={{ fontFamily: 'Poppins' }}>
              <Counter to={stat.n} suffix={stat.s} />
            </div>
            <div className="text-xs text-[#5E7367] text-center leading-snug">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Map,
    color: '#0D8C60', bg: '#E8F5E9',
    title: 'Interactive Campus Map',
    desc: 'Explore LASUSTECH with a live zoomable map. Colour-coded buildings by category — faculty, labs, admin, and more.',
  },
  {
    icon: Route,
    color: '#2078B4', bg: '#E8F2FA',
    title: 'Turn-by-Turn Directions',
    desc: 'Powered by Dijkstra & A* algorithms for optimal walking routes. Step-by-step voice guidance, offline-ready.',
  },
  {
    icon: QrCode,
    color: '#7C5CFA', bg: '#F0ECFF',
    title: 'QR Code Scanner',
    desc: 'Scan QR codes on campus signage to instantly get building info, directions, and nearby facilities.',
  },
  {
    icon: Bot,
    color: '#F27C42', bg: '#FFF3EC',
    title: 'AI Campus Assistant',
    desc: 'Ask anything — timetables, office hours, events, shortcuts. Powered by a context-aware campus AI.',
  },
  {
    icon: CalendarDays,
    color: '#D85B73', bg: '#FDEEF1',
    title: 'Campus Events',
    desc: 'Never miss a lecture, seminar, or social event. Browse the campus calendar and set reminders.',
  },
  {
    icon: PackageSearch,
    color: '#A06A20', bg: '#FBF3E8',
    title: 'Lost & Found',
    desc: 'Report or search for lost items across campus. Connected to the LASUSTECH student network.',
  },
  {
    icon: Building2,
    color: '#2D5B4B', bg: '#E8F2EE',
    title: 'Building Info',
    desc: 'Detailed profiles for every campus building — departments, floors, facilities, opening hours.',
  },
  {
    icon: GraduationCap,
    color: '#0D8C60', bg: '#E8F5E9',
    title: "Freshers' Tour",
    desc: 'A guided walkthrough of campus for new students — curated stops, fun facts, and orientation tips.',
  },
];

function Features() {
  const [hovered, setHovered] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" className="py-24 px-5 md:px-10 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          variants={stagger(0.06)} initial="hidden" animate={inView ? 'show' : 'hidden'}
          className="text-center mb-14">
          <motion.div variants={fadeUp} className="pill-badge bg-[#E8F2E6] text-[#0D8C60] mb-4">
            Everything you need
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-[#102418] mb-4">
            Your whole campus, one app
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#5E7367] max-w-lg mx-auto">
            Eight powerful features built specifically for LASUSTECH students and staff.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger(0.07)} initial="hidden" animate={inView ? 'show' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i} variants={fadeUp}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              whileHover={{ y: -4 }}
              className="relative p-6 rounded-[20px] border border-[#D4E1D4] bg-[#FDFEFC] cursor-default transition-shadow"
              style={{ boxShadow: hovered === i ? `0 8px 32px ${f.color}20, 0 1px 3px ${f.color}10` : undefined }}>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: f.bg }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 className="text-[#102418] mb-2 text-base">{f.title}</h3>
              <p className="text-[#5E7367] text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ── How It Works ───────────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    icon: Smartphone,
    color: '#0D8C60',
    title: 'Download PathFindr',
    desc: 'Free on Android. Install in seconds, no sign-up required to browse the map.',
  },
  {
    number: '02',
    icon: Search,
    color: '#2078B4',
    title: 'Search your destination',
    desc: 'Type a building name, scan a QR code on signage, or browse the map to find your target.',
  },
  {
    number: '03',
    icon: Navigation,
    color: '#7C5CFA',
    title: 'Follow turn-by-turn steps',
    desc: 'PathFindr calculates the fastest walking route and guides you step by step across campus.',
  },
  {
    number: '04',
    icon: Star,
    color: '#F2B84B',
    title: 'Explore more features',
    desc: 'Check events, chat with the AI assistant, report lost items, and personalise your experience.',
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="py-24 px-5 md:px-10 bg-[#F4F7F2]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          ref={ref}
          variants={stagger(0.07)} initial="hidden" animate={inView ? 'show' : 'hidden'}>

          <div className="text-center mb-14">
            <motion.div variants={fadeUp} className="pill-badge bg-white text-[#0D8C60] mb-4 soft-shadow">
              Simple as 1-2-3-4
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-[#102418] mb-4">
              From download to destination<br />in under a minute
            </motion.h2>
          </div>

          {/* Steps with connector line on desktop */}
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Connector */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-[#D4E1D4]" />

            {STEPS.map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div
                    className="w-24 h-24 rounded-full flex flex-col items-center justify-center z-10 relative bg-white card-shadow"
                    style={{ border: `2px solid ${s.color}30` }}>
                    <s.icon size={28} color={s.color} />
                  </div>
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold z-20"
                    style={{ backgroundColor: s.color, fontFamily: 'Poppins' }}>
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-[#102418] mb-2">{s.title}</h3>
                <p className="text-[#5E7367] text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ── For Students highlight ─────────────────────────────────────────────────
function ForStudents() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [activeTab, setActiveTab] = useState<'map' | 'ai' | 'qr'>('map');

  const tabs = [
    { id: 'map' as const,  icon: Map,    label: 'Navigate',    color: '#0D8C60' },
    { id: 'ai'  as const,  icon: Bot,    label: 'Ask AI',      color: '#7C5CFA' },
    { id: 'qr'  as const,  icon: QrCode, label: 'Scan & Go',   color: '#2078B4' },
  ];

  const panels = {
    map: (
      <div className="flex flex-col gap-3 w-full">
        {[
          { label: 'ICT Centre → Library',  time: '4 min', dist: '320 m', steps: 6 },
          { label: 'Gate → Eng. Block',     time: '7 min', dist: '580 m', steps: 9 },
          { label: 'Student Hub → Admin',   time: '3 min', dist: '240 m', steps: 4 },
        ].map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 card-shadow border border-[#D4E1D4]">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
              <Route size={14} className="text-[#0D8C60]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-[#102418]" style={{ fontFamily: 'Poppins' }}>{r.label}</div>
              <div className="text-xs text-[#5E7367]">{r.dist} · {r.steps} steps</div>
            </div>
            <div className="flex items-center gap-1 text-[#0D8C60] text-xs font-bold">
              <Clock size={11} />{r.time}
            </div>
          </motion.div>
        ))}
      </div>
    ),
    ai: (
      <div className="flex flex-col gap-3 w-full">
        {[
          { q: 'Where is the Computer Science department?',     a: 'Engineering Block, 2nd floor, Room 214.' },
          { q: 'Any events happening this weekend?',             a: 'Tech fair on Saturday 10am – Student Hub.' },
          { q: 'What time does the library close?',              a: 'Main Library closes at 9pm on weekdays.' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col gap-2">
            <div className="self-end bg-[#0D8C60] text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
              {item.q}
            </div>
            <div className="self-start bg-white border border-[#D4E1D4] text-[#102418] text-sm rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] soft-shadow">
              {item.a}
            </div>
          </motion.div>
        ))}
      </div>
    ),
    qr: (
      <div className="flex flex-col items-center gap-4 py-4">
        {/* Fake QR viewfinder */}
        <div className="relative w-44 h-44 rounded-3xl overflow-hidden bg-[#102418] flex items-center justify-center">
          {/* Corner brackets */}
          {['tl','tr','bl','br'].map(c => (
            <div key={c} className={`absolute w-8 h-8 ${
              c==='tl'?'top-3 left-3 border-t-2 border-l-2':
              c==='tr'?'top-3 right-3 border-t-2 border-r-2':
              c==='bl'?'bottom-3 left-3 border-b-2 border-l-2':
              'bottom-3 right-3 border-b-2 border-r-2'
            } border-[#0D8C60]`} />
          ))}
          {/* Scan line */}
          <div className="absolute left-4 right-4 h-0.5 bg-[#0D8C60] opacity-80 animate-scan" style={{ top: '50%' }} />
          <QrCode size={60} className="text-white opacity-30" />
        </div>
        <p className="text-sm text-[#5E7367] text-center">
          Point your camera at any campus QR code to instantly open building info and directions.
        </p>
        <div className="pill-badge bg-[#E8F2E6] text-[#0D8C60]">
          <Check size={10} /> Offline capable
        </div>
      </div>
    ),
  };

  return (
    <section id="for-students" className="py-24 px-5 md:px-10 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-14 items-center" ref={ref}>

        {/* Left copy */}
        <motion.div
          variants={stagger(0.08)} initial="hidden" animate={inView ? 'show' : 'hidden'}>
          <motion.div variants={fadeUp} className="pill-badge bg-[#E8F2E6] text-[#0D8C60] mb-4">
            For students
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-[#102418] mb-5">
            Everything a LASUSTECH student needs
          </motion.h2>
          <motion.p variants={fadeUp} className="text-[#5E7367] leading-relaxed mb-6">
            Whether you're a new fresher or a final-year student, PathFindr adapts to you.
            Personalised profile, saved routes, AI-powered help, and real-time campus events.
          </motion.p>
          <motion.ul variants={stagger(0.06)} className="flex flex-col gap-3 mb-8">
            {[
              'Offline maps — works without internet',
              'AI assistant trained on campus data',
              'QR codes on every building',
              'Freshers\' guided tour mode',
              'Lost & Found board',
              'Event reminders with notifications',
            ].map((item, i) => (
              <motion.li key={i} variants={fadeUp} className="flex items-center gap-3 text-sm text-[#5E7367]">
                <div className="w-5 h-5 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
                  <Check size={11} className="text-[#0D8C60]" />
                </div>
                {item}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div variants={fadeUp} className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['#0D8C60','#2078B4','#7C5CFA','#F27C42'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ background: c }}>
                  {String.fromCharCode(65+i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-[#5E7367]">
              <span className="font-semibold text-[#102418]">500+ students</span> already navigating smarter
            </span>
          </motion.div>
        </motion.div>

        {/* Right interactive panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-[#F4F7F2] rounded-[28px] p-6 border border-[#D4E1D4] soft-shadow">

          {/* Tab switcher */}
          <div className="flex gap-2 mb-5">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? 'bg-white card-shadow text-[#102418]'
                    : 'text-[#5E7367] hover:text-[#102418]'
                }`}>
                <t.icon size={15} color={activeTab === t.id ? t.color : undefined} />
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}>
              {panels[activeTab]}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────
function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const stats = [
    { icon: Building2, value: 60,   suffix: '+', label: 'Buildings mapped',       color: '#0D8C60' },
    { icon: Users,     value: 500,  suffix: '+', label: 'Active students',         color: '#2078B4' },
    { icon: Route,     value: 1200, suffix: '+', label: 'Routes calculated daily', color: '#7C5CFA' },
    { icon: Zap,       value: 98,   suffix: '%', label: 'Navigation accuracy',     color: '#F2B84B' },
  ];
  return (
    <section className="py-16 px-5 md:px-10 bg-[#F4F7F2]">
      <div ref={ref} className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center gap-2 bg-white rounded-[20px] p-6 card-shadow border border-[#D4E1D4] text-center">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-1" style={{ background: s.color + '15' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div className="text-2xl font-extrabold text-[#102418]" style={{ fontFamily: 'Poppins' }}>
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <div className="text-xs text-[#5E7367]">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── FAQ ────────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'Is PathFindr free to use?',                          a: 'Yes — PathFindr is completely free for all LASUSTECH students and staff. Download, navigate, and explore with no subscription.' },
  { q: 'Does it work without an internet connection?',       a: 'Yes. The campus map and navigation are available offline after first launch. The AI assistant and event feed require a connection.' },
  { q: 'Which platforms is PathFindr available on?',        a: 'Currently Android (via direct APK download or Google Play). An iOS version is in development.' },
  { q: 'How accurate is the navigation?',                    a: 'PathFindr uses Dijkstra and A* routing algorithms on a hand-crafted campus graph for 98%+ route accuracy across all mapped buildings.' },
  { q: 'Can I contribute a missing building or correction?', a: 'Absolutely. Use the "Report an issue" button in the app or contact the PathFindr team on campus.' },
  { q: 'How does the QR code scanning work?',               a: 'QR codes are placed on campus signage. Scanning one with PathFindr instantly opens building info, directions from your current location, and nearby points of interest.' },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#D4E1D4] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left py-5 gap-4">
        <span className="font-semibold text-[#102418] text-base">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown size={18} className="text-[#5E7367]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden">
            <p className="pb-5 text-[#5E7367] leading-relaxed text-sm">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQ() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <section className="py-24 px-5 md:px-10 bg-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12" ref={ref}>
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="md:col-span-5">
          <div className="bg-[#F4F7F2] rounded-[32px] p-8 h-full flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#0D8C60] flex items-center justify-center mb-5 green-glow-sm">
                <Bot size={22} color="#fff" />
              </div>
              <h2 className="text-[#102418] mb-3">Got questions?</h2>
              <p className="text-[#5E7367] leading-relaxed">
                Everything you need to know about PathFindr and campus navigation at LASUSTECH.
              </p>
            </div>
            <div className="mt-8 bg-white p-4 rounded-2xl soft-shadow flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                <Check size={16} className="text-[#0D8C60]" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#102418]" style={{ fontFamily: 'Poppins' }}>Student-built for students</div>
                <div className="text-xs text-[#5E7367]">Made at LASUSTECH</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="md:col-span-7">
          {FAQS.map((f, i) => <FAQItem key={i} question={f.q} answer={f.a} />)}
        </motion.div>
      </div>
    </section>
  );
}

// ── Download CTA ───────────────────────────────────────────────────────────
function DownloadCTA() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/waitlist/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        // keep `email` so the confirmation message can display the address
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id="download" className="px-5 md:px-10 py-10 bg-[#F4F7F2]">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="cta-gradient rounded-[40px] p-10 md:p-20 flex flex-col items-center text-center relative overflow-hidden noise">

        {/* Decorative rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/10" />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
          <MapPin size={28} color="#fff" />
        </div>

        <div className="pill-badge bg-white/20 text-white mb-4">
          Available now · Android
        </div>

        <h2 className="text-white mb-4 max-w-xl">
          Start navigating LASUSTECH smarter today
        </h2>
        <p className="text-white/75 max-w-md mb-8 leading-relaxed">
          Download PathFindr for free. No subscription, no ads — just the campus
          navigation tool you actually need.
        </p>

        {/* Download button */}
        <a
          href="#"
          className="flex items-center gap-3 px-8 py-4 bg-white text-[#0D8C60] rounded-full font-bold text-base hover:bg-[#F4F7F2] transition-colors mb-10 soft-shadow">
          <Smartphone size={20} />
          Download the APK — Free
          <ArrowRight size={16} />
        </a>

        {/* Waitlist form */}
        <div className="w-full max-w-md relative z-10">
          <p className="text-white/70 text-sm mb-1 font-medium">iOS version coming soon</p>
          <p className="text-white/50 text-xs mb-5">
            Join the waitlist — we'll email you the moment it's available.
          </p>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 bg-white/15 border border-white/25 rounded-2xl px-6 py-5 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Check size={20} color="#fff" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>
                    You're on the waitlist!
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    We'll send a confirmation to <span className="text-white/80 font-medium">{email || 'your inbox'}</span>.
                    Watch out for an email from PathFindr when iOS launches.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="your@student.lasustech.edu.ng"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  className="flex-1 px-5 py-3.5 rounded-full bg-white/15 border border-white/25 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm text-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-7 py-3.5 bg-white text-[#0D8C60] rounded-full font-bold text-sm hover:bg-[#F4F7F2] active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap">
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Adding you…
                    </span>
                  ) : 'Join waitlist'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {status === 'error' && (
            <motion.p
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 text-white/60 text-xs text-center">
              Something went wrong. Please check your email and try again.
            </motion.p>
          )}
        </div>
      </motion.div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#F4F7F2] border-t border-[#D4E1D4] px-5 md:px-10 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#0D8C60] flex items-center justify-center">
            <MapPin size={14} color="#fff" />
          </div>
          <span className="font-extrabold text-[#102418]" style={{ fontFamily: 'Poppins' }}>
            Path<span className="text-[#0D8C60]">Findr</span>
          </span>
        </div>

        <p className="text-[#5E7367] text-sm text-center">
          © {new Date().getFullYear()} PathFindr · Built for LASUSTECH students
        </p>

        <div className="flex gap-5">
          {[
            { href: '#features',    label: 'Features' },
            { href: '#how-it-works',label: 'How it works' },
            { href: '#download',    label: 'Download' },
          ].map(l => (
            <a key={l.label} href={l.href} className="text-[#5E7367] hover:text-[#0D8C60] text-sm transition-colors">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── App root ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ForStudents />
      <StatsBar />
      <FAQ />
      <DownloadCTA />
      <Footer />
    </div>
  );
}
