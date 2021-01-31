export const mapRouteToURL = routeObj => {
  if (routeObj.pathname === undefined) {
    return null;
  } else if (routeObj.pathname === '/expenses') {
    const { collectiveSlug, ...queryURL } = routeObj.query;
    const queryURLstr = new URLSearchParams(queryURL).toString();

    return `${collectiveSlug}/expenses?${queryURLstr}`;
  } else {
    return null;
  }
};
