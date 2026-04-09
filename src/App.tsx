/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useEffect, useRef, useState, type ReactNode, Component, type ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Cpu, BarChart3, Zap, ShieldCheck, Quote, Star, Check, X, Instagram, Twitter, Linkedin, Mail, Phone, MapPin, Facebook } from 'lucide-react';
import Hls from 'hls.js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Blogs from './Blogs';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070612] text-beige flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Algo salió mal.</h2>
          <p className="text-beige/60 mb-6 max-w-md">
            Ha ocurrido un error inesperado en la aplicación. Por favor, recarga la página.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-beige text-[#070612] rounded-full font-medium"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const BlurIn = ({ 
  children, 
  delay = 0, 
  duration = 0.6,
  className 
}: { 
  children: ReactNode; 
  delay?: number; 
  duration?: number;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const SplitText = ({ 
  text, 
  delay = 0, 
  duration = 0.6,
  stagger = 0.08,
  className,
  lineClassName
}: { 
  text: string; 
  delay?: number; 
  duration?: number;
  stagger?: number;
  className?: string;
  lineClassName?: string;
}) => {
  const words = text.split(' ');
  
  return (
    <div className={cn("flex flex-wrap", className)}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration, 
            delay: delay + (i * stagger),
            ease: [0.21, 0.47, 0.32, 0.98]
          }}
          className={cn("inline-block mr-[0.25em]", lineClassName)}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

const VideoBackground = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsUrl = "https://stream.mux.com/s8pMcOvMQXc4GD6AX4e1o01xFogFxipmuKltNfSYza0200.m3u8";

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure muted is set for autoplay
    video.muted = true;

    let hls: Hls | null = null;

    const handlePlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Ignore AbortError as it's often a race condition with loading/unmounting
          if (error.name !== 'AbortError') {
            console.error("Video play failed:", error);
          }
        });
      }
    };

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, handlePlay);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', handlePlay);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover origin-left scale-[1.2] ml-[200px]"
      />
      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#070612] to-transparent z-10" />
    </div>
  );
};

const SalesBarChart = () => {
  const data = [20, 35, 30, 60, 85, 120];
  const maxVal = Math.max(...data);
  
  return (
    <div className="flex items-end justify-center gap-4 sm:gap-8 h-56 sm:h-72 mt-16 w-full max-w-3xl mx-auto border-b border-beige/20 pb-1 px-4">
      {data.map((val, i) => (
        <div key={i} className="relative flex flex-col items-center justify-end h-full flex-1">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: `${(val / maxVal) * 100}%`, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              duration: 1, 
              delay: i * 0.15, 
              ease: [0.21, 0.47, 0.32, 0.98] 
            }}
            className="w-full max-w-[4rem] bg-gradient-to-t from-beige/5 via-beige/40 to-beige/80 rounded-t-lg relative group"
          >
            {/* Glow effect on the top of the bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-beige rounded-t-lg opacity-50 blur-[2px]"></div>
            
            {/* Percentage indicator */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i * 0.15) + 0.6, duration: 0.5 }}
              className="absolute -top-10 left-1/2 -translate-x-1/2 text-sm md:text-base font-mono text-beige/80 font-medium"
            >
              +{val}%
            </motion.div>
          </motion.div>
        </div>
      ))}
    </div>
  );
};

const TestimonialsSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 300;
        const gap = 24;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const reviews = [
    { id: 1, text: "Super recomendados, un trabajo demasiado profesional en el sitio web, diseño limpio y atención muy respetuosa", name: "Alejandro Salazar", time: "1 week ago", avatar: "https://i.imgur.com/Dehg7cl.jpeg" },
    { id: 2, text: "Trabajo rápido y excelente atención, además pude ver un crecimiento profesional con mi negocio, sin duda la página lo hace ver muy serio", name: "Mauricio Hernández", time: "2 weeks ago", avatar: "https://i.imgur.com/EdZokjB.jpeg" },
    { id: 3, text: "No tenía página web y dependíamos solo de referidos… en 2 semanas ya estábamos recibiendo consultas desde la web. Súper recomendados.", name: "Silvia Villegas", time: "1 month ago", avatar: "https://i.imgur.com/oav8Dlt.jpeg" },
    { id: 4, text: "Increíble la diferencia de un perfil de Facebook a una web profesional, he podido recibir más clientes de forma automática todas las semanas, de verdad que fue una gran inversión", name: "Ulises segura", time: "2 months ago", avatar: "https://i.imgur.com/IZevXrE.jpeg" },
    { id: 5, text: "Sin duda lo que mata un negocio es no lanzarse a lo digital, gracias a Dios por haberme encontrado una empresa que me ofreció una solución rapida y muy económica, súper recomendados al 100%", name: "Gabriel Sibaja", time: "3 months ago", avatar: "https://i.imgur.com/VZIumrd.jpeg" },
  ];

  return (
    <section id="reviews" className="pt-24 lg:pt-28 pb-[100px] w-full bg-[#070612]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Top Center Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <p className="text-beige/80 text-base mb-1">Nuestros clientes</p>
          <h2 className="text-3xl md:text-4xl font-bold text-beige mb-0 tracking-tight max-w-5xl mx-auto">Ellos ya lo comprobaron, sin excusas, sin objeción, sin miedo ¿Y TÚ?</h2>
          
          <div className="flex flex-col items-center -mt-8 md:-mt-12">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-beige/90">4.8/5</span>
              <img 
                src="https://i.imgur.com/wwUudET.png" 
                alt="Trustpilot Rating" 
                className="h-32 md:h-40 w-auto max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column (30%) */}
          <div className="lg:col-span-4 flex flex-col gap-8 pr-0 lg:pr-8">
            <Quote className="w-12 h-12 text-beige/10 rotate-180" />
          </div>

          {/* Right Column (70%) */}
          <div className="lg:col-span-8 overflow-hidden">
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-8 -mb-8 [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reviews.map(review => (
                <div 
                  key={review.id} 
                  className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] shrink-0 snap-start bg-beige/[0.03] border border-beige/10 rounded-2xl p-6 shadow-sm hover:bg-beige/[0.05] transition-colors"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-[#00B67A] fill-[#00B67A]" />
                    ))}
                  </div>
                  <p className="text-beige/70 text-sm leading-relaxed mb-6 min-h-[80px]">
                    "{review.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={review.avatar} 
                      alt={review.name} 
                      className="w-10 h-10 rounded-full object-cover border border-beige/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex flex-col">
                      <span className="text-beige font-bold text-sm">{review.name}</span>
                      <span className="text-beige/40 text-xs">{review.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const PortfolioSection = () => {
  const brands = [
    { id: 1, name: "Marca 1", logo: "https://i.imgur.com/EMkXpOW.png" },
    { id: 2, name: "Marca 2", logo: "https://i.imgur.com/FDQCGHN.jpeg" },
    { id: 3, name: "Marca 3", logo: "https://i.imgur.com/BGUw9Nr.jpeg" },
    { id: 4, name: "Marca 4", logo: "https://i.imgur.com/LHi1rwi.jpeg" },
    { id: 5, name: "Marca 5", logo: "https://i.imgur.com/Br0sors.jpeg" },
    { id: 6, name: "Marca 6", logo: "https://i.imgur.com/idlnUbt.jpeg" },
    { id: 7, name: "Marca 7", logo: "https://i.imgur.com/zBvrlZ9.jpeg" },
  ];

  return (
    <section className="py-24 lg:py-32 w-full bg-[#070612] border-t border-beige/5">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col items-center text-center mb-16 md:mb-24 px-6">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-beige/40 mb-4 block">
            NUESTRO PORTAFOLIO
          </span>
          <h2 className="text-3xl md:text-4xl font-medium leading-tight text-beige">
            De negocio a <span className="font-serif italic text-beige/80">imagen empresarial</span>
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 md:gap-14 max-w-4xl mx-auto px-6">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group cursor-pointer flex justify-center w-[100px] sm:w-[120px] md:w-[150px]"
            >
              <div className="w-full aspect-square sm:aspect-[4/3] relative flex items-center justify-center">
                <img 
                  src={brand.logo} 
                  alt={brand.name}
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ComparisonSection = () => {
  const comparisons = [
    { others: "Plantillas genéricas", webworks: "Diseños altamente profesionales" },
    { others: "Atención lenta y demorada", webworks: "Atención rápida y prioritaria" },
    { others: "Pagos extras por hosting", webworks: "Hosting y dominio gratis" },
    { others: "Formularios limitados", webworks: "Formulario ilimitado" },
    { others: "Entrega en semanas", webworks: "Entrega rápida en 48 horas" },
    { others: "Soporte con costo extra", webworks: "Soporte técnico Gratis" },
    { others: "Mensualidades eternas", webworks: "Pago único sin mensualidades" },
  ];

  return (
    <section className="py-24 bg-[#070612] border-t border-beige/5">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-beige mb-4">
            ¿Por qué elegir <span className="text-beige/40 italic font-serif">Webworks</span>?
          </h2>
        </div>

        <div className="overflow-hidden rounded-3xl border border-beige/10 bg-beige/[0.02] backdrop-blur-md">
          {/* Header */}
          <div className="grid grid-cols-2 border-b border-beige/10 bg-beige/[0.05]">
            <div className="p-6 md:p-8 flex items-center justify-center border-r border-beige/10">
              <span className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-beige/30">Agencia Normal</span>
            </div>
            <div className="p-6 md:p-8 flex items-center justify-center bg-beige/[0.02]">
              <img 
                src="https://i.imgur.com/hRN0Wid.png" 
                alt="Webworks Logo" 
                className="h-24 md:h-36 w-auto brightness-110"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Rows */}
          {comparisons.map((item, i) => (
            <div key={i} className="grid grid-cols-2 border-b border-beige/5 last:border-0 group">
              <div className="p-6 md:p-8 flex items-center justify-center border-r border-beige/10 bg-red-500/[0.01]">
                <div className="flex items-center gap-3 text-beige/40">
                  <X className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="text-xs md:text-base font-medium line-through decoration-red-500/40">{item.others}</span>
                </div>
              </div>
              <div className="p-6 md:p-8 flex items-center justify-center bg-green-500/[0.01] group-hover:bg-green-500/[0.03] transition-colors">
                <div className="flex items-center gap-3 text-beige">
                  <Check className="w-5 h-5 shrink-0 text-[#00B67A]" />
                  <span className="text-xs md:text-base font-bold tracking-tight">{item.webworks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactFormSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    business: '',
    details: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = "50661197610";
    const message = encodeURIComponent(`Hola Webworks, mi nombre es ${formData.name}, tengo un negocio de ${formData.business} y quisiera saber: ${formData.details}`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <section id="contact" className="relative pt-32 pb-8 bg-[#070612] overflow-hidden border-t border-beige/5">
      {/* Spotlight effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,245,240,0.05),transparent_70%)] pointer-events-none" />
      
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-beige/[0.04] rounded-full blur-[150px] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-bold uppercase tracking-[0.5em] text-beige/40 mb-6 block"
          >
            SOLICITAR INFORMACIÓN
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-light text-beige tracking-tight"
          >
            Eleve su <span className="font-serif italic text-beige/70">estándar digital</span>
          </motion.h2>
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 1 }}
            className="h-px w-24 bg-beige/30 mx-auto mt-8"
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          {/* Professional Container with subtle background */}
          <div className="relative bg-beige/[0.04] backdrop-blur-xl border border-beige/20 rounded-xl p-10 md:p-20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)]">
            <form className="grid grid-cols-1 gap-16" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="relative group">
                  <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-beige/80 mb-4 block transition-colors group-focus-within:text-beige">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    placeholder="Su nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-transparent border-b border-beige/20 py-4 text-beige placeholder:text-beige/10 focus:outline-none focus:border-beige/50 transition-all font-light text-xl"
                  />
                </div>
                <div className="relative group">
                  <label htmlFor="business" className="text-[10px] font-bold uppercase tracking-widest text-beige/80 mb-4 block transition-colors group-focus-within:text-beige">
                    Tipo de Negocio
                  </label>
                  <input
                    type="text"
                    id="business"
                    required
                    placeholder="Industria o sector"
                    value={formData.business}
                    onChange={(e) => setFormData({ ...formData, business: e.target.value })}
                    className="w-full bg-transparent border-b border-beige/20 py-4 text-beige placeholder:text-beige/10 focus:outline-none focus:border-beige/50 transition-all font-light text-xl"
                  />
                </div>
              </div>

              <div className="relative group">
                <label htmlFor="details" className="text-[10px] font-bold uppercase tracking-widest text-beige/80 mb-4 block transition-colors group-focus-within:text-beige">
                  Detalle de la consulta
                </label>
                <textarea
                  id="details"
                  rows={3}
                  required
                  placeholder="Describa brevemente sus objetivos..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full bg-transparent border-b border-beige/20 py-4 text-beige placeholder:text-beige/10 focus:outline-none focus:border-beige/50 transition-all font-light text-xl resize-none"
                />
              </div>

              <div className="flex justify-center pt-12">
                <button
                  type="submit"
                  className="group px-10 py-3 bg-beige border border-beige transition-all duration-500 hover:bg-transparent hover:text-beige"
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-[#070612] group-hover:text-beige transition-colors">
                    Recibir asesoría gratis
                  </span>
                </button>
              </div>
            </form>

            {/* Subtle prestige accents */}
            <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-transparent via-beige/20 to-transparent" />
            <div className="absolute bottom-0 right-0 w-32 h-px bg-gradient-to-l from-transparent via-beige/20 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#070612] pt-8 pb-12 border-t border-beige/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <img 
              src="https://i.imgur.com/7J5EOvJ.png" 
              alt="Webworks Logo" 
              className="h-52 w-auto -mb-6 brightness-110"
              referrerPolicy="no-referrer"
            />
            <p className="text-beige/40 text-sm leading-relaxed max-w-xs">
              Impulsamos el crecimiento de tu negocio con sitios web de alto impacto, diseño exclusivo y tecnología que convierte visitantes en clientes.
            </p>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-beige/60 mb-8">Contacto</h4>
            <ul className="space-y-6">
              <li className="flex items-center gap-4 text-beige/40 hover:text-beige transition-colors group">
                <div className="w-10 h-10 rounded-full border border-beige/5 flex items-center justify-center group-hover:border-beige/20 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm">info.webworkscorp@gmail.com</span>
              </li>
              <li className="flex items-center gap-4 text-beige/40 hover:text-beige transition-colors group">
                <div className="w-10 h-10 rounded-full border border-beige/5 flex items-center justify-center group-hover:border-beige/20 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm">+506 6119 7610</span>
              </li>
              <li className="flex items-center gap-4 text-beige/40 hover:text-beige transition-colors group">
                <div className="w-10 h-10 rounded-full border border-beige/5 flex items-center justify-center group-hover:border-beige/20 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm">San José, Costa Rica</span>
              </li>
            </ul>
          </div>

          {/* Social Column */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-beige/60 mb-8">Redes Sociales</h4>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/share/1chmaXhHxU/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-beige/10 flex items-center justify-center text-beige/40 hover:text-beige hover:border-beige/30 transition-all hover:-translate-y-1">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/webworks.corp?igsh=MWllNDlhMG84YmZkNw==" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-beige/10 flex items-center justify-center text-beige/40 hover:text-beige hover:border-beige/30 transition-all hover:-translate-y-1">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://wa.me/50661197610" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full border border-beige/10 flex items-center justify-center text-beige/40 hover:text-beige hover:border-beige/30 transition-all hover:-translate-y-1">
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-5 h-5 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>
              <a href="mailto:info.webworkscorp@gmail.com" className="w-12 h-12 rounded-full border border-beige/10 flex items-center justify-center text-beige/40 hover:text-beige hover:border-beige/30 transition-all hover:-translate-y-1">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-beige/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-beige/20 uppercase tracking-[0.2em]">
            © 2026 Webworks Corporation. Todos los derechos reservados.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] text-beige/20 uppercase tracking-[0.2em] hover:text-beige/40 transition-colors">Términos</a>
            <a href="#" className="text-[10px] text-beige/20 uppercase tracking-[0.2em] hover:text-beige/40 transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [showBlog, setShowBlog] = useState(false);

  if (showBlog) {
    return (
      <div className="bg-[#070612] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button 
            onClick={() => setShowBlog(false)}
            className="text-beige/60 hover:text-beige transition-colors text-sm font-medium flex items-center gap-2"
          >
            ← Volver al inicio
          </button>
        </div>
        <Blogs />
      </div>
    );
  }

  return (
    <div className="bg-[#070612] text-beige selection:bg-beige/20">
      {/* Floating Blog Button */}
      <div className="fixed top-6 right-6 z-50">
        <button 
          onClick={() => setShowBlog(true)}
          className="px-6 py-2 rounded-full bg-beige/10 backdrop-blur-md border border-beige/20 text-beige text-sm font-medium hover:bg-beige/20 transition-colors"
        >
          Ver Blog
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-screen overflow-hidden flex items-center">
        {/* Background Video */}
        <VideoBackground />

        {/* Content Container */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col gap-12 max-w-3xl">
            
            {/* Heading Group */}
            <div className="flex flex-col gap-6">
              
              {/* Trust Badge */}
              <BlurIn duration={0.7} className="mb-2 relative -left-2 sm:-left-4">
                <div className="flex items-center gap-4 group">
                  <img 
                    src="https://i.imgur.com/nAcXETt.png" 
                    alt="Certification Badge" 
                    className="h-6 sm:h-7 w-auto brightness-110 contrast-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-beige/30 group-hover:text-beige/50 transition-colors">
                      Verified Agency
                    </span>
                    <span className="text-[10px] font-medium text-beige/60">
                      Google Web Certified
                    </span>
                  </div>
                </div>
              </BlurIn>

              {/* Main Heading */}
              <div className="flex flex-col gap-2 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight lg:leading-[1.2] text-beige">
                <SplitText 
                  text="Las empresas que dominan el mercado" 
                  className="block"
                />
                <SplitText 
                  text="no tienen mejor producto— tienen" 
                  delay={0.4}
                  className="block"
                />
                <div className="flex flex-wrap items-baseline gap-[0.25em]">
                  <SplitText 
                    text="mejor" 
                    delay={0.6}
                  />
                  <SplitText 
                    text="presencia" 
                    delay={0.76}
                    lineClassName="font-serif italic"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <BlurIn delay={0.4} duration={0.6}>
                <p className="text-beige/80 text-lg font-normal leading-relaxed max-w-xl">
                  En Webworks corporation creamos presencias digitales que posicionan tu negocio como referente en tu industria — con el nivel de detalle y sofisticación que tus clientes esperan ver.
                </p>
              </BlurIn>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <BlurIn delay={0.6} duration={0.6}>
                <a 
                  href="#contact"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-beige text-[#070612] font-medium transition-transform hover:scale-105 active:scale-95"
                >
                  Agendar consulta
                  <ArrowRight className="w-4 h-4" />
                </a>
              </BlurIn>
              
              <BlurIn delay={0.6} duration={0.6}>
                <a 
                  href="#reviews"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-beige/20 backdrop-blur-sm text-beige font-medium transition-colors hover:bg-beige/30 active:scale-95"
                >
                  Nuestros clientes
                </a>
              </BlurIn>
            </div>

          </div>
        </div>
      </section>

      {/* Certifications & Sales Growth Section */}
      <section className="pt-24 lg:pt-32 pb-24 lg:pb-28 relative border-t border-beige/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <BlurIn delay={0.2} duration={0.8} className="mb-16">
            <div className="relative overflow-hidden pb-12 border-b border-beige/5">
              <motion.div 
                className="flex gap-12 md:gap-24 items-center whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ 
                  duration: 8, 
                  ease: "linear", 
                  repeat: Infinity 
                }}
              >
                {/* First set of logos */}
                {[
                  "https://i.imgur.com/9lacAm1.png",
                  "https://i.imgur.com/5kurRiP.png",
                  "https://i.imgur.com/6Q3M4gw.png",
                  "https://i.imgur.com/YVTh9fp.png"
                ].map((src, i) => (
                  <img 
                    key={`cert-1-${i}`}
                    src={src} 
                    alt={`Certification ${i + 1}`} 
                    className="h-20 md:h-28 w-auto object-contain shrink-0 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                ))}
                {/* Duplicate set for seamless loop */}
                {[
                  "https://i.imgur.com/9lacAm1.png",
                  "https://i.imgur.com/5kurRiP.png",
                  "https://i.imgur.com/6Q3M4gw.png",
                  "https://i.imgur.com/YVTh9fp.png"
                ].map((src, i) => (
                  <img 
                    key={`cert-2-${i}`}
                    src={src} 
                    alt={`Certification ${i + 1} clone`} 
                    className="h-20 md:h-28 w-auto object-contain shrink-0 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </motion.div>
            </div>
          </BlurIn>

          {/* Sales Growth Section */}
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-12">
            <BlurIn duration={0.8}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-beige mb-6">
                Tener presencia profesional no solo eleva tu imagen, <br className="hidden md:block" />
                <span className="font-serif italic text-beige/80">eleva tus ventas.</span>
              </h2>
            </BlurIn>
            
            <SalesBarChart />
          </div>
        </div>
      </section>

      <TestimonialsSection />
      
      <ComparisonSection />

      <PortfolioSection />

      <ContactFormSection />

      <Footer />
    </div>
  );
}
