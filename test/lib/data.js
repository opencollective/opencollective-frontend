import { expect } from 'chai';
import { diffDBEntries } from '../../server/lib/data';

describe('diffDBEntries', () => {
  it('works with empty lists', () => {
    const [toCreate, toRemove, toUpdate] = diffDBEntries([], [], []);
    expect(toCreate).to.eql([]);
    expect(toRemove).to.eql([]);
    expect(toUpdate).to.eql([]);
  });

  it('returns correct results', () => {
    const [toCreate, toRemove, toUpdate] = diffDBEntries(
      [{ id: 1, msg: 'I am 1' }, { id: 2, msg: 'I am 2' }, { id: 3, msg: 'I am 3' }],
      [{ id: 1, msg: 'I am 1 edited' }, { id: 2, msg: 'I am 2' }, { msg: 'I am the new one!' }],
      ['msg'],
    );

    expect(toCreate).to.eql([{ msg: 'I am the new one!' }]);
    expect(toRemove).to.eql([{ id: 3, msg: 'I am 3' }]);
    expect(toUpdate).to.eql([{ id: 1, msg: 'I am 1 edited' }]);
  });

  it('throws if we try to update an unexisting entry', () => {
    const errorMsg = "One of the entity you're trying to update doesn't exist or has changes. Please refresh the page.";
    expect(() => diffDBEntries([], [{ id: 1, msg: 'Malicious entry' }], ['msg'])).to.throw(errorMsg);
  });
});
