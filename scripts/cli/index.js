const yaml = require('js-yaml');
const log = require('loglevel');
const dateFormat = require('dateformat');
const generateReceivers = require('../lib');
const { loadDataFile, writeDataFile } = require('./utils');
const {
  getConfigFromCLIArguments,
  getConfigFromConfigFile,
} = require('./config');

module.exports.doMain = async () => {
  const cliConfig = getConfigFromCLIArguments(process.argv);

  // Set the log level now. By default, the log level follow the quiet
  // argument. However it might be ovewriten so that the process can be
  // monitored without the results being printed out.
  if (cliConfig.logLevel) log.setLevel(cliConfig.logLevel);
  else log.setLevel(cliConfig.quiet ? 'silent' : 'info');

  // Load the configuration file (if any).
  const config =
    (cliConfig.config && (await getConfigFromConfigFile(cliConfig.config))) ||
    null;

  // Parse the configuration.
  const {
    data: dataPath,
    dryRun,
    ignoreHistory,
    quiet,
    exclusionGroups,
    blackLists,
    random,
    id,
    participants,
  } = { ...config, ...cliConfig };

  // Load the history (if available).
  const history = (dataPath && (await loadDataFile(dataPath))) || [];

  if (dataPath) {
    if (ignoreHistory) {
      log.info(`${history.length} past christmases will be ignored.`);
    } else {
      log.info(`${history.length} past christmases found.`);
    }
  }

  // Avoid id duplications in the data file.
  if (id != null && history.some(c => c.id === id)) {
    throw new Error(`Identifier "${id}" already exists in data file.`);
  }

  const receivers = generateReceivers({
    participants,
    history: ignoreHistory ? [] : history.map(c => c.receivers),
    blackLists,
    exclusionGroups,
    random,
  });
  // Only print the results in verbose mode.
  if (!quiet) {
    process.stdout.write(yaml.safeDump({ receivers }));
  }

  if (!dryRun && dataPath) {
    const data = [
      ...history,
      {
        receivers,
        ...(id ? { id } : null),
        date: dateFormat(new Date(), 'isoDateTime'),
      },
    ];
    await writeDataFile(dataPath, data);
    log.info(`New data written in ${dataPath}.`);
  }
};

module.exports.main = () => {
  module.exports
    .doMain()
    .then(() => {
      process.exit(0);
    })
    .catch(e => {
      if (log.getLevel() > log.levels.DEBUG) {
        log.error(`Error: ${e.message}`);
      } else {
        log.debug(e.stack);
      }
      process.exit(-1);
    });
};
