import React, { useState } from "react";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { AnalysisRequest } from "../types";

interface AnalyzerProps {
  onAnalyze: (request: AnalysisRequest) => void;
  isLoading: boolean;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalyze, isLoading }) => {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAnalyze = () => {
    if (!message.trim()) {
      setError("Please enter a message to analyze.");
      return;
    }
    if (message.length > 1000) {
      setError("Message must be 1,000 characters or fewer.");
      return;
    }
    setError("");
    onAnalyze({ message });
  };

  return (
    <div className="bg-surface-card rounded-xl shadow-md border border-gray-200 overflow-hidden mt-8 transition-shadow hover:shadow-lg">
      <div className="p-5 sm:p-6 lg:p-8">
        <h2 className="text-lg sm:text-xl font-bold text-text-main mb-4">Message Analyzer</h2>
        
        <p className="text-sm text-text-muted mb-3">Use mock messages only. Do not enter real OTPs, passwords, bank details or student data.</p>
        <div className="relative">
          <textarea
            id="message-input"
            aria-label="Message to analyze"
            className={`w-full h-40 sm:h-48 p-4 bg-surface-bg border ${error ? 'border-status-danger ring-1 ring-status-danger' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all resize-y min-h-[120px] text-text-main text-sm sm:text-base`}
            placeholder="Paste suspicious email, SMS, or chat message here..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError("");
            }}
            disabled={isLoading}
            aria-invalid={!!error}
          />
          <div className="absolute bottom-3 right-4 text-xs font-semibold text-text-muted bg-surface-bg/90 px-2 py-1 rounded shadow-sm backdrop-blur-sm">
            {message.length}/1,000 characters
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-status-danger font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm sm:text-base font-semibold rounded-lg shadow-sm text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Analyzing Context...
              </>
            ) : (
              <>
                <Search className="-ml-1 mr-2 h-5 w-5" />
                Analyze Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

