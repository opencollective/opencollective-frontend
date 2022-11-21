/**
 * Returns true if the account requires 2FA for admins. Parent must be preloaded.
 */
export const require2FAForAdmins = (collective): boolean => {
  if (!collective) {
    return false;
  }

  const parent = collective.parent || collective.parentCollective;
  const accountToCheck = parent || collective;
  return Boolean(accountToCheck.policies?.REQUIRE_2FA_FOR_ADMINS);
};
