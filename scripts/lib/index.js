const deepMerge = require('deepmerge');
const uniq = require('lodash/uniq');
const { generateSantas } = require('./generate-santas');
const { exclusionGroupsToBlacklists } = require('./utils');

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
 * @param {List.<Object.<string,string>>} [options.history] An array
 * containing the previous attributions (dictionaries whose keys are the
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
const santasDeRoy = options => {
  const {
    history = [],
    blackLists: initBlackList = {},
    exclusionGroups = [],
    participants = uniq([
      ...exclusionGroups.reduce((all, g) => [...all, ...g], []),
      ...Object.keys(initBlackList),
    ]),
    random = true,
  } =
    Array.isArray(options) || options == null
      ? { participants: options }
      : options;

  // Check if there is participants.
  if (!participants || participants.length <= 0) {
    throw new Error('No participants specified.');
  }

  // Convert exclusion groups to blacklists and merge them with the blacklists.
  const blackLists = deepMerge(
    exclusionGroupsToBlacklists(exclusionGroups),
    initBlackList,
  );

  return generateSantas({ random, participants, history, blackLists });
};

module.exports = santasDeRoy;
