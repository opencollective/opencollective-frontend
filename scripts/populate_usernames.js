#!/usr/bin/env node
import '../server/env';

import models from '../server/models';

const done = err => {
  if (err) {
    console.log('err', err);
  }
  console.log('done!');
  process.exit();
};

// Get all users
models.User.findAll()
  .map(user => {
    if (user.username) {
      return;
    }
    return models.User.suggestUsername(user).then(username => {
      if (!username) {
        return;
      }
      console.log(`Setting user#${user.id}'s username to ${username}`);
      user.username = username;
      return user.save().catch(e => console.error(e.errors));
    });
  })
  .then(() => done())
  .catch(done);
