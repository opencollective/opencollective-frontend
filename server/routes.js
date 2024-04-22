const path = require('path');

const express = require('express');
const { trim } = require('lodash');

const maxAge = (maxAge = 60) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

module.exports = expressApp => {
  const app = expressApp;

  // Support older assets from website
  app.use('/public/images', express.static(path.join(__dirname, '../public/static/images')));

  app.get('/static/*', maxAge(86400));

  app.get('/favicon.*', maxAge(300000), (req, res) => {
    return res.sendFile(path.join(__dirname, '../public/static/images/favicon.ico.png'));
  });

  // This is used by Cypress to collect server side coverage
  if (process.env.OC_ENV === 'e2e' || process.env.E2E_TEST) {
    app.get('/__coverage__', (req, res) => {
      res.json({
        coverage: global.__coverage__ || null,
      });
      global.__coverage__ = {};
    });
  }

  // Correct slug links that end or start with hyphen
  app.use((req, res, next) => {
    if (req.path) {
      const path = req.path.split('/'); // `/-xxx-/test` => [ '', '-xxx-', 'test' ]
      const slug = path[1]; // slug = '-xxx-'
      const trimmedSlug = trim(slug, '-'); // '-xxx-' => 'xxx'
      if (trimmedSlug && trimmedSlug !== slug) {
        path[1] = trimmedSlug; // path = [ '', 'xxx', 'test' ]
        return res.redirect(301, path.join('/')); // `/xxx/test`
      }
    }
    next();
  });
};
