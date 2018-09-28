import { Account } from './interface/Account';

import { User } from './object/User';
import { Organization } from './object/Organization';
import { Collective } from './object/Collective';
import { Event } from './object/Event';
import { Bot } from './object/Bot';

import { Debit } from './object/Debit';
import { Credit } from './object/Credit';

import { Amount } from './object/Amount';

import { Member, MemberOf } from './object/Member';

const types = [
  Account,
  User,
  Organization,
  Collective,
  Event,
  Bot,
  Debit,
  Credit,
  Amount,
  Member,
  MemberOf,
];

export default types;
