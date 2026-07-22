import React from "react";
import { Shield } from "lucide-react";
import { motion } from "motion/react";
import BlurText from "./BlurText";

export const Hero: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-brand-950 text-white pb-32 pt-16 sm:pb-40 sm:pt-24 lg:pb-48 lg:pt-32">
      {/* Abstract Background Patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute left-1/2 right-0 top-0 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48" aria-hidden="true">
          <div className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-brand-300 to-brand-600 opacity-20" style={{ clipPath: 'polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)' }}></div>
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-700/50 backdrop-blur-sm mb-6"
        >
          <Shield className="h-4 w-4 text-brand-400" />
          <span className="text-xs font-semibold tracking-wide text-brand-200 uppercase">Enterprise Phishing Protection</span>
        </motion.div>
        
        <div className="flex flex-col items-center justify-center mb-6 gap-2 sm:gap-4 drop-shadow-sm">
          <BlurText 
            text="Detect AI-Generated Phishing" 
            delay={100} 
            animateBy="words" 
            direction="top" 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-extrabold text-white text-center" 
          />
          <BlurText 
            text="Before They Harm You" 
            delay={150} 
            animateBy="words" 
            direction="top" 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500 text-center pb-2" 
          />
        </div>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-brand-200 font-medium"
        >
          Analyze suspicious emails, SMS messages, and chat interactions using advanced AI-powered security analysis. Protect your organization with transparent, explainable threat detection.
        </motion.p>
      </div>
    </div>
  );
};
