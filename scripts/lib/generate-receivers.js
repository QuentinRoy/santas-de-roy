const munkres = require('munkres-js');
const shuffle = require('lodash/shuffle');

module.exports.MAX_COST = Number.POSITIVE_INFINITY;

/**
 * Create the matrix of costs for Munkres. Columns are santas and rows
 * are receivers. Cells are the cost of assigning the corresponding santa to
 * the corresponding receiver. The cost of the assignation of a santa with
 * a receiver is the number of times this santa has already been assigned to
 * the corresponding receiver (except if the receiver is in the santa's
 * blackList, in this case it is INFINITY).
 *
 * @private
 * @param {string[]} participants The list of all participants.
 * @param {List.<Object.<string,string>>} pastChristmases An array containing
 * the previous attributions. The keys are the santas and the values who
 * they will give a present to.
 * @param {Object.<string,string[]>} blackLists a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 * @return {Object.<int,int>} The new assignations.
 */
module.exports.createCostMatrix = (participants, pastChristmases, blackLists) =>
  participants.map(santa => {
    const santaBlackList = blackLists[santa] || [];
    return participants.map(receiver => {
      if (receiver === santa || santaBlackList.includes(receiver)) {
        return module.exports.MAX_COST;
      }
      return pastChristmases.reduce(
        (count, assignations) =>
          assignations[santa] === receiver ? count + 1 : count,
        0,
      );
    });
  });

/**
 * Actually perform the santa generation after the options have been processed.
 *
 * @private
 * @param {string[]} participants The list of all participants.
 * @param {List.<Object.<string,string>>} pastChristmases An array containing
 * the previous attributions.
 * @param {Object.<string,string[]>} blackLists a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 * @return {Object.<string,string>} The new assignations.
 */
module.exports.runAssignmentAlgo = (
  participants,
  pastChristmases,
  blackLists,
) => {
  // Use the Munkres algorithm to get the assignation. Because the cost of an
  // an assignation is the number of times this assignation already happened,
  // Munkres will minimize the number of re-assignation.
  const assignations = munkres(
    module.exports.createCostMatrix(participants, pastChristmases, blackLists),
  )
    // Convert the results of munkres to [santa, receiver] entries.
    .map(entry => entry.map(pi => participants[pi]))
    // Transform into a dictionary.
    .reduce(
      (obj, [santa, receiver]) => Object.assign({}, obj, { [santa]: receiver }),
      {},
    );

  return assignations;
};

module.exports.generateReceivers = ({
  random,
  participants,
  history,
  blackLists,
}) => {
  // Randomized (or not) the participants to make the algorithm indeterministic.
  const randomizedParticipants = random ? shuffle(participants) : participants;

  // Generate the assignations.
  const assignations = module.exports.runAssignmentAlgo(
    randomizedParticipants,
    history,
    blackLists,
  );

  // If the participants have been randomized, re-sort them.
  if (random) {
    return participants.reduce(
      (obj, p) => Object.assign({}, obj, { [p]: assignations[p] }),
      {},
    );
  }
  return assignations;
};
