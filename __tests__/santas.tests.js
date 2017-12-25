const test = require('ava');
const {
  findLeastSantas,
  findPotentialSantas,
  findFirstParticipantWithLeastSantas,
} = require('../modules/santas');

test('findAvailableSantas will find the available Santas for a participant', t => {
  // Without blacklist nor previous assignations.
  t.deepEqual(findLeastSantas([], ['anna', 'yin', 'lucy'], 'bob'), [
    'anna',
    'yin',
    'lucy',
  ]);

  // With previous assignations.
  t.deepEqual(
    findLeastSantas(
      [
        {
          bob: 'anna',
          lucy: 'bob',
          anna: 'yin',
          yin: 'matt',
          matt: 'lucy',
        },
      ],
      ['lucy', 'anna', 'yin', 'tom'],
      'bob',
    ),
    ['anna', 'yin', 'tom'],
  );

  // When all have been the Santa at least once.
  t.deepEqual(
    findLeastSantas(
      [
        {
          bob: 'anna',
          yin: 'bob',
          anna: 'tom',
          tom: 'yin',
        },
        {
          bob: 'yin',
          yin: 'tom',
          anna: 'bob',
          tom: 'anna',
        },
        {
          bob: 'tom',
          yin: 'anna',
          anna: 'yin',
          tom: 'bob',
        },
        { bob: 'tom', tom: 'bob' },
        { bob: 'max', max: 'bob' },
      ],
      ['anna', 'yin', 'tom', 'max'],
      'bob',
    ),
    ['anna', 'yin', 'max'],
  );
});

test('findPotentialSantas filters out participants that cannot be the santa of a participant', t => {
  t.deepEqual(
    findPotentialSantas({}, ['louis', 'bob', 'anna', 'lucy'], 'bob'),
    ['louis', 'anna', 'lucy'],
  );

  t.deepEqual(
    findPotentialSantas(
      { louis: ['bob', 'anna'], bob: ['lucy'] },
      ['louis', 'bob', 'anna', 'lucy'],
      'bob',
    ),
    ['anna', 'lucy'],
  );
});

test('findFirstParticipantWithLeastSantas find the first participant with the least santas', t => {
  t.is(
    findFirstParticipantWithLeastSantas({
      bob: ['anna', 'lucy'],
      max: ['bob'],
      anna: ['bob', 'lucy'],
      lucy: ['anna'],
    }),
    'max',
  );
});
