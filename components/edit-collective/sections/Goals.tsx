import React from 'react';
import { GoalsForm } from '../../goals/GoalForm';

export default function GoalsSection({ collective }) {
  const hasOldGoals = collective.settings.goals && !collective.goal; // include check for "showGoals?"
  return (
    <div>
      <p className="max-w-prose text-muted-foreground">Set a goal to share with your community</p>
      {!hasOldGoals && <GoalsForm account={collective} />}
    </div>
  );
}
