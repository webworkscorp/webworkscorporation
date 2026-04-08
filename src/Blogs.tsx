/// <reference types="vite/client" />
import { useState, useEffect, useRef } from "react";

// ─── CONFIGURA ESTO ────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const SITE_TOPIC = import.meta.env.VITE_SITE_TOPIC || "servicios web y diseño digital en Costa Rica";
const MAX_POSTS = 2;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
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
- imageKeyword: 2 palabras en INGLÉS para buscar imagen (ej: "web design", "digital marketing")
- tags: array de 3 etiquetas cortas en español

Responde ÚNICAMENTE con JSON válido, sin markdown ni backticks:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "imageKeyword": "...",
  "tags": ["...", "...", "..."]
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

  const seed = encodeURIComponent(parsed.imageKeyword || "business");
  const imageUrl = `https://source.unsplash.com/800x450/?${seed}&sig=${Date.now()}`;

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

export default function Blogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "waiting" | "done">("idle");
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("seo-blog-posts");
    if (saved) {
      try {
        const parsed: BlogPost[] = JSON.parse(saved);
        setPosts(parsed);
        if (parsed.length >= MAX_POSTS) setStatus("done");
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem("seo-blog-posts", JSON.stringify(posts));
    }
  }, [posts]);

  const generate = async (index: number) => {
    if (!GEMINI_API_KEY) {
      console.error("Falta VITE_GEMINI_API_KEY en variables de entorno");
      return;
    }
    setLoading(true);
    setStatus("generating");
    try {
      const post = await generatePost(SITE_TOPIC, index);
      setPosts((prev) => [...prev, post]);
    } catch (e) {
      console.error("Error generando post:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("seo-blog-posts");
    const existing: BlogPost[] = saved ? JSON.parse(saved) : [];

    if (existing.length === 0) {
      generate(0).then(() => {
        setStatus("waiting");
        setCountdown(INTERVAL_MS / 1000);

        countRef.current = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) { clearInterval(countRef.current!); return 0; }
            return c - 1;
          });
        }, 1000);

        timerRef.current = setTimeout(() => {
          generate(1).then(() => setStatus("done"));
        }, INTERVAL_MS);
      });
    } else if (existing.length === 1) {
      setStatus("waiting");
      setCountdown(INTERVAL_MS / 1000);

      countRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(countRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(() => {
        generate(1).then(() => setStatus("done"));
      }, INTERVAL_MS);
    } else {
      setStatus("done");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countRef.current) clearInterval(countRef.current);
    };
  }, []);

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

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

      {status === "generating" && (
        <div className="status-bar generating">
          <span className="pulse-dot" />
          Generando artículo con IA...
        </div>
      )}
      {status === "waiting" && countdown > 0 && (
        <div className="status-bar waiting">
          <span>⏱</span>
          Próximo artículo en <strong>{formatCountdown(countdown)}</strong>
        </div>
      )}
      {status === "done" && posts.length > 0 && (
        <div className="status-bar done">
          ✓ {posts.length} artículo{posts.length > 1 ? "s" : ""} publicado{posts.length > 1 ? "s" : ""}
        </div>
      )}

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

        {loading && (
          <div className="blog-card skeleton">
            <div className="skeleton-img" />
            <div className="card-body">
              <div className="skeleton-line short" />
              <div className="skeleton-line long" />
              <div className="skeleton-line medium" />
            </div>
          </div>
        )}
      </div>

      {posts.length === 0 && !loading && (
        <div className="empty-state">
          <p>Los artículos aparecerán aquí automáticamente.</p>
        </div>
      )}
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
