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
 * @param {Object.<string, string[]>} blackList Maps the id of a participant
 * with the the id of the other participants he should not be the Santa.
 * @param {string[]} participants The id of all participants.
 * @param {string} participant The id of a participant.
 * @return {string[]} Find all participants that can be Santa for this
 * participant.
 */
const findPotentialSantas = (blackList, participants, participant) =>
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
      const potentialSantas = findPotentialSantas(
        blackList,
        participants,
        participant,
      );
      return findLeastSantas(pastSantas, potentialSantas, participant);
    }),
  );

/**
 * Find one of the participants with the least possible Santas.
 *
 * @param {Object<string, string[]>} participantSantas The possible Santas of
 * each participants.
 * @return {string} The id of the first participant found with the least
 * Santas.
 */
const findFirstParticipantWithLeastSantas = participantSantas =>
  Object.entries(participantSantas).reduce(
    (current, [participant, santas]) =>
      !current || santas.length < current.min
        ? { min: santas.length, participant }
        : current,
    null,
  ).participant;

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
  throw new Error('Not yet implemented');
};

module.exports = {
  findLeastSantas,
  findPotentialSantas,
  findLeastSantasForAll,
  generateSantas,
  findFirstParticipantWithLeastSantas,
};
