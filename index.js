import express from 'express';
import path from 'path';
import request from 'request';

const app = express();

const API_URL = process.env.API_URL || 'http://localhost:3060';
const API_KEY = process.env.API_KEY || 'dvl-1510egmf4a23d80342403fb599qd';

const getApiUrl = (url) => {
  const withoutParams = API_URL + (url.replace('/api/', '/'));
  const hasParams = `${url}`.match(/\?/) 

  return `${withoutParams}${hasParams ? '&' : '?'}api_key=${API_KEY}`;
}

/**
 * Pipe the requests before the middlewares, the piping will only work with raw
 * data
 * More infos: https://github.com/request/request/issues/1664#issuecomment-117721025
 */
app.all('/api/*', (req, res) => {
req
    .pipe(request(getApiUrl(req.url), { followRedirect: false }))
    .on('error', (e) => {
    console.error("error calling api", getApiUrl(req.url), e);
    res.status(500).send(e);
    })
    .pipe(res);
});

console.log("static folder", path.join(__dirname, `static`));
app.use('/static', express.static(path.join(__dirname, `static`), { maxAge: '1d' }));

app.use('/favicon.*', (req, res) => {
    return res.sendfile('./build/favicon.png');
});

app.use('*', (req, res) => {
    return res.sendfile('./build/index.html');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT);
console.log("Listening on port", PORT);
