const sortBy = require('lodash/sortBy');
const shuffle = require('lodash/shuffle');

const TRAVERSE_DEFAULT_CONFIG = {
  parents: [],
  getSubBranchOptimalCost: () => 0,
};

/**
 * @callback ChildrenGetter
 * @param {Node} node The current node.
 * @param {string} level The name of the next level (i.e. the level the children
 * of the current node).
 * @param {Node[]} branch The list of the nodes in the branch being currently
 * constructed.
 * @return {Node[]} The possible children of the current node.
 */

/**
 * @param {Object} config The settings of the traverse.
 * @param {ChildrenGetter} config.getNodeChildren Function to get the children
 * of a node.
 * @param {number} [config.getSubBranchOptimalCost] If known the best possible cost
 * of a branch.
 * @param {Node[]} [config.parents=[]] Initialization of the traverse: an array
 * of node from oldest to newest (i.e. the latest node would be the direct
 * parent of the first node of the branch create by traverse). The format of the
 * nodes is up to the consumer, but is typically the same as the result of
 * `config.getNodeChildren`.
 * @return {Node[]} The selected branch.
 */
const traverse = config => {
  const { parents, getNodeChildren, getSubBranchOptimalCost } = Object.assign(
    {},
    TRAVERSE_DEFAULT_CONFIG,
    config,
  );
  const children = getNodeChildren(parents);
  // Failed branch.
  if (children == null) {
    return null;
  }
  // End of a branch.
  if (!children.length) {
    return {
      branch: [],
      cost: 0,
      depth: 0,
      explored: 1,
      failed: 0,
      trimmed: 0,
    };
  }
  // Calculate the best (lowest) possible cost of a sub-branch so that we can
  // stop once we found one.
  const optimalCost = getSubBranchOptimalCost(parents);
  // Look up sub-branches.
  return sortBy(shuffle(children), 'cost').reduce(
    (current, child) => {
      if (current.cost <= optimalCost)
        return Object.assign(current, { trimmed: current.trimmed + 1 });
      const sub = traverse({
        parents: [...parents, child],
        getNodeChildren,
        getSubBranchOptimalCost,
      });
      return sub && (!current || current.cost > sub.cost)
        ? {
            branch: [child, ...sub.branch],
            // Allows arbitrary type of child, takes into account the cost if
            // available.
            cost: sub.cost + ((child != null && child.cost) || 0),
            depth: sub.depth + 1,
            explored: current.explored + sub.explored,
            failed: current.failed + sub.failed,
            trimmed: current.trimmed + sub.trimmed,
          }
        : Object.assign({}, current, {
            explored: sub
              ? current.explored + sub.explored
              : current.explored + 1,
            failed: sub ? current.failed + sub.failed : current.failed + 1,
            trimmed: sub ? current.trimmed + sub.trimmed : current.trimmed,
          });
    },
    {
      cost: Number.POSITIVE_INFINITY,
      explored: 0,
      failed: 0,
      trimmed: 0,
    },
  );
};

module.exports = traverse;
