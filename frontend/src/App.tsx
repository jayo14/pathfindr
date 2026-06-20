import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ArrowRight,
  Code,
  Globe,
  PenTool,

  MessageSquare,
  Activity,
  Target,
  BarChart3,
  BrainCircuit,
  Smartphone,
  Check
} from 'lucide-react';

const Navbar = () => (
  <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[1280px] z-50">
    <div className="glass h-16 rounded-2xl flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-slate-900" />
        <span className="text-lg font-bold text-slate-900">neuralAI</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {["Product", "Pricing", "Resources", "Blog"].map((link) => (
          <a key={link} href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            {link}
          </a>
        ))}
        <a href="#" className="text-sm font-medium text-slate-900">Sign in</a>
      </div>

      <button className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-900 hover:bg-slate-50 transition-colors">
        Signup
      </button>
    </div>
  </nav>
);

const Hero = () => (
  <section className="pt-32 pb-24 px-5 md:px-20 flex flex-col items-center text-center bg-[var(--hero-bg)]">
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[800px] mb-6"
    >
      AI-Driven sales teams with human-level precision
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="max-w-[560px] text-lg text-slate-500 mb-10"
    >
      Empower your business with AI-driven agents that execute tasks with human-level precision, efficiency, and reliability.
    </motion.p>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex gap-4 mb-16"
    >
      <button className="px-6 py-3.5 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all">
        Try for free
      </button>
      <button className="px-6 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-full font-medium hover:bg-slate-50 transition-all">
        Request a Demo
      </button>
    </motion.div>

    <div className="relative w-full max-w-[1000px] h-[480px]">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="absolute inset-x-0 mx-auto w-full md:w-[420px] bg-white rounded-[24px] soft-shadow p-6 z-10"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <BrainCircuit className="text-indigo-500" size={20} />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold">AI Assistant</div>
              <div className="text-xs text-slate-400">Online</div>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl text-left text-sm text-slate-700">
            Provide a detailed summary of my company's latest revenue showing key metrics.
          </div>
          <div className="w-12 h-12 rounded-full bg-[var(--rose-gradient)] self-center flex items-center justify-center text-white shadow-lg">
            <Activity size={24} />
          </div>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute top-10 left-0 glass p-4 rounded-2xl flex items-center gap-3 hidden md:flex">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500 flex items-center justify-center text-xs font-bold">43%</div>
        <div className="text-left"><div className="text-xs font-bold">Conversion</div><div className="text-[10px] text-slate-400">Improved rate</div></div>
      </motion.div>

      <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }} className="absolute top-1/2 left-[-40px] bg-white p-3 rounded-full soft-shadow flex items-center gap-2 hidden md:flex">
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
        <span className="text-xs font-medium">Performance 58%</span>
      </motion.div>

      <motion.div animate={{ x: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }} className="absolute bottom-10 left-10 glass p-4 rounded-2xl hidden md:block">
        <div className="text-xs text-slate-500 mb-1">Revenue</div>
        <div className="text-lg font-bold">$7,354.21</div>
        <div className="h-1 w-full bg-indigo-100 rounded-full mt-2 overflow-hidden">
          <div className="h-full w-2/3 bg-indigo-500" />
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }} className="absolute top-20 right-0 bg-white px-4 py-2 rounded-full soft-shadow text-xs font-medium hidden md:block">
        Daily Figures: $4,056.21
      </motion.div>

      <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }} className="absolute bottom-20 right-10 bg-white p-6 rounded-[24px] soft-shadow text-center hidden md:block">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-slate-100 flex items-center justify-center text-sm font-bold mb-2">43%</div>
        <div className="text-xs font-semibold">Accuracy</div>
      </motion.div>
    </div>
  </section>
);

const TrustedPartners = () => (
  <section className="py-16 flex flex-col items-center bg-white">
    <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-8">Our trusted partners</span>
    <div className="flex flex-wrap justify-center gap-12 md:gap-16 opacity-50 grayscale">
       {["Hedge", "Iberis", "Lattice", "Evermore", "Hedge"].map((name, i) => (
         <span key={i} className="text-2xl font-black text-slate-900 tracking-tighter italic">{name}</span>
       ))}
    </div>
  </section>
);

const Features = () => (
  <section className="py-24 px-5 md:px-20 bg-white">
    <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
      <div className="space-y-3">
        <span className="text-indigo-500 font-bold">Benefits</span>
        <h2 className="max-w-[600px]">Why sales teams love our AI-Powered dashboard</h2>
      </div>
      <button className="flex items-center gap-2 text-slate-900 font-medium group">
        Learn more <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       {[
         { title: "Real-time analytics", desc: "Track performance metrics as they happen with human-level accuracy.", icon: Activity },
         { title: "Smart automation", desc: "Automate repetitive tasks and focus on closing deals.", icon: Target },
         { title: "Advanced forecasting", desc: "Predict future sales trends with our proprietary AI models.", icon: BarChart3 }
       ].map((feat, i) => (
         <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors group">
           <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-500 mb-6 soft-shadow group-hover:scale-110 transition-transform">
             <feat.icon size={24} />
           </div>
           <h3 className="mb-3">{feat.title}</h3>
           <p className="text-slate-500 text-sm">{feat.desc}</p>
         </div>
       ))}
    </div>
  </section>
);

const SplitFeatures = () => (
  <section className="py-24 px-5 md:px-20 grid grid-cols-1 md:grid-cols-2 gap-10 bg-white">
    <div className="bg-slate-50 rounded-[24px] p-10 flex flex-col items-center justify-center overflow-hidden">
      <h3 className="mb-8 text-center">AI-Powered Lead Formatting</h3>
      <div className="grid grid-cols-3 gap-6 opacity-80">
        {[Code, Globe, PenTool,  Smartphone, MessageSquare].map((Icon, i) => (
          <div key={i} className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center soft-shadow">
            <Icon size={32} className="text-slate-400" />
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white border border-slate-100 rounded-[24px] p-10 soft-shadow">
      <h3 className="mb-8">Real-Time Performance Tracking</h3>
      <div className="flex items-end gap-3 h-48">
        {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
          <div key={i} className={`flex-1 rounded-t-lg ${i === 3 ? 'bg-indigo-500' : 'bg-slate-100'}`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-24 px-5 md:px-20 flex flex-col items-center bg-white">
    <div className="text-center mb-16 space-y-3">
      <span className="text-xs uppercase font-bold text-slate-400">Testimonials</span>
      <h2>What sales teams are saying</h2>
      <p className="text-slate-500">Trusted by high-performing teams worldwide.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {[
        { name: "Sarah Chen", role: "Sales Director @ TechFlow", quote: "neuralAI has completely transformed how our team handles lead qualification. The precision is unmatched." },
        { name: "James Miller", role: "Head of Growth @ Saasify", quote: "We've seen a 40% increase in conversion rates since integrating neuralAI agents into our workflow." },
        { name: "Elena Rodriguez", role: "VP Sales @ Innovate", quote: "The dashboard gives us insights we didn't know we needed. It's like having an extra team of analysts." }
      ].map((t, i) => (
        <div key={i} className="p-8 rounded-2xl bg-white border border-slate-100 soft-shadow flex flex-col gap-6">
          <div className="text-2xl font-black italic text-slate-200">"</div>
          <p className="text-slate-800 font-medium italic">{t.quote}</p>
          <div className="flex items-center gap-3 mt-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden">
               <img src={`https://i.pravatar.cc/100?u=${i}`} alt={t.name} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{t.name}</div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t.role}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-6">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full text-left">
        <span className="text-lg font-medium text-slate-900">{question}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown size={20} className="text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-slate-500 leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => (
  <section className="py-24 px-5 md:px-20 grid grid-cols-1 md:grid-cols-12 gap-16 bg-white">
    <div className="md:col-span-5">
      <div className="bg-slate-50 rounded-[32px] p-8 aspect-square flex flex-col justify-between overflow-hidden relative group">
        <div className="space-y-4">
           <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white">
             <BrainCircuit size={24} />
           </div>
           <h2>Got questions? We've got answers.</h2>
        </div>
        <div className="bg-white p-4 rounded-2xl soft-shadow flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"><Check size={20}/></div>
           <div className="text-sm font-bold text-slate-900">Active Support 24/7</div>
        </div>
      </div>
    </div>
    <div className="md:col-span-7 flex flex-col gap-2">
      <FAQItem
        question="How secure is my data with neuralAI?"
        answer="We use enterprise-grade encryption and comply with all major data protection regulations. Your data is isolated and used only for your agents' training."
      />
      <FAQItem
        question="Can I customize the AI's personality?"
        answer="Yes! Our platform allows you to define the tone, style, and specific knowledge base for each agent to match your brand's voice."
      />
      <FAQItem
        question="Does it integrate with my existing CRM?"
        answer="Absolutely. We offer native integrations with Salesforce, HubSpot, Pipedrive, and many others through our robust API."
      />
    </div>
  </section>
);

const FooterCTA = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/waitlist/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <section className="px-5 md:px-10 pb-10">
      <div className="bg-[var(--cta-bg)] rounded-[40px] p-12 md:p-24 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-rose-300/30 to-transparent" />
        <h2 className="mb-8 max-w-[600px]">Supercharge your sales with AI today!</h2>

        <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md flex flex-col md:flex-row gap-3">
           <input
             type="email"
             required
             placeholder="Enter your work email"
             className="flex-1 px-6 py-4 rounded-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
           />
           <button
             disabled={status === 'loading'}
             className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
           >
             {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
           </button>
        </form>

        {status === 'success' && (
          <p className="mt-4 text-green-600 font-medium">You've been added to the waitlist!</p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-rose-500 font-medium">Something went wrong. Please try again.</p>
        )}

        <div className="mt-20 w-full max-w-[1000px] bg-white rounded-t-[32px] soft-shadow p-6 pb-0 border border-slate-100 h-64 overflow-hidden -mb-24">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="w-3 h-3 rounded-full bg-slate-200" />
              <div className="w-3 h-3 rounded-full bg-slate-200" />
            </div>
            <div className="w-32 h-6 rounded-full bg-slate-50" />
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />
            <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />
            <div className="h-40 rounded-xl bg-slate-50 animate-pulse" />
          </div>
        </div>
      </div>

      <footer className="mt-20 flex flex-col md:flex-row justify-between items-center py-10 border-t border-slate-100 gap-6">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900" />
            <span className="font-bold">neuralAI</span>
         </div>
         <div className="text-slate-400 text-sm">© 2024 neuralAI. All rights reserved.</div>
         <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors"><Smartphone size={20}/></a>
            <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors"><Activity size={20}/></a>
            <a href="#" className="text-slate-400 hover:text-indigo-500 transition-colors"><Target size={20}/></a>
         </div>
      </footer>
    </section>
  );
};

export default function App() {
  return (
    <div className="outer-canvas mx-auto">
      <Navbar />
      <Hero />
      <TrustedPartners />
      <Features />
      <SplitFeatures />
      <Testimonials />
      <FAQ />
      <FooterCTA />
    </div>
  );
}
