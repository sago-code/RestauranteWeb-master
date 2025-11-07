
import OpenAI from 'openai';
import { menu } from '../data/menu.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


const allItems = (cat) => {
  if (cat) return menu[cat] || [];
  return [
    ...menu.hamburguesas,
    ...menu.perros,
    ...menu.salchipapas,
  ];
};

const detectCategory = (msg) => {
  const q = msg.toLowerCase();
  if (q.includes('hamburguesa')) return 'hamburguesas';
  if (q.includes('perro')) return 'perros';
  if (q.includes('salchipapa') || q.includes('salchi')) return 'salchipapas';
  return null;
};

const systemPrompt = (menuJson) => `
Eres un asistente de una tienda de comidas rápidas. SOLO usa este MENÚ (JSON):
${JSON.stringify(menuJson)}

Campos: { id, nombre, descripcion, precio, imagen }
- La detección de ingredientes debe realizarse buscando palabras dentro de "descripcion".
- Si el usuario menciona hamburguesa/perro/salchipapa, limita la búsqueda a esa categoría.
- Si pide "más cara": devuelve el item con mayor "precio" de la categoría detectada; si no hay categoría, prioriza "hamburguesas".
- Si pide por un ingrediente (ej. "piña"): filtra por "descripcion" que contenga esa palabra (insensible a mayúsculas).
- Si hay varias: devuelve la mejor coincidencia y menciona 1-2 alternativas.
- Si no hay coincidencias: pide aclaración breve.
- Responde SIEMPRE en JSON de una sola línea:
{"answer":"texto breve para el cliente","item":{"nombre":"","precio":0},"alternatives":[{"nombre":"","precio":0}]}
`;

function resolveLocal(message) {
  const q = message.toLowerCase();
  const category = detectCategory(q);
  const pool = allItems(category);


  if (q.includes('más cara') || q.includes('mas cara') || q.includes('cara')) {
    const sorted = pool.slice().sort((a, b) => b.precio - a.precio);
    const item = sorted[0];
    const alternatives = sorted.slice(1, 3).map(x => ({ nombre: x.nombre, precio: x.precio }));
    if (item) return { answer: `La más cara es ${item.nombre} por $${item.precio}.`, item, alternatives };
  }


  const maybeWord = ['piña', 'jalapeño', 'jalapeños', 'bbq', 'tocino', 'guacamole', 'pollo', 'vegetariana', 'doble', 'triple']
    .find(w => q.includes(w));
  if (maybeWord) {
    const hits = pool.filter(p => p.descripcion.toLowerCase().includes(maybeWord));
    if (hits.length) {
      const [item, ...rest] = hits;
      const alternatives = rest.slice(0, 2).map(x => ({ nombre: x.nombre, precio: x.precio }));
      return { answer: `Te recomiendo ${item.nombre} con ${maybeWord}.`, item, alternatives };
    }
  }


  return { answer: '¿Buscas la opción más cara o alguna con un ingrediente específico (por ejemplo, "piña")?' };
}

export async function chatHandler(req, res) {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message es requerido' });

    if (!process.env.OPENAI_API_KEY) {
      return res.json(resolveLocal(message));
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt(menu) },
        { role: 'user', content: message },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content ?? '{}';
    let payload = {};
    try { payload = JSON.parse(raw); } catch { payload = { answer: raw }; }

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.json(resolveLocal(req.body?.message ?? ''));
  }
}
