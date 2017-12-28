const yaml = require('js-yaml');
const fs = require('fs');
const { promisify } = require('util');
const log = require('loglevel');
const { generateSantas } = require('./modules/santas');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
log.setDefaultLevel('debug');

const PAST_PATH = 'past.yaml';

const families = [
  ['Adrien', 'Antoine', 'Maryvone', 'Hugo', 'Noel-Gilles'],
  ['Louise', 'Sadyo', 'Pierre-Marie', 'Marie-Odile', 'Quentin'],
  ['Valérie', 'Pascal', 'Nathan', 'Marion'],
  ['Christelle', 'Daniel', 'Manon', 'Rémi'],
  ['Thérèse', 'Joseph'],
];

const main = () =>
  readFile(PAST_PATH)
    .then(data => yaml.safeLoad(data), () => [])
    .then(past => {
      log.info(`${past.length} past christmases found.`);
      log.info(`Calculating new christmas...`);
      const start = Date.now();
      const christmas = Object.assign(
        generateSantas(past.map(p => p.santas), families),
        { duration: Date.now() - start },
      );
      process.stdout.write(yaml.safeDump(christmas));
      return writeFile(PAST_PATH, yaml.safeDump([...past, christmas]));
    });

main().catch(e => log.error(e));
