const yaml = require('js-yaml');
const fs = require('fs');
const log = require('loglevel');
const { promisify } = require('util');
const generateSantas = require('../scripts');
const { version } = require('../package.json');
const program = require('commander');
const dateFormat = require('dateformat');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Set up and parse command line arguments.
program
  .version(version)
  .usage('[options] [participants ...]')
  .description(
    'An application to assign secret santas, optionally taking history into account.',
  )
  .option('-c, --config [path]', 'set config path (json or yaml)')
  .option(
    '-d, --data <path>',
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
  .parse(process.argv);

const getDataType = filePath => {
  if (filePath.endsWith('.json')) {
    return 'json';
  }
  if (/\.ya?ml$/.test(filePath)) {
    return 'yaml';
  }
  return undefined;
};

const loadDataFile = async dataPath => {
  let textData;
  try {
    textData = await readFile(dataPath);
  } catch (e) {
    return undefined;
  }
  switch (getDataType(dataPath)) {
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
  ...CLI_OPTIONS.filter(o => o !== 'data' && o !== 'logLevel'),
  'exclusionGroups',
  'blackLists',
  'participants',
];

const getConfigFromConfigFile = async configPath => {
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
  return config;
};

const getConfigFromCLIArguments = () => ({
  ...program.opts(),
  participants:
    program.args && program.args.length > 0 ? program.args : undefined,
});

const doesIdExistInHistory = (id, history) => history.some(c => c.id === id);

const main = async () => {
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

  if (!dataPath && !dryRun) {
    log.warn(
      'Warning: file to read history and write the results is not provided. Use -d to provide a data path or --dry-run to disable this warning and run in dry-run mode.',
    );
  }

  // Load the history (if available).
  const history = (dataPath && (await loadDataFile(dataPath))) || [];

  if (ignoreHistory) {
    log.info(`${history.length} past christmases will be ignored.`);
  } else {
    log.info(`${history.length} past christmases found.`);
  }

  // Avoid id duplications in the data file.
  if (id != null && doesIdExistInHistory(id, history)) {
    throw new Error(`Identifier "${id}" already exists in data file.`);
  }

  const santas = generateSantas({
    participants,
    history: ignoreHistory ? [] : history.map(c => c.santas),
    blackLists,
    exclusionGroups,
    random,
  });

  // Only print the results in verbose mode.
  if (!quiet) {
    process.stdout.write(yaml.safeDump({ santas }));
  }

  if (!dryRun && dataPath) {
    const data = [
      ...history,
      {
        santas,
        ...(id ? { id } : null),
        date: dateFormat(new Date(), 'isoDateTime'),
      },
    ];
    if (getDataType(dataPath) === 'json') {
      await writeFile(dataPath, JSON.stringify(data, null, 2));
    } else {
      await writeFile(dataPath, yaml.safeDump(data));
    }
  }

  log.info(`New data written in ${dataPath}.`);
};

main()
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
