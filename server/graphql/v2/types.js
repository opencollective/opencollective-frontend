import { Account } from './interface/Account';

import { User } from './object/User';
import { Organization } from './object/Organization';
import { Collective } from './object/Collective';
import { Event } from './object/Event';
import { Bot } from './object/Bot';

import { Debit } from './object/Debit';
import { Credit } from './object/Credit';

const types = [
  Account,
  User,
  Organization,
  Collective,
  Event,
  Bot,
  Debit,
  Credit,
];

export default types;
