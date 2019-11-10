const munkres = require('munkres-js');
const shuffle = require('lodash/shuffle');
const { NoSolutionsError } = require('./errors');

// Do not use positive infinity as it makes munkres freeze in case of
// impossibilities.
module.exports.MAX_COST = Number.MAX_VALUE;

/**
 * Create the matrix of costs for Munkres. Columns (outer list) are santas and
 * rows (inner lists) are receivers. Cells are the cost of assigning the
 * corresponding santa to the corresponding receiver. The cost of the
 * assignation of a santa with a receiver is the number of times this santa has
 * already been assigned to the corresponding receiver (except if the receiver
 * is in the santa's blackList, in this case it is MAX_COST).
 *
 * @private
 * @param {string[]} participants The list of all participants.
 * @param {List.<Object.<string,string|List.<string>>>} pastChristmases An array
 * containing the previous attributions. The keys are the santas and the values
 * who they gave a present to.
 * @param {Object.<string,string[]>} blackLists a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 * @param {Object.<Object.<string,number>>} modifiers A dictionary of receiver
 * assignation costs. Each key is a participant. Each values is a dictionary
 * whose keys are potential receivers, and value a > 0 modifier to add to the
 * assignation cost.
 * @return {Object.<int,int>} The cost matrix.
 */
module.exports.createCostMatrix = (
  participants,
  pastChristmases,
  blackLists,
  modifiers,
) =>
  participants.map(santa => {
    const santaBlackList = blackLists[santa] || [];
    const santaModifiers = modifiers[santa] || {};
    return participants.map(receiver => {
      if (receiver === santa || santaBlackList.includes(receiver)) {
        return module.exports.MAX_COST;
      }
      const modifier = santaModifiers[receiver] || 0;
      return pastChristmases.reduce((count, assignations) => {
        const receivers = assignations[santa];
        if (
          receivers == null ||
          ((!Array.isArray(receivers) || !receivers.includes(receiver)) &&
            receivers !== receiver)
        ) {
          return count;
        }
        return count + 1;
      }, modifier);
    });
  });

module.exports.isImpossible = (costMatrix, munkresResult) =>
  munkresResult.some(
    ([santaI, receiverI]) =>
      costMatrix[santaI][receiverI] >= module.exports.MAX_COST,
  );

/**
 * Actually perform the santa generation after the options have been processed.
 *
 * @private
 * @param {string[]} participants The list of all participants.
 * @param {List.<Object.<string,string|List.<string>>>} pastChristmases An array
 * containing the previous attributions.
 * @param {Object.<string,string[]>} blackLists a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 * @param {Object.<Object.<string,number>>} modifiers A dictionary of receiver
 * assignation costs. Each key is a participant. Each values is a dictionary
 * whose keys are potential receivers, and value a > 0 modifier to add to the
 * assignation cost.
 * @return {Object.<string,string>} The new assignations.
 */
module.exports.runAssignmentAlgo = (
  participants,
  pastChristmases,
  blackLists,
  modifiers,
) => {
  const costMatrix = module.exports.createCostMatrix(
    participants,
    pastChristmases,
    blackLists,
    modifiers,
  );

  // Use the Munkres algorithm to get the assignation. Because the cost of an
  // an assignation is the number of times this assignation already happened,
  // Munkres will minimize the number of re-assignation.
  const munkresResult = munkres(costMatrix);

  // Make sure we did not reach a cost of MAX_COST. If this is the case, one of
  // the forbidden assignations have been made, and there is no other solutions.
  if (module.exports.isImpossible(costMatrix, munkresResult)) {
    throw new NoSolutionsError('could not find a solution');
  }

  // Convert the results of munkres to [santa, receiver] entries.
  const assignations = munkresResult
    .map(entry => entry.map(pi => participants[pi]))
    // Transform into a dictionary.
    .reduce((obj, [santa, receiver]) => ({ ...obj, [santa]: receiver }), {});

  return assignations;
};

module.exports.generateReceivers = ({
  random,
  participants,
  history: pastChristmases,
  blackLists,
  modifiers,
}) => {
  // Randomized (or not) the participants to make the algorithm indeterministic.
  const randomizedParticipants = random ? shuffle(participants) : participants;

  // Generate the assignations.
  const assignations = module.exports.runAssignmentAlgo(
    randomizedParticipants,
    pastChristmases,
    blackLists,
    modifiers,
  );

  // If the participants have been randomized, re-sort them.
  if (random) {
    return participants.reduce(
      (obj, p) => ({ ...obj, [p]: assignations[p] }),
      {},
    );
  }
  return assignations;
};
