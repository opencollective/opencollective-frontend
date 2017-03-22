const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const pathMatch = require('path-match')

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: 'src' });
const handle = app.getRequestHandler();
const route = pathMatch();
const match = route('/:collectiveSlug/events/:eventSlug');

app.prepare()
.then(() => {
  createServer((req, res) => {
    const { pathname } = parse(req.url)

    const params = match(pathname)

    if (params === false) {
      handle(req, res)
      return
    }

    app.render(req, res, '/event', params)
  })
  .listen(3000, (err) => {
    if (err) throw err
    console.log('>> Ready on http://localhost:3000')
  })
})