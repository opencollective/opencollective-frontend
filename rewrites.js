const createOrderPage = '/contribution-flow';
const contributionFlowSteps = '/details|profile|payment|summary|success';

exports.REWRITES = [
  {
    source: '/:pageSlug(become-a-host|become-a-fiscal-host)',
    destination: '/become-a-host',
  },
  {
    source: '/fiscal-hosting',
    destination: '/fiscal-hosting',
  },
  {
    source: '/welcome',
    destination: '/welcome',
  },
  {
    source: '/:pageSlug(widgets|tos|privacypolicy|hiring)',
    destination: '/staticPage',
  },
  {
    source: '/opensource/apply/:step(intro|pick-repo|fees|form|success)',
    destination: '/osc-host-application',
  },
  {
    source: '/signin/sent',
    destination: '/signinLinkSent',
  },
  {
    source: '/reset-password/sent',
    destination: '/reset-password-sent',
  },
  {
    source: '/reset-password/completed',
    destination: '/reset-password-completed',
  },
  {
    source: '/oauth/authorize',
    destination: '/oauth/authorize',
  },
  {
    source: '/deleteCollective/confirmed',
    destination: '/confirmCollectiveDeletion',
  },
  {
    source: '/create-account/guest',
    destination: '/guest-join',
  },
  {
    source: '/organizations/new',
    destination: '/createOrganization',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/updates',
    destination: '/updates',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/updates/new',
    destination: '/createUpdate',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/updates/:updateSlug',
    destination: '/update',
  },
  {
    source: '/:collectiveSlug?/redeem/:code?',
    destination: '/redeem',
  },
  {
    source: '/:collectiveSlug?/redeemed/:code?',
    destination: '/redeemed',
  },
  {
    source: '/paymentmethod/:paymentMethodId/update',
    destination: '/updatePaymentMethod',
  },
  {
    source: '/:collectiveSlug/banner.html',
    destination: '/banner-iframe',
  },
  {
    source: '/:collectiveSlug/(collectives|widget).html',
    destination: '/collectives-iframe',
  },
  {
    source: '/redirect',
    destination: '/external-redirect',
  },
  {
    source: '/signin/:token?',
    destination: '/signin',
  },
  {
    source: '/reset-password/:token?',
    destination: '/reset-password',
  },
  {
    source: '/confirm/email/:token',
    destination: '/confirmEmail',
  },
  {
    source: '/confirm/guest/:token',
    destination: '/confirm-guest',
  },
  {
    source: '/email/unsubscribe/:email/:slug/:type/:token',
    destination: '/unsubscribeEmail',
  },
  {
    source: '/:form(create-account)',
    destination: '/signin',
  },
  {
    source: '/:collectiveSlug/:verb(contribute|donate)/button',
    destination: '/button',
  },
  {
    source: '/:parentCollectiveSlug/events/(new|create)',
    destination: '/createEvent',
  },
  {
    source: '/:parentCollectiveSlug/projects/(new|create)',
    destination: '/create-project',
  },
  {
    source: '/dashboard/:slug/expenses/new',
    destination: '/submit-expense',
  },
  {
    source: '/dashboard',
    destination: '/dashboard',
  },
  { source: '/workspace', destination: '/dashboard' },
  {
    source: '/dashboard/:slug/:section?/:subpath*',
    destination: '/dashboard',
  },
  {
    source: '/workspace/:slug/:section?/:subpath*',
    destination: '/dashboard',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/contact',
    destination: '/collective-contact',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/transactions',
    destination: '/transactions',
  },
  {
    source: '/:parentCollectiveSlug?/:type(events|projects)?/:collectiveSlug/expenses/new',
    destination: '/create-expense',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/expenses/:ExpenseId([0-9]+)',
    destination: '/expense',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/expenses',
    destination: '/expenses',
  },
  {
    source: '/:collectiveSlug/submitted-expenses',
    destination: '/submitted-expenses',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/orders',
    destination: '/orders',
  },
  {
    source:
      '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/(orders|contributions)/:OrderId([0-9]+)',
    destination: '/order',
  },
  {
    source: '/:collectiveSlug?/(orders|contributions)/:id([0-9]+)/confirm',
    destination: '/confirmOrder',
  },
  {
    source: '/fund/:verb(apply|create)/:step(form)?',
    destination: '/create-fund',
  },

  // New Create Collective Flow
  {
    source: '/:hostCollectiveSlug?/:verb(create)/:version(v2)?/:category(community|climate)?/:step(form)?',
    destination: '/create-collective',
  },
  // Events and Projects using collective page
  {
    source: '/:parentCollectiveSlug/events/:slug',
    destination: '/collective-page',
  },
  {
    source: '/:parentCollectiveSlug/projects/:slug',
    destination: '/collective-page',
  },
  // "Ways to contribute" pages
  {
    source: '/:collectiveSlug/:verb(tiers|contribute|events|projects|connected-collectives)',
    destination: '/contribute',
  },
  {
    source:
      '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/:verb(tiers|contribute|connected-collectives)',
    destination: '/contribute',
  },
  // Embed
  {
    source: `/embed/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/:verb(donate)/:step(${contributionFlowSteps})?`,
    destination: '/embed/contribution-flow',
  },
  {
    source: `/embed/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/contribute/:tierSlug?-:tierId([0-9]+)/:action(checkout)?/:step(${contributionFlowSteps})?`,
    destination: '/embed/contribution-flow',
  },
  // Tier page
  {
    source:
      '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/:verb(tiers|contribute)/:tierSlug?-:tierId([0-9]+)',
    destination: '/tier',
  },
  // Conversations
  {
    source: '/:collectiveSlug/conversations',
    destination: '/conversations',
  },
  {
    source: '/:collectiveSlug/conversations/new',
    destination: '/create-conversation',
  },
  {
    source: '/:collectiveSlug/conversations/:slug?-:id([a-z0-9]+)',
    destination: '/conversation',
  },
  // Legacy Banners/Widgets/Buttons
  {
    source: '/:collectiveSlug/:verb(contribute|donate)/button:size(|@2x).png',
    destination: '/api/legacy/contribute',
  },
  {
    source: '/:collectiveSlug/:verb(contribute|donate)/button.js',
    destination: '/api/legacy/button',
  },
  {
    source: '/:collectiveSlug/:widget(widget|events|collectives|banner).js',
    destination: '/api/legacy/widget',
  },
  // Contribute Flow
  // ---------------
  // Legacy create order route. Deprectated on 2019-02-12
  {
    source: '/:collectiveSlug/:verb(order)/:tierId/:amount(\\d+)?/:interval(month|monthly|year|yearly)?',
    destination: createOrderPage,
  },
  // Legacy tier route. Deprectated on 2019-06-07
  {
    source: `/:collectiveSlug/:verb(donate|pay|contribute|order|events)/tier/:tierId-:tierSlug?/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  // New Routes -> New flow
  {
    source: `/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/:verb(donate)/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  {
    source: `/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/:verb(contribute)/:tierSlug?-:tierId([0-9]+)/checkout/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  // Generic Route
  {
    source:
      '/:collectiveSlug/:verb(donate|pay|order)/:amount(\\d+)?/:interval(month|monthly|year|yearly)?/:description?',
    destination: createOrderPage,
  },
  // Events
  {
    source: `/:collectiveSlug/:verb(events|projects)/:eventSlug/order/:tierId/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  // Marketing Pages
  {
    source: `/:pageSlug(gift-of-giving|gift-cards)`,
    destination: '/marketingPage',
  },
  // New accept financial contributions flow
  {
    source:
      '/:slug/accept-financial-contributions/:path(ourselves|myself|organization|host)?/:method(stripe|bank)?/:state(success)?',
    destination: '/accept-financial-contributions',
  },
  // New recurring contributions page
  {
    source: '/:slug/manage-contributions/:tab(recurring|processing)?',
    destination: '/manage-contributions',
  },
  {
    source: '/manage-contributions/:tab(recurring|processing)?',
    destination: '/manage-contributions',
  },
  {
    source: '/:slug/recurring-contributions/:tab(recurring|processing)?',
    destination: '/manage-contributions',
  },
  {
    source: '/recurring-contributions/:tab(recurring|processing)?',
    destination: '/manage-contributions',
  },
  {
    source: '/:slug/subscriptions',
    destination: '/manage-contributions',
  },
  // Path routing: all the rewrites below are ready to be removed as soon as we
  // set `useFileSystemPublicRoutes` to true (default) in `next.config.js`
  {
    source: '/',
    destination: '/home',
  },
  {
    source: '/home',
    destination: '/home',
  },
  {
    source: '/collectives',
    destination: '/collectives',
  },
  {
    source: '/search',
    destination: '/search',
  },
  {
    source: '/pricing',
    destination: '/pricing',
  },
  {
    source: '/pricing-old',
    destination: '/pricing-old',
  },
  {
    source: '/become-a-sponsor',
    destination: '/become-a-sponsor',
  },
  {
    source: '/how-it-works',
    destination: '/how-it-works',
  },
  {
    source: '/e2c',
    destination: '/e2c',
  },
  {
    source: '/:action(help|contact)/:formConfirmation(success)?',
    destination: '/help-and-support',
  },
  {
    source: '/member-invitations',
    destination: '/member-invitations',
  },
  {
    source: '/applications',
    destination: '/applications',
  },
  // Robots.txt
  {
    source: '/robots.txt',
    destination: '/api/robots',
  },
  // Collective
  // ----------
  // Collective page
  {
    source: '/:slug',
    destination: '/collective-page',
  },
  {
    source: '/:slug/:action(apply)?/:mode(onboarding)?/:step(administrators|contact-info|success)?',
    destination: '/collective-page',
  },
  // Root actions
  {
    source: '/opencollective/root-actions/:section?',
    destination: '/root-actions',
  },
  // Terms of services for the host
  {
    source: '/:hostCollectiveSlug/terms',
    destination: '/terms-of-fiscal-sponsorship',
  },
];
