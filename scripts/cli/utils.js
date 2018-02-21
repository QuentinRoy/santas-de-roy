const fs = require('fs');
const yaml = require('js-yaml');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports.getDataType = filePath => {
  if (filePath.endsWith('.json')) {
    return 'json';
  }
  if (/\.ya?ml$/.test(filePath)) {
    return 'yaml';
  }
  return undefined;
};

module.exports.loadDataFile = async dataPath => {
  let parse;
  switch (module.exports.getDataType(dataPath)) {
    case 'json':
      parse = JSON.parse.bind(JSON); // eslint-disable-line
      break;
    case 'yaml':
      parse = yaml.safeLoad.bind(yaml);
      break;
    default:
      throw new Error(
        `${dataPath}: unsupported format. Format must be json or yaml.`,
      );
  }
  return readFile(dataPath).then(
    // Parse the file.
    parse,
    // If the file could not be read, return undefined.
    () => undefined,
  );
};

module.exports.writeDataFile = async (dataPath, data) => {
  let serialize;
  switch (module.exports.getDataType(dataPath)) {
    case 'json':
      serialize = data => JSON.stringify(data, null, 2); // eslint-disable-line
      break;
    case 'yaml':
      serialize = yaml.safeDump.bind(yaml);
      break;
    default:
      throw new Error(
        `${dataPath}: unsupported format. Format must be json or yaml.`,
      );
  }
  return writeFile(dataPath, serialize(data));
};
