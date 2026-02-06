
import React, { useState } from 'react';

export const LegalModals: React.FC = () => {
  const [open, setOpen] = useState<string | null>(null);

  const content: Record<string, any> = {
    privacy: {
      title: "Политика конфиденциальности",
      text: "Мы собираем только необходимые данные для работы AI-репетитора. Ваши данные не передаются третьим лицам без вашего согласия. Мы соблюдаем 152-ФЗ и GDPR..."
    },
    terms: {
      title: "Условия использования",
      text: "Сервис предоставляется 'как есть'. AI-репетитор является вспомогательным инструментом и не гарантирует конкретных результатов на экзаменах..."
    },
    data: {
      title: "Обработка данных",
      text: "Нажимая кнопку, вы соглашаетесь на автоматизированную обработку ваших персональных данных, включая Telegram ID и имя..."
    }
  };

  if (!open) return (
    <div className="flex flex-wrap justify-center gap-3 mt-6">
      <button onClick={() => setOpen('privacy')} className="text-[10px] text-slate-400 underline uppercase tracking-wider font-bold">Политика</button>
      <button onClick={() => setOpen('terms')} className="text-[10px] text-slate-400 underline uppercase tracking-wider font-bold">Условия</button>
      <button onClick={() => setOpen('data')} className="text-[10px] text-slate-400 underline uppercase tracking-wider font-bold">Согласие</button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-slide-in">
      <div className="bg-white rounded-3xl w-full max-w-sm max-h-[80vh] overflow-y-auto p-8 relative">
        <button onClick={() => setOpen(null)} className="absolute top-4 right-4 p-2 text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <h3 className="text-xl font-extrabold text-blue-900 mb-4">{content[open].title}</h3>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>{content[open].text}</p>
          <p>Полный текст документа доступен по запросу в поддержку @kontentcod.</p>
        </div>
      </div>
    </div>
  );
};
