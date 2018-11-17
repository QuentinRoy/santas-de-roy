const munkres = require('munkres-js');
const shuffle = require('lodash/shuffle');
const generateReceivers = require('./generate-receivers');
const { NoSolutionsError } = require('./errors');

jest.mock('munkres-js', () => jest.fn(() => []));
jest.mock('lodash/shuffle', () => jest.fn(() => []));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createCostMatrix', () => {
  test('it creates simple cost mastrix', () => {
    expect(generateReceivers.createCostMatrix([], [], {}, {})).toEqual([]);
    expect(
      generateReceivers.createCostMatrix(['jo', 'anna', 'bob'], [], {}, {}),
    ).toEqual([
      [generateReceivers.MAX_COST, 0, 0],
      [0, generateReceivers.MAX_COST, 0],
      [0, 0, generateReceivers.MAX_COST],
    ]);
  });

  test('it takes into account history, blacklists and modifiers', () => {
    expect(
      generateReceivers.createCostMatrix(
        ['jo', 'anna', 'bob', 'jack'],
        [
          { jo: 'anna', bob: 'jack', jack: 'rob', rob: 'bob' },
          { jo: 'anna', bob: 'anna', anna: 'jack' },
        ],
        { jo: ['jack'], bob: ['jo', 'anna'] },
        { jack: { bob: 0.5, jo: 1.5 }, bob: { anna: 2 }, jo: { anna: 0 } },
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
      [1.5, 0, 0.5, generateReceivers.MAX_COST],
    ]);
  });
});

describe('isImpossible', () => {
  test('returns false if no assignation costs are under MAX_COST', () => {
    expect(
      generateReceivers.isImpossible(
        [
          [1, generateReceivers.MAX_COST, generateReceivers.MAX_COST],
          [0, 0, generateReceivers.MAX_COST],
          [generateReceivers.MAX_COST, generateReceivers.MAX_COST, 1],
        ],
        [[0, 0], [2, 2], [1, 1]],
      ),
    ).toBe(false);
  });
  test('returns true if at least one of the assignation costs is higher or equal to MAX_COST', () => {
    expect(
      generateReceivers.isImpossible(
        [
          [1, generateReceivers.MAX_COST, generateReceivers.MAX_COST],
          [0, 0, generateReceivers.MAX_COST],
          [generateReceivers.MAX_COST, generateReceivers.MAX_COST, 1],
        ],
        [[1, 0], [2, 2], [0, 1]],
      ),
    ).toBe(true);
  });
});

describe('runAssignmentAlgo', () => {
  const originalCreateCostMatrix = generateReceivers.createCostMatrix;
  const originalIsImpossible = generateReceivers.isImpossible;
  beforeEach(() => {
    generateReceivers.createCostMatrix = jest.fn();
    generateReceivers.isImpossible = jest.fn(() => false);
  });
  afterEach(() => {
    generateReceivers.createCostMatrix = originalCreateCostMatrix;
    generateReceivers.isImpossible = originalIsImpossible;
  });

  test('it appropriately calls munkres, createCostMatrix and isImpossible', () => {
    // Set up mocks.
    generateReceivers.createCostMatrix.mockReturnValue('costReturn');
    munkres.mockReturnValue([['munkresReturn']]);
    generateReceivers.isImpossible.mockReturnValue(false);
    // Test.
    generateReceivers.runAssignmentAlgo(
      ['jo', 'bob', 'ana'],
      { mockPast: {} },
      ['foo', 'bar'],
      { mockModif: {} },
    );
    // Check the calls.
    expect(generateReceivers.createCostMatrix.mock.calls).toEqual([
      [
        ['jo', 'bob', 'ana'],
        { mockPast: {} },
        ['foo', 'bar'],
        { mockModif: {} },
      ],
    ]);
    expect(munkres.mock.calls).toEqual([['costReturn']]);
    expect(generateReceivers.isImpossible.mock.calls).toEqual([
      ['costReturn', [['munkresReturn']]],
    ]);
  });
  test('map back munkres results to participants', () => {
    generateReceivers.isImpossible.mockReturnValue(true);
    expect(() => {
      generateReceivers.runAssignmentAlgo(['jo', 'bob', 'ana']);
    }).toThrowError(NoSolutionsError);
  });

  test('throws in case of impossibilities', () => {
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
        history: 'mock-history',
        blackLists: 'mock-blackLists',
        modifiers: 'mock-modifiers',
      }),
    ).toEqual({ foo: 'bar' });
    // Check the calls.
    expect(generateReceivers.runAssignmentAlgo.mock.calls).toEqual([
      [['bar', 'foo'], 'mock-history', 'mock-blackLists', 'mock-modifiers'],
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
        history: 'mock-history',
        blackLists: 'mock-blackLists',
        modifiers: 'mock-modifiers',
      }),
    ).toEqual({ foo: 'bar' });
    // Check the calls.
    expect(shuffle.mock.calls).toEqual([[['bar', 'foo']]]);
    expect(generateReceivers.runAssignmentAlgo.mock.calls).toEqual([
      [
        ['mock', 'shuffle'],
        'mock-history',
        'mock-blackLists',
        'mock-modifiers',
      ],
    ]);
  });
});
