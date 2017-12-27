const traverse = require('./traverse');

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
  return possibleReceivers.map((receiver, i) => ({
    count: santaReceiverMappingCounts[i],
    receiver,
  }));
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
    return familyArray.includes(santa) ? result : [...result, ...familyArray];
  }, []);

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
  const participants = families.reduce((result, family) => [
    ...result,
    ...(Array.isArray(family) ? family : [family]),
  ]);
  const n = participants.length;
  const santaMappingsForAll = Object.assign(
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
    // is the possible Santas of the n-th participant with n being the depth
    // of the branch.
    getNodeChildren(branch) {
      const depth = branch.length;
      if (depth === n) {
        return [];
      }
      const santa = participants[branch.length];
      const children = santaMappingsForAll[santa].filter(mapping =>
        branch.every(node => node.receiver !== mapping.receiver),
      );
      return children.length
        ? children.map(m => ({
            cost: m.count,
            receiver: m.receiver,
          }))
        : // null indicates that the branch has failed and should not be kept.
          null;
    },
  });
  return {
    santas: Object.assign(
      ...result.branch.map((node, i) => ({ [participants[i]]: node.receiver })),
    ),
    cost: result.cost,
    optimal: result.optimal,
  };
};

module.exports = {
  findPotentialReceivers,
  generateSantas,
  getSantaMappings,
  getSantaReceiverMappingCount,
};
