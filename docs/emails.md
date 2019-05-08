# Developing with Emails

## Receving Emails

- Launch the API server with `MAILDEV=true npm run dev`
- In a separate terminal, launch [MailDev](https://danfarrelly.nyc/MailDev/) with `npm run maildev`
- Open `http://localhost:1080` to browse outgoing emails

## Email Templates

Email templates can be viewed locally by running `npm run compile:email <template name>` and making sure there is data for that template in `scripts/compile-email.js`.
