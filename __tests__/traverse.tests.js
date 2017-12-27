const test = require('ava');
const { spy } = require('sinon');
const traverse = require('../modules/traverse');

test('traverse', t => {
  const tree = {
    cost: 0,
    subBranch: 1,
    children: {
      '1': {
        cost: 0,
        subBranch: 2,
        children: {
          '1.1': {
            cost: 1,
            subBranch: 1,
            children: {
              '1.1.1': { cost: 1, failed: true },
            },
          },
          '1.2': {
            cost: 1,
            subBranch: 1,
            children: {
              '1.2.1': { cost: 1 },
            },
          },
          '1.3': { cost: 3 },
        },
      },
      '2': {
        subBranch: 0,
        cost: 1,
        children: {
          '2.1': { cost: 0, failed: true },
          '2.2': { cost: 0 },
          '2.3': { cost: 1 },
        },
      },
      '3': {
        cost: 1,
        subBranch: 1,
        children: {
          '3.1': { cost: 3 },
          '3.2': {
            subBranch: 0,
            cost: 1,
            children: {
              '3.1.1': { cost: 0 },
              '3.1.2': { cost: 0, failed: true },
              '3.1.3': { cost: 1 },
            },
          },
        },
      },
    },
  };

  const getNode = branch =>
    branch.reduce(
      (currentNode, child) => currentNode.children[child.name],
      tree,
    );

  const getNodeChildren = spy(branch => {
    const node = getNode(branch);
    if (node.failed) return null;
    return Object.entries(node.children || {}).map(([childName, child]) => ({
      name: childName,
      cost: child.cost,
    }));
  });

  const getSubBranchOptimalCost = branch => getNode(branch).subBranch;
  const result = traverse({ getNodeChildren, getSubBranchOptimalCost });
  t.deepEqual(result.branch, [
    { name: '2', cost: 1 },
    { name: '2.2', cost: 0 },
  ]);
  t.is(result.cost, 1);
});
