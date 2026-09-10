import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { 
  Briefcase, 
  Target, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  TrendingUp,
  Building2,
  FileText,
  Zap,
  Filter,
  ExternalLink,
  Info
} from 'lucide-react';

const JOB_CATEGORIES = [
  "All Categories",
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

export default function JobMatchingPage() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState(null);
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
        runJobMatch(response.data[0].id, categoryFilter);
      }
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const runJobMatch = async (resumeId, category) => {
    if (!resumeId) {
      setErrorMsg('Please select or upload a resume first.');
      return;
    }

    setMatching(true);
    setErrorMsg('');
    try {
      const payload = {
        resume_id: parseInt(resumeId, 10),
        category_filter: category === "All Categories" ? null : category,
        top_n: 10
      };
      const response = await apiClient.post('/jobs/match', payload);
      setMatchResults(response.data);
    } catch (err) {
      console.error('Job matching error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to calculate job matches.');
    } finally {
      setMatching(false);
    }
  };

  const getMatchColor = (pct) => {
    if (pct >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: '#10B981' };
    if (pct >= 45) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: '#F59E0B' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', ring: '#EF4444' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Briefcase className="w-3.5 h-3.5" /> Stage 6 Job Role Matching Engine
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI Job Role Matching Engine
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Algorithmically match candidate resume text against sample software job postings using TF-IDF and skill overlap.
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
                runJobMatch(e.target.value, categoryFilter);
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

          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-400" /> Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                if (selectedResumeId) {
                  runJobMatch(selectedResumeId, e.target.value);
                }
              }}
              className="px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-blue-500 min-w-[180px]"
            >
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <div className="flex items-end">
            <button
              onClick={() => runJobMatch(selectedResumeId, categoryFilter)}
              disabled={matching || !selectedResumeId}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              {matching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Matching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Find Matching Jobs
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-slate-300 text-xs flex items-center gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong className="text-white">Sample Job Dataset Notice:</strong> Jobs listed are realistic demo postings evaluated against candidate resume skills and TF-IDF text vectors.
        </span>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Main Job Matches List */}
      {matching ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <span className="text-sm font-medium">Running hybrid skill overlap & TF-IDF similarity algorithm...</span>
        </div>
      ) : matchResults && matchResults.matches.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Evaluated {matchResults.total_jobs_evaluated} Demo Jobs • Showing Top Matches</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {matchResults.matches.map((job) => {
              const colorInfo = getMatchColor(job.match_percentage);
              return (
                <div
                  key={job.id}
                  className="p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 shadow-xl transition-all space-y-6"
                >
                  {/* Top Row: Title, Company, Location, Match Score Ring */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                          {job.category}
                        </span>
                        <span className="text-xs text-slate-400">{job.experience}</span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-white pt-1">
                        {job.title}
                      </h2>
                      <div className="flex items-center gap-4 text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {job.location}
                        </span>
                      </div>
                    </div>

                    {/* Match Score Badge / Gauge */}
                    <div className={`px-5 py-3 rounded-2xl border ${colorInfo.bg} ${colorInfo.border} flex items-center gap-3 shrink-0`}>
                      <div className="text-right">
                        <div className={`text-2xl font-extrabold ${colorInfo.text}`}>
                          {job.match_percentage}%
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Match Score</div>
                      </div>
                      <TrendingUp className={`w-6 h-6 ${colorInfo.text}`} />
                    </div>
                  </div>

                  {/* Match Explanation Banner */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Why this job matches: </strong>
                      {job.explanation}
                    </div>
                  </div>

                  {/* Description Preview */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Matched vs Missing Skills Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/60">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 block flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({job.matched_skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {job.matched_skills.map((skill, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {job.missing_skills.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 block flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing Skills ({job.missing_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.missing_skills.map((skill, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-slate-500 space-y-3 border border-dashed border-slate-800 rounded-3xl">
          <Briefcase className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">Ready for Job Matching</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Select an uploaded resume and optional category above, then click <span className="font-semibold text-slate-300">"Find Matching Jobs"</span> to evaluate job postings.
          </p>
        </div>
      )}
    </div>
  );
}
