import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Target, 
  Briefcase, 
  Wand2, 
  MessageSquare, 
  Upload, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Loader2, 
  ShieldCheck, 
  Award,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await apiClient.get('/dashboard/summary');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setErrorMsg('Failed to load dashboard data. Please refresh or try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-semibold">Loading Candidate Dashboard...</p>
        </div>
      </div>
    );
  }

  const resumesCount = dashboardData?.resumes_count || 0;
  const atsScore = dashboardData?.latest_ats_analysis?.overall_score ?? null;
  const skillGapMatch = dashboardData?.latest_skill_gap?.skill_match_percentage ?? null;
  const healthScore = dashboardData?.latest_improvement?.overall_health_score ?? null;
  const jobSummary = dashboardData?.job_matching_summary;
  const interviewSummary = dashboardData?.interview_summary;
  const recentActivities = dashboardData?.recent_activity || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. Welcome Header Banner */}
        <div className="bg-gradient-to-r from-blue-950/70 via-indigo-900/50 to-slate-900 p-6 sm:p-8 rounded-2xl border border-blue-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>AI Career Dashboard</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.full_name || dashboardData?.user_name || 'Candidate'}!
              </h1>
              <p className="mt-2 text-slate-300 max-w-2xl text-sm sm:text-base">
                Your AI Resume & Interview Coach is fully active. Track your ATS score progression, skill alignment, job role matches, and mock interview readiness in one place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/analyzer"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Resume</span>
              </Link>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
            <button 
              onClick={fetchDashboardSummary}
              className="text-xs bg-red-900/60 hover:bg-red-800 text-white px-3 py-1 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. Resume & Overall Metrics Cards (4 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Resumes Uploaded */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">Resumes Uploaded</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-white">{resumesCount}</span>
              <span className="text-xs text-slate-400 block mt-1">
                {dashboardData?.latest_resume ? `Latest: ${dashboardData.latest_resume.filename}` : 'No resume uploaded yet'}
              </span>
            </div>
            <Link to="/analyzer" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <span>View Resumes</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 2: ATS Score */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">ATS Compatibility</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-3">
              <span className={`text-3xl font-extrabold ${
                atsScore >= 80 ? 'text-emerald-400' :
                atsScore >= 60 ? 'text-blue-400' :
                atsScore !== null ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {atsScore !== null ? `${atsScore}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                {dashboardData?.latest_ats_analysis?.target_role || 'Run ATS Analysis'}
              </span>
            </div>
            <Link to="/analyzer" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <span>ATS Breakdown</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 3: Skill Gap Alignment */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">Skill Gap Match</span>
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-indigo-400">
                {skillGapMatch !== null ? `${skillGapMatch}%` : 'N/A'}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                {dashboardData?.latest_skill_gap ? `Target: ${dashboardData.latest_skill_gap.target_role}` : 'Target Role Alignment'}
              </span>
            </div>
            <Link to="/skill-gap" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <span>Analyze Skill Gap</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Card 4: Resume Health */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase tracking-wider font-semibold">Resume Health Score</span>
              <Wand2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-purple-400">
                {healthScore !== null ? `${healthScore}/100` : 'N/A'}
              </span>
              <span className="text-xs text-slate-400 block mt-1">
                {dashboardData?.latest_improvement ? `${dashboardData.latest_improvement.total_suggestions} improvement suggestions` : 'Wording & Metric Engine'}
              </span>
            </div>
            <Link to="/resume-improver" className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1">
              <span>Improve Phrasing</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </div>

        {/* 3. Job Matching & Mock Interview Summaries (2 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Job Matching Summary Box */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Job Role Matching Summary</h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {jobSummary?.total_jobs_in_db || 32} Sample Jobs Available
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {resumesCount === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Upload your resume to calculate your match score against sample software jobs.
                  </p>
                ) : (
                  <>
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/40 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Top Matched Role
                        </span>
                        <h3 className="text-sm font-bold text-white mt-0.5">
                          {jobSummary?.top_match_title || 'Software Engineer'}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {jobSummary?.top_match_company || 'TechCorp Solutions'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-emerald-400">
                          {jobSummary?.best_match_percentage ? `${jobSummary.best_match_percentage}%` : '85%'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Match Score</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Link
              to="/job-matching"
              className="w-full bg-slate-900 hover:bg-slate-700/60 border border-slate-700 text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 transition"
            >
              <span>Explore All Job Matches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mock Interview Summary Box */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base font-bold text-white">Mock Technical Interview Summary</h2>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {interviewSummary?.total_completed || 0} Sessions Completed
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {interviewSummary?.latest_score !== null && interviewSummary?.latest_score !== undefined ? (
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/40 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Latest Session ({interviewSummary.target_role})
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        Performance Evaluated
                      </h3>
                      {interviewSummary.strong_areas.length > 0 && (
                        <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{interviewSummary.strong_areas[0]}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-purple-400">
                        {interviewSummary.latest_score}/100
                      </span>
                      <span className="text-[10px] text-slate-400 block">Interview Score</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    No mock interviews completed yet. Test your technical understanding with role-specific questions.
                  </p>
                )}
              </div>
            </div>

            <Link
              to="/mock-interview"
              className="w-full bg-slate-900 hover:bg-slate-700/60 border border-slate-700 text-white text-xs font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 transition"
            >
              <span>Start Mock Technical Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

        {/* 4. Quick Actions Grid (6 Grid) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
            <Zap className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            <Link
              to="/analyzer"
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 p-5 rounded-xl transition-all shadow-md group space-y-2"
            >
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 w-fit group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Upload Resume
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Upload a new PDF or DOCX resume to extract text and analyze qualifications.
              </p>
            </Link>

            <Link
              to="/analyzer"
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 p-5 rounded-xl transition-all shadow-md group space-y-2"
            >
              <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 w-fit group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                ATS Resume Analysis
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculate an 0-100 deterministic ATS compatibility score with category feedback.
              </p>
            </Link>

            <Link
              to="/skill-gap"
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 p-5 rounded-xl transition-all shadow-md group space-y-2"
            >
              <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                Skill Gap Analysis
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare your extracted technical skills against target software engineering roles.
              </p>
            </Link>

            <Link
              to="/resume-improver"
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 p-5 rounded-xl transition-all shadow-md group space-y-2"
            >
              <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 w-fit group-hover:scale-110 transition-transform">
                <Wand2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                Resume Improvement
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Eliminate weak phrasing and transform bullets into quantifiable impact statements.
              </p>
            </Link>

            <Link
              to="/job-matching"
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 p-5 rounded-xl transition-all shadow-md group space-y-2"
            >
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 w-fit group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                Find Job Matches
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Match your resume against 32+ demo software engineering job listings.
              </p>
            </Link>

            <Link
              to="/mock-interview"
              className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 p-5 rounded-xl transition-all shadow-md group space-y-2"
            >
              <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 w-fit group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                Start Mock Interview
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Practice technical interview questions with real-time answer scoring and advice.
              </p>
            </Link>

          </div>
        </div>

        {/* 5. Recent Activity Timeline */}
        {recentActivities.length > 0 && (
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-white">Recent Candidate Activity</h2>
            </div>

            <div className="space-y-3">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    {act.type === 'resume_upload' ? (
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-200">{act.title}</span>
                  </div>
                  <span className="text-slate-500">{new Date(act.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
