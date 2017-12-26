const test = require('ava');
const { stub } = require('sinon');
const traverse = require('../modules/traverse');

test('traverse find a possible branch', t => {
  // prettier-ignore
  const getNodeChildren = stub()
    .onCall(0).returns(['b1', 'b2', 'b3'])
    .onCall(1).returns([])
    .onCall(2).returns(['c1'])
    .onCall(3).returns([])
    .onCall(4).returns(['c2'])
    .onCall(5).returns(['d1', 'd2'])
    .throws(new Error('Called too many times'));

  t.deepEqual(
    traverse({ levels: ['a', 'b', 'c', 'd'], init: ['a2'], getNodeChildren }),
    {
      branch: ['a2', 'b3', 'c2', 'd1'],
      depth: 4,
      isComplete: true,
      failedBranch: 2,
    },
  );
  t.deepEqual(getNodeChildren.args, [
    ['a2', 'b', ['a2']],
    ['b1', 'c', ['a2', 'b1']],
    ['b2', 'c', ['a2', 'b2']],
    ['c1', 'd', ['a2', 'b2', 'c1']],
    ['b3', 'c', ['a2', 'b3']],
    ['c2', 'd', ['a2', 'b3', 'c2']],
  ]);
  t.is(getNodeChildren.callCount, 6);
});
