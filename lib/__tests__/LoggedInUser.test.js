import LoggedInUser from '../LoggedInUser';

// ---- Define some test data ----

const COLLECTIVE_WITH_VALID_USER_AS_ADMIN = {
  id: 42,
  slug: 'valid-user-collective',
};

const COLLECTIVE_WITH_VALID_USER_NOT_MEMBER = {
  id: 43,
  slug: 'random-collective',
};

const VALID_USER = {
  id: 9000,
  CollectiveId: 19000,
  collective: { id: 19000 },
  memberOf: [{ collective: COLLECTIVE_WITH_VALID_USER_AS_ADMIN, role: 'ADMIN' }],
};

const OTHER_USER = {
  id: 9001,
  CollectiveId: 19001,
  collective: { id: 19001 },
};

// ---- Tests ----

describe('canCreateCommentOnExpense', () => {
  test('can comment own expense', () => {
    expect(
      new LoggedInUser(VALID_USER).canCreateCommentOnExpense({
        collective: COLLECTIVE_WITH_VALID_USER_NOT_MEMBER,
        fromCollective: VALID_USER.collective,
        user: VALID_USER,
      }),
    ).toBeTruthy();
  });

  test('can comment expenses made in collective owned by user', () => {
    expect(
      new LoggedInUser(VALID_USER).canCreateCommentOnExpense({
        collective: COLLECTIVE_WITH_VALID_USER_AS_ADMIN,
        fromCollective: VALID_USER.collective,
        user: OTHER_USER,
      }),
    ).toBeTruthy();
  });

  test('cannot comment on expenses if not author nor collective admin', () => {
    expect(
      new LoggedInUser(VALID_USER).canCreateCommentOnExpense({
        collective: COLLECTIVE_WITH_VALID_USER_NOT_MEMBER,
        fromCollective: OTHER_USER.collective,
        user: OTHER_USER,
      }),
    ).toBeFalsy();
  });
});
