import React from "react";
import { ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

export const Navbar: React.FC = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="bg-brand-600 p-2 rounded-lg shadow-sm shadow-brand-500/20 group-hover:bg-brand-700 transition-colors">
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="font-bold text-lg sm:text-xl text-text-main tracking-tight">
              Phisem
            </span>
          </div>
          <div className="flex items-center space-x-6 sm:space-x-8">
            <a href="#" className="hidden sm:block text-sm font-semibold text-text-muted hover:text-brand-600 transition-colors">Platform</a>
            <a href="#capabilities" className="hidden sm:block text-sm font-semibold text-text-muted hover:text-brand-600 transition-colors">Platform Capabilities</a>
            <a href="#pipeline" className="text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors">Pipeline Processing</a>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
