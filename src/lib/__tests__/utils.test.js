import * as utils from '../utils.js'

describe('utils lib', () => {
  it('capitalize', () => {
    expect(utils.capitalize("hello")).toEqual("Hello");
    expect(utils.capitalize("HELLO")).toEqual("HELLO");
    expect(utils.capitalize("")).toEqual("");
    expect(utils.capitalize()).toEqual("");
    expect(utils.capitalize(undefined)).toEqual("");
    expect(utils.capitalize(null)).toEqual("");
    const arr = [undefined];
    expect(utils.capitalize(arr)).toEqual("");
  })
})
