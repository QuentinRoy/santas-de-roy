const test = require('ava');
const {
  findPotentialReceivers,
  getSantaReceiverMappingCount,
  getSantaMappings,
  getTraverseNodeChildren,
} = require('../modules/santas');

test('findPotentialReceivers', t => {
  t.deepEqual(findPotentialReceivers(['louis', 'bob', 'anna', 'lucy'], 'bob'), [
    'louis',
    'anna',
    'lucy',
  ]);

  t.deepEqual(
    findPotentialReceivers([['louis', 'bob'], 'anna', ['lucy', 'max']], 'bob'),
    ['anna', 'lucy', 'max'],
  );
});

test('getSantaReceiverMappingCount', t => {
  const past = [
    { bob: 'anna', lucy: 'bob', anna: 'ying', ying: 'lucy' },
    { bob: 'anna', lucy: 'max', anna: 'bob', max: 'lucy' },
  ];
  t.is(getSantaReceiverMappingCount(past, 'bob', 'anna'), 2);
  t.is(getSantaReceiverMappingCount(past, 'lucy', 'anna'), 0);
});

test('getSantaMappings', t => {
  t.deepEqual(
    getSantaMappings(
      [
        { bob: 'anna', lucy: 'bob', anna: 'ying', ying: 'lucy' },
        { bob: 'anna', lucy: 'max', anna: 'bob', max: 'lucy' },
        { bob: 'max', lucy: 'anna', anna: 'lucy', max: 'bob' },
        { bob: 'lucy', lucy: 'bob' },
        { max: 'ying', lucy: 'max', ying: 'lucy' },
      ],
      ['anna', 'max', 'ying', 'louis'],
      'bob',
    ),
    [
      { receiver: 'anna', count: 2 },
      { receiver: 'max', count: 1 },
      { receiver: 'ying', count: 0 },
      { receiver: 'louis', count: 0 },
    ],
  );
});

test('createNodeChildrenGetter', t => {
  const participants = ['bob', 'anna', 'ying', 'max'];
  const santaMappings = {
    bob: [
      { receiver: 'anna', count: 2 },
      { receiver: 'ying', count: 1 },
      { receiver: 'max', count: 0 },
    ],
    anna: [
      { receiver: 'bob', count: 0 },
      { receiver: 'ying', count: 1 },
      { receiver: 'max', count: 1 },
    ],
    ying: [
      { receiver: 'bob', count: 2 },
      { receiver: 'anna', count: 0 },
      { receiver: 'max', count: 1 },
    ],
    max: [
      { receiver: 'bob', count: 0 },
      { receiver: 'anna', count: 0 },
      { receiver: 'ying', count: 1 },
    ],
  };

  t.deepEqual(getTraverseNodeChildren(participants, santaMappings, []), [
    { receiver: 'anna', cost: 2, santa: 'bob' },
    { receiver: 'ying', cost: 1, santa: 'bob' },
    { receiver: 'max', cost: 0, santa: 'bob' },
  ]);

  t.deepEqual(
    getTraverseNodeChildren(participants, santaMappings, [
      { receiver: 'anna' },
    ]),
    [
      { receiver: 'bob', cost: 0, santa: 'anna' },
      { receiver: 'ying', cost: 1, santa: 'anna' },
      { receiver: 'max', cost: 1, santa: 'anna' },
    ],
  );

  t.deepEqual(
    getTraverseNodeChildren(participants, santaMappings, [
      { receiver: 'ying' },
    ]),
    [
      { receiver: 'bob', cost: 0, santa: 'anna' },
      { receiver: 'max', cost: 1, santa: 'anna' },
    ],
  );

  t.deepEqual(
    getTraverseNodeChildren(participants, santaMappings, [
      { receiver: 'anna' },
      { receiver: 'max' },
    ]),
    [{ receiver: 'bob', cost: 2, santa: 'ying' }],
  );
});
