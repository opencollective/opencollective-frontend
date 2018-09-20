export default {
  cloudfront: {
    head: {
      header: {
        'Content-Type': 'image/png',
      },
      status: 200,
    },
    get: {
      header: {
        'Content-Type': 'image/png',
      },
      status: 200,
      body: 'blahblahblah',
    },
  },
};
