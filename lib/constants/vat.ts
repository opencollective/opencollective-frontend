// TODO: `DISABLED` is read by `components/edit-collective/sections/Info.tsx` but was never defined
// here, so it is always `undefined` at runtime. Kept optional to preserve the behaviour until the
// call site is fixed in a separate commit.
export const VAT_OPTIONS: { HOST: string; OWN: string; DISABLED?: string } = {
  HOST: 'HOST',
  OWN: 'OWN',
};
