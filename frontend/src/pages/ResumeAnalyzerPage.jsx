import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileCheck,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Target,
  BarChart3,
  TrendingUp,
  Award,
  BookOpen,
  Zap,
  Info
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

export default function ResumeAnalyzerPage() {
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Target role selection
  const [targetRole, setTargetRole] = useState("Software Engineer");

  // Selected resume for preview
  const [selectedResume, setSelectedResume] = useState(null);
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [copied, setCopied] = useState(false);

  // ATS Analysis state
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzingResumeId, setAnalyzingResumeId] = useState(null);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Delete modal state
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await apiClient.get('/resumes');
      setResumes(response.data);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    validateAndUpload(file);
  };

  const validateAndUpload = async (file) => {
    setErrorMsg('');
    setSuccessMsg('');

    const ext = "." + file.name.toLowerCase().split('.').pop();
    if (ext !== '.pdf' && ext !== '.docx') {
      setErrorMsg('Unsupported file format. Please upload a PDF (.pdf) or Word document (.docx).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 5 MB.`);
      return;
    }

    if (file.size === 0) {
      setErrorMsg('Uploaded file is empty (0 bytes).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(20);

    try {
      const response = await apiClient.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });

      setSuccessMsg(`Resume "${response.data.original_filename}" uploaded and parsed successfully!`);
      setSelectedResume(response.data);
      fetchResumes();

      // Automatically trigger ATS Analysis for newly uploaded resume
      runAtsAnalysis(response.data.id, targetRole);
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to upload and parse resume file.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const runAtsAnalysis = async (resumeId, role) => {
    setAnalyzingResumeId(resumeId);
    setErrorMsg('');
    try {
      const response = await apiClient.post(`/analysis/resume/${resumeId}`, {
        target_role: role
      });
      setAnalysisResult(response.data);
    } catch (err) {
      console.error('ATS Analysis error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to run ATS analysis.');
    } finally {
      setAnalyzingResumeId(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleViewResume = async (resumeId) => {
    setLoadingSingle(true);
    setErrorMsg('');
    try {
      const response = await apiClient.get(`/resumes/${resumeId}`);
      setSelectedResume(response.data);

      // Try fetching existing analysis
      try {
        const analysisRes = await apiClient.get(`/analysis/resume/${resumeId}`);
        setAnalysisResult(analysisRes.data);
      } catch {
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error('Error fetching resume preview:', err);
      setErrorMsg(err.response?.data?.detail || 'Could not load resume preview.');
    } finally {
      setLoadingSingle(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/resumes/${resumeToDelete.id}`);
      setSuccessMsg(`Resume "${resumeToDelete.original_filename}" deleted.`);
      if (selectedResume?.id === resumeToDelete.id) {
        setSelectedResume(null);
        setAnalysisResult(null);
      }
      fetchResumes();
    } catch (err) {
      console.error('Error deleting resume:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to delete resume.');
    } finally {
      setIsDeleting(false);
      setResumeToDelete(null);
    }
  };

  const handleCopyText = () => {
    if (selectedResume?.extracted_text) {
      navigator.clipboard.writeText(selectedResume.extracted_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 75) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: '#10B981' };
    if (score >= 50) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: '#F59E0B' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', ring: '#EF4444' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/60 border border-slate-700/60 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Stage 4 ATS Compatibility Analysis
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ATS Resume Analyzer & Skill Extractor
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Upload your resume, select your target role, and calculate your AI-powered ATS compatibility score.
          </p>
        </div>

        {/* Target Role Selector */}
        <div className="w-full md:w-auto flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-blue-400" /> Select Target Job Role
          </label>
          <select
            value={targetRole}
            onChange={(e) => {
              setTargetRole(e.target.value);
              if (selectedResume) {
                runAtsAnalysis(selectedResume.id, e.target.value);
              }
            }}
            className="px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-blue-500"
          >
            {TARGET_ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error & Success Alert Badges */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div className="flex-1">{successMsg}</div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-10 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
            : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/60'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
            <UploadCloud className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              Drag & drop your resume file here, or <span className="text-blue-400 hover:underline">browse</span>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Supports <span className="font-semibold text-slate-200">PDF (.pdf)</span> and <span className="font-semibold text-slate-200">Word (.docx)</span> files
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Maximum file size: <span className="font-medium text-slate-400">5 MB</span>
            </p>
          </div>

          {uploading && (
            <div className="w-full max-w-xs space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold text-blue-400">
                <span>Parsing & Extracting Text...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ATS Analysis Dashboard Component (If Analysis Available) */}
      {analysisResult && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-8 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
                <BarChart3 className="w-4 h-4" /> ATS Compatibility Results
              </div>
              <h2 className="text-2xl font-extrabold text-white">
                Analysis Report: <span className="text-blue-400">{analysisResult.target_role}</span>
              </h2>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Estimated AI-powered deterministic score</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score Ring / Gauge Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    stroke={getScoreColor(analysisResult.overall_score).ring}
                    strokeDasharray={`${analysisResult.overall_score}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-4xl font-extrabold ${getScoreColor(analysisResult.overall_score).text}`}>
                    {analysisResult.overall_score}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Out of 100</span>
                </div>
              </div>

              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(analysisResult.overall_score).bg} ${getScoreColor(analysisResult.overall_score).text} ${getScoreColor(analysisResult.overall_score).border}`}>
                  {analysisResult.overall_score >= 75 ? 'Strong ATS Match' : analysisResult.overall_score >= 50 ? 'Moderate ATS Match' : 'Low ATS Match'}
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Scored specifically for <span className="font-semibold text-slate-200">{analysisResult.target_role}</span> criteria.
                </p>
              </div>
            </div>

            {/* Category Breakdown Progress Bars */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-700/60 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Score Breakdown by Category
              </h3>

              <div className="space-y-3 pt-1">
                {/* Tech Skills */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Technical Skill Match</span>
                    <span className="font-bold text-blue-400">{analysisResult.category_scores.technical_skills} / 30 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(analysisResult.category_scores.technical_skills / 30) * 100}%` }} />
                  </div>
                </div>

                {/* Structure */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Structure & Section Headers</span>
                    <span className="font-bold text-indigo-400">{analysisResult.category_scores.structure} / 20 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(analysisResult.category_scores.structure / 20) * 100}%` }} />
                  </div>
                </div>

                {/* Experience & Impact */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Work Experience & Impact Metrics</span>
                    <span className="font-bold text-purple-400">{analysisResult.category_scores.experience} / 20 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(analysisResult.category_scores.experience / 20) * 100}%` }} />
                  </div>
                </div>

                {/* Education */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Education & Background</span>
                    <span className="font-bold text-emerald-400">{analysisResult.category_scores.education} / 15 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(analysisResult.category_scores.education / 15) * 100}%` }} />
                  </div>
                </div>

                {/* Readability & Length */}
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Readability & Contact Info</span>
                    <span className="font-bold text-amber-400">{analysisResult.category_scores.readability} / 15 pts</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(analysisResult.category_scores.readability / 15) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detected Skills Badges */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Detected Technical Skills ({analysisResult.detected_skills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysisResult.detected_skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Strengths, Weaknesses, Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Strengths */}
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Key Strengths
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysisResult.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Areas for Improvement
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysisResult.weaknesses.map((weak, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions */}
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Recommended Action Items
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {analysisResult.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Selected Resume Preview & Uploaded Resumes List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Extracted Text Preview Section */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              Extracted Resume Text Preview
            </h3>

            {selectedResume && (
              <button
                onClick={handleCopyText}
                className="px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            )}
          </div>

          {loadingSingle ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-xs">Loading extracted text...</span>
            </div>
          ) : selectedResume ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="font-semibold text-white">{selectedResume.original_filename}</span>
                  <span className="text-slate-400">{(selectedResume.file_size / 1024).toFixed(1)} KB</span>
                </div>
                <div className="text-slate-400">
                  Uploaded: {new Date(selectedResume.created_at).toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedResume.extracted_text || '[No text extracted from document]'}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium">No resume selected</p>
              <p className="text-xs text-slate-600">Upload a resume above or select an existing resume from the list to preview extracted text.</p>
            </div>
          )}
        </div>

        {/* Uploaded Resumes List */}
        <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              My Uploaded Resumes ({resumes.length})
            </h3>
          </div>

          {loadingResumes ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="text-xs">Fetching uploaded resumes...</span>
            </div>
          ) : resumes.length > 0 ? (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {resumes.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    selectedResume?.id === item.id 
                      ? 'bg-blue-600/10 border-blue-500/50' 
                      : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate" title={item.original_filename}>
                        {item.original_filename}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {(item.file_size / 1024).toFixed(1)} KB • {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        handleViewResume(item.id);
                        runAtsAnalysis(item.id, targetRole);
                      }}
                      disabled={analyzingResumeId === item.id}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                      title="Analyze ATS Score"
                    >
                      {analyzingResumeId === item.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <BarChart3 className="w-3.5 h-3.5" />
                      )}
                      Analyze
                    </button>
                    <button
                      onClick={() => handleViewResume(item.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                      title="Preview Text"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setResumeToDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 space-y-2 border border-dashed border-slate-800 rounded-xl">
              <UploadCloud className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-medium">No resumes uploaded yet</p>
              <p className="text-xs text-slate-600">Upload your first resume using the dropzone above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {resumeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Resume?</h3>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-white">"{resumeToDelete.original_filename}"</span>? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResumeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteResume}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
