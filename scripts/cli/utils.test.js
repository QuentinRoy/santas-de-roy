const fs = require('fs');
const yaml = require('js-yaml');
const utils = require('./utils');

jest.mock('fs');
jest.mock('js-yaml');

test('getDataType', () => {
  expect(utils.getDataType('path/data.yml')).toBe('yaml');
  expect(utils.getDataType('path/data.yaml')).toBe('yaml');
  expect(utils.getDataType('path/data.json')).toBe('json');
  expect(utils.getDataType('path/data.stuff')).toBe(undefined);
});

describe('loadDataFile', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  test('return undefined if the file cannot be read', async () => {
    fs.readFile.mockImplementation((_, callback) => {
      callback(new Error());
    });
    expect(await utils.loadDataFile('test-file.json')).toBe(undefined);
    expect(fs.readFile.mock.calls[0][0]).toBe('test-file.json');
    expect(fs.readFile.mock.calls.length).toBe(1);
  });

  test('parse the file as JSON if getDataType returns json', async () => {
    jest.spyOn(utils, 'getDataType').mockImplementation(() => 'json');
    fs.readFile.mockImplementation((_, callback) => {
      callback(null, 'data1');
    });
    jest.spyOn(JSON, 'parse').mockImplementation(() => ({ prop1: 'val1' }));

    expect(await utils.loadDataFile('test-file1')).toEqual({ prop1: 'val1' });
    expect(utils.getDataType.mock.calls).toEqual([['test-file1']]);
    expect(JSON.parse.mock.calls).toEqual([['data1']]);
  });

  test('parse the file as YAML if getDataType returns yaml', async () => {
    jest.spyOn(utils, 'getDataType').mockImplementation(() => 'yaml');
    fs.readFile.mockImplementation((_, callback) => {
      callback(null, 'data2');
    });
    jest.spyOn(yaml, 'safeLoad').mockImplementation(() => ({ prop2: 'val2' }));

    expect(await utils.loadDataFile('test-file2')).toEqual({ prop2: 'val2' });
    expect(utils.getDataType.mock.calls).toEqual([['test-file2']]);
    expect(yaml.safeLoad.mock.calls).toEqual([['data2']]);
  });

  test('throws if getDataType returns neither yaml nor json', async () => {
    jest.spyOn(utils, 'getDataType').mockImplementation(() => 'foo');

    await expect(utils.loadDataFile('test-file3')).rejects.toThrow(
      'test-file3: unsupported format. Format must be json or yaml.',
    );
    expect(utils.getDataType.mock.calls).toEqual([['test-file3']]);
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});

describe('writeDataFile', () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  test('throws if the file cannot be writtem', async () => {
    jest.spyOn(utils, 'getDataType').mockImplementation(() => 'json');
    fs.writeFile.mockImplementation((_, callback) => {
      callback(null, 'data1');
    });
    jest.spyOn(JSON, 'stringify').mockImplementation(() => 'serializedData');
    expect(utils.writeDataFile('test-file.json', 'data')).rejects.toThrow();
  });

  test('serialize the data as JSON if getDataType returns json', async () => {
    jest.spyOn(utils, 'getDataType').mockImplementation(() => 'json');
    jest.spyOn(JSON, 'stringify').mockImplementation(() => 'serializedData1');
    fs.writeFile.mockImplementation((_1, _2, callback) => {
      callback(null, true);
    });

    await utils.writeDataFile('test-file1', 'data1');
    expect(utils.getDataType.mock.calls).toEqual([['test-file1']]);
    expect(JSON.stringify.mock.calls).toEqual([['data1', null, 2]]);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile.mock.calls[0].slice(0, 2)).toEqual([
      'test-file1',
      'serializedData1',
    ]);
  });

  test('serialize the data as YAML if getDataType returns yaml', async () => {
    jest.spyOn(utils, 'getDataType').mockImplementation(() => 'yaml');
    jest.spyOn(yaml, 'safeDump').mockImplementation(() => 'serializedData2');
    fs.writeFile.mockImplementation((_1, _2, callback) => {
      callback(null, true);
    });

    await utils.writeDataFile('test-file2', 'data2');
    expect(utils.getDataType.mock.calls).toEqual([['test-file2']]);
    expect(yaml.safeDump.mock.calls).toEqual([['data2']]);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile.mock.calls[0].slice(0, 2)).toEqual([
      'test-file2',
      'serializedData2',
    ]);
  });

  test('throws if getDataType returns neither yaml nor json', async () => {
    jest.spyOn(utils, 'getDataType').mockImplementation(() => 'foo');

    await expect(utils.writeDataFile('test-file3', 'bar')).rejects.toThrow(
      'test-file3: unsupported format. Format must be json or yaml.',
    );
    expect(utils.getDataType.mock.calls).toEqual([['test-file3']]);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});
