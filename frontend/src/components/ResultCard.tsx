import React from "react";
import { AnalysisResponse } from "../types";
import { ShieldCheck, AlertTriangle, ShieldAlert, AlertCircle, Info, Lightbulb, Server, Fingerprint, BrainCircuit, Activity } from "lucide-react";
import CountUp from "./CountUp";
import AnimatedContent from "./AnimatedContent";

interface ResultCardProps {
  result: AnalysisResponse;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const isSafe = result.risk === "SAFE";
  const isSuspicious = result.risk === "SUSPICIOUS";
  const isHighRisk = result.risk === "HIGH RISK";

  let headerColor = "bg-white border-gray-100";
  let icon = <Info className="h-8 w-8" />;
  let progressColor = "bg-gray-400";
  let badgeColor = "bg-gray-100 text-gray-800 border-gray-200";
  
  if (isSafe) {
    icon = <ShieldCheck className="h-10 w-10 text-status-success" />;
    progressColor = "bg-status-success";
    badgeColor = "bg-green-100 text-green-800 border-green-200";
  } else if (isSuspicious) {
    icon = <AlertTriangle className="h-10 w-10 text-status-warning" />;
    progressColor = "bg-status-warning";
    badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
  } else if (isHighRisk) {
    icon = <ShieldAlert className="h-10 w-10 text-status-danger" />;
    progressColor = "bg-status-danger";
    badgeColor = "bg-red-100 text-red-800 border-red-200";
  }

  return (
    <AnimatedContent
      distance={40}
      direction="vertical"
      duration={0.8}
      ease="power3.out"
      initialOpacity={0}
      animateOpacity
      className="w-full"
    >
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden transition-all">
        
        {/* Top summary section */}
        <div className={`p-6 sm:p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
          <div className="flex items-center gap-5">
            <div className={`p-4 rounded-2xl shadow-sm ${badgeColor}`}>
              {icon}
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1">Text Risk Assessment</h2>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs sm:text-sm font-extrabold uppercase tracking-wide rounded-full border ${badgeColor}`}>
                  {isSafe ? 'Low text risk' : result.risk}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col w-full md:w-64 bg-surface-bg p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-end w-full mb-2">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5"><Activity className="h-3.5 w-3.5"/> Risk score</span>
              <span className="text-xl font-black leading-none text-text-main">
                <CountUp from={0} to={result.risk_score} duration={1.5} />/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
               <div className={`h-full ${progressColor} transition-all duration-1000 ease-out`} style={{ width: `${result.risk_score}%` }}></div>
            </div>
          </div>
        </div>

      <div className="p-6 sm:p-8 space-y-8 bg-surface-bg/30">
        
<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="font-bold">Sender unverified</p>
          <p className="text-sm mt-1">Pasted text cannot establish who sent a message. A low score does not confirm authenticity. For bank or payment requests, open the official app independently or contact a known official number.</p>
        </div>
        <p className="text-sm text-text-muted">Source: {result.analysis_source}. Risk score is an estimate, not a probability or guarantee of safety.</p>
        {/* Red Flags Section */}
        {result.red_flags && result.red_flags.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-status-warning" /> 
              Identified Threat Indicators
            </h3>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              {result.red_flags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-white border border-red-100 shadow-sm rounded-xl transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <div className="bg-red-50 p-2 rounded-lg flex-shrink-0">
                    <Fingerprint className="h-5 w-5 text-status-danger opacity-90" />
                  </div>
                  <span className="font-semibold text-text-main text-sm sm:text-base leading-snug mt-1">{flag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          {/* AI Explanation Section */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 flex flex-col">
             <h3 className="text-sm font-bold text-text-main flex items-center gap-2 mb-4">
                <BrainCircuit className="h-5 w-5 text-brand-500" /> 
                Analysis explanation
             </h3>
             <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 shadow-sm flex-grow">
               <p className="text-text-main leading-relaxed text-sm sm:text-base whitespace-pre-wrap break-words font-medium">
                 {result.explanation}
               </p>
             </div>
          </div>

          {/* Recommended Action */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 flex flex-col">
             <h3 className="text-sm font-bold text-text-main flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-status-success" /> 
                Prescribed Action
             </h3>
             <div className="bg-brand-50/50 border border-brand-100 p-5 sm:p-6 rounded-xl shadow-sm flex-grow flex flex-col justify-center">
               <div className="flex items-start gap-4">
                 <div className="bg-white p-2.5 rounded-xl shadow-sm border border-brand-50 flex-shrink-0">
                   <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-brand-600" />
                 </div>
                 <p className="font-bold text-brand-900 text-sm sm:text-base leading-relaxed mt-1">{result.safe_action}</p>
               </div>
             </div>
          </div>
        </div>

      </div>
      </div>
    </AnimatedContent>
  );
};

