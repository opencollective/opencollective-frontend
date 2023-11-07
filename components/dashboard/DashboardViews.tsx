import React from 'react';
import { omitBy } from 'lodash';

import { Box } from '../Grid';
import Tabs from '../StyledTabs';
const omit = (query, keys) => {
  return omitBy(query, (value, key) => !value || (keys && keys.includes(key)));
};

export default function DashboardViews({ query, omitMatchingParams, onChange, views }) {
  const [currentView, setView] = React.useState(views?.[0]);
  const currentQuery = omit(query, omitMatchingParams);

  React.useEffect(() => {
    const matchingView = views?.find(v => {
      const viewQuery = omit(v.query, omitMatchingParams);
      return (
        Object.keys(viewQuery).every(key => {
          return viewQuery[key] === currentQuery[key];
        }) && Object.keys(currentQuery).every(key => viewQuery[key] === currentQuery[key])
      );
    });
    setView(matchingView || null);
  }, [JSON.stringify(currentQuery)]);

  return (
    <Box mb={3}>
      <Tabs
        tabs={views}
        selectedId={currentView?.id}
        onChange={id => {
          const view = views.find(v => v.id === id);
          if (view) {
            onChange(view.query);
          }
        }}
      />
    </Box>
  );
}
