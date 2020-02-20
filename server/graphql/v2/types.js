import { Account } from './interface/Account';
import { Amount } from './object/Amount';
import { Bot } from './object/Bot';
import { Collective } from './object/Collective';
import { Credit } from './object/Credit';
import { Debit } from './object/Debit';
import { Event } from './object/Event';
import { Individual } from './object/Individual';
import { Member, MemberOf } from './object/Member';
import { Organization } from './object/Organization';
import { TransferWise } from './object/TransferWise';

const types = [
  Account,
  Amount,
  Bot,
  Collective,
  Credit,
  Debit,
  Event,
  Individual,
  Member,
  MemberOf,
  Organization,
  TransferWise,
];

export default types;
