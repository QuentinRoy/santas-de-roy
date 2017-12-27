const test = require('ava');
const {
  findPotentialReceivers,
  getSantaReceiverMappingCount,
  getSantaMappings,
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
