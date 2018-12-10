/**
 * Return the correct border color index depending on `error` and `success`.
 *
 * ## Examples
 *
 *    > getInputBorderColor({error: true})
 *    'red.500'
 */
export const getInputBorderColor = (error, success) => {
  if (error) {
    return 'red.500';
  }

  if (success) {
    return 'green.300';
  }

  return 'black.300';
};
