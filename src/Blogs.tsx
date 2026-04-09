/// <reference types="vite/client" />
import { useState, useEffect, useRef } from "react";

// ─── CONFIGURA ESTO ────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const SITE_TOPIC = import.meta.env.VITE_SITE_TOPIC || "tecnología y automatización en Costa Rica";
const MAX_POSTS = 3;
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

async function generateImage(imagePrompt: string): Promise<string> {
  // Usando Pollinations AI: gratis, ilimitado, sin keys y sin popups
  const encodedPrompt = encodeURIComponent(imagePrompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=450&nologo=true`;
}

async function getFallbackPost(topic: string, index: number): Promise<BlogPost> {
  const fallbackPosts = [
    {
      title: "El auge de la automatización en " + topic,
      excerpt: "Descubre cómo la automatización está redefiniendo los procesos operativos y mejorando la eficiencia a niveles sin precedentes.",
      content: "<h2>La nueva era de la eficiencia</h2><p>La automatización ha dejado de ser una opción para convertirse en una necesidad. Las empresas que adoptan estas tecnologías están viendo mejoras significativas en sus tiempos de respuesta y reducción de costos operativos.</p><p>Implementar sistemas automatizados permite a los equipos enfocarse en tareas estratégicas de alto valor, dejando el trabajo repetitivo a las máquinas.</p><h2>Beneficios tangibles</h2><p>Los resultados de la automatización son medibles y directos. Desde la atención al cliente hasta la gestión de inventarios, el impacto es profundo.</p><ul><li>Reducción de errores humanos.</li><li>Operación continua 24/7.</li><li>Análisis de datos en tiempo real.</li></ul><h3>El siguiente paso</h3><p>Prepararse para esta transición requiere una auditoría completa de los procesos actuales. Identificar cuellos de botella es el primer paso hacia una transformación digital exitosa.</p><p>No te quedes atrás en la carrera tecnológica. Empieza a evaluar qué procesos en tu empresa pueden beneficiarse de la automatización hoy mismo.</p>",
      imagePrompt: "futuristic automated factory or digital workflow glowing lines 8k",
      tags: ["Automatización", "Eficiencia", "Futuro"]
    },
    {
      title: "Inteligencia Artificial y el futuro de " + topic,
      excerpt: "La IA está cambiando las reglas del juego. Aprende cómo esta tecnología predictiva está anticipando las necesidades del mercado.",
      content: "<h2>Predicción y análisis avanzado</h2><p>La verdadera revolución de la Inteligencia Artificial no es solo automatizar, sino predecir. Los algoritmos actuales pueden analizar enormes volúmenes de datos para anticipar tendencias de mercado antes de que ocurran.</p><p>Esta capacidad predictiva permite a las empresas ajustar sus estrategias en tiempo real, ofreciendo productos y servicios exactamente cuando el cliente los necesita.</p><h2>Personalización a gran escala</h2><p>Otro aspecto fundamental es la hiper-personalización. La IA permite crear experiencias únicas para cada usuario, basadas en su historial y comportamiento.</p><ul><li>Recomendaciones precisas.</li><li>Interfaces adaptativas.</li><li>Comunicación proactiva.</li></ul><h3>Adopción estratégica</h3><p>Integrar IA requiere más que solo tecnología; requiere un cambio cultural en la organización. La toma de decisiones debe volverse verdaderamente basada en datos.</p><p>El momento de explorar soluciones de IA es ahora. Las herramientas son más accesibles que nunca y el retorno de inversión justifica la innovación.</p>",
      imagePrompt: "artificial intelligence glowing brain network connections 8k",
      tags: ["IA", "Predicción", "Innovación"]
    }
  ];

  const fallback = fallbackPosts[index % fallbackPosts.length];
  const imageUrl = await generateImage(fallback.imagePrompt);
  const words = fallback.content.replace(/<[^>]+>/g, "").split(/\s+/).length;
  const readTime = `${Math.max(2, Math.ceil(words / 200))} min`;

  return {
    id: `post-fallback-${Date.now()}-${index}`,
    title: fallback.title,
    excerpt: fallback.excerpt,
    content: fallback.content,
    imageUrl,
    createdAt: getCRTime(),
    readTime,
    tags: fallback.tags,
  };
}

async function generatePost(topic: string, index: number): Promise<BlogPost> {
  const angles = [
    `tendencias actuales y consejos prácticos sobre "${topic}"`,
    `guía completa para principiantes sobre "${topic}"`,
    `errores comunes y cómo evitarlos en "${topic}"`,
    `estrategias avanzadas para mejorar resultados en "${topic}"`,
  ];
  const angle = angles[index % angles.length];

  const prompt = `Eres el analista de tendencias digitales y copywriter SEO más avanzado del mundo. Tienes acceso a información en tiempo real.
Tu objetivo es realizar una investigación PROFUNDA sobre las tendencias actuales en internet, específicamente en el sector de "${topic}" en Costa Rica y a nivel global.
No te bases solo en lo que ya sabes; simula un análisis de datos en vivo de búsquedas, comportamiento de usuarios y patrones de la web.
Con base en esta investigación, DEBES ANTICIPAR con un 100% de seguridad cuál será la tendencia número 1 de búsqueda e información MAÑANA en este sector.

Escribe un artículo de blog EXCEPCIONAL basado EXCLUSIVAMENTE en esta tendencia predictiva que acabas de descubrir.

ESTRUCTURA OBLIGATORIA DEL ARTÍCULO:
- Título: Exactamente 55-60 caracteres. Debe incluir la keyword principal de la tendencia al inicio.
- Meta description: Exactamente 155 caracteres. Debe generar urgencia sobre esta nueva tendencia.
- Introducción: Primer párrafo de alto impacto. Revela la tendencia que dominará mañana y por qué el lector debe actuar hoy.
- Cuerpo: Aproximadamente 400-500 palabras en HTML limpio (h2, h3, p, ul, li, strong). Exactamente 3 secciones h2 y 1 h3. NO LO HAGAS CORTO.
- Keyword density: 1.5% — incluir la keyword principal de la tendencia y 3 variaciones semánticas.
- Cada sección h2 debe tener mínimo 2 párrafos completos y una lista ul o li.
- Penúltimo párrafo: beneficios concretos de anticiparse a esta tendencia.
- Último párrafo: llamada a acción directa.
- imagePrompt: Crea un prompt en inglés para generar una imagen fotorrealista espectacular que represente esta tendencia exacta. Debe ser muy descriptivo, estilo fotografía comercial 8K.
- tags: array de 3 etiquetas cortas en español relacionadas a la tendencia.

TONO: Visionario, experto, urgente y profesional.

IMPORTANTE: DEBES RESPONDER ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. NO INCLUYAS TEXTO FUERA DEL JSON.
ESTRUCTURA DEL JSON:
{
  "title": "string",
  "excerpt": "string (meta description)",
  "content": "string (HTML)",
  "imagePrompt": "string",
  "tags": ["string", "string", "string"]
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    }),
  };

  let res = await fetch(url, options);

  // Reintento automático si se alcanza el límite de peticiones (Error 429)
  if (res.status === 429) {
    console.warn("Límite de peticiones alcanzado (Error 429). Esperando 15 segundos antes de reintentar...");
    await new Promise(resolve => setTimeout(resolve, 15000));
    res = await fetch(url, options);
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    console.error(`Gemini API Error (${res.status}):`, errorText);
    
    // Si es un error de cuota o límite que persiste, usamos un post de respaldo
    if (res.status === 429 || errorText.toLowerCase().includes("quota")) {
      console.warn("Cuota excedida o límite de peticiones. Usando post de respaldo.");
      return getFallbackPost(topic, index);
    }
    
    throw new Error(`Gemini error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = raw.replace(/```json|```/g, "").trim();
  
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    console.warn("JSON Parse Warning. Using fallback content.");
    return getFallbackPost(topic, index);
  }

  const content = parsed.content || "<p>Contenido no disponible.</p>";
  const words = content.replace(/<[^>]+>/g, "").split(/\s+/).length;
  const readTime = `${Math.max(2, Math.ceil(words / 200))} min`;

  const imageUrl = await generateImage(parsed.imagePrompt || "technology, digital marketing, modern business");

  return {
    id: `post-${Date.now()}-${index}`,
    title: parsed.title || "Artículo sin título",
    excerpt: parsed.excerpt || "Sin descripción.",
    content: content,
    imageUrl,
    createdAt: getCRTime(),
    readTime,
    tags: parsed.tags || ["Tecnología", "Negocios"],
  };
}

const DEFAULT_POST: BlogPost = {
  id: "post-default-1",
  title: "El Futuro del Diseño Web en CR: Tendencias de Mañana",
  excerpt: "Descubre la tendencia número uno que dominará las búsquedas web en Costa Rica a partir de mañana. Anticípate y domina tu sector.",
  content: "<h2>La revolución de la Web Inmersiva y Predictiva</h2><p>El análisis de datos en tiempo real nos indica un cambio drástico en el comportamiento del consumidor costarricense. Ya no basta con tener una página web informativa; los usuarios ahora exigen experiencias inmersivas y predictivas. La tendencia que explotará mañana en los motores de búsqueda es la integración de interfaces adaptativas impulsadas por IA que se anticipan a lo que el usuario quiere antes de que haga clic.</p><p>Las empresas que no adopten este modelo quedarán rezagadas rápidamente. La velocidad de carga y la personalización extrema son los nuevos estándares. Si tu sitio web no está aprendiendo del comportamiento de tus visitantes en tiempo real, estás perdiendo conversiones valiosas cada segundo.</p><h2>Micro-interacciones y Diseño Emocional</h2><p>Otra métrica que está mostrando un crecimiento exponencial en las búsquedas es el diseño emocional a través de micro-interacciones. Los usuarios buscan validación instantánea y respuestas visuales satisfactorias al interactuar con plataformas digitales.</p><p>Implementar estas estrategias no es solo una cuestión de estética, sino de retención pura. Un usuario que siente que la interfaz 'le responde' de manera fluida y humana tiene un 40% más de probabilidades de completar una compra o dejar sus datos.</p><ul><li><strong>Animaciones con propósito:</strong> Guiar el ojo del usuario hacia la conversión.</li><li><strong>Feedback háptico simulado:</strong> Respuestas visuales que imitan la sensación táctil.</li><li><strong>Carga progresiva inteligente:</strong> Mostrar primero lo que el usuario más necesita.</li></ul><h2>El SEO del Mañana: Búsqueda Semántica Avanzada</h2><p>Las palabras clave tradicionales están muriendo. La tendencia inminente es la optimización para la búsqueda semántica y conversacional. Los motores de búsqueda ahora entienden el contexto y la intención mucho mejor que antes.</p><p>Para dominar este nuevo panorama, tu contenido debe responder preguntas complejas de manera natural y estructurada. La anticipación es clave: debes responder a la duda del usuario antes de que termine de formularla en su mente.</p><h3>Actúa Hoy, Domina Mañana</h3><p>Anticiparse a estas tendencias no es una opción, es la única estrategia viable de supervivencia digital. Al implementar interfaces predictivas y diseño emocional hoy, te aseguras de capturar la ola de tráfico que se generará mañana.</p><p>No esperes a que tu competencia marque el paso. Contáctanos hoy mismo para auditar tu presencia digital y prepararla para las exigencias del mercado del mañana. El futuro es ahora.</p>",
  imageUrl: "https://image.pollinations.ai/prompt/Futuristic%20holographic%20web%20design%20interface%20glowing%20in%20a%20dark%20modern%20office%20in%20Costa%20Rica%208k%20resolution?width=800&height=450&nologo=true",
  createdAt: getCRTime(),
  readTime: "4 min",
  tags: ["Tendencias Web", "IA Predictiva", "Futuro Digital"]
};

export default function Blogs() {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem("seo-blog-posts-v6");
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
    localStorage.setItem("seo-blog-posts-v6", JSON.stringify(posts));
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
        // Esperar más tiempo (20 segundos) antes de reintentar para evitar saturar la API
        setTimeout(() => setIsIncubating(false), 20000);
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
            className="article-hero-img skeleton-img-bg"
            onLoad={(e) => (e.target as HTMLImageElement).classList.remove('skeleton-img-bg')}
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
                className="card-img skeleton-img-bg"
                onLoad={(e) => (e.target as HTMLImageElement).classList.remove('skeleton-img-bg')}
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
  .skeleton-img-bg { background: linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; color: transparent; }
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
