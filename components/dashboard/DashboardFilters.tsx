import React from 'react';

import Tabs from '../Tabs';

export default function DashboardFilters({ query, onChange, views }) {
  const [currentView, setView] = React.useState(views?.[0]);

  React.useEffect(() => {
    const matchingView = views?.find(v => {
      return (
        Object.keys(v.query).every(key => {
          return v.query[key] == query[key];
        }) && Object.keys(query).every(key => v.query[key] == query[key])
      );
    });
    setView(matchingView || null);
  }, [JSON.stringify(query)]);

  return (
    <div>
      <Tabs
        label="Views"
        tabs={views}
        selectedId={currentView?.id}
        onChange={id => {
          const view = views.find(v => v.id === id);
          if (view) {
            onChange(view.query);
          }
        }}
      />
    </div>
  );
}
