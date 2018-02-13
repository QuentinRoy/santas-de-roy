const shuffle = require('lodash/shuffle');
const munkres = require('munkres-js');
const deepMerge = require('deepmerge');

/**
 * Create blacklists from exclusion groups: a participant cannot be the santa of
 * someone who is in his exclusion group.
 *
 * @param {Array.<string[]>} exclusionGroups exclusion groups of participants.
 * @return {Object.<string,string[]>} a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 */
const exclusionGroupsToBlackLists = exclusionGroups =>
  exclusionGroups.reduce(
    (res, group) =>
      Object.assign(
        {},
        res,
        group.reduce((fRes, p) => Object.assign({}, fRes, { [p]: group }), {}),
      ),
    {},
  );

/**
 * Actually perform the santa generation after the options have been processed.
 *
 * @param {string[]} participants The list of all participants.
 * @param {{}[]} pastChristmases An array containing the previous attributions.
 * @param {Object.<string,string[]>} blackLists a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 * @return {Object.<string,string>} The new assignations.
 */
const generateSantas = (participants, pastChristmases, blackLists) => {
  // Create the matrix of costs for Munkres. Columns are santas and rows
  // are receivers. Cells are the cost of assigning the corresponding santa to
  // the corresponding receiver. The cost of the assignation of a santa with
  // a receiver is the number of times this santa has already been assigned to
  // the corresponding receiver (except if the receiver is in the santa's
  // blackList, in this case it is INFINITY).
  const costMatrix = participants.map(santa => {
    const santaBlackList = blackLists[santa] || [];
    return participants.map(receiver => {
      if (receiver === santa || santaBlackList.includes(receiver)) {
        return Number.POSITIVE_INFINITY;
      }
      return pastChristmases.reduce(
        (count, assignations) =>
          assignations[santa] === receiver ? count + 1 : count,
        0,
      );
    });
  });
  // Use the Munkres algorithm to get the assignation. Because the cost of an
  // an assignation is the number of times this assignation already happened,
  // Munkres will minimize the number of re-assignation.
  const assignations = munkres(costMatrix)
    // Convert the results of munkres to [santa, receiver] entries.
    .map(entry => entry.map(pi => participants[pi]))
    // Transform into a dictionary.
    .reduce(
      (obj, [santa, receiver]) => Object.assign({}, obj, { [santa]: receiver }),
      {},
    );

  return assignations;
};

/**
 * Generate a new secret Santa attributions based on past attributions and
 * available participants.
 *
 * Make sure that the attributions are as much as possible different from
 * one year to another: e.g. if Bob has already been Anna's Santa in the past,
 * he can only be Anna's Santa again once every other participants also have
 * been Anna's Santa.
 *
 * Also supports black-listing: some participants that cannot be the Santa
 * of some others.
 *
 * @param {Object|string[]} options - Options for the generation. Alternatively,
 * an array of participants can be directly provided.
 * @param {string[]} [options.participants] The list of all participants.
 * If omitted, then the participants appearing in exclusionGroups and
 * as a blackLists key will be used.
 * @param {Object.<string,string>[]} [options.pastChristmases] An array
 * containing the previous attributions (dictionnaries whose keys are the
 * santas, and values their receiver).
 * @param {Object.<string,string[]>} [options.blackLists] A dictionary whose
 * keys are participants and values a list of participants they cannot be the
 * santa of.
 * @param {Array.<string[]>} [options.exclusionGroups] Exclusion groups of
 * participants. A participant cannot be the santa of someone who is in his
 * exclusion group.
 * @param {boolean} [options.randomize=true] If true (default), randomizes
 * the assignation algorithm. Makes the output non deterministic.
 * @return {Object.<string,string>} The new assignations.
 */
module.exports = options => {
  // Parse the options.
  const {
    pastChristmases = [],
    blackLists: initBlackList = {},
    exclusionGroups = [],
    participants = [
      ...exclusionGroups.reduce((all, g) => [...all, ...g]),
      ...Object.keys(initBlackList),
    ],
    randomize = true,
  } = Array.isArray(options) ? { participants: options } : options;

  const blackLists = deepMerge(
    exclusionGroupsToBlackLists(exclusionGroups),
    initBlackList,
  );

  const randomizedParticipants = randomize
    ? shuffle(participants)
    : participants;
  const assignations = generateSantas(
    randomizedParticipants,
    pastChristmases,
    blackLists,
  );
  if (!randomize) return assignations;
  // If the participants have been randomized, re-sort them.
  return participants.reduce(
    (obj, p) => Object.assign({}, obj, { [p]: assignations[p] }),
    {},
  );
};
