const yaml = require('js-yaml');
const fs = require('fs');
const log = require('loglevel');
const { promisify } = require('util');
const generateSantas = require('../scripts');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

log.setDefaultLevel('info');

const PAST_PATH = 'past.yaml';
const FAMILIES = [
  ['Adrien', 'Antoine', 'Maryvone', 'Hugo', 'Noel-Gilles'],
  ['Louise', 'Sadyo', 'Pierre-Marie', 'Marie-Odile', 'Quentin'],
  ['Valérie', 'Pascal', 'Nathan', 'Marion'],
  ['Christelle', 'Daniel', 'Manon', 'Rémi'],
  ['Thérèse', 'Joseph'],
];

readFile(PAST_PATH)
  .then(data => yaml.safeLoad(data), () => [])
  .then(past => {
    log.info(`${past.length} past christmases found.`);
    log.info(`Calculating new christmas...`);
    const santas = generateSantas({
      pastChristmases: past.map(p => p.santas),
      exclusionGroups: FAMILIES,
    });
    process.stdout.write(yaml.safeDump({ santas }));
    return writeFile(PAST_PATH, yaml.safeDump([...past, { santas }]));
  })
  .catch(e => log.error(e));
