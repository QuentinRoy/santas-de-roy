const TRAVERSE_DEFAULT_CONFIG = { parents: [] };

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
 * @param {ChildrenGetter} config.getNodeChildren Function to get the children of
 * a node.
 * @param {Node[]} [config.parents=[]] Initialization of the traverse: an array
 * of node from oldest to newest (i.e. the latest node would be the direct
 * parent of the first node of the branch create by traverse). The format of the
 * nodes is up to the consumer, but is typically the same as the result of
 * `config.getNodeChildren`.
 * @return {Node[]} The selected branch.
 */
const traverse = config => {
  const { parents, getNodeChildren } = Object.assign(
    {},
    TRAVERSE_DEFAULT_CONFIG,
    config,
  );
  const children = getNodeChildren(parents);
  // Failed branch.
  if (children == null) return null;
  // End of a branch.
  if (!children.length)
    return {
      branch: [],
      cost: 0,
      depth: 0,
      explored: 1,
      failed: 0,
    };
  // Look up sub-branches.
  return children.reduce(
    (current, child) => {
      const sub = traverse({
        parents: [...parents, child],
        getNodeChildren,
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
          }
        : Object.assign({}, current, {
            explored: current.explored + 1,
            failed: sub ? current.failed + sub.failed : current.failed + 1,
          });
    },
    {
      cost: Number.POSITIVE_INFINITY,
      explored: 0,
      failed: 0,
    },
  );
};

module.exports = traverse;
