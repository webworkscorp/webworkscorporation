/// <reference types="vite/client" />
import { useState, useEffect, useRef } from "react";

// ─── CONFIGURA ESTO ────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const SITE_TOPIC = import.meta.env.VITE_SITE_TOPIC || "servicios web y diseño digital en Costa Rica";
const MAX_POSTS = 2;
const INTERVAL_MS = 60 * 1000; // 1 minuto
// ───────────────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  createdAt: string;
  readTime: string;
  tags: string[];
}

function getCRTime(): string {
  return new Date().toLocaleString("es-CR", {
    timeZone: "America/Costa_Rica",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function generatePost(topic: string, index: number): Promise<BlogPost> {
  const angles = [
    `tendencias actuales y consejos prácticos sobre "${topic}"`,
    `guía completa para principiantes sobre "${topic}"`,
    `errores comunes y cómo evitarlos en "${topic}"`,
    `estrategias avanzadas para mejorar resultados en "${topic}"`,
  ];
  const angle = angles[index % angles.length];

  const prompt = `Eres un experto en SEO y marketing digital para el mercado costarricense. 
Genera un artículo de blog COMPLETO en español, enfocado en: ${angle}.

REGLAS:
- Título: máximo 60 caracteres, con palabra clave principal al inicio
- Meta description (excerpt): exactamente 150-160 caracteres, incluir llamada a la acción
- Contenido: mínimo 600 palabras en HTML limpio (solo h2, h3, p, ul, li, strong)
- Usar palabras clave de forma natural (densidad 1-2%)
- Tono profesional pero cercano, orientado a pymes costarricenses
- Incluir al menos 2 subtítulos h2 y 1 h3
- Terminar con párrafo de conclusión
- imagePrompt: Un prompt detallado en INGLÉS para generar una imagen fotorrealista con IA que ilustre el artículo con alta coherencia visual (ej: "A modern office desk with a laptop displaying growth charts, bright natural light, cinematic, photorealistic").
- tags: array de 3 etiquetas cortas en español

Responde ÚNICAMENTE con JSON válido, sin markdown ni backticks:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "imagePrompt": "...",
  "tags": ["...", "...", "..."]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  const words = parsed.content.replace(/<[^>]+>/g, "").split(/\s+/).length;
  const readTime = `${Math.max(2, Math.ceil(words / 200))} min`;

  // Usamos Pollinations AI para generar una imagen coherente basada en el prompt exacto de Gemini
  const seed = encodeURIComponent(parsed.imagePrompt || "business technology modern office");
  const imageUrl = `https://image.pollinations.ai/prompt/${seed}?width=800&height=450&nologo=true`;

  return {
    id: `post-${Date.now()}-${index}`,
    title: parsed.title,
    excerpt: parsed.excerpt,
    content: parsed.content,
    imageUrl,
    createdAt: getCRTime(),
    readTime,
    tags: parsed.tags || [],
  };
}

const DEFAULT_POST: BlogPost = {
  id: "post-default-1",
  title: "La importancia del diseño web profesional para tu negocio",
  excerpt: "Descubre cómo un sitio web bien diseñado puede transformar tu negocio, atraer más clientes y destacar frente a la competencia en el mercado digital actual.",
  content: "<h2>El impacto de la primera impresión digital</h2><p>En el mundo actual, tu sitio web es la vitrina principal de tu negocio. Los clientes buscan servicios en línea antes de tomar una decisión de compra. Un diseño web profesional no solo transmite confianza, sino que también facilita la navegación y mejora la experiencia del usuario.</p><h2>¿Por qué invertir en diseño web?</h2><p>Muchos negocios subestiman el poder de una buena presencia digital. Sin embargo, un sitio web optimizado ayuda a mejorar el posicionamiento en buscadores (SEO), lo que significa que más personas te encontrarán cuando busquen los servicios que ofreces.</p><ul><li><strong>Credibilidad:</strong> Un diseño moderno y limpio demuestra profesionalismo.</li><li><strong>Disponibilidad 24/7:</strong> Tu negocio siempre está abierto para recibir consultas.</li><li><strong>Alcance:</strong> Rompe las barreras geográficas y llega a nuevos mercados.</li></ul><h3>Conclusión</h3><p>Invertir en un diseño web profesional es invertir en el futuro de tu empresa. No dejes que tu competencia se lleve a tus clientes potenciales. ¡Es hora de dar el salto digital y consolidar tu presencia en línea!</p>",
  imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  createdAt: getCRTime(),
  readTime: "3 min",
  tags: ["Diseño Web", "Estrategia", "Negocios"]
};

export default function Blogs() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem("seo-blog-posts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch {}
    }
    return [DEFAULT_POST];
  });
  
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [incubatedPost, setIncubatedPost] = useState<BlogPost | null>(null);
  const [isIncubating, setIsIncubating] = useState(false);
  
  const [countdown, setCountdown] = useState(() => posts.length < MAX_POSTS ? INTERVAL_MS / 1000 : 0);

  useEffect(() => {
    localStorage.setItem("seo-blog-posts", JSON.stringify(posts));
  }, [posts]);

  // Incubadora: Genera el post en segundo plano si hace falta
  useEffect(() => {
    if (posts.length >= MAX_POSTS) return;
    if (!incubatedPost && !isIncubating && GEMINI_API_KEY) {
      setIsIncubating(true);
      generatePost(SITE_TOPIC, posts.length).then(post => {
        setIncubatedPost(post);
        setIsIncubating(false);
      }).catch(e => {
        console.error("Error incubando post:", e);
        setIsIncubating(false);
      });
    }
  }, [posts.length, incubatedPost, isIncubating]);

  // Temporizador
  useEffect(() => {
    if (posts.length >= MAX_POSTS) return;

    const timer = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [posts.length]);

  // Publicador: Sube el post cuando el contador llega a 0 y la incubadora terminó
  useEffect(() => {
    if (countdown === 0 && posts.length < MAX_POSTS) {
      if (incubatedPost) {
        setPosts(prev => [...prev, incubatedPost]);
        setIncubatedPost(null);
        if (posts.length + 1 < MAX_POSTS) {
          setCountdown(INTERVAL_MS / 1000);
        }
      }
    }
  }, [countdown, incubatedPost, posts.length]);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  let statusUI = null;
  if (posts.length >= MAX_POSTS) {
    statusUI = (
      <div className="status-bar done">
        ✓ {posts.length} artículo{posts.length > 1 ? "s" : ""} publicado{posts.length > 1 ? "s" : ""}
      </div>
    );
  } else if (countdown > 0) {
    statusUI = (
      <div className="status-bar waiting">
        <span>⏱</span>
        Próximo artículo en <strong>{formatCountdown(countdown)}</strong>
        {isIncubating && <span style={{fontSize: '0.75rem', opacity: 0.6, marginLeft: '8px'}}>(Incubando en segundo plano...)</span>}
        {incubatedPost && <span style={{fontSize: '0.75rem', opacity: 0.6, marginLeft: '8px'}}>(¡Listo para publicar!)</span>}
      </div>
    );
  } else if (countdown === 0 && !incubatedPost) {
    statusUI = (
      <div className="status-bar generating">
        <span className="pulse-dot" />
        Finalizando detalles del artículo...
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="blog-article-page">
        <style>{articleStyles}</style>
        <div className="article-header">
          <button className="back-btn" onClick={() => setSelectedPost(null)}>
            ← Volver al Blog
          </button>
        </div>
        <article className="article-container">
          <div className="article-meta-top">
            {selectedPost.tags.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
          <h1 className="article-title">{selectedPost.title}</h1>
          <div className="article-info">
            <span>🕐 {selectedPost.readTime} de lectura</span>
            <span>📅 {selectedPost.createdAt}</span>
          </div>
          <img
            src={selectedPost.imageUrl}
            alt={selectedPost.title}
            className="article-hero-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/800/450?random=${selectedPost.id}`;
            }}
          />
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
          />
        </article>
      </div>
    );
  }

  return (
    <div className="blog-page">
      <style>{blogStyles}</style>

      <div className="blog-hero">
        <h1 className="blog-hero-title">Blog</h1>
        <p className="blog-hero-sub">Contenido SEO generado automáticamente con IA</p>
      </div>

      {statusUI}

      <div className="blog-grid">
        {posts.map((post) => (
          <article key={post.id} className="blog-card" onClick={() => setSelectedPost(post)}>
            <div className="card-img-wrap">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="card-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/600/340?random=${post.id}`;
                }}
              />
              <div className="card-read-time">{post.readTime}</div>
            </div>
            <div className="card-body">
              <div className="card-tags">
                {post.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
              <h2 className="card-title">{post.title}</h2>
              <p className="card-excerpt">{post.excerpt}</p>
              <div className="card-footer">
                <span className="card-date">{post.createdAt}</span>
                <button className="read-btn">Leer artículo →</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

const blogStyles = `
  .blog-page { min-height: 100vh; padding-bottom: 80px; font-family: 'Georgia', serif; }
  .blog-hero { text-align: center; padding: 80px 20px 50px; background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%); }
  .blog-hero-title { font-size: clamp(2.5rem, 6vw, 4rem); font-weight: 800; color: #fff; margin: 0 0 12px; letter-spacing: -2px; }
  .blog-hero-sub { color: #888; font-size: 1rem; font-family: sans-serif; }
  .status-bar { display: flex; align-items: center; gap: 10px; max-width: 900px; margin: 24px auto 0; padding: 12px 20px; border-radius: 8px; font-family: sans-serif; font-size: 0.9rem; }
  .status-bar.generating { background: #1a1a2e; color: #7c83fd; border: 1px solid #7c83fd33; }
  .status-bar.waiting { background: #1a150a; color: #f5a623; border: 1px solid #f5a62333; }
  .status-bar.done { background: #0a1a12; color: #4ade80; border: 1px solid #4ade8033; }
  .pulse-dot { width: 8px; height: 8px; background: #7c83fd; border-radius: 50%; animation: pulse 1s ease-in-out infinite; flex-shrink: 0; }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.4); } }
  .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 32px; max-width: 900px; margin: 40px auto 0; padding: 0 20px; }
  .blog-card { background: #111; border: 1px solid #222; border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
  .blog-card:hover { transform: translateY(-4px); border-color: #444; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
  .card-img-wrap { position: relative; height: 220px; overflow: hidden; }
  .card-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
  .blog-card:hover .card-img { transform: scale(1.05); }
  .card-read-time { position: absolute; bottom: 12px; right: 12px; background: rgba(0,0,0,0.75); color: #fff; font-size: 0.75rem; font-family: sans-serif; padding: 4px 10px; border-radius: 20px; backdrop-filter: blur(4px); }
  .card-body { padding: 24px; }
  .card-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .tag { font-size: 0.7rem; font-family: sans-serif; color: #7c83fd; background: #7c83fd15; border: 1px solid #7c83fd33; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card-title { font-size: 1.25rem; font-weight: 700; color: #f0f0f0; margin: 0 0 10px; line-height: 1.3; font-family: sans-serif; }
  .card-excerpt { font-size: 0.9rem; color: #888; line-height: 1.6; margin: 0 0 20px; font-family: sans-serif; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .card-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #222; padding-top: 16px; }
  .card-date { font-size: 0.75rem; color: #555; font-family: sans-serif; }
  .read-btn { background: none; border: 1px solid #333; color: #ccc; padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; cursor: pointer; font-family: sans-serif; transition: all 0.2s ease; }
  .read-btn:hover { background: #fff; color: #000; border-color: #fff; }
  .blog-card.skeleton { pointer-events: none; }
  .skeleton-img { height: 220px; background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
  .skeleton-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; margin-bottom: 10px; }
  .skeleton-line.short { width: 40%; }
  .skeleton-line.long { width: 90%; }
  .skeleton-line.medium { width: 65%; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .empty-state { text-align: center; color: #555; font-family: sans-serif; padding: 60px 20px; }
  @media (max-width: 480px) { .blog-grid { grid-template-columns: 1fr; } }
`;

const articleStyles = `
  .blog-article-page { min-height: 100vh; background: #0a0a0a; padding-bottom: 80px; }
  .article-header { padding: 24px 20px; max-width: 760px; margin: 0 auto; }
  .back-btn { background: none; border: 1px solid #333; color: #888; padding: 8px 18px; border-radius: 20px; cursor: pointer; font-family: sans-serif; font-size: 0.85rem; transition: all 0.2s; }
  .back-btn:hover { border-color: #fff; color: #fff; }
  .article-container { max-width: 760px; margin: 0 auto; padding: 0 20px; }
  .article-meta-top { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
  .article-title { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800; color: #f0f0f0; line-height: 1.2; margin: 0 0 16px; font-family: sans-serif; letter-spacing: -0.5px; }
  .article-info { display: flex; gap: 20px; color: #555; font-size: 0.85rem; font-family: sans-serif; margin-bottom: 28px; }
  .article-hero-img { width: 100%; height: 380px; object-fit: cover; border-radius: 12px; margin-bottom: 40px; }
  .article-body { color: #ccc; font-size: 1.05rem; line-height: 1.8; font-family: Georgia, serif; }
  .article-body h2 { font-size: 1.5rem; color: #f0f0f0; margin: 40px 0 16px; font-family: sans-serif; font-weight: 700; }
  .article-body h3 { font-size: 1.2rem; color: #e0e0e0; margin: 28px 0 12px; font-family: sans-serif; }
  .article-body p { margin-bottom: 20px; }
  .article-body ul, .article-body ol { padding-left: 24px; margin-bottom: 20px; }
  .article-body li { margin-bottom: 8px; }
  .article-body strong { color: #fff; }
  .tag { font-size: 0.7rem; font-family: sans-serif; color: #7c83fd; background: #7c83fd15; border: 1px solid #7c83fd33; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
`;
