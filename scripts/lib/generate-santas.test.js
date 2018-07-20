const munkres = require('munkres-js');
const shuffle = require('lodash/shuffle');
const genSantas = require('./generate-santas');

jest.mock('munkres-js', () => jest.fn(() => []));
jest.mock('lodash/shuffle', () => jest.fn(() => []));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createCostMatrix', () => {
  test('it creates simple cost mastrix', () => {
    expect(genSantas.createCostMatrix([], [], {})).toEqual([]);
    expect(genSantas.createCostMatrix(['jo', 'anna', 'bob'], [], {})).toEqual([
      [genSantas.MAX_COST, 0, 0],
      [0, genSantas.MAX_COST, 0],
      [0, 0, genSantas.MAX_COST],
    ]);
  });

  test('it takes into account history and blacklists', () => {
    expect(
      genSantas.createCostMatrix(
        ['jo', 'anna', 'bob', 'jack'],
        [
          { jo: 'anna', bob: 'jack', jack: 'rob', rob: 'bob' },
          { jo: 'anna', bob: 'anna', anna: 'jack' },
        ],
        { jo: ['jack'], bob: ['jo', 'anna'] },
      ),
    ).toEqual([
      [genSantas.MAX_COST, 2, 0, genSantas.MAX_COST],
      [0, genSantas.MAX_COST, 0, 1],
      [genSantas.MAX_COST, genSantas.MAX_COST, genSantas.MAX_COST, 1],
      [0, 0, 0, genSantas.MAX_COST],
    ]);
  });
});

describe('runAssignmentAlgo', () => {
  const originalCreateCostMatrix = genSantas.createCostMatrix;
  beforeEach(() => {
    genSantas.createCostMatrix = jest.fn();
  });
  afterEach(() => {
    genSantas.createCostMatrix = originalCreateCostMatrix;
  });

  test('it appropriately calls munkres and createCostMatrix', () => {
    // Set up mocks.
    genSantas.createCostMatrix.mockReturnValue('costReturn');
    // Test.
    genSantas.runAssignmentAlgo(['jo', 'bob', 'ana'], { args: 'test' }, [
      'foo',
      'bar',
    ]);
    // Check the calls.
    expect(genSantas.createCostMatrix.mock.calls).toEqual([
      [['jo', 'bob', 'ana'], { args: 'test' }, ['foo', 'bar']],
    ]);
    expect(munkres.mock.calls).toEqual([['costReturn']]);
  });

  test('map back munkres results to participants', () => {
    munkres.mockReturnValue([[0, 2], [1, 0], [2, 1]]);
    expect(genSantas.runAssignmentAlgo(['jo', 'bob', 'ana'])).toEqual({
      jo: 'ana',
      bob: 'jo',
      ana: 'bob',
    });
  });
});

describe('generateSantas', () => {
  const originalRunAssignmentAlgo = genSantas.runAssignmentAlgo;
  beforeEach(() => {
    genSantas.runAssignmentAlgo = jest.fn(() => ({}));
  });
  afterEach(() => {
    genSantas.runAssignmentAlgo = originalRunAssignmentAlgo;
  });

  test('it appropriately calls runAssignmentAlgo and returns its result when random is false', () => {
    genSantas.runAssignmentAlgo.mockReturnValue({ foo: 'bar' });
    // Test.
    expect(
      genSantas.generateSantas({
        random: false,
        participants: ['bar', 'foo'],
        history: 'history',
        blackLists: 'blackLists',
      }),
    ).toEqual({ foo: 'bar' });
    // Check the calls.
    expect(genSantas.runAssignmentAlgo.mock.calls).toEqual([
      [['bar', 'foo'], 'history', 'blackLists'],
    ]);
  });

  test('it appropriately calls runAssignmentAlgo and shuffle and returns runAssignmentAlgo results when random is true', () => {
    genSantas.runAssignmentAlgo.mockReturnValue({ foo: 'bar' });
    shuffle.mockReturnValue(['mock', 'shuffle']);
    // Test.
    expect(
      genSantas.generateSantas({
        random: true,
        participants: ['bar', 'foo'],
        history: 'history',
        blackLists: 'blackLists',
      }),
    ).toEqual({ foo: 'bar' });
    // Check the calls.
    expect(shuffle.mock.calls).toEqual([[['bar', 'foo']]]);
    expect(genSantas.runAssignmentAlgo.mock.calls).toEqual([
      [['mock', 'shuffle'], 'history', 'blackLists'],
    ]);
  });
});
