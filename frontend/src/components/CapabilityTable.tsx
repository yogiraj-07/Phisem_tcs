import React from "react";
import { CheckCircle2 } from "lucide-react";

export const CapabilityTable: React.FC = () => {
  const capabilities = [
    { feature: "AI Text Classification", desc: "Contextual review of message wording; cannot authenticate the sender." },
    { feature: "Risk Scoring", desc: "Estimated text risk from 0 to 100, not a probability of fraud." },
    { feature: "Red Flag Extraction", desc: "Automated isolation of manipulative phrasing, urgency triggers, and payload links." },
    { feature: "Explainable AI (XAI)", desc: "Transparent reasoning behind classification decisions for human review." },
    { feature: "Actionable Intelligence", desc: "Prescriptive security recommendations based on threat type and severity." },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden my-12 sm:my-20">
      <div className="px-6 sm:px-8 py-6 border-b border-gray-100 bg-surface-bg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-text-main tracking-tight">Platform Capabilities</h3>
          <p className="text-sm font-medium text-text-muted mt-1">A prototype for understanding suspicious messages.</p>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-white">
            <tr>
              <th scope="col" className="px-6 sm:px-8 py-4 text-left text-xs font-extrabold text-text-muted uppercase tracking-widest w-1/3 min-w-[220px]">
                Core Feature
              </th>
              <th scope="col" className="px-6 sm:px-8 py-4 text-left text-xs font-extrabold text-text-muted uppercase tracking-widest min-w-[320px]">
                Technical Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {capabilities.map((item, idx) => (
              <tr key={idx} className="hover:bg-brand-50/30 transition-colors group">
                <td className="px-6 sm:px-8 py-5 whitespace-nowrap text-sm sm:text-base font-bold text-text-main flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-brand-500 opacity-70 group-hover:opacity-100 transition-opacity" />
                  {item.feature}
                </td>
                <td className="px-6 sm:px-8 py-5 text-sm sm:text-base font-medium text-text-muted">
                  {item.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

