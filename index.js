import express from 'express';

const app = express();

/**
 * Static folder
 */
app.use('/static', express.static(path.join(__dirname, `./src/assets/`), { maxAge: '1d' }));
console.log("using /static");
app.get('/', (req, res) => {
    res.send('Welcome');
});
app.listen();
