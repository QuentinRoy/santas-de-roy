const TRAVERSE_DEFAULT_CONFIG = { init: [] };

/**
 * @callback ChildGetter
 * @param {Node} node The current node.
 * @param {string} level The name of the next level (i.e. the level the children
 * of the current node).
 * @param {Node[]} branch The list of the nodes in the branch being currently
 * constructed.
 * @return {Node[]} The possible children of the current node.
 */

/**
 * @param {Object} config The settings of the traverse.
 * @param {string[]} config.levels The name of the levels. Also indicates the
 * required branch depths.
 * @param {ChildGetter} config.getNodeChildren Function to get the children of
 * a node.
 * @param {Node[]} [config.init=[]] Initialization of the traverse: an array of
 * node. The format of node is up to the consumer, but is typically the same
 * as the result of `config.getNodeChildren`.
 * @return {Node[]} The selected branch.
 */
const traverse = config => {
  const { init: branch, levels, getNodeChildren } = Object.assign(
    {},
    TRAVERSE_DEFAULT_CONFIG,
    config,
  );
  const initDepth = branch.length;
  const levelsDepth = levels.length;
  const isComplete = initDepth === levelsDepth;
  const children = isComplete
    ? []
    : getNodeChildren(branch[initDepth - 1], levels[initDepth], branch);
  return children.reduce(
    (current, child) => {
      if (current.isComplete) return current;
      const sub = traverse({
        init: [...branch, child],
        levels,
        getNodeChildren,
      });
      return Object.assign({}, sub.depth > current.depth ? sub : current, {
        failedBranch: sub.failedBranch + current.failedBranch,
      });
    },
    {
      depth: initDepth,
      branch,
      isComplete,
      failedBranch: isComplete || children.length > 0 ? 0 : 1,
    },
  );
};

module.exports = traverse;
