const traverse = require('./traverse');

/**
 * Find the participants that have been the least the Santa of a participant.
 *
 * @param {{}[]} pastSantas An array containing the previous attributions.
 * @param {string[]} potentialSantas The list of potential Santas.
 * @param {string} participant The name of the participant.
 * @return {string[]} The name of the participants that can be the santa of
 * this participant.
 */
const findLeastSantas = (pastSantas, potentialSantas, participant) => {
  // Look up the number of time each other participants have been the santa
  // of participant.
  const santaCounts = potentialSantas.map(potentialSanta => ({
    potentialSanta,
    count: pastSantas.filter(
      attribution => attribution[potentialSanta] === participant,
    ).length,
  }));
  // Return the list of participants who have been the least the santa of
  // participant.
  const minCount = Math.min(...santaCounts.map(c => c.count));
  return santaCounts
    .filter(c => c.count === minCount)
    .map(c => c.potentialSanta);
};

/**
 * Find all the participants that can be the Santa of a participant.
 *
 * @param {Object.<string, string[]>} blackList Maps the id of a participant
 * with the the id of the other participants he should not be the Santa.
 * @param {string[]} participants The id of all participants.
 * @param {string} participant The id of a participant.
 * @return {string[]} Find all participants that can be Santa for this
 * participant.
 */
const findPossibleSantas = (blackList, participants, participant) =>
  participants.filter(
    p =>
      p !== participant &&
      !(blackList[p] && blackList[p].includes(participant)),
  );

/**
 * For all participants, find the participants that have been the least their
 * Santa.
 *
 * @param {{}[]} pastSantas An array containing the previous Santa attributions.
 * @param {Object.<string, string[]>} blackList Maps the id of a participant
 * with the the id of the other participants he should not be the Santa.
 * @param {string[]} participants The id of all participants.
 * @return {Object<string, string[]>} A dictionary mapping each participant's
 * id with a list of the other participants that can be their Santa.
 */
const findLeastSantasForAll = (pastSantas, blackList, participants) =>
  Object.assign(
    ...participants.map(participant => {
      const potentialSantas = findPossibleSantas(
        blackList,
        participants,
        participant,
      );
      return findLeastSantas(pastSantas, potentialSantas, participant);
    }),
  );

/**
 * @param {Object<string, string[]>} participantsLeastSantas A dictionary
 * mapping each participant's id with a list of the other participants that can
 * be their Santa.
 * @return {string[]} The list of all participants sorted by the number of
 * possible Santas they have
 */
const getParticipantsSortedPerSantas = participantsLeastSantas =>
  Object.entries(participantsLeastSantas)
    .sort((e1, e2) => e1[1].length - e2[1].length)
    .map(e => e[0]);

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
 * @param {{}[]} pastSantas An array containing the previous attributions.
 * @param {Object.<string, string[]>} blackList Maps the id of a participant
 * with the the id of the other participants he should not be the Santa.
 * @param {string[]} participants The id of all participants.
 * @return {{}[]} The new attributions
 */
const generateSantas = (pastSantas, blackList, participants) => {
  const participantsSantas = findLeastSantasForAll(
    pastSantas,
    blackList,
    participants,
  );
  // Sort the participants per number of possible Santas. They are the harder
  // to find Santas to so it is better to look at them first in the tree.
  const sortedParticipants = getParticipantsSortedPerSantas(participantsSantas);
  // `traverse` explores an unknown tree to find an acceptable branch.
  // The value of each node will be a Santa whose recipient is the d-th
  // participant of `participants` where d is the depth of the node.
  return traverse({
    // The name of each level of the tree that must find a corresponding value.
    levels: sortedParticipants.length,
    // This function must return the children of the last node of `branch`, that
    // is the possible Santas of the n-th participant with n being the depth
    // of the branch.
    getNodeChildren(node, level, branch) {
      return participantsSantas[level].filter(santa => !branch.includes(santa));
    },
  });
};

module.exports = {
  findLeastSantas,
  findPossibleSantas,
  findLeastSantasForAll,
  generateSantas,
  getParticipantsSortedPerSantas,
};
