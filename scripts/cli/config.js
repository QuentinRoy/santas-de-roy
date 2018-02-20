const path = require('path');
const pickBy = require('lodash/pickBy');
const { Command } = require('commander');
const { version } = require('../../package.json');
const { loadDataFile } = require('./utils.js');

const CLI_OPTIONS = [
  'dryRun',
  'data',
  'ignoreHistory',
  'quiet',
  'random',
  'id',
  'logLevel',
];
const CONFIG_FILE_OPTIONS = [
  ...CLI_OPTIONS.filter(o => o !== 'logLevel'),
  'exclusionGroups',
  'blackLists',
  'participants',
];

module.exports.getConfigFromConfigFile = async configPath => {
  // Load the configuration file (if any).
  const config = await loadDataFile(configPath);
  if (!config) {
    throw new Error(`Cannot read config file ${configPath}`);
  }
  // Check the config file options.
  Object.keys(config).forEach(k => {
    if (!CONFIG_FILE_OPTIONS.includes(k))
      throw new Error(
        `Unknown options found in config file ${configPath}: ${k}`,
      );
  });
  if (config.data) {
    config.data = path.resolve(path.dirname(configPath), config.data);
  }
  return config;
};

module.exports.getConfigFromCLIArguments = argv => {
  const program = new Command();
  program
    .version(version)
    .usage('[options] [participants ...]')
    .description(
      'An application to assign secret santas, optionally taking history into account.',
    )
    .option('-c, --config [path]', 'set config path (json or yaml)')
    .option(
      '-d, --data [path]',
      'set the history path (to be loaded and written, json or yaml)',
    )
    .option('-d, --dry-run', 'do not write in the history file')
    .option(
      '--ignore-history',
      'ignore the history when computing the new assignations',
    )
    .option(
      '--log-level [level]',
      'set the log level',
      /^(trace|debug|info|warn|error|silent)$/i,
    )
    .option('--no-random', 'do not randomize the assignations')
    .option('-q, --quiet', 'do not output results')
    .option(
      '-i, --id [id]',
      'give an identifier for this christmas to write in the data',
    )
    .parse(argv);

  return Object.assign(
    {},
    pickBy(program.opts(), val => val !== undefined),
    program.args && program.args.length > 0
      ? {
          participants: program.args,
        }
      : undefined,
  );
};
