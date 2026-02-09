import React, { useState } from 'react';
import { LegalDocumentViewer, DOC_TYPES, type DocType } from './LegalDocuments';

interface Props {
  onAccept: () => void;
  onCancel: () => void;
  planName: string;
  loading?: boolean;
}

const REQUIRED_CHECKBOXES = [
  {
    id: 'tried',
    label: 'Я использовал бесплатный пробный период и ознакомился с функционалом сервиса',
  },
  {
    id: 'satisfied',
    label: 'Функционал сервиса меня полностью устраивает, претензий к работоспособности не имею',
  },
  {
    id: 'terms',
    label: 'Я ознакомился и согласен с Пользовательским соглашением',
    docType: 'terms' as DocType,
  },
  {
    id: 'privacy',
    label: 'Я ознакомился и согласен с Политикой конфиденциальности',
    docType: 'privacy' as DocType,
  },
  {
    id: 'refund',
    label: 'Я ознакомился и согласен с Политикой возврата средств',
    docType: 'refund' as DocType,
  },
  {
    id: 'product',
    label: 'Я ознакомился с описанием продукта и тарифных планов',
    docType: 'product' as DocType,
  },
];

const SubscriptionAgreement: React.FC<Props> = ({ onAccept, onCancel, planName, loading }) => {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [viewingDoc, setViewingDoc] = useState<DocType | null>(null);

  const allChecked = REQUIRED_CHECKBOXES.every(cb => checks[cb.id]);

  const toggle = (id: string) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-slide-in">
        <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-5 border-b">
            <h3 className="text-lg font-extrabold text-slate-900">Оформление подписки</h3>
            <p className="text-sm text-slate-500 mt-1">
              Тариф «{planName}»
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
              <p className="text-xs text-amber-800 font-medium">
                ⚠️ Перед оформлением подписки внимательно ознакомьтесь с документацией и подтвердите своё согласие со всеми пунктами ниже.
              </p>
            </div>

            {/* Document links */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Документация:</p>
              {DOC_TYPES.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => setViewingDoc(doc.id)}
                  className="w-full text-left px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <span>📄 {doc.label}</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Подтверждения:</p>
              {REQUIRED_CHECKBOXES.map(cb => (
                <label
                  key={cb.id}
                  className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!checks[cb.id]}
                    onChange={() => toggle(cb.id)}
                    className="mt-0.5 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    {cb.label}
                    {cb.docType && (
                      <button
                        onClick={(e) => { e.preventDefault(); setViewingDoc(cb.docType!); }}
                        className="ml-1 text-blue-600 underline"
                      >
                        (читать)
                      </button>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 border-t space-y-2">
            <button
              onClick={onAccept}
              disabled={!allChecked || loading}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
                allChecked && !loading
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Перенаправление...' : 'Подтвердить и перейти к оплате'}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 text-slate-500 font-medium text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>

      {viewingDoc && (
        <LegalDocumentViewer docType={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </>
  );
};

export default SubscriptionAgreement;
