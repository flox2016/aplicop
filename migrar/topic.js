'use strict';

function levelsOf(levels) {
  if (!Array.isArray(levels)) {
    throw new Error("path() expects an array, e.g. path(['user'])");
  }
  if (levels.length === 0) {
    throw new Error("path() needs at least one level");
  }
  return levels.map((level, index) => {
    if (typeof level !== "string") {
      const type = level === null ? "null" : typeof level;
      throw new Error(
        `level at index ${index} must be a string, got ${type}`
      );
    }
    if (level === "") {
      throw new Error(`empty level at index ${index}`);
    }
    if (level.includes("/")) {
      const parts = level.split("/").map((part) => `'${part}'`).join(", ");
      throw new Error(
        `"${level}" contains "/", split it: path([${parts}])`
      );
    }
    if (level.includes("+")) {
      throw new Error(`"${level}" contains "+", not allowed in a topic`);
    }
    if (level.includes("#")) {
      throw new Error(`"${level}" contains "#", not allowed in a topic`);
    }
    if (level.includes("\0")) {
      throw new Error(`level at index ${index} contains a NUL character`);
    }
    return level;
  });
}
class Topic {
  constructor(levels) {
    this.levels = levels;
  }
  /** Start a topic with the given levels, e.g. `Topic.path(['user', userId])`. */
  static path(levels) {
    return new Topic(levelsOf(levels));
  }
  /** Append the given levels. */
  path(levels) {
    return new Topic([...this.levels, ...levelsOf(levels)]);
  }
  toString() {
    return this.levels.join("/");
  }
}

exports.Topic = Topic;
//# sourceMappingURL=topic.js.map
//# sourceMappingURL=topic.js.map