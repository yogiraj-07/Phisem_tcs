import React, { useRef } from "react";
import { ArrowRight, FileText, Shield, BrainCircuit, Activity, CheckCircle2 } from "lucide-react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";

export const HowItWorks: React.FC = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Maps the vertical scroll to a horizontal translation
  const x = useTransform(smoothProgress, [0, 1], ["5%", "-75%"]);

  const steps = [
    { icon: <FileText className="h-8 w-8 sm:h-12 sm:w-12 text-brand-600" />, title: "Ingestion", desc: "A mock message is submitted for review." },
    { icon: <Shield className="h-8 w-8 sm:h-12 sm:w-12 text-brand-600" />, title: "Guardrails", desc: "Input checks and keyword clues." },
    { icon: <BrainCircuit className="h-8 w-8 sm:h-12 sm:w-12 text-brand-600" />, title: "Analysis", desc: "LLM semantic pattern evaluation." },
    { icon: <Activity className="h-8 w-8 sm:h-12 sm:w-12 text-brand-600" />, title: "Scoring", desc: "Estimated text risk, with sender unverified." },
    { icon: <CheckCircle2 className="h-8 w-8 sm:h-12 sm:w-12 text-brand-600" />, title: "Resolution", desc: "Actionable security output delivered." },
  ];

  return (
    <section id="pipeline" ref={targetRef} className="relative sm:h-[250vh] bg-surface-bg mt-16 sm:mt-24">
      <div className="sm:sticky sm:top-0 sm:h-screen flex flex-col items-center justify-center overflow-hidden py-12 sm:py-0">
        
        <div className="text-center mb-10 sm:mb-20 px-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text-main tracking-tight">Processing Pipeline</h2>
          <p className="text-lg sm:text-xl text-text-muted mt-4 font-medium">How Phisem evaluates threats in real-time.</p>
        </div>
        
        {/* Desktop View: Horizontal Scroll */}
        <div className="hidden sm:block w-full">
          <motion.div 
            style={{ x }}
            className="flex flex-nowrap items-center gap-6 sm:gap-12 w-max px-8 sm:px-[10vw]"
          >
            {steps.map((step, idx) => (
              <React.Fragment key={`desktop-${idx}`}>
                <div className="flex flex-col items-center text-center w-[280px] sm:w-[380px] lg:w-[420px] bg-white p-10 sm:p-14 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group flex-shrink-0">
                  <div className="bg-brand-50 p-6 sm:p-8 rounded-2xl mb-8 group-hover:scale-110 group-hover:bg-brand-100 transition-all duration-500 shadow-sm">
                    {step.icon}
                  </div>
                  <h4 className="font-extrabold text-text-main text-2xl sm:text-3xl mb-4">{step.title}</h4>
                  <p className="text-base sm:text-lg text-text-muted font-medium leading-relaxed">{step.desc}</p>
                </div>
                
                {idx < steps.length - 1 && (
                  <div className="flex-shrink-0 text-brand-300/60 drop-shadow-sm">
                    <ArrowRight className="h-10 w-10 sm:h-14 sm:w-14" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Mobile View: Vertical Stack */}
        <div className="flex flex-col sm:hidden items-center gap-4 w-full px-4 max-w-md mx-auto">
            {steps.map((step, idx) => (
              <React.Fragment key={`mobile-${idx}`}>
                <div className="flex flex-row items-center text-left w-full bg-white p-5 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 gap-5">
                  <div className="bg-brand-50 p-4 rounded-xl shadow-sm flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="flex-col flex">
                    <h4 className="font-extrabold text-text-main text-lg mb-1">{step.title}</h4>
                    <p className="text-sm text-text-muted font-medium leading-snug">{step.desc}</p>
                  </div>
                </div>
                
                {idx < steps.length - 1 && (
                  <div className="flex-shrink-0 text-brand-300/60 drop-shadow-sm py-1">
                    <ArrowRight className="h-6 w-6 rotate-90" />
                  </div>
                )}
              </React.Fragment>
            ))}
        </div>
        
      </div>
    </section>
  );
};

