process.env.LOGS_SECRET_KEY && require('now-logs')(process.env.LOGS_SECRET_KEY)

const { createServer } = require('http')
const next = require('next')

const env = process.env.NODE_ENV || "development";
const dev = (env === 'development');
const app = next({ dev, dir: 'src' });
const routes = require('./routes')
const handler = routes.getRequestHandler(app)

app.prepare()
.then(() => {
  createServer(handler)
  .listen(3000, (err) => {
    if (err) throw err
    console.log(`>> Ready on http://localhost:3000 in ${env} environment`);
  })
})