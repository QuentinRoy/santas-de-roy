const path = require('path');
const {
  getConfigFromCLIArguments,
  getConfigFromConfigFile,
} = require('./config');
const { version } = require('../../package.json');
const { loadDataFile } = require('./utils.js');

jest.mock('./utils.js');

beforeEach(() => {
  jest.resetAllMocks();
});

describe('getConfigFromCLIArguments', () => {
  test('fetch the config from the command line arguments', () => {
    expect(
      getConfigFromCLIArguments(['', '', '--quiet', '--no-random', 'a', 'b']),
    ).toEqual({
      participants: ['a', 'b'],
      random: false,
      quiet: true,
      version,
    });
  });

  test.skip('throws if there is invalid arguments', () => {
    expect(() =>
      getConfigFromCLIArguments(['', '', '--invalid', '--no-random', 'a', 'b']),
    ).toThrow();
  });
});

describe('getConfigFromConfigFile', () => {
  test('throws if the file cannot be loaded', () => {
    loadDataFile.mockImplementation(() => null);
    expect(getConfigFromConfigFile('./do-not-exist.json')).rejects.toThrow(
      'Cannot read config file ./do-not-exist.json',
    );
  });

  test('throws if the config contains invalid values', () => {
    loadDataFile.mockImplementation(() => ({
      invalidOpt: 'unknown property',
    }));

    expect(getConfigFromConfigFile('./config.yaml')).rejects.toThrow(
      'Unknown options found in config file ./config.yaml: invalidOpt',
    );
  });

  test("returns the file's data if conform", () => {
    loadDataFile.mockImplementation(() => ({
      ignoreHistory: true,
      participants: ['jo', 'bar'],
    }));

    expect(getConfigFromConfigFile('./config.yaml')).resolves.toEqual({
      ignoreHistory: true,
      participants: ['jo', 'bar'],
    });
  });

  test('resolves data path relatively to the config file', () => {
    loadDataFile.mockImplementation(() => ({
      data: '../history.json',
    }));

    expect(
      getConfigFromConfigFile('./path/to/config/config.yaml'),
    ).resolves.toEqual({
      data: path.resolve('./path/to/history.json'),
    });
  });

  test('do not change absolute data path', () => {
    loadDataFile.mockImplementation(() => ({
      data: '/tmp/history.json',
    }));

    expect(
      getConfigFromConfigFile('./path/to/config/config.yaml'),
    ).resolves.toEqual({
      data: '/tmp/history.json',
    });
  });
});
