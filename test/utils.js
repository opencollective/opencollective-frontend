import fs from 'fs';
import path from 'path';
import request from 'request';

const screenshotsDirectory = (process.env.CIRCLE_ARTIFACTS) ? process.env.CIRCLE_ARTIFACTS : '/tmp';
console.log(">>> screenshotsDirectory", screenshotsDirectory);

export function closeChrome(chrome) {
  return new Promise((resolve, reject) => {
    chrome.end()
      .then(() => {
        setTimeout(resolve, 100);
      })
      // .then(() => {
        // setTimeout(() => {
        // console.log(">>> killing chrome", typeof chrome);
        // chrome.kill()
          // .then(() => resolve())
          // .catch(e => {
            // console.error(">>> error closing chrome", e);
            // reject(e);
          // });
      // }, 500);
      // })
    });
}

export function download(filename, url) {
  return new Promise((resolve, reject) => {
    if (!process.env.DOWNLOAD_SCREENSHOT) {
      console.log(">>> screenshot", url);
      return false;
    }
    console.log(">>> downloading", url);
    request.head(url, (err, res) => {
      if (err) return reject(err);
      const filepath = path.join(screenshotsDirectory, `${filename}.png`);
      console.log(">>> saved in", filepath, `${Math.round(Number(res.headers['content-length']) / 1024)}KB`);
      request(url).pipe(fs.createWriteStream(filepath)).on('close', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}