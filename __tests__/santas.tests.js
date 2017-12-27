const test = require('ava');
const {
  findPotentialReceivers,
  getSantaReceiverMappingCount,
  getSantaMappings,
  getTraverseNodeChildren,
  getRemainingReceivers,
  getRemainingSantas,
  getSubBranchOptimalCost,
} = require('../modules/santas');

test('findPotentialReceivers', t => {
  t.deepEqual(
    findPotentialReceivers(['louis', 'bob', 'anna', 'lucy'], 'bob'), //
    ['louis', 'anna', 'lucy'],
  );

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
    {
      anna: 2,
      max: 1,
      ying: 0,
      louis: 0,
    },
  );
});

test('getTraverseNodeChildren', t => {
  const participants = ['bob', 'anna', 'ying', 'max'];
  const santaMappings = {
    bob: { anna: 2, ying: 1, max: 0 },
    anna: { bob: 0, ying: 1, max: 1 },
    ying: { bob: 2, anna: 0, max: 1 },
    max: { bob: 0, anna: 0, ying: 1 },
  };

  t.deepEqual(
    getTraverseNodeChildren(participants, santaMappings, []), //
    [
      { receiver: 'anna', cost: 2, santa: 'bob' },
      { receiver: 'ying', cost: 1, santa: 'bob' },
      { receiver: 'max', cost: 0, santa: 'bob' },
    ],
  );

  t.deepEqual(
    getTraverseNodeChildren(
      participants, //
      santaMappings,
      [{ receiver: 'anna' }],
    ),
    [
      { receiver: 'bob', cost: 0, santa: 'anna' },
      { receiver: 'ying', cost: 1, santa: 'anna' },
      { receiver: 'max', cost: 1, santa: 'anna' },
    ],
  );

  t.deepEqual(
    getTraverseNodeChildren(
      participants, //
      santaMappings,
      [{ receiver: 'ying' }],
    ),
    [
      { receiver: 'bob', cost: 0, santa: 'anna' },
      { receiver: 'max', cost: 1, santa: 'anna' },
    ],
  );

  t.deepEqual(
    getTraverseNodeChildren(
      participants, //
      santaMappings,
      [{ receiver: 'anna' }, { receiver: 'max' }],
    ),
    [{ receiver: 'bob', cost: 2, santa: 'ying' }],
  );
});

test('getRemainingReceivers', t => {
  const participants = ['bob', 'anna', 'ying', 'max'];
  t.deepEqual(
    getRemainingReceivers(
      participants, //
      [{ receiver: 'ying' }, { receiver: 'max' }],
    ),
    ['bob', 'anna'],
  );
  t.deepEqual(
    getRemainingReceivers(participants, []), //
    ['bob', 'anna', 'ying', 'max'],
  );

  t.deepEqual(
    getRemainingReceivers(participants, [
      { receiver: 'bob' },
      { receiver: 'anna' },
      { receiver: 'ying' },
      { receiver: 'max' },
    ]),
    [],
  );
});

test('getRemainingSantas', t => {
  const participants = ['bob', 'anna', 'ying', 'max'];
  t.deepEqual(
    getRemainingSantas(participants, [{}, {}]), //
    ['ying', 'max'],
  );
  t.deepEqual(
    getRemainingSantas(participants, []), //
    ['bob', 'anna', 'ying', 'max'],
  );

  t.deepEqual(
    getRemainingSantas(participants, [{}, {}, {}, {}]), //
    [],
  );
});

test('getSubBranchOptimalCost', t => {
  const participants = ['bob', 'anna', 'ying', 'max'];
  const allSantaMappings = {
    bob: { anna: 2, ying: 1, max: 1 },
    anna: { bob: 0, ying: 1, max: 1 },
    ying: { bob: 2, anna: 0 },
    max: { bob: 1, anna: 0, ying: 2 },
  };
  t.deepEqual(
    getSubBranchOptimalCost(participants, allSantaMappings, [
      { receiver: 'anna' },
      { receiver: 'max' },
    ]),
    /* ying: bob only */ 2 + /* max: bob & ying */ 1,
  );
  t.deepEqual(
    getSubBranchOptimalCost(participants, allSantaMappings, [
      { receiver: 'anna' },
      { receiver: 'bob' },
    ]),
    // ying is blocked.
    Number.POSITIVE_INFINITY,
  );
  t.deepEqual(getSubBranchOptimalCost(participants, allSantaMappings, []), 1);
  t.deepEqual(
    getSubBranchOptimalCost(participants, allSantaMappings, [
      { receiver: 'anna' },
      { receiver: 'max' },
      { receiver: 'max' },
      { receiver: 'ying' },
    ]),
    0,
  );
});
