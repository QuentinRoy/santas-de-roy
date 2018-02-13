const munkres = require('munkres-js');
const yaml = require('js-yaml');
const fs = require('fs');
const log = require('loglevel');
const shuffle = require('lodash/shuffle');
const sortBy = require('lodash/sortBy');
const { promisify } = require('util');

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

/**
 * Create blacklists from participants group in families: a participant
 * cannot be the santa of someone in his own family.
 *
 * @param {Array.<string[]>} families participants grouped in families.
 * @return {Object.<string,string[]>} a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 */
const familiesToBlackLists = families =>
  families.reduce(
    (res, family) =>
      Object.assign(
        {},
        res,
        family.reduce(
          (fRes, p) => Object.assign({}, fRes, { [p]: family }),
          {},
        ),
      ),
    {},
  );

/**
 * Generate a new secret Santa attributions based on past attributions and
 * available participants.
 *
 * Make sure that the attributions are as much as possible different from
 * one year to another: e.g. if Bob has already been Anna's Santa in the past,
 * he can only be Anna's Santa again once every other participants also have
 * been Anna's Santa.
 *
 * Also supports black-listing: some participants that may never be the Santa
 * of some others.
 *
 * @param {{}[]} pastChristmas An array containing the previous attributions.
 * @param {string[]} participants The list of all participants.
 * @param {Object.<string,string[]>} blackLists a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 * @return {Object.<string,string>} The new assignations.
 */
const generateSantas = (pastChristmas, participants, blackLists) => {
  const costMatrix = participants.map(santa => {
    const santaBlackList = blackLists[santa] || [];
    return participants.map(receiver => {
      if (receiver === santa || santaBlackList.includes(receiver)) {
        return Number.POSITIVE_INFINITY;
      }
      return pastChristmas.reduce(
        (count, assignations) =>
          assignations[santa] === receiver ? count + 1 : count,
        0,
      );
    });
  });
  // console.log(costMatrix);
  const assignationMatrix = munkres(costMatrix);
  const assignations = assignationMatrix.reduce((res, [santaI, receiverI]) => {
    const santa = participants[santaI];
    const receiver = participants[receiverI];
    return Object.assign({}, res, { [santa]: receiver });
  }, {});
  return assignations;
};

if (require.main === module) {
  readFile(PAST_PATH)
    .then(data => yaml.safeLoad(data), () => [])
    .then(past => {
      log.info(`${past.length} past christmases found.`);
      log.info(`Calculating new christmas...`);
      const participants = FAMILIES.reduce((res, f) => [...res, ...f]);
      const blackLists = familiesToBlackLists(FAMILIES);
      const assignations = generateSantas(
        past.map(p => p.santas),
        // Shuffle the participants to make sure the assignations are random.
        shuffle(participants),
        blackLists,
      );
      // Sort the assignation keys by participants (the keys).
      const sortedChristmas = sortBy(participants).reduce(
        (res, p) => Object.assign({}, res, { [p]: assignations[p] }),
        {},
      );
      process.stdout.write(yaml.safeDump({ santas: sortedChristmas }));
      return writeFile(
        PAST_PATH,
        yaml.safeDump([...past, { santas: sortedChristmas }]),
      );
    })
    .catch(e => log.error(e));
}

module.exports = generateSantas;
