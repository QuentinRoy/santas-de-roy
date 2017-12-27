const traverse = require('./traverse');
const shuffle = require('lodash/shuffle');

/**
 * @param {{}[]} pastChristmas An array containing the previous Santa
 * attributions.
 * @param {string} santa A participant id.
 * @param {string} receiver An other participant id.
 * @return {number} The number of time santa has been the santa of receiver
 * in the past.
 */
const getSantaReceiverMappingCount = (pastChristmas, santa, receiver) =>
  pastChristmas.reduce(
    (sum, christmas) => sum + (christmas[santa] === receiver ? 1 : 0),
    0,
  );

/**
 * @param {{}[]} pastChristmas An array containing the previous Santa
 * attributions.
 * @param {string[]} possibleReceivers The id of all participants that `santa`
 * can be a Santa of.
 * @param {string} santa The santa to attribute.
 * @return {{cost:number, receiver:string, count:count}[]} The mapping
 */
const getSantaMappings = (pastChristmas, possibleReceivers, santa) => {
  const santaReceiverMappingCounts = possibleReceivers.map(receiver =>
    getSantaReceiverMappingCount(pastChristmas, santa, receiver),
  );
  return Object.assign(
    ...possibleReceivers.map((receiver, i) => ({
      [receiver]: santaReceiverMappingCounts[i],
    })),
  );
};

/**
 * Finds the participants a potential santa can be the santa of.
 *
 * @param {Array.<string[]|string>} families The list of all participants sorted
 * by families
 * @param {string} santa The id of a participant to be a santa.
 * @return {string[]} The participants this santa can be the santa of.
 */
const findPotentialReceivers = (families, santa) =>
  families.reduce((result, family) => {
    const familyArray = Array.isArray(family) ? family : [family];
    // If this participant is part of the family, he/she cannot be the santa
    // of anyone in this family.
    return familyArray.includes(santa) ? result : [...result, ...familyArray];
  }, []);

const getRemainingReceivers = (participants, parentBranch) =>
  participants.filter(p => !parentBranch.find(n => n.receiver === p));

const getRemainingSantas = (participants, parentBranch) =>
  participants.slice(parentBranch.length);

const getSubBranchOptimalCost = (
  participants,
  allSantaMappings,
  parentBranch,
) => {
  const remainingReceivers = getRemainingReceivers(participants, parentBranch);
  const remainingSantas = getRemainingSantas(participants, parentBranch);
  return remainingSantas.reduce((acc, santa) => {
    const santaMappings = allSantaMappings[santa];
    return (
      acc +
      Math.min(
        ...remainingReceivers.map(
          r =>
            santaMappings[r] == null
              ? Number.POSITIVE_INFINITY
              : santaMappings[r],
        ),
      )
    );
  }, 0);
};

const getTraverseNodeChildren = (participants, allSantaMappings, parents) => {
  // Case all santas have a receiver -> the branch is done -> return [].
  if (parents.length === participants.length) {
    return [];
  }
  // Fetch the santa corresponding the node depth. This is the santa that
  // needs a receiver.
  const santa = participants[parents.length];
  // Find the potential receivers of this santa. `santaMappings` will contain
  // this santa potential receivers, to which needs to be remove all receivers
  // that have already been assigned.
  const potentialReceivers = Object.entries(allSantaMappings[santa])
    .filter(([receiver]) => parents.every(node => node.receiver !== receiver))
    // Create the node's children from the potential receivers.
    .map(([receiver, cost]) => ({
      santa,
      cost,
      receiver,
    }));
  // If there is no possible receivers even though not all santas have a
  // receiver, this branch isn't working -> return null.
  return potentialReceivers.length ? potentialReceivers : null;
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
 * Also supports black-listing: some participants that may never be the Santa
 * of some others.
 *
 * @param {{}[]} pastChristmas An array containing the previous attributions.
 * @param {Array.<string[]|string>} families The list of all participants sorted
 * by families.
 * @return {{}[]} The new attributions
 */
const generateSantas = (pastChristmas, families) => {
  const participants = shuffle(
    families.reduce((result, family) => [
      ...result,
      ...(Array.isArray(family) ? family : [family]),
    ]),
  );
  const allSantaMappings = Object.assign(
    ...participants.map(p => {
      const receivers = findPotentialReceivers(families, p);
      return {
        [p]: getSantaMappings(pastChristmas, receivers, p),
      };
    }),
  );
  // `traverse` explores an unknown tree to find an acceptable branch.
  // The value of each node will be a Santa whose recipient is the d-th
  // participant of `participants` where d is the depth of the node.
  const result = traverse({
    // This function must return the children of the last node of `branch`, that
    // is the possible santas of the n-th participant with n being the depth
    // of the branch.
    getNodeChildren(branch) {
      return getTraverseNodeChildren(participants, allSantaMappings, branch);
    },
    getSubBranchOptimalCost(branch) {
      return getSubBranchOptimalCost(participants, allSantaMappings, branch);
    },
  });
  return {
    santas: Object.assign(
      ...result.branch.map((node, i) => ({ [participants[i]]: node.receiver })),
    ),
    cost: result.cost,
    explored: result.explored,
    failed: result.failed,
    trimmed: result.trimmed,
  };
};

module.exports = {
  findPotentialReceivers,
  generateSantas,
  getSantaMappings,
  getSantaReceiverMappingCount,
  getTraverseNodeChildren,
  getRemainingReceivers,
  getRemainingSantas,
  getSubBranchOptimalCost,
};
