import { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'bot', text: '¡Hola! Pregúntame por la hamburguesa más cara o por ingredientes (ej. "con piña").' }
  ]);

  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages(m => [...m, { from: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

     const answer = data?.answer || 'No pude entender tu solicitud.';
      const item = data?.item;

      let pretty = answer;

      if (item?.nombre && item?.precio != null) {
        pretty += `\n\n👉 ${item.nombre} — $${item.precio}`;
      }

      setMessages(m => [...m, { from: 'bot', text: pretty }]);
    } catch (e) {
      setMessages(m => [...m, { from: 'bot', text: 'Hubo un error procesando tu solicitud.' }]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sending) send();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', right: 100, bottom: 30, zIndex: 9999,
          width: 60, height: 60, borderRadius: '50%', border: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,.2)', cursor: 'pointer',
          background: '#ff6b01', color: '#fff', fontWeight: 700, fontSize: 14
        }}
        aria-label="Abrir chatbot"
      >
        {open ? '×' : 'Chat'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', right: 20, bottom: 92, zIndex: 9998,
            width: 340, height: 440, background: '#fff', borderRadius: 16,
            boxShadow: '0 12px 28px rgba(0,0,0,.25)', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', border: '1px solid #eee',
            color: '#000'                 
          }}
        >
          <div style={{ padding: '12px 14px', background: '#ffedd5', fontWeight: 700, color: '#000' }}>
            Asistente de pedidos
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: 'auto', fontSize: 14, lineHeight: 1.35 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ margin: '8px 0', display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  background: m.from === 'user' ? '#e0f2fe' : '#f3f4f6',
                  padding: '8px 10px',
                  borderRadius: 10,
                  whiteSpace: 'pre-wrap',
                  color: '#000'        
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div style={{ padding: 10, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder='Escribe: "hamburguesa más cara" o "con piña"'
              rows={2}
              style={{
                flex: 1, resize: 'none', padding: 8, borderRadius: 8, border: '1px solid #ddd',
                color: '#000'          
              }}
            />
            {}
            <button
              onClick={send}
              disabled={sending}
              style={{
                padding: '0 26px', borderRadius: 8, border: 'none', background: '#ff6b01',
                color: '#fff', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer'
              }}
            >
              {sending ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;