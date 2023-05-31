/* eslint-disable react/prop-types */
import { MessageSquare, Paperclip, ShieldAlert, ShieldCheck, ShieldClose, ShieldQuestion } from 'lucide-react';
import React from 'react';

import { compact, find, first, uniq, upperCase } from 'lodash';

const LEVEL_ORDER = ['HIGH', 'MEDIUM', 'LOW', 'PASS'];

export const expenseRequiresSecurityConfirmation = expense =>
  expense?.securityChecks?.filter(check => check.level === 'HIGH').length > 0;

// const LEVEL_BUTTON_STYLE = {
//   PASS: 'successSecondary',
//   HIGH: 'dangerSecondary',
//   MEDIUM: 'warningSecondary',
//   LOW: 'secondary',
// };

export const SecurityChecksIndicator = ({ securityChecks }) => {
  // const highRiskChecks = securityChecks?.filter(check => check.level === 'HIGH').length || 0;

  const higherRisk = first(compact(LEVEL_ORDER.map(level => find(securityChecks, { level }))));
  // const ShieldIcon = highRiskChecks ? ShieldAlert : ShieldCheck;
  // const buttonStyle = LEVEL_BUTTON_STYLE[higherRisk?.level] || 'secondary';

  const pickIcon = level => {
    switch (level) {
      case 'HIGH':
        return <ShieldClose size={18} />;
      case 'MEDIUM':
        return <ShieldAlert size={18} />;
      case 'LOW':
        return <ShieldQuestion size={18} />;
      default:
        return <ShieldCheck size={18} />;
    }
  };
  return (
    <div className="relative">
      {/* {highRiskChecks ? (
        <div className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full p-1 text-xs text-white transition-colors group-hover:bg-red-500">
          {highRiskChecks}
        </div>
      ) : null} */}
      {pickIcon(higherRisk?.level)}
    </div>
  );
};

export default SecurityChecksIndicator;
