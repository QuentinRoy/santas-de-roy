const uniq = require('lodash/uniq');
const mapValues = require('lodash/mapValues');
const { exclusionGroupsToBlacklists } = require('./utils');

test('exclusionGroupsToBlacklists', () => {
  expect(
    mapValues(
      exclusionGroupsToBlacklists([
        ['bob', 'anna', 'jack'],
        ['bob', 'alice'],
      ]),
      val => uniq(val).sort(),
    ),
  ).toEqual({
    bob: ['bob', 'anna', 'jack', 'alice'].sort(),
    anna: ['bob', 'anna', 'jack'].sort(),
    jack: ['bob', 'anna', 'jack'].sort(),
    alice: ['bob', 'alice'].sort(),
  });
});
