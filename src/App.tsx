import { motion } from 'motion/react';
import { 
  Gamepad2, 
  Users, 
  Trophy, 
  Globe2, 
  ShieldCheck, 
  Languages, 
  ChevronRight, 
  Star,
  MessageSquare,
  Crosshair,
  Swords,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gaming-900 overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <GamesStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <AppMockupSection />
        <TestimonialsSection />
        <TournamentsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gaming-900/60 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            <Gamepad2 className="text-white w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-white">
            Gamer<span className="text-neon-blue">Buddy</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="text-slate-300 hover:text-white hover:text-shadow-glow transition-all">Features</a>
          <a href="#tournaments" className="text-slate-300 hover:text-white hover:text-shadow-glow transition-all">Tournaments</a>
          <a href="#faq" className="text-slate-300 hover:text-white hover:text-shadow-glow transition-all">FAQ</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-6">
          <button className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log In
          </button>
          <button className="relative group px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm text-white overflow-hidden whitespace-nowrap">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-blue to-neon-purple opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-[1px] bg-gaming-900 rounded-[7px] group-hover:bg-gaming-800 transition-colors" />
            <span className="relative z-10 group-hover:text-shadow-glow transition-all">Get Early Access</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-24 pb-14 sm:pt-28 sm:pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[100px] opacity-40 pointer-events-none" />
      
      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-neon-blue rounded-full"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: Math.random() * 0.5 + 0.2
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [null, 0]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-center">
          
          {/* Left: Text Content */}
          <motion.div
            className="w-full max-w-4xl text-center"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              Built for Uzbekistan & Central Asia
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-tight mb-6 leading-[1.1]">
              Stop solo queue. <br />
              <span className="text-gradient">Find your squad.</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
              Find teammates by rank, role, language, and game. Build squads and join tournaments across Central Asia.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-white font-bold text-base sm:text-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 group">
                Find Teammates
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-white font-bold text-base sm:text-lg border border-white/20 hover:border-neon-purple hover:bg-neon-purple/10 hover:shadow-[0_0_20px_rgba(138,43,226,0.2)] transition-all flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-neon-purple" />
                Explore Tournaments
              </button>
            </div>
            
            {/* Social Proof / Stats */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-slate-400">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-gaming-900 bg-gradient-to-br from-slate-700 to-slate-800" />
                ))}
              </div>
              <div className="text-center sm:text-left">
                <div className="text-white font-bold text-base">10,000+ Players</div>
                <div>Waiting in lobby</div>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}

function GamesStrip() {
  const games = [
    "CS2", "Dota 2", "PUBG Mobile", "Valorant", "Mobile Legends", "Apex Legends"
  ];
  
  return (
    <div className="border-y border-white/5 bg-white/[0.02] py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500 mb-6 uppercase tracking-wider">Supported Games</p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 md:gap-16 opacity-60">
          {games.map((game, i) => (
            <div key={i} className="font-display font-bold text-base sm:text-xl md:text-2xl text-white tracking-widest">
              {game}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: <Crosshair className="w-6 h-6 text-neon-blue" />,
      title: "Smart Matchmaking",
      description: "Find players with similar ranks, playstyles, and goals. No more toxic randoms."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-neon-purple" />,
      title: "Verified Profiles",
      description: "Connect your Steam or game IDs. We verify ranks to ensure fair and honest team building."
    },
    {
      icon: <Globe2 className="w-6 h-6 text-neon-pink" />,
      title: "Regional Focus",
      description: "Ping matters. Find teammates specifically in Uzbekistan, Kazakhstan, and across Central Asia."
    },
    {
      icon: <Trophy className="w-6 h-6 text-yellow-400" />,
      title: "Local Tournaments",
      description: "Discover and register for local LANs and online cups with prize pools."
    },
    {
      icon: <Languages className="w-6 h-6 text-green-400" />,
      title: "Language Filters",
      description: "Filter players by language: Uzbek, Russian, English. Communication is key to winning."
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-orange-400" />,
      title: "Squad Chat & Voice",
      description: "Built-in tools to coordinate with your new team before jumping into Discord or the game."
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-20 lg:py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Everything you need to <span className="text-gradient">rank up</span>
          </h2>
          <p className="text-slate-400 text-lg">
            GamerBuddy isn't just a forum. It's a purpose-built platform to solve the biggest problem in competitive gaming: finding reliable teammates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 sm:p-8 rounded-2xl hover:bg-white/10 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Create Your Profile",
      desc: "Link your game accounts, set your roles, and define your schedule."
    },
    {
      num: "02",
      title: "Swipe or Search",
      desc: "Use our Tinder-like matching for quick games, or advanced search for serious squads."
    },
    {
      num: "03",
      title: "Dominate the Lobby",
      desc: "Party up, communicate effectively, and start winning your matches."
    }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gaming-800 relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10 sm:gap-16 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
              From solo to squad in <span className="text-gradient">minutes</span>
            </h2>
            <div className="space-y-6 sm:space-y-8 mt-10 sm:mt-12">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4 sm:gap-6">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-neon-blue/30 flex items-center justify-center text-neon-blue font-display font-bold text-lg sm:text-xl bg-neon-blue/5">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-neon-blue/20 to-neon-purple/20 rounded-full blur-3xl" />
              <div className="relative h-full w-full glass-card rounded-3xl border border-white/10 overflow-hidden p-4 sm:p-6 flex flex-col">
                {/* Mock UI */}
                <div className="flex items-center justify-between mb-6">
                  <div className="font-display font-bold text-white">Suggested Players</div>
                  <div className="text-xs text-neon-blue bg-neon-blue/10 px-2 py-1 rounded">CS2</div>
                </div>
                
                <div className="flex-1 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-white/5 hover:border-white/20 transition-colors cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-white text-sm">Player_{i}99</div>
                          <div className="text-xs text-green-400">Online</div>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Global Elite • Entry Fragger</div>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center hover:bg-neon-blue hover:text-white transition-colors">
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppMockupSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-10 sm:mb-16">
          Designed for <span className="text-gradient">Gamers</span>
        </h2>
        
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl blur opacity-20" />
          <div className="relative glass-card rounded-2xl border border-white/10 aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-[#0d0d12] flex items-center justify-center">
            {/* Abstract representation of the app dashboard */}
            <div className="absolute inset-0 flex">
              {/* Sidebar */}
              <div className="w-64 border-r border-white/5 p-6 hidden md:block">
                <div className="w-32 h-8 bg-white/10 rounded mb-10" />
                <div className="space-y-4">
                  {[1,2,3,4].map(i => <div key={i} className="w-full h-10 bg-white/5 rounded" />)}
                </div>
              </div>
              {/* Main Content */}
              <div className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="w-48 h-8 bg-white/10 rounded" />
                  <div className="w-10 h-10 bg-white/10 rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/5" />)}
                </div>
                <div className="h-40 sm:h-64 bg-white/5 rounded-xl border border-white/5" />
              </div>
            </div>
            
            <div className="z-10 bg-gaming-900/80 backdrop-blur-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white/10 text-xs sm:text-sm font-medium text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
              Dashboard Preview
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Used to spend hours looking for a decent +1 for CS2 Faceit. Now I find a full stack in 5 minutes. The regional filter is a lifesaver.",
      author: "Azamat 'RushB' K.",
      role: "CS2 Player, Tashkent",
      rating: 5
    },
    {
      quote: "Finally a platform that understands CIS gamers. Found my current Dota 2 team here and we just won our first local LAN!",
      author: "Elena 'SupportOnly'",
      role: "Dota 2 Player, Almaty",
      rating: 5
    },
    {
      quote: "The tournament discovery feature is amazing. I never knew there were so many PUBG Mobile events happening in my city.",
      author: "Timur 'Sniper'",
      role: "PUBG Mobile, Samarkand",
      rating: 5
    }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gaming-800 relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Trusted by the <span className="text-gradient">Community</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card p-6 sm:p-8 rounded-2xl relative">
              <div className="flex gap-1 mb-6">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-neon-blue text-neon-blue" />
                ))}
              </div>
              <p className="text-slate-300 text-sm sm:text-base mb-8 italic">"{t.quote}"</p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800" />
                <div>
                  <div className="text-white font-bold text-sm">{t.author}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TournamentsSection() {
  return (
    <section id="tournaments" className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-10 sm:gap-16 items-center">
          <div className="lg:w-1/2 order-2 lg:order-1">
            <div className="space-y-6">
              {[
                { name: "Tashkent CS2 Masters", prize: "10,000,000 UZS", date: "Next Weekend", status: "Registering" },
                { name: "Central Asia Dota Cup", prize: "$5,000", date: "Starts in 2 weeks", status: "Upcoming" },
                { name: "PUBG Mobile Campus", prize: "Gaming Gear", date: "Ongoing", status: "Live" }
              ].map((t, i) => (
                <div key={i} className="glass-card p-5 sm:p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/5 hover:border-neon-purple/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        t.status === 'Live' ? 'bg-red-500/20 text-red-400' : 
                        t.status === 'Registering' ? 'bg-green-500/20 text-green-400' : 
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-slate-400 text-sm">{t.date}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white">{t.name}</h4>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm text-slate-400 mb-1">Prize Pool</div>
                    <div className="text-neon-purple font-bold">{t.prize}</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-8 text-neon-blue font-medium hover:text-white transition-colors flex items-center gap-2">
              View all tournaments <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="lg:w-1/2 order-1 lg:order-2">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
              Compete in <span className="text-gradient">Local Events</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8">
              We partner with local cyber arenas and organizers to bring you the best tournaments in Uzbekistan and Central Asia. Build your team on GamerBuddy and register with one click.
            </p>
            <ul className="space-y-4">
              {['Verified prize pools', 'LAN and Online events', 'Solo and Team registrations', 'Automated bracket management'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-neon-purple/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-neon-purple" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "Is GamerBuddy free to use?",
      a: "Yes! Finding teammates and basic profile features are completely free. We may introduce premium features later for advanced tournament analytics and team management."
    },
    {
      q: "Which countries are supported?",
      a: "We are currently focusing heavily on Uzbekistan, Kazakhstan, Kyrgyzstan, and Tajikistan to ensure high-quality, low-ping matchmaking."
    },
    {
      q: "How do you verify ranks?",
      a: "You can securely link your Steam, Faceit, or mobile game IDs. We use official APIs to fetch and display your real, verified rank."
    },
    {
      q: "Can I organize my own tournament?",
      a: "Tournament organization tools are currently in beta for selected partners. If you run a cyber arena or community, contact us for early access."
    }
  ];

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-gaming-800 border-y border-white/5">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-12 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string, key?: string | number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
      <button 
        className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-bold text-sm sm:text-base text-white">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 sm:px-6 pb-4 text-slate-400 text-sm sm:text-base">
          {answer}
        </div>
      )}
    </div>
  );
}

function CTASection() {
  return (
    <section className="py-20 sm:py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neon-blue/10 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold text-white mb-6">
          Ready to drop in?
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-8 sm:mb-10">
          Join thousands of players already finding their perfect squads on GamerBuddy.
        </p>
        <button className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-5 bg-gradient-to-r from-neon-blue to-neon-purple rounded-xl text-white font-bold text-base sm:text-lg lg:text-xl hover:shadow-[0_0_40px_rgba(138,43,226,0.4)] transition-all transform hover:-translate-y-1">
          Create Free Account
        </button>
        <p className="mt-6 text-sm text-slate-500">No credit card required. Setup takes 2 minutes.</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#050507] py-10 sm:py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="text-neon-blue w-6 h-6" />
              <span className="font-display font-bold text-xl text-white">
                Gamer<span className="text-neon-blue">Buddy</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm">
              The premier platform for finding teammates and tournaments in Central Asia. Built by gamers, for gamers.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-neon-blue transition-colors">Find Players</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">Tournaments</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">Leaderboards</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-neon-blue transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-neon-blue transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-slate-600 text-center md:text-left">
          <p>© 2026 GamerBuddy. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span>Tashkent, Uzbekistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
