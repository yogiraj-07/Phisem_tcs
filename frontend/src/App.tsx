import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Analyzer } from './components/Analyzer';
import { ResultCard } from './components/ResultCard';
import { CapabilityTable } from './components/CapabilityTable';
import { HowItWorks } from './components/HowItWorks';
import { analyzeMessage } from './services/api';
import { AnalysisRequest, AnalysisResponse } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const handleAnalyze = async (request: AnalysisRequest) => {
    setIsLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await analyzeMessage(request);
      setResult(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Analysis failed. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg font-sans text-text-main flex flex-col selection:bg-brand-200 selection:text-brand-900">
      <Navbar />
      <main className="flex-grow pt-16 sm:pt-20">
        <Hero />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-16 sm:-mt-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Analyzer onAnalyze={handleAnalyze} isLoading={isLoading} />
          </motion.div>
          
          {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
          <AnimatePresence>
            {result && (
              <motion.div 
                key="result"
                id="result-section" 
                initial={{ opacity: 0, height: 0, y: 20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mt-8 sm:mt-12 overflow-hidden"
              >
                <ResultCard result={result} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div 
            id="capabilities"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="mt-20 sm:mt-24"
          >
             <CapabilityTable />
          </motion.div>
        </div>
        
        <HowItWorks />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-text-muted">
            &copy; {new Date().getFullYear()} Phisem. Enterprise AI Security.
          </p>
        </div>
      </footer>
    </div>
  );
}

