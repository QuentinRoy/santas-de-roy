const fs = require('fs');
const yaml = require('js-yaml');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

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
  let textData;
  try {
    textData = await readFile(dataPath);
  } catch (e) {
    return undefined;
  }
  switch (module.exports.getDataType(dataPath)) {
    case 'json':
      return JSON.parse(textData);
    case 'yaml':
      return yaml.safeLoad(textData);
    default:
      throw new Error(
        `${dataPath}: unsupported format. Format must be json or yaml.`,
      );
  }
};
