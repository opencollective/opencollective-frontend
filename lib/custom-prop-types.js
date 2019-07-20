import { isUppercase } from 'validator';

export const propTypeCountry = (props, propName, componentName) => {
  if (props[propName] === undefined || props[propName] === null) {
    return false;
  }
  if (props[propName].length !== 2 || !isUppercase(props[propName])) {
    return new Error(
      `Invalid prop "${propName}" supplied to "${componentName}". Expected a two letters, uppercase country code.`,
    );
  }
  return false;
};
