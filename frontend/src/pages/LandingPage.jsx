import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/api';
import { 
  FileText, 
  Sparkles, 
  Target, 
  Briefcase, 
  MessageSquare, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export default function LandingPage() {
  const [healthStatus, setHealthStatus] = useState({ loading: true, healthy: false, error: null });

  useEffect(() => {
    async function verifyBackend() {
      try {
        const res = await checkHealth();
        if (res && res.status === 'healthy') {
          setHealthStatus({ loading: false, healthy: true, error: null });
        } else {
          setHealthStatus({ loading: false, healthy: false, error: 'Unexpected response' });
        }
      } catch (err) {
        setHealthStatus({ loading: false, healthy: false, error: 'Backend Offline' });
      }
    }
    verifyBackend();
  }, []);

  const features = [
    {
      icon: FileText,
      title: 'ATS Resume Scoring',
      description: 'Get an instant, AI-calculated ATS compatibility score tailored to modern software engineering filters.'
    },
    {
      icon: Target,
      title: 'Skill Gap Analysis',
      description: 'Extract technical & soft skills and compare them directly with target role requirements to bridge missing gaps.'
    },
    {
      icon: Briefcase,
      title: 'Smart Job Matching',
      description: 'Algorithmically match your resume against real-world job roles and target company profiles.'
    },
    {
      icon: MessageSquare,
      title: 'AI Mock Interviews',
      description: 'Practice interactive role-specific technical interviews with instant AI evaluation and performance feedback.'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track your resume health, skill improvements, and interview readiness over time.'
    },
    {
      icon: ShieldCheck,
      title: 'Privacy & Security',
      description: 'Stateless server processing and encrypted token-based authorization protect your career data.'
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Health Status Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 mb-8 backdrop-blur-sm">
            <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-300">Backend Status:</span>
            {healthStatus.loading ? (
              <span className="text-xs text-yellow-400 font-semibold">Connecting...</span>
            ) : healthStatus.healthy ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy (http://localhost:8000/health)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> {healthStatus.error || 'Disconnected'}
              </span>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Turn Your Resume Into Your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Career Advantage
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Analyze your resume, discover skill gaps, find better job matches, and practice interviews with AI.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xl shadow-blue-600/30 transition-all hover:scale-105 active:scale-95">
              <Sparkles className="w-5 h-5" />
              Analyze My Resume
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all">
              Explore Demo Dashboard
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx} 
                  className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-500/5 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-white">{feat.title}</h3>
                  <p className="mt-2 text-slate-400 text-sm leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
