import React from 'react';

interface Props {
  variant?: 'light' | 'dark';
}

const SupportButton: React.FC<Props> = ({ variant = 'dark' }) => {
  const handleClick = () => {
    window.open('https://t.me/Dikiy4747', '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
        variant === 'light'
          ? 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
      title="Поддержка"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </button>
  );
};

export default SupportButton;
