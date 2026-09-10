import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  TrendingUp,
  Zap,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';

const TARGET_ROLES = [
  "Software Engineer",
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Python Developer",
  "Java Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "DevOps Engineer"
];

export default function SkillGapPage() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState("Software Engineer");
  
  const [analyzing, setAnalyzing] = useState(false);
  const [gapResult, setGapResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await apiClient.get('/resumes');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResumeId(response.data[0].id);
        fetchExistingGap(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const fetchExistingGap = async (resumeId) => {
    try {
      const response = await apiClient.get(`/skills/gap-analysis/${resumeId}`);
      setGapResult(response.data);
      if (response.data.target_role) {
        setTargetRole(response.data.target_role);
      }
    } catch {
      setGapResult(null);
    }
  };

  const handleRunAnalysis = async () => {
    if (!selectedResumeId) {
      setErrorMsg('Please select or upload a resume first.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg('');
    try {
      const response = await apiClient.post(`/skills/gap-analysis/${selectedResumeId}`, {
        target_role: targetRole
      });
      setGapResult(response.data);
    } catch (err) {
      console.error('Skill gap error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to perform skill gap analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getMatchColor = (pct) => {
    if (pct >= 70) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: '#10B981' };
    if (pct >= 40) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: '#F59E0B' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', ring: '#EF4444' };
  };

  const getImportanceBadge = (importance) => {
    if (importance === 'Critical') return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    if (importance === 'High') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5" /> Stage 5 Skill Extraction & Gap Analysis
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Skill Gap Analysis & Recommendations
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Compare extracted technical skills against target candidate role requirements to bridge skill gaps.
          </p>
        </div>

        {/* Selection Controls */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          {/* Resume Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Resume
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => {
                setSelectedResumeId(e.target.value);
                fetchExistingGap(e.target.value);
              }}
              disabled={loadingResumes || resumes.length === 0}
              className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-blue-500 min-w-[200px]"
            >
              {resumes.length === 0 ? (
                <option value="">No Resumes Uploaded</option>
              ) : (
                resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.original_filename}</option>
                ))
              )}
            </select>
          </div>

          {/* Target Role Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-400" /> Target Role
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-blue-500 min-w-[200px]"
            >
              {TARGET_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <div className="flex items-end">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || !selectedResumeId}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Analyze Skills
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Main Analysis Results Card */}
      {gapResult ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-8 shadow-2xl">
          {/* Header Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Skill Match Gauge */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke={getMatchColor(gapResult.skill_match_percentage).ring}
                    strokeDasharray={`${gapResult.skill_match_percentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-2xl font-extrabold ${getMatchColor(gapResult.skill_match_percentage).text}`}>
                    {gapResult.skill_match_percentage}%
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Skill Match</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role Match Rating</span>
                <h3 className="text-xl font-bold text-white mt-1">{gapResult.target_role}</h3>
                <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getMatchColor(gapResult.skill_match_percentage).bg} ${getMatchColor(gapResult.skill_match_percentage).text} ${getMatchColor(gapResult.skill_match_percentage).border}`}>
                  {gapResult.skill_match_percentage >= 70 ? 'High Relevance' : gapResult.skill_match_percentage >= 40 ? 'Moderate Relevance' : 'Skill Gap Identified'}
                </span>
              </div>
            </div>

            {/* Matched Skills Overview */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Matched Core Skills</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-emerald-400">{gapResult.matched_skills.length}</span>
                <p className="text-xs text-slate-400 mt-1">Found in candidate resume matching role requirements</p>
              </div>
            </div>

            {/* Missing Skills Overview */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Missing Key Skills</span>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-amber-400">{gapResult.missing_skills.length}</span>
                <p className="text-xs text-slate-400 mt-1">Recommended for target {gapResult.target_role} qualification</p>
              </div>
            </div>
          </div>

          {/* Matched vs Missing Skills Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Matched Skills */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Matched Role Skills ({gapResult.matched_skills.length})
              </h3>
              {gapResult.matched_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gapResult.matched_skills.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No matching role skills found in resume.</p>
              )}
            </div>

            {/* Missing Skills */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Missing Role Skills ({gapResult.missing_skills.length})
              </h3>
              {gapResult.missing_skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {gapResult.missing_skills.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-400 font-semibold">Great job! All core skills for this target role were detected in your resume.</p>
              )}
            </div>
          </div>

          {/* Actionable Learning Path Recommendations Cards */}
          {gapResult.recommendations && gapResult.recommendations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Recommended Skill Learning Paths
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gapResult.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-3 hover:border-slate-600 transition-all">
                    <div className="flex justify-between items-center">
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        {rec.skill_name}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getImportanceBadge(rec.importance)}`}>
                        {rec.importance} Priority
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-200">Why it matters: </span>
                      {rec.why_it_matters}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-blue-300 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Recommended Action: </span>
                        {rec.learning_path}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Extracted Skills Tag Cloud */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              All Extracted Candidate Skills ({gapResult.all_extracted_skills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {gapResult.all_extracted_skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 space-y-3 border border-dashed border-slate-800 rounded-3xl">
          <Target className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">Ready for Skill Gap Analysis</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select an uploaded resume and a target role above, then click <span className="font-semibold text-slate-300">"Analyze Skills"</span> to evaluate skill gaps.
          </p>
        </div>
      )}
    </div>
  );
}
