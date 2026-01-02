import React from 'react';

interface SafePlaceholderProps {
  module: string;
}

export const SafePlaceholder: React.FC<SafePlaceholderProps> = ({ module }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
      <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        {module} temporarily unavailable
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
        The system is undergoing router stabilization. Access to this module via deep links is currently restricted to ensure console integrity.
      </p>
      <button 
        onClick={() => window.location.href = '#/'}
        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default SafePlaceholder;