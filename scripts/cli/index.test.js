const { doMain } = require('./index');
const {
  getConfigFromCLIArguments,
  getConfigFromConfigFile,
} = require('./config');
const { loadDataFile, writeDataFile } = require('./utils');
const dateFormat = require('dateformat');
const generateSantas = require('../lib');

jest.mock('js-yaml');
jest.mock('loglevel');
jest.mock('../lib');
jest.mock('dateformat');
jest.mock('./utils');
jest.mock('./config');

describe('doMain', () => {
  const processArgv = process.argv;
  const stdOutWrite = process.stdout.write;
  afterEach(() => {
    process.argv = processArgv;
    process.stdout.write = stdOutWrite;
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    process.stdout.write = jest.fn();
    process.argv = ['arg1', 'arg2'];
  });

  test('merges cli arguments and config file for generateSantas options', async () => {
    getConfigFromCLIArguments.mockImplementation(() => ({
      config: 'conf',
      participants: 'participants',
      random: 'random',
      toBe: 'ignored',
    }));
    getConfigFromConfigFile.mockImplementation(() => ({
      toBe: 'ignored too',
      blackLists: 'blackLists',
      exclusionGroups: 'exclusionGroups',
      data: 'dataPath',
    }));
    generateSantas.mockImplementation(() => 'santas');
    loadDataFile.mockImplementation(() => [{ santas: 'history' }]);
    dateFormat.mockImplementation(() => 'dateformat');

    await doMain();

    expect(getConfigFromCLIArguments.mock.calls).toEqual([
      [
        ['arg1', 'arg2'], // mock process.argv.
      ],
    ]);
    expect(getConfigFromConfigFile.mock.calls).toEqual([
      ['conf'], // config returned by getConfigFromCLIArguments.
    ]);
    expect(generateSantas.mock.calls).toEqual([
      [
        {
          blackLists: 'blackLists',
          exclusionGroups: 'exclusionGroups',
          history: ['history'],
          participants: 'participants',
          random: 'random',
        },
      ],
    ]);
    expect(writeDataFile.mock.calls).toEqual([
      [
        'dataPath',
        [{ santas: 'history' }, { santas: 'santas', date: 'dateformat' }],
      ],
    ]);
  });
});
