import React from 'react';
import { GoalsForm } from '../../goals/GoalForm';
import LegacyCollectiveGoals from './LegacyCollectiveGoals';

export default function GoalsSection({ collective }) {
  const hasOldGoals = collective.settings.goals && collective.settings.collectivePage?.showGoals && !collective.goal; // include check for "showGoals?"
  return (
    <div className="space-y-4">
      <p className="max-w-prose text-muted-foreground">Set a goal to share with your community</p>
      {!hasOldGoals && <GoalsForm account={collective} />}
      {hasOldGoals && <LegacyCollectiveGoals collective={collective} />}
    </div>
  );
}
