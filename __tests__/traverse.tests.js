const test = require('ava');
const { spy } = require('sinon');
const traverse = require('../modules/traverse');

test('traverse', t => {
  const tree = {
    cost: 0,
    children: {
      '1': {
        cost: 0,
        children: {
          '1.1': {
            cost: 1,
            children: {
              '1.1.1': { cost: 1, failed: true },
            },
          },
          '1.2': {
            cost: 1,
            children: {
              '1.1.2': { cost: 1 },
            },
          },
        },
      },
      '2': {
        cost: 1,
        children: {
          '2.1': { cost: 0, failed: true },
          '2.2': { cost: 0 },
        },
      },
      '3': {
        cost: 0,
        children: {
          '3.1': { cost: 3 },
          '3.2': {
            cost: 1,
            children: {
              '3.1.1': { cost: 1 },
              '3.1.2': {
                cost: 0,
              },
            },
          },
        },
      },
    },
  };

  const getNodeChildren = spy(branch => {
    const node = branch.reduce(
      (currentNode, child) => currentNode.children[child.name],
      tree,
    );
    if (node.failed) return null;
    return Object.entries(node.children || {}).map(([childName, child]) => ({
      name: childName,
      cost: child.cost,
    }));
  });

  t.deepEqual(traverse({ getNodeChildren }), {
    branch: [{ name: '2', cost: 1 }, { name: '2.2', cost: 0 }],
    depth: 2,
    cost: 1,
    explored: 5,
    failed: 2,
  });
});
