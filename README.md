# OpenCollective API

[![Circle CI](https://circleci.com/gh/opencollective/opencollective-api/tree/master.svg?style=shield)](https://circleci.com/gh/opencollective/opencollective-api/tree/master)
[![Slack Status](https://slack.opencollective.org/badge.svg)](https://slack.opencollective.org)
[![Dependency Status](https://david-dm.org/opencollective/opencollective-api.svg)](https://david-dm.org/opencollective/opencollective-api)
[![Coverage Status](https://coveralls.io/repos/github/OpenCollective/opencollective-api/badge.svg)](https://coveralls.io/github/OpenCollective/opencollective-api)


## How to get started

Note: If you see a step below that could be improved (or is outdated),
please update instructions. We rarely go through this process
ourselves, so your fresh pair of eyes and your recent experience with
it, makes you the best candidate to improve them for other users.

### Download the source code

Although this repository only contains the code for the API and the
code for the UI is in a [separate
repository](https://github.com/opencollective/frontend), these
instructions will get *both* running on developer mode. That's why you
need to download *both* codebases under the same directory. Here's an
example of how it can be done if you have a
[git](https://git-scm.com/) client setup and ready to work:

```bash
$ mkdir -p ~/src/github.com/opencollective
$ cd ~/src/github.com/opencollective
$ git clone https://github.com/opencollective/opencollective-api
$ git clone https://github.com/opencollective/frontend
```

### Run the application

#### Vagrant setup

If you by any chance is a [Vagrant](https://www.vagrantup.com/) user,
just run the usual `vagrant up` within the `opencollective-api`
directory and go to http://localhost:23000/ in your browser.

#### Docker setup

If you prefer using `docker-compose` make sure it's installed and
working and then execute the following command:

```bash
$ docker-compose -f docker/docker-compose.yml up --build
```

Then you'll be able to access the UI from http://localhost:13000 and
the API from the address http://localhost:13060.

### Local setup

#### Requirements

- A PostgreSQL installation (10.3, 9.6.8, 9.5.12, 9.4.17, 9.3.22 or newer)
- [PostGIS](https://postgis.net/install/) extension for PostgeSQL
- Python 2 configured as the active version. You can use `pyenv` to switch python versions.

#### Steps

1. Setup your environment

Copy `env.default` and rename it to `.env`

2. Install dependencies

```bash
npm install
```

3. Start your local server

```bash
npm run dev
```

##### Troubleshooting:

- If you're running into node-gyp issues related to Python 3 vs Python 2 you can run `npm rebuild` or run `npm install` again.
- The postinstall script should set-up your default environment and bootstrap the database along with some seed data. If it is failing you can try to run: `npm run db:setup && ./node_modules/.bin/babel-node ./scripts/db_restore.js opencollective_dvl`

### Once it's running

This new environment is created with the `opencollective_dvl`
database. And it comes with enough data to play with most of the
system.

However, trying to access the home page will lead you to a 404
page. That's because we're porting our old UI over to the new one. The
repository
[opencollective-website](http://github.com/opencollective/opencollective-website/)
is deprecated but it still powers our home page and the `/discover`
page.

To see something interesting, please access one of the collectives
that are present in this sanitized version of the database. Here are
some examples:

- http://localhost:13000/opensource
- http://localhost:13000/apex
- http://localhost:13000/railsgirlsatl
- http://localhost:13000/tipbox
- http://localhost:13000/brusselstogether
- http://localhost:13000/veganizerbxl

### Local Email

Email templates can be viewed locally by running `npm run compile:email <template name>` and making sure there is data for that template in `scripts/compile-email.js`.

Email sending can done by running [`npm run maildev`](https://danfarrelly.nyc/MailDev/) locally and setting the `MAILDEV` environment variable to `true`. Then open `http://localhost:1080` to see any outgoing emails from the `opencollective-api` server.

## Participate on the discussion

If you have any questions, ping us on Slack
(https://slack.opencollective.org) or on Twitter
([@opencollect](https://twitter.com/opencollect)).

## TODO

- The User model is confusing with the concept of User Collective, we
  should merge the "User" model with the "ConnectedAccount" model so
  that we could have multiple emails per User.
- CreatedByUserId is confusing, it should be "CreatedByCollectiveId"
