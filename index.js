import express from 'express';

const app = express();

/**
 * Static folder
 */
app.get('/', (req, res) => {
    res.send('Welcome');
});
app.listen();
