const munkres = require('munkres-js');
const shuffle = require('lodash/shuffle');
const generateReceivers = require('./generate-receivers');

jest.mock('munkres-js', () => jest.fn(() => []));
jest.mock('lodash/shuffle', () => jest.fn(() => []));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createCostMatrix', () => {
  test('it creates simple cost mastrix', () => {
    expect(generateReceivers.createCostMatrix([], [], {})).toEqual([]);
    expect(
      generateReceivers.createCostMatrix(['jo', 'anna', 'bob'], [], {}),
    ).toEqual([
      [generateReceivers.MAX_COST, 0, 0],
      [0, generateReceivers.MAX_COST, 0],
      [0, 0, generateReceivers.MAX_COST],
    ]);
  });

  test('it takes into account history and blacklists', () => {
    expect(
      generateReceivers.createCostMatrix(
        ['jo', 'anna', 'bob', 'jack'],
        [
          { jo: 'anna', bob: 'jack', jack: 'rob', rob: 'bob' },
          { jo: 'anna', bob: 'anna', anna: 'jack' },
        ],
        { jo: ['jack'], bob: ['jo', 'anna'] },
        { jo: { bob: 1 } },
      ),
    ).toEqual([
      [generateReceivers.MAX_COST, 2, 0, generateReceivers.MAX_COST],
      [0, generateReceivers.MAX_COST, 0, 1],
      [
        generateReceivers.MAX_COST,
        generateReceivers.MAX_COST,
        generateReceivers.MAX_COST,
        1,
      ],
      [0, 0, 0, generateReceivers.MAX_COST],
    ]);
  });
});

describe('runAssignmentAlgo', () => {
  const originalCreateCostMatrix = generateReceivers.createCostMatrix;
  beforeEach(() => {
    generateReceivers.createCostMatrix = jest.fn();
  });
  afterEach(() => {
    generateReceivers.createCostMatrix = originalCreateCostMatrix;
  });

  test('it appropriately calls munkres and createCostMatrix', () => {
    // Set up mocks.
    generateReceivers.createCostMatrix.mockReturnValue('costReturn');
    // Test.
    generateReceivers.runAssignmentAlgo(
      ['jo', 'bob', 'ana'],
      { args: 'test' },
      ['foo', 'bar'],
    );
    // Check the calls.
    expect(generateReceivers.createCostMatrix.mock.calls).toEqual([
      [['jo', 'bob', 'ana'], { args: 'test' }, ['foo', 'bar']],
    ]);
    expect(munkres.mock.calls).toEqual([['costReturn']]);
  });

  test('map back munkres results to participants', () => {
    munkres.mockReturnValue([[0, 2], [1, 0], [2, 1]]);
    expect(generateReceivers.runAssignmentAlgo(['jo', 'bob', 'ana'])).toEqual({
      jo: 'ana',
      bob: 'jo',
      ana: 'bob',
    });
  });
});

describe('generateReceivers', () => {
  const originalRunAssignmentAlgo = generateReceivers.runAssignmentAlgo;
  beforeEach(() => {
    generateReceivers.runAssignmentAlgo = jest.fn(() => ({}));
  });
  afterEach(() => {
    generateReceivers.runAssignmentAlgo = originalRunAssignmentAlgo;
  });

  test('it appropriately calls runAssignmentAlgo and returns its result when random is false', () => {
    generateReceivers.runAssignmentAlgo.mockReturnValue({ foo: 'bar' });
    // Test.
    expect(
      generateReceivers.generateReceivers({
        random: false,
        participants: ['bar', 'foo'],
        history: 'history',
        blackLists: 'blackLists',
      }),
    ).toEqual({ foo: 'bar' });
    // Check the calls.
    expect(generateReceivers.runAssignmentAlgo.mock.calls).toEqual([
      [['bar', 'foo'], 'history', 'blackLists'],
    ]);
  });

  test('it appropriately calls runAssignmentAlgo and shuffle and returns runAssignmentAlgo results when random is true', () => {
    generateReceivers.runAssignmentAlgo.mockReturnValue({ foo: 'bar' });
    shuffle.mockReturnValue(['mock', 'shuffle']);
    // Test.
    expect(
      generateReceivers.generateReceivers({
        random: true,
        participants: ['bar', 'foo'],
        history: 'history',
        blackLists: 'blackLists',
      }),
    ).toEqual({ foo: 'bar' });
    // Check the calls.
    expect(shuffle.mock.calls).toEqual([[['bar', 'foo']]]);
    expect(generateReceivers.runAssignmentAlgo.mock.calls).toEqual([
      [['mock', 'shuffle'], 'history', 'blackLists'],
    ]);
  });
});
