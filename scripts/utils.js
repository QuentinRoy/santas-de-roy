/**
 * Create blacklists from exclusion groups: a participant cannot be the santa of
 * someone who is in his exclusion group.
 *
 * @private
 * @param {Array.<string[]>} exclusionGroups exclusion groups of participants.
 * @return {Object.<string,string[]>} a dictionary whose keys are
 * participants and values a list of participants they cannot be the santa of.
 */
module.exports.exclusionGroupsToBlacklists = exclusionGroups =>
  exclusionGroups.reduce(
    (res, group) =>
      Object.assign(
        {},
        res,
        group.reduce(
          (fRes, p) =>
            Object.assign({}, fRes, { [p]: [...group, ...(res[p] || [])] }),
          {},
        ),
      ),
    {},
  );
