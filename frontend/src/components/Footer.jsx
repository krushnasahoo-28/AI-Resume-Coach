import React from 'react';
import { Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-200">AI Resume Analyzer & Interview Coach</span>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} AI Resume Coach. Production SaaS platform engineered for CS & AI professionals.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#privacy" className="hover:text-slate-200 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-200 transition-colors">Terms of Service</a>
            <a href="#docs" className="hover:text-slate-200 transition-colors">API Docs</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
