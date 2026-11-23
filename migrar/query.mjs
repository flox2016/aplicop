import JSONbigModule from 'json-bigint';

// src/query.ts
var JSONbig = JSONbigModule({ useNativeBigInt: true });
var _Query = class _Query {
  /**
   * Constructor for Query class.
   *
   * @param {string} method
   * @param {AttributesTypes} attribute
   * @param {QueryTypes} values
   */
  constructor(method, attribute, values) {
    this.method = method;
    this.attribute = attribute;
    if (values !== void 0) {
      if (Array.isArray(values)) {
        this.values = values;
      } else {
        this.values = [values];
      }
    }
  }
  /**
   * Convert the query object to a JSON string.
   *
   * @returns {string}
   */
  toString() {
    return JSONbig.stringify({
      method: this.method,
      attribute: this.attribute,
      values: this.values
    });
  }
  static createJoin(method, table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") {
    if (Array.isArray(leftOrAliasOrOn)) {
      return _Query.nestedJoin(method, table, "", leftOrAliasOrOn);
    }
    if (Array.isArray(rightOrOn)) {
      return _Query.nestedJoin(method, table, leftOrAliasOrOn, rightOrOn);
    }
    return new _Query(
      method,
      table,
      alias !== "" ? [leftOrAliasOrOn, operator, rightOrOn, alias] : [leftOrAliasOrOn, operator, rightOrOn]
    ).toString();
  }
  static nestedJoin(method, table, alias, on) {
    const values = [];
    if (alias !== "") {
      values.push(alias);
    }
    for (const query of on) {
      values.push(JSONbig.parse(query));
    }
    return new _Query(method, table, values).toString();
  }
};
/**
 * Filter resources where attribute is equal to value.
 *
 * @param {string} attribute
 * @param {QueryTypes} value
 * @returns {string}
 */
_Query.equal = (attribute, value) => new _Query("equal", attribute, value).toString();
/**
 * Filter resources where attribute is not equal to value.
 *
 * @param {string} attribute
 * @param {QueryTypes} value
 * @returns {string}
 */
_Query.notEqual = (attribute, value) => new _Query("notEqual", attribute, value).toString();
/**
 * Filter resources where attribute matches a regular expression pattern.
 *
 * @param {string} attribute The attribute to filter on.
 * @param {string} pattern The regular expression pattern to match.
 * @returns {string}
 */
_Query.regex = (attribute, pattern) => new _Query("regex", attribute, pattern).toString();
/**
 * Filter resources where attribute is less than value.
 *
 * @param {string} attribute
 * @param {QueryTypes} value
 * @returns {string}
 */
_Query.lessThan = (attribute, value) => new _Query("lessThan", attribute, value).toString();
/**
 * Filter resources where attribute is less than or equal to value.
 *
 * @param {string} attribute
 * @param {QueryTypes} value
 * @returns {string}
 */
_Query.lessThanEqual = (attribute, value) => new _Query("lessThanEqual", attribute, value).toString();
/**
 * Filter resources where attribute is greater than value.
 *
 * @param {string} attribute
 * @param {QueryTypes} value
 * @returns {string}
 */
_Query.greaterThan = (attribute, value) => new _Query("greaterThan", attribute, value).toString();
/**
 * Filter resources where attribute is greater than or equal to value.
 *
 * @param {string} attribute
 * @param {QueryTypes} value
 * @returns {string}
 */
_Query.greaterThanEqual = (attribute, value) => new _Query("greaterThanEqual", attribute, value).toString();
/**
 * Filter resources where attribute is null.
 *
 * @param {string} attribute
 * @returns {string}
 */
_Query.isNull = (attribute) => new _Query("isNull", attribute).toString();
/**
 * Filter resources where attribute is not null.
 *
 * @param {string} attribute
 * @returns {string}
 */
_Query.isNotNull = (attribute) => new _Query("isNotNull", attribute).toString();
/**
 * Filter resources where the specified attributes exist.
 *
 * @param {string[]} attributes The list of attributes that must exist.
 * @returns {string}
 */
_Query.exists = (attributes) => new _Query("exists", void 0, attributes).toString();
/**
 * Filter resources where the specified attributes do not exist.
 *
 * @param {string[]} attributes The list of attributes that must not exist.
 * @returns {string}
 */
_Query.notExists = (attributes) => new _Query("notExists", void 0, attributes).toString();
/**
 * Filter resources where attribute is between start and end (inclusive).
 *
 * @param {string} attribute
 * @param {string | number | bigint} start
 * @param {string | number | bigint} end
 * @returns {string}
 */
_Query.between = (attribute, start, end) => new _Query("between", attribute, [
  start,
  end
]).toString();
/**
 * Filter resources where attribute starts with value.
 *
 * @param {string} attribute
 * @param {string} value
 * @returns {string}
 */
_Query.startsWith = (attribute, value) => new _Query("startsWith", attribute, value).toString();
/**
 * Filter resources where attribute ends with value.
 *
 * @param {string} attribute
 * @param {string} value
 * @returns {string}
 */
_Query.endsWith = (attribute, value) => new _Query("endsWith", attribute, value).toString();
/**
 * Specify which attributes should be returned by the API call.
 *
 * @param {string[]} attributes
 * @returns {string}
 */
_Query.select = (attributes) => new _Query("select", void 0, attributes).toString();
/**
 * Filter resources by searching attribute for value.
 * A fulltext index on attribute is required for this query to work.
 *
 * @param {string} attribute
 * @param {string} value
 * @returns {string}
 */
_Query.search = (attribute, value) => new _Query("search", attribute, value).toString();
/**
 * Sort results by attribute descending.
 *
 * @param {string} attribute
 * @returns {string}
 */
_Query.orderDesc = (attribute) => new _Query("orderDesc", attribute).toString();
/**
 * Sort results by attribute ascending.
 *
 * @param {string} attribute
 * @returns {string}
 */
_Query.orderAsc = (attribute) => new _Query("orderAsc", attribute).toString();
/**
 * Sort results randomly.
 *
 * @returns {string}
 */
_Query.orderRandom = () => new _Query("orderRandom").toString();
/**
 * Return results after documentId.
 *
 * @param {string} documentId
 * @returns {string}
 */
_Query.cursorAfter = (documentId) => new _Query("cursorAfter", void 0, documentId).toString();
/**
 * Return results before documentId.
 *
 * @param {string} documentId
 * @returns {string}
 */
_Query.cursorBefore = (documentId) => new _Query("cursorBefore", void 0, documentId).toString();
/**
 * Return only limit results.
 *
 * @param {number} limit
 * @returns {string}
 */
_Query.limit = (limit) => new _Query("limit", void 0, limit).toString();
/**
 * Filter resources by skipping the first offset results.
 *
 * @param {number} offset
 * @returns {string}
 */
_Query.offset = (offset) => new _Query("offset", void 0, offset).toString();
/**
 * Filter resources where attribute contains the specified value.
 * For string attributes, checks if the string contains the substring.
 *
 * Note: For array attributes, use {@link containsAny} or {@link containsAll} instead.
 * @param {string} attribute
 * @param {string | string[]} value
 * @returns {string}
 */
_Query.contains = (attribute, value) => new _Query("contains", attribute, value).toString();
/**
 * Filter resources where attribute contains ANY of the specified values.
 * For array and relationship attributes, matches documents where the attribute
 * contains at least one of the given values.
 *
 * @param {string} attribute
 * @param {any[]} value
 * @returns {string}
 */
_Query.containsAny = (attribute, value) => new _Query("containsAny", attribute, value).toString();
/**
 * Filter resources where attribute contains ALL of the specified values.
 * For array and relationship attributes, matches documents where the attribute
 * contains every one of the given values.
 *
 * @param {string} attribute
 * @param {any[]} value
 * @returns {string}
 */
_Query.containsAll = (attribute, value) => new _Query("containsAll", attribute, value).toString();
/**
 * Filter resources where attribute does not contain the specified value.
 *
 * @param {string} attribute
 * @param {string | any[]} value
 * @returns {string}
 */
_Query.notContains = (attribute, value) => new _Query("notContains", attribute, value).toString();
/**
 * Filter resources by searching attribute for value (inverse of search).
 * A fulltext index on attribute is required for this query to work.
 *
 * @param {string} attribute
 * @param {string} value
 * @returns {string}
 */
_Query.notSearch = (attribute, value) => new _Query("notSearch", attribute, value).toString();
/**
 * Filter resources where attribute is not between start and end (exclusive).
 *
 * @param {string} attribute
 * @param {string | number | bigint} start
 * @param {string | number | bigint} end
 * @returns {string}
 */
_Query.notBetween = (attribute, start, end) => new _Query("notBetween", attribute, [
  start,
  end
]).toString();
/**
 * Filter resources where attribute does not start with value.
 *
 * @param {string} attribute
 * @param {string} value
 * @returns {string}
 */
_Query.notStartsWith = (attribute, value) => new _Query("notStartsWith", attribute, value).toString();
/**
 * Filter resources where attribute does not end with value.
 *
 * @param {string} attribute
 * @param {string} value
 * @returns {string}
 */
_Query.notEndsWith = (attribute, value) => new _Query("notEndsWith", attribute, value).toString();
/**
 * Filter resources where document was created before date.
 *
 * @param {string} value
 * @returns {string}
 */
_Query.createdBefore = (value) => _Query.lessThan("$createdAt", value);
/**
 * Filter resources where document was created after date.
 *
 * @param {string} value
 * @returns {string}
 */
_Query.createdAfter = (value) => _Query.greaterThan("$createdAt", value);
/**
 * Filter resources where document was created between dates.
 *
 * @param {string} start
 * @param {string} end
 * @returns {string}
 */
_Query.createdBetween = (start, end) => _Query.between("$createdAt", start, end);
/**
 * Filter resources where document was updated before date.
 *
 * @param {string} value
 * @returns {string}
 */
_Query.updatedBefore = (value) => _Query.lessThan("$updatedAt", value);
/**
 * Filter resources where document was updated after date.
 *
 * @param {string} value
 * @returns {string}
 */
_Query.updatedAfter = (value) => _Query.greaterThan("$updatedAt", value);
/**
 * Filter resources where document was updated between dates.
 *
 * @param {string} start
 * @param {string} end
 * @returns {string}
 */
_Query.updatedBetween = (start, end) => _Query.between("$updatedAt", start, end);
/**
 * Combine multiple queries using logical OR operator.
 *
 * @param {string[]} queries
 * @returns {string}
 */
_Query.or = (queries) => new _Query(
  "or",
  void 0,
  queries.map((query) => JSONbig.parse(query))
).toString();
/**
 * Combine multiple queries using logical AND operator.
 *
 * @param {string[]} queries
 * @returns {string}
 */
_Query.and = (queries) => new _Query(
  "and",
  void 0,
  queries.map((query) => JSONbig.parse(query))
).toString();
/**
 * Filter array elements where at least one element matches all the specified queries.
 *
 * @param {string} attribute The attribute containing the array to filter on.
 * @param {string[]} queries The list of query strings to match against array elements.
 * @returns {string}
 */
_Query.elemMatch = (attribute, queries) => new _Query(
  "elemMatch",
  attribute,
  queries.map((query) => JSONbig.parse(query))
).toString();
/**
 * Constrain populated related documents on a relationship attribute.
 *
 * @param {string} attribute The relationship attribute to query.
 * @param {string[]} queries Filter, order, select, and pagination queries applied to related documents.
 * @returns {string}
 */
_Query.relationship = (attribute, queries) => new _Query(
  "relationship",
  attribute,
  queries.map((query) => JSONbig.parse(query))
).toString();
/**
 * Filter resources where attribute is at a specific distance from the given coordinates.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @param {number} distance
 * @param {boolean} meters
 * @returns {string}
 */
_Query.distanceEqual = (attribute, values, distance, meters = true) => new _Query("distanceEqual", attribute, [
  [values, distance, meters]
]).toString();
/**
 * Filter resources where attribute is not at a specific distance from the given coordinates.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @param {number} distance
 * @param {boolean} meters
 * @returns {string}
 */
_Query.distanceNotEqual = (attribute, values, distance, meters = true) => new _Query("distanceNotEqual", attribute, [
  [values, distance, meters]
]).toString();
/**
 * Filter resources where attribute is at a distance greater than the specified value from the given coordinates.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @param {number} distance
 * @param {boolean} meters
 * @returns {string}
 */
_Query.distanceGreaterThan = (attribute, values, distance, meters = true) => new _Query("distanceGreaterThan", attribute, [
  [values, distance, meters]
]).toString();
/**
 * Filter resources where attribute is at a distance less than the specified value from the given coordinates.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @param {number} distance
 * @param {boolean} meters
 * @returns {string}
 */
_Query.distanceLessThan = (attribute, values, distance, meters = true) => new _Query("distanceLessThan", attribute, [
  [values, distance, meters]
]).toString();
/**
 * Filter resources using vector dot product similarity.
 *
 * @param {string} attribute
 * @param {number[]} vector
 * @returns {string}
 */
_Query.vectorDot = (attribute, vector) => new _Query("vectorDot", attribute, [
  vector
]).toString();
/**
 * Filter resources using vector cosine similarity.
 *
 * @param {string} attribute
 * @param {number[]} vector
 * @returns {string}
 */
_Query.vectorCosine = (attribute, vector) => new _Query("vectorCosine", attribute, [
  vector
]).toString();
/**
 * Filter resources using vector Euclidean distance.
 *
 * @param {string} attribute
 * @param {number[]} vector
 * @returns {string}
 */
_Query.vectorEuclidean = (attribute, vector) => new _Query("vectorEuclidean", attribute, [
  vector
]).toString();
/**
 * Filter resources where attribute intersects with the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.intersects = (attribute, values) => new _Query("intersects", attribute, [values]).toString();
/**
 * Filter resources where attribute does not intersect with the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.notIntersects = (attribute, values) => new _Query("notIntersects", attribute, [values]).toString();
/**
 * Filter resources where attribute crosses the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.crosses = (attribute, values) => new _Query("crosses", attribute, [values]).toString();
/**
 * Filter resources where attribute does not cross the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.notCrosses = (attribute, values) => new _Query("notCrosses", attribute, [values]).toString();
/**
 * Filter resources where attribute overlaps with the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.overlaps = (attribute, values) => new _Query("overlaps", attribute, [values]).toString();
/**
 * Filter resources where attribute does not overlap with the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.notOverlaps = (attribute, values) => new _Query("notOverlaps", attribute, [values]).toString();
/**
 * Filter resources where attribute touches the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.touches = (attribute, values) => new _Query("touches", attribute, [values]).toString();
/**
 * Filter resources where attribute does not touch the given geometry.
 *
 * @param {string} attribute
 * @param {any[]} values
 * @returns {string}
 */
_Query.notTouches = (attribute, values) => new _Query("notTouches", attribute, [values]).toString();
/**
 * Count documents, optionally aliased.
 */
_Query.count = (attribute = "*", alias = "") => new _Query(
  "count",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/**
 * Count distinct values of attribute, optionally aliased.
 */
_Query.countDistinct = (attribute, alias = "") => new _Query(
  "countDistinct",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Sum values of `attribute`, optionally aliased. */
_Query.sum = (attribute, alias = "") => new _Query(
  "sum",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Average values of `attribute`, optionally aliased. */
_Query.avg = (attribute, alias = "") => new _Query(
  "avg",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Minimum value of `attribute`, optionally aliased. */
_Query.min = (attribute, alias = "") => new _Query(
  "min",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Maximum value of `attribute`, optionally aliased. */
_Query.max = (attribute, alias = "") => new _Query(
  "max",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Population standard deviation of `attribute` (the same as stddevPop), optionally aliased. */
_Query.stddev = (attribute, alias = "") => new _Query(
  "stddev",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Population standard deviation of `attribute`, optionally aliased. */
_Query.stddevPop = (attribute, alias = "") => new _Query(
  "stddevPop",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Sample standard deviation of `attribute`, optionally aliased. */
_Query.stddevSamp = (attribute, alias = "") => new _Query(
  "stddevSamp",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Population variance of `attribute` (the same as varPop), optionally aliased. */
_Query.variance = (attribute, alias = "") => new _Query(
  "variance",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Population variance of `attribute`, optionally aliased. */
_Query.varPop = (attribute, alias = "") => new _Query(
  "varPop",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Sample variance of `attribute`, optionally aliased. */
_Query.varSamp = (attribute, alias = "") => new _Query(
  "varSamp",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Bitwise AND of `attribute`, optionally aliased. */
_Query.bitAnd = (attribute, alias = "") => new _Query(
  "bitAnd",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Bitwise OR of `attribute`, optionally aliased. */
_Query.bitOr = (attribute, alias = "") => new _Query(
  "bitOr",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/** Bitwise XOR of `attribute`, optionally aliased. */
_Query.bitXor = (attribute, alias = "") => new _Query(
  "bitXor",
  attribute,
  alias !== "" ? alias : void 0
).toString();
/**
 * Group results by attributes.
 */
_Query.groupBy = (attributes) => new _Query("groupBy", void 0, attributes).toString();
/**
 * Filter grouped results. `queries` are nested like `and`/`or`.
 */
_Query.having = (queries) => new _Query(
  "having",
  void 0,
  queries.map((query) => JSONbig.parse(query))
).toString();
/** Select distinct rows. */
_Query.distinct = () => new _Query("distinct").toString();
/**
 * Column-to-column join ON condition.
 */
_Query.on = (left, right, operator = "=") => new _Query("on", void 0, [left, operator, right]).toString();
/**
 * Inner join. `table` is the joined collection/table ID; without an alias the server names the join after it, if the ID is a valid alias, and otherwise rejects the query.
 */
_Query.join = (table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") => _Query.createJoin(
  "join",
  table,
  leftOrAliasOrOn,
  rightOrOn,
  operator,
  alias
);
/** Left join. `table` is the joined collection/table ID; without an alias the server names the join after it, if the ID is a valid alias, and otherwise rejects the query. */
_Query.leftJoin = (table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") => _Query.createJoin(
  "leftJoin",
  table,
  leftOrAliasOrOn,
  rightOrOn,
  operator,
  alias
);
/** Right join. `table` is the joined collection/table ID; without an alias the server names the join after it, if the ID is a valid alias, and otherwise rejects the query. */
_Query.rightJoin = (table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") => _Query.createJoin(
  "rightJoin",
  table,
  leftOrAliasOrOn,
  rightOrOn,
  operator,
  alias
);
/** Full outer join. `table` is the joined collection/table ID; without an alias the server names the join after it, if the ID is a valid alias, and otherwise rejects the query. */
_Query.fullOuterJoin = (table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") => _Query.createJoin(
  "fullOuterJoin",
  table,
  leftOrAliasOrOn,
  rightOrOn,
  operator,
  alias
);
/** Cross join. `table` is the joined collection/table ID; without an alias the server names the join after it, if the ID is a valid alias, and otherwise rejects the query. */
_Query.crossJoin = (table, alias = "") => new _Query(
  "crossJoin",
  table,
  alias !== "" ? alias : void 0
).toString();
/** Filter resources where `attribute` covers the given geometry. */
_Query.covers = (attribute, values) => new _Query("covers", attribute, [values]).toString();
/** Filter resources where `attribute` does not cover the given geometry. */
_Query.notCovers = (attribute, values) => new _Query("notCovers", attribute, [values]).toString();
/** Filter resources where `attribute` is spatially equal to the given geometry. */
_Query.spatialEquals = (attribute, values) => new _Query("spatialEquals", attribute, [values]).toString();
/** Filter resources where `attribute` is not spatially equal to the given geometry. */
_Query.notSpatialEquals = (attribute, values) => new _Query("notSpatialEquals", attribute, [values]).toString();
/**
 * Return limit and offset queries for 1-based page pagination.
 */
_Query.page = (page, perPage = 25) => {
  if (page < 1) {
    throw new Error("Page must be >= 1, got " + page);
  }
  if (perPage < 1) {
    throw new Error("Per page must be >= 1, got " + perPage);
  }
  return [_Query.limit(perPage), _Query.offset((page - 1) * perPage)];
};
/** Start a fluent query builder. */
_Query.builder = () => new _Query.Builder();
var Query = _Query;
((Query2) => {
  class Builder {
    constructor() {
      this.queries = [];
    }
    build() {
      return [...this.queries];
    }
    equal(attribute, value) {
      return this.push(Query2.equal(attribute, value));
    }
    notEqual(attribute, value) {
      return this.push(Query2.notEqual(attribute, value));
    }
    lessThan(attribute, value) {
      return this.push(Query2.lessThan(attribute, value));
    }
    lessThanEqual(attribute, value) {
      return this.push(Query2.lessThanEqual(attribute, value));
    }
    greaterThan(attribute, value) {
      return this.push(Query2.greaterThan(attribute, value));
    }
    greaterThanEqual(attribute, value) {
      return this.push(Query2.greaterThanEqual(attribute, value));
    }
    search(attribute, value) {
      return this.push(Query2.search(attribute, value));
    }
    isNull(attribute) {
      return this.push(Query2.isNull(attribute));
    }
    isNotNull(attribute) {
      return this.push(Query2.isNotNull(attribute));
    }
    between(attribute, start, end) {
      return this.push(Query2.between(attribute, start, end));
    }
    startsWith(attribute, value) {
      return this.push(Query2.startsWith(attribute, value));
    }
    endsWith(attribute, value) {
      return this.push(Query2.endsWith(attribute, value));
    }
    select(attributes) {
      return this.push(Query2.select(attributes));
    }
    cursorAfter(documentId) {
      return this.push(Query2.cursorAfter(documentId));
    }
    cursorBefore(documentId) {
      return this.push(Query2.cursorBefore(documentId));
    }
    orderAsc(attribute) {
      return this.push(Query2.orderAsc(attribute));
    }
    orderDesc(attribute) {
      return this.push(Query2.orderDesc(attribute));
    }
    orderRandom() {
      return this.push(Query2.orderRandom());
    }
    limit(limit) {
      return this.push(Query2.limit(limit));
    }
    offset(offset) {
      return this.push(Query2.offset(offset));
    }
    contains(attribute, value) {
      return this.push(Query2.contains(attribute, value));
    }
    containsAny(attribute, value) {
      return this.push(Query2.containsAny(attribute, value));
    }
    containsAll(attribute, value) {
      return this.push(Query2.containsAll(attribute, value));
    }
    notContains(attribute, value) {
      return this.push(Query2.notContains(attribute, value));
    }
    notSearch(attribute, value) {
      return this.push(Query2.notSearch(attribute, value));
    }
    notBetween(attribute, start, end) {
      return this.push(Query2.notBetween(attribute, start, end));
    }
    notStartsWith(attribute, value) {
      return this.push(Query2.notStartsWith(attribute, value));
    }
    notEndsWith(attribute, value) {
      return this.push(Query2.notEndsWith(attribute, value));
    }
    regex(attribute, pattern) {
      return this.push(Query2.regex(attribute, pattern));
    }
    exists(attributes) {
      return this.push(Query2.exists(attributes));
    }
    notExists(attributes) {
      return this.push(Query2.notExists(attributes));
    }
    createdBefore(value) {
      return this.push(Query2.createdBefore(value));
    }
    createdAfter(value) {
      return this.push(Query2.createdAfter(value));
    }
    createdBetween(start, end) {
      return this.push(Query2.createdBetween(start, end));
    }
    updatedBefore(value) {
      return this.push(Query2.updatedBefore(value));
    }
    updatedAfter(value) {
      return this.push(Query2.updatedAfter(value));
    }
    updatedBetween(start, end) {
      return this.push(Query2.updatedBetween(start, end));
    }
    or(queries) {
      return this.push(Query2.or(queries));
    }
    and(queries) {
      return this.push(Query2.and(queries));
    }
    elemMatch(attribute, queries) {
      return this.push(Query2.elemMatch(attribute, queries));
    }
    relationship(attribute, queries) {
      return this.push(Query2.relationship(attribute, queries));
    }
    distanceEqual(attribute, values, distance, meters = true) {
      return this.push(
        Query2.distanceEqual(attribute, values, distance, meters)
      );
    }
    distanceNotEqual(attribute, values, distance, meters = true) {
      return this.push(
        Query2.distanceNotEqual(attribute, values, distance, meters)
      );
    }
    distanceGreaterThan(attribute, values, distance, meters = true) {
      return this.push(
        Query2.distanceGreaterThan(attribute, values, distance, meters)
      );
    }
    distanceLessThan(attribute, values, distance, meters = true) {
      return this.push(
        Query2.distanceLessThan(attribute, values, distance, meters)
      );
    }
    intersects(attribute, values) {
      return this.push(Query2.intersects(attribute, values));
    }
    notIntersects(attribute, values) {
      return this.push(Query2.notIntersects(attribute, values));
    }
    crosses(attribute, values) {
      return this.push(Query2.crosses(attribute, values));
    }
    notCrosses(attribute, values) {
      return this.push(Query2.notCrosses(attribute, values));
    }
    overlaps(attribute, values) {
      return this.push(Query2.overlaps(attribute, values));
    }
    notOverlaps(attribute, values) {
      return this.push(Query2.notOverlaps(attribute, values));
    }
    touches(attribute, values) {
      return this.push(Query2.touches(attribute, values));
    }
    notTouches(attribute, values) {
      return this.push(Query2.notTouches(attribute, values));
    }
    count(attribute = "*", alias = "") {
      return this.push(Query2.count(attribute, alias));
    }
    countDistinct(attribute, alias = "") {
      return this.push(Query2.countDistinct(attribute, alias));
    }
    sum(attribute, alias = "") {
      return this.push(Query2.sum(attribute, alias));
    }
    avg(attribute, alias = "") {
      return this.push(Query2.avg(attribute, alias));
    }
    min(attribute, alias = "") {
      return this.push(Query2.min(attribute, alias));
    }
    max(attribute, alias = "") {
      return this.push(Query2.max(attribute, alias));
    }
    stddev(attribute, alias = "") {
      return this.push(Query2.stddev(attribute, alias));
    }
    stddevPop(attribute, alias = "") {
      return this.push(Query2.stddevPop(attribute, alias));
    }
    stddevSamp(attribute, alias = "") {
      return this.push(Query2.stddevSamp(attribute, alias));
    }
    variance(attribute, alias = "") {
      return this.push(Query2.variance(attribute, alias));
    }
    varPop(attribute, alias = "") {
      return this.push(Query2.varPop(attribute, alias));
    }
    varSamp(attribute, alias = "") {
      return this.push(Query2.varSamp(attribute, alias));
    }
    bitAnd(attribute, alias = "") {
      return this.push(Query2.bitAnd(attribute, alias));
    }
    bitOr(attribute, alias = "") {
      return this.push(Query2.bitOr(attribute, alias));
    }
    bitXor(attribute, alias = "") {
      return this.push(Query2.bitXor(attribute, alias));
    }
    groupBy(attributes) {
      return this.push(Query2.groupBy(attributes));
    }
    having(queries) {
      return this.push(Query2.having(queries));
    }
    distinct() {
      return this.push(Query2.distinct());
    }
    join(table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") {
      return this.push(
        Query2.join(table, leftOrAliasOrOn, rightOrOn, operator, alias)
      );
    }
    leftJoin(table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") {
      return this.push(
        Query2.leftJoin(
          table,
          leftOrAliasOrOn,
          rightOrOn,
          operator,
          alias
        )
      );
    }
    rightJoin(table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") {
      return this.push(
        Query2.rightJoin(
          table,
          leftOrAliasOrOn,
          rightOrOn,
          operator,
          alias
        )
      );
    }
    fullOuterJoin(table, leftOrAliasOrOn, rightOrOn = "", operator = "=", alias = "") {
      return this.push(
        Query2.fullOuterJoin(
          table,
          leftOrAliasOrOn,
          rightOrOn,
          operator,
          alias
        )
      );
    }
    crossJoin(table, alias = "") {
      return this.push(Query2.crossJoin(table, alias));
    }
    vectorDot(attribute, vector) {
      return this.push(Query2.vectorDot(attribute, vector));
    }
    vectorCosine(attribute, vector) {
      return this.push(Query2.vectorCosine(attribute, vector));
    }
    vectorEuclidean(attribute, vector) {
      return this.push(Query2.vectorEuclidean(attribute, vector));
    }
    covers(attribute, values) {
      return this.push(Query2.covers(attribute, values));
    }
    notCovers(attribute, values) {
      return this.push(Query2.notCovers(attribute, values));
    }
    spatialEquals(attribute, values) {
      return this.push(Query2.spatialEquals(attribute, values));
    }
    notSpatialEquals(attribute, values) {
      return this.push(Query2.notSpatialEquals(attribute, values));
    }
    page(page, perPage = 25) {
      return this.push(Query2.page(page, perPage));
    }
    push(query) {
      if (Array.isArray(query)) {
        this.queries.push(...query);
      } else {
        this.queries.push(query);
      }
      return this;
    }
  }
  Query2.Builder = Builder;
})(Query || (Query = {}));
function normalizeQueries(queries) {
  if (queries == null) {
    return [];
  }
  if (queries instanceof Query.Builder) {
    return queries.build();
  }
  if (!Array.isArray(queries)) {
    if (queries instanceof Query) {
      return [queries.toString()];
    }
    if (typeof queries === "string") {
      return [queries];
    }
    return [];
  }
  const out = [];
  for (const item of queries) {
    out.push(...normalizeQueries(item));
  }
  return out;
}
function isQueryValue(value) {
  return value instanceof Query.Builder || value instanceof Query;
}
function flattenParam(value) {
  if (isQueryValue(value)) {
    return normalizeQueries(value);
  }
  if (!Array.isArray(value)) {
    return value;
  }
  const out = [];
  for (const item of value) {
    if (isQueryValue(item)) {
      out.push(...normalizeQueries(item));
    } else {
      out.push(flattenParam(item));
    }
  }
  return out;
}
var QueryBuilder = Query.Builder;

export { Query, QueryBuilder, flattenParam, normalizeQueries };
//# sourceMappingURL=query.mjs.map
//# sourceMappingURL=query.mjs.map