/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const openbts = ($root.openbts = (() => {
  /**
   * Namespace openbts.
   * @exports openbts
   * @namespace
   */
  const openbts = {};

  /**
   * StationStatus enum.
   * @name openbts.StationStatus
   * @enum {number}
   * @property {number} published=0 published value
   * @property {number} inactive=1 inactive value
   * @property {number} pending=2 pending value
   */
  openbts.StationStatus = (function () {
    const valuesById = {},
      values = Object.create(valuesById);
    values[(valuesById[0] = "published")] = 0;
    values[(valuesById[1] = "inactive")] = 1;
    values[(valuesById[2] = "pending")] = 2;
    return values;
  })();

  openbts.Operator = (function () {
    /**
     * Properties of an Operator.
     * @memberof openbts
     * @interface IOperator
     * @property {number|null} [id] Operator id
     * @property {string|null} [name] Operator name
     * @property {string|null} [full_name] Operator full_name
     * @property {number|null} [parent_id] Operator parent_id
     * @property {number|null} [mnc] Operator mnc
     */

    /**
     * Constructs a new Operator.
     * @memberof openbts
     * @classdesc Represents an Operator.
     * @implements IOperator
     * @constructor
     * @param {openbts.IOperator=} [properties] Properties to set
     */
    function Operator(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
    }

    /**
     * Operator id.
     * @member {number} id
     * @memberof openbts.Operator
     * @instance
     */
    Operator.prototype.id = 0;

    /**
     * Operator name.
     * @member {string} name
     * @memberof openbts.Operator
     * @instance
     */
    Operator.prototype.name = "";

    /**
     * Operator full_name.
     * @member {string} full_name
     * @memberof openbts.Operator
     * @instance
     */
    Operator.prototype.full_name = "";

    /**
     * Operator parent_id.
     * @member {number} parent_id
     * @memberof openbts.Operator
     * @instance
     */
    Operator.prototype.parent_id = 0;

    /**
     * Operator mnc.
     * @member {number} mnc
     * @memberof openbts.Operator
     * @instance
     */
    Operator.prototype.mnc = 0;

    /**
     * Creates a new Operator instance using the specified properties.
     * @function create
     * @memberof openbts.Operator
     * @static
     * @param {openbts.IOperator=} [properties] Properties to set
     * @returns {openbts.Operator} Operator instance
     */
    Operator.create = function create(properties) {
      return new Operator(properties);
    };

    /**
     * Encodes the specified Operator message. Does not implicitly {@link openbts.Operator.verify|verify} messages.
     * @function encode
     * @memberof openbts.Operator
     * @static
     * @param {openbts.IOperator} message Operator message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Operator.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
      if (message.name != null && Object.hasOwnProperty.call(message, "name")) writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.name);
      if (message.full_name != null && Object.hasOwnProperty.call(message, "full_name"))
        writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.full_name);
      if (message.parent_id != null && Object.hasOwnProperty.call(message, "parent_id"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.parent_id);
      if (message.mnc != null && Object.hasOwnProperty.call(message, "mnc")) writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.mnc);
      return writer;
    };

    /**
     * Encodes the specified Operator message, length delimited. Does not implicitly {@link openbts.Operator.verify|verify} messages.
     * @function encodeDelimited
     * @memberof openbts.Operator
     * @static
     * @param {openbts.IOperator} message Operator message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Operator.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an Operator message from the specified reader or buffer.
     * @function decode
     * @memberof openbts.Operator
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {openbts.Operator} Operator
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Operator.decode = function decode(reader, length, error, long) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      if (long === undefined) long = 0;
      if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.openbts.Operator();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.int32();
            break;
          }
          case 2: {
            message.name = reader.string();
            break;
          }
          case 3: {
            message.full_name = reader.string();
            break;
          }
          case 4: {
            message.parent_id = reader.int32();
            break;
          }
          case 5: {
            message.mnc = reader.int32();
            break;
          }
          default:
            reader.skipType(tag & 7, long);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes an Operator message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof openbts.Operator
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {openbts.Operator} Operator
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Operator.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an Operator message.
     * @function verify
     * @memberof openbts.Operator
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Operator.verify = function verify(message, long) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (long === undefined) long = 0;
      if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
      if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
      if (message.name != null && message.hasOwnProperty("name")) if (!$util.isString(message.name)) return "name: string expected";
      if (message.full_name != null && message.hasOwnProperty("full_name"))
        if (!$util.isString(message.full_name)) return "full_name: string expected";
      if (message.parent_id != null && message.hasOwnProperty("parent_id"))
        if (!$util.isInteger(message.parent_id)) return "parent_id: integer expected";
      if (message.mnc != null && message.hasOwnProperty("mnc")) if (!$util.isInteger(message.mnc)) return "mnc: integer expected";
      return null;
    };

    /**
     * Creates an Operator message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof openbts.Operator
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {openbts.Operator} Operator
     */
    Operator.fromObject = function fromObject(object, long) {
      if (object instanceof $root.openbts.Operator) return object;
      if (long === undefined) long = 0;
      if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
      let message = new $root.openbts.Operator();
      if (object.id != null) message.id = object.id | 0;
      if (object.name != null) message.name = String(object.name);
      if (object.full_name != null) message.full_name = String(object.full_name);
      if (object.parent_id != null) message.parent_id = object.parent_id | 0;
      if (object.mnc != null) message.mnc = object.mnc | 0;
      return message;
    };

    /**
     * Creates a plain object from an Operator message. Also converts values to other types if specified.
     * @function toObject
     * @memberof openbts.Operator
     * @static
     * @param {openbts.Operator} message Operator
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Operator.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = 0;
        object.name = "";
        object.full_name = "";
        object.parent_id = 0;
        object.mnc = 0;
      }
      if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
      if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
      if (message.full_name != null && message.hasOwnProperty("full_name")) object.full_name = message.full_name;
      if (message.parent_id != null && message.hasOwnProperty("parent_id")) object.parent_id = message.parent_id;
      if (message.mnc != null && message.hasOwnProperty("mnc")) object.mnc = message.mnc;
      return object;
    };

    /**
     * Converts this Operator to JSON.
     * @function toJSON
     * @memberof openbts.Operator
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Operator.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Operator
     * @function getTypeUrl
     * @memberof openbts.Operator
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Operator.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/openbts.Operator";
    };

    return Operator;
  })();

  openbts.Region = (function () {
    /**
     * Properties of a Region.
     * @memberof openbts
     * @interface IRegion
     * @property {number|null} [id] Region id
     * @property {string|null} [name] Region name
     * @property {string|null} [code] Region code
     */

    /**
     * Constructs a new Region.
     * @memberof openbts
     * @classdesc Represents a Region.
     * @implements IRegion
     * @constructor
     * @param {openbts.IRegion=} [properties] Properties to set
     */
    function Region(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
    }

    /**
     * Region id.
     * @member {number} id
     * @memberof openbts.Region
     * @instance
     */
    Region.prototype.id = 0;

    /**
     * Region name.
     * @member {string} name
     * @memberof openbts.Region
     * @instance
     */
    Region.prototype.name = "";

    /**
     * Region code.
     * @member {string} code
     * @memberof openbts.Region
     * @instance
     */
    Region.prototype.code = "";

    /**
     * Creates a new Region instance using the specified properties.
     * @function create
     * @memberof openbts.Region
     * @static
     * @param {openbts.IRegion=} [properties] Properties to set
     * @returns {openbts.Region} Region instance
     */
    Region.create = function create(properties) {
      return new Region(properties);
    };

    /**
     * Encodes the specified Region message. Does not implicitly {@link openbts.Region.verify|verify} messages.
     * @function encode
     * @memberof openbts.Region
     * @static
     * @param {openbts.IRegion} message Region message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Region.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
      if (message.name != null && Object.hasOwnProperty.call(message, "name")) writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.name);
      if (message.code != null && Object.hasOwnProperty.call(message, "code")) writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.code);
      return writer;
    };

    /**
     * Encodes the specified Region message, length delimited. Does not implicitly {@link openbts.Region.verify|verify} messages.
     * @function encodeDelimited
     * @memberof openbts.Region
     * @static
     * @param {openbts.IRegion} message Region message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Region.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Region message from the specified reader or buffer.
     * @function decode
     * @memberof openbts.Region
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {openbts.Region} Region
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Region.decode = function decode(reader, length, error, long) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      if (long === undefined) long = 0;
      if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.openbts.Region();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.int32();
            break;
          }
          case 2: {
            message.name = reader.string();
            break;
          }
          case 3: {
            message.code = reader.string();
            break;
          }
          default:
            reader.skipType(tag & 7, long);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a Region message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof openbts.Region
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {openbts.Region} Region
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Region.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Region message.
     * @function verify
     * @memberof openbts.Region
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Region.verify = function verify(message, long) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (long === undefined) long = 0;
      if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
      if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
      if (message.name != null && message.hasOwnProperty("name")) if (!$util.isString(message.name)) return "name: string expected";
      if (message.code != null && message.hasOwnProperty("code")) if (!$util.isString(message.code)) return "code: string expected";
      return null;
    };

    /**
     * Creates a Region message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof openbts.Region
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {openbts.Region} Region
     */
    Region.fromObject = function fromObject(object, long) {
      if (object instanceof $root.openbts.Region) return object;
      if (long === undefined) long = 0;
      if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
      let message = new $root.openbts.Region();
      if (object.id != null) message.id = object.id | 0;
      if (object.name != null) message.name = String(object.name);
      if (object.code != null) message.code = String(object.code);
      return message;
    };

    /**
     * Creates a plain object from a Region message. Also converts values to other types if specified.
     * @function toObject
     * @memberof openbts.Region
     * @static
     * @param {openbts.Region} message Region
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Region.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = 0;
        object.name = "";
        object.code = "";
      }
      if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
      if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
      if (message.code != null && message.hasOwnProperty("code")) object.code = message.code;
      return object;
    };

    /**
     * Converts this Region to JSON.
     * @function toJSON
     * @memberof openbts.Region
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Region.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Region
     * @function getTypeUrl
     * @memberof openbts.Region
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Region.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/openbts.Region";
    };

    return Region;
  })();

  /**
   * Rat enum.
   * @name openbts.Rat
   * @enum {number}
   * @property {number} GSM=0 GSM value
   * @property {number} CDMA=1 CDMA value
   * @property {number} UMTS=2 UMTS value
   * @property {number} LTE=3 LTE value
   * @property {number} NR=4 NR value
   * @property {number} IOT=5 IOT value
   */
  openbts.Rat = (function () {
    const valuesById = {},
      values = Object.create(valuesById);
    values[(valuesById[0] = "GSM")] = 0;
    values[(valuesById[1] = "CDMA")] = 1;
    values[(valuesById[2] = "UMTS")] = 2;
    values[(valuesById[3] = "LTE")] = 3;
    values[(valuesById[4] = "NR")] = 4;
    values[(valuesById[5] = "IOT")] = 5;
    return values;
  })();

  /**
   * Duplex enum.
   * @name openbts.Duplex
   * @enum {number}
   * @property {number} FDD=0 FDD value
   * @property {number} TDD=1 TDD value
   */
  openbts.Duplex = (function () {
    const valuesById = {},
      values = Object.create(valuesById);
    values[(valuesById[0] = "FDD")] = 0;
    values[(valuesById[1] = "TDD")] = 1;
    return values;
  })();

  /**
   * BandVariant enum.
   * @name openbts.BandVariant
   * @enum {number}
   * @property {number} commercial=0 commercial value
   * @property {number} railway=1 railway value
   */
  openbts.BandVariant = (function () {
    const valuesById = {},
      values = Object.create(valuesById);
    values[(valuesById[0] = "commercial")] = 0;
    values[(valuesById[1] = "railway")] = 1;
    return values;
  })();

  openbts.Band = (function () {
    /**
     * Properties of a Band.
     * @memberof openbts
     * @interface IBand
     * @property {number|null} [id] Band id
     * @property {number|null} [value] Band value
     * @property {openbts.Rat|null} [rat] Band rat
     * @property {string|null} [name] Band name
     * @property {openbts.Duplex|null} [duplex] Band duplex
     * @property {openbts.BandVariant|null} [variant] Band variant
     */

    /**
     * Constructs a new Band.
     * @memberof openbts
     * @classdesc Represents a Band.
     * @implements IBand
     * @constructor
     * @param {openbts.IBand=} [properties] Properties to set
     */
    function Band(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
    }

    /**
     * Band id.
     * @member {number} id
     * @memberof openbts.Band
     * @instance
     */
    Band.prototype.id = 0;

    /**
     * Band value.
     * @member {number} value
     * @memberof openbts.Band
     * @instance
     */
    Band.prototype.value = 0;

    /**
     * Band rat.
     * @member {openbts.Rat} rat
     * @memberof openbts.Band
     * @instance
     */
    Band.prototype.rat = 0;

    /**
     * Band name.
     * @member {string} name
     * @memberof openbts.Band
     * @instance
     */
    Band.prototype.name = "";

    /**
     * Band duplex.
     * @member {openbts.Duplex} duplex
     * @memberof openbts.Band
     * @instance
     */
    Band.prototype.duplex = 0;

    /**
     * Band variant.
     * @member {openbts.BandVariant} variant
     * @memberof openbts.Band
     * @instance
     */
    Band.prototype.variant = 0;

    /**
     * Creates a new Band instance using the specified properties.
     * @function create
     * @memberof openbts.Band
     * @static
     * @param {openbts.IBand=} [properties] Properties to set
     * @returns {openbts.Band} Band instance
     */
    Band.create = function create(properties) {
      return new Band(properties);
    };

    /**
     * Encodes the specified Band message. Does not implicitly {@link openbts.Band.verify|verify} messages.
     * @function encode
     * @memberof openbts.Band
     * @static
     * @param {openbts.IBand} message Band message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Band.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create();
      if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
      if (message.value != null && Object.hasOwnProperty.call(message, "value")) writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.value);
      if (message.rat != null && Object.hasOwnProperty.call(message, "rat")) writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.rat);
      if (message.name != null && Object.hasOwnProperty.call(message, "name")) writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.name);
      if (message.duplex != null && Object.hasOwnProperty.call(message, "duplex")) writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.duplex);
      if (message.variant != null && Object.hasOwnProperty.call(message, "variant")) writer.uint32(/* id 6, wireType 0 =*/ 48).int32(message.variant);
      return writer;
    };

    /**
     * Encodes the specified Band message, length delimited. Does not implicitly {@link openbts.Band.verify|verify} messages.
     * @function encodeDelimited
     * @memberof openbts.Band
     * @static
     * @param {openbts.IBand} message Band message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    Band.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a Band message from the specified reader or buffer.
     * @function decode
     * @memberof openbts.Band
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {openbts.Band} Band
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Band.decode = function decode(reader, length, error, long) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
      if (long === undefined) long = 0;
      if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
      let end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.openbts.Band();
      while (reader.pos < end) {
        let tag = reader.uint32();
        if (tag === error) break;
        switch (tag >>> 3) {
          case 1: {
            message.id = reader.int32();
            break;
          }
          case 2: {
            message.value = reader.int32();
            break;
          }
          case 3: {
            message.rat = reader.int32();
            break;
          }
          case 4: {
            message.name = reader.string();
            break;
          }
          case 5: {
            message.duplex = reader.int32();
            break;
          }
          case 6: {
            message.variant = reader.int32();
            break;
          }
          default:
            reader.skipType(tag & 7, long);
            break;
        }
      }
      return message;
    };

    /**
     * Decodes a Band message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof openbts.Band
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {openbts.Band} Band
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    Band.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader);
      return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a Band message.
     * @function verify
     * @memberof openbts.Band
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    Band.verify = function verify(message, long) {
      if (typeof message !== "object" || message === null) return "object expected";
      if (long === undefined) long = 0;
      if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
      if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
      if (message.value != null && message.hasOwnProperty("value")) if (!$util.isInteger(message.value)) return "value: integer expected";
      if (message.rat != null && message.hasOwnProperty("rat"))
        switch (message.rat) {
          default:
            return "rat: enum value expected";
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
        }
      if (message.name != null && message.hasOwnProperty("name")) if (!$util.isString(message.name)) return "name: string expected";
      if (message.duplex != null && message.hasOwnProperty("duplex"))
        switch (message.duplex) {
          default:
            return "duplex: enum value expected";
          case 0:
          case 1:
            break;
        }
      if (message.variant != null && message.hasOwnProperty("variant"))
        switch (message.variant) {
          default:
            return "variant: enum value expected";
          case 0:
          case 1:
            break;
        }
      return null;
    };

    /**
     * Creates a Band message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof openbts.Band
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {openbts.Band} Band
     */
    Band.fromObject = function fromObject(object, long) {
      if (object instanceof $root.openbts.Band) return object;
      if (long === undefined) long = 0;
      if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
      let message = new $root.openbts.Band();
      if (object.id != null) message.id = object.id | 0;
      if (object.value != null) message.value = object.value | 0;
      switch (object.rat) {
        default:
          if (typeof object.rat === "number") {
            message.rat = object.rat;
            break;
          }
          break;
        case "GSM":
        case 0:
          message.rat = 0;
          break;
        case "CDMA":
        case 1:
          message.rat = 1;
          break;
        case "UMTS":
        case 2:
          message.rat = 2;
          break;
        case "LTE":
        case 3:
          message.rat = 3;
          break;
        case "NR":
        case 4:
          message.rat = 4;
          break;
        case "IOT":
        case 5:
          message.rat = 5;
          break;
      }
      if (object.name != null) message.name = String(object.name);
      switch (object.duplex) {
        default:
          if (typeof object.duplex === "number") {
            message.duplex = object.duplex;
            break;
          }
          break;
        case "FDD":
        case 0:
          message.duplex = 0;
          break;
        case "TDD":
        case 1:
          message.duplex = 1;
          break;
      }
      switch (object.variant) {
        default:
          if (typeof object.variant === "number") {
            message.variant = object.variant;
            break;
          }
          break;
        case "commercial":
        case 0:
          message.variant = 0;
          break;
        case "railway":
        case 1:
          message.variant = 1;
          break;
      }
      return message;
    };

    /**
     * Creates a plain object from a Band message. Also converts values to other types if specified.
     * @function toObject
     * @memberof openbts.Band
     * @static
     * @param {openbts.Band} message Band
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    Band.toObject = function toObject(message, options) {
      if (!options) options = {};
      let object = {};
      if (options.defaults) {
        object.id = 0;
        object.value = 0;
        object.rat = options.enums === String ? "GSM" : 0;
        object.name = "";
        object.duplex = options.enums === String ? "FDD" : 0;
        object.variant = options.enums === String ? "commercial" : 0;
      }
      if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
      if (message.value != null && message.hasOwnProperty("value")) object.value = message.value;
      if (message.rat != null && message.hasOwnProperty("rat"))
        object.rat =
          options.enums === String ? ($root.openbts.Rat[message.rat] === undefined ? message.rat : $root.openbts.Rat[message.rat]) : message.rat;
      if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
      if (message.duplex != null && message.hasOwnProperty("duplex"))
        object.duplex =
          options.enums === String
            ? $root.openbts.Duplex[message.duplex] === undefined
              ? message.duplex
              : $root.openbts.Duplex[message.duplex]
            : message.duplex;
      if (message.variant != null && message.hasOwnProperty("variant"))
        object.variant =
          options.enums === String
            ? $root.openbts.BandVariant[message.variant] === undefined
              ? message.variant
              : $root.openbts.BandVariant[message.variant]
            : message.variant;
      return object;
    };

    /**
     * Converts this Band to JSON.
     * @function toJSON
     * @memberof openbts.Band
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    Band.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for Band
     * @function getTypeUrl
     * @memberof openbts.Band
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    Band.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com";
      }
      return typeUrlPrefix + "/openbts.Band";
    };

    return Band;
  })();

  openbts.locations = (function () {
    /**
     * Namespace locations.
     * @memberof openbts
     * @namespace
     */
    const locations = {};

    locations.LocationStation = (function () {
      /**
       * Properties of a LocationStation.
       * @memberof openbts.locations
       * @interface ILocationStation
       * @property {number|null} [id] LocationStation id
       * @property {string|null} [station_id] LocationStation station_id
       * @property {string|null} [notes] LocationStation notes
       * @property {string|null} [extra_address] LocationStation extra_address
       * @property {string|null} [updatedAt] LocationStation updatedAt
       * @property {string|null} [createdAt] LocationStation createdAt
       * @property {boolean|null} [is_confirmed] LocationStation is_confirmed
       * @property {openbts.StationStatus|null} [status] LocationStation status
       * @property {openbts.IOperator|null} [operator] LocationStation operator
       * @property {Array.<openbts.stations.ICellWithoutDetails>|null} [cells] LocationStation cells
       * @property {openbts.stations.IExtraIdentificators|null} [extra_identificators] LocationStation extra_identificators
       */

      /**
       * Constructs a new LocationStation.
       * @memberof openbts.locations
       * @classdesc Represents a LocationStation.
       * @implements ILocationStation
       * @constructor
       * @param {openbts.locations.ILocationStation=} [properties] Properties to set
       */
      function LocationStation(properties) {
        this.cells = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * LocationStation id.
       * @member {number} id
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.id = 0;

      /**
       * LocationStation station_id.
       * @member {string} station_id
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.station_id = "";

      /**
       * LocationStation notes.
       * @member {string} notes
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.notes = "";

      /**
       * LocationStation extra_address.
       * @member {string} extra_address
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.extra_address = "";

      /**
       * LocationStation updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.updatedAt = "";

      /**
       * LocationStation createdAt.
       * @member {string} createdAt
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.createdAt = "";

      /**
       * LocationStation is_confirmed.
       * @member {boolean} is_confirmed
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.is_confirmed = false;

      /**
       * LocationStation status.
       * @member {openbts.StationStatus} status
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.status = 0;

      /**
       * LocationStation operator.
       * @member {openbts.IOperator|null|undefined} operator
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.operator = null;

      /**
       * LocationStation cells.
       * @member {Array.<openbts.stations.ICellWithoutDetails>} cells
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.cells = $util.emptyArray;

      /**
       * LocationStation extra_identificators.
       * @member {openbts.stations.IExtraIdentificators|null|undefined} extra_identificators
       * @memberof openbts.locations.LocationStation
       * @instance
       */
      LocationStation.prototype.extra_identificators = null;

      /**
       * Creates a new LocationStation instance using the specified properties.
       * @function create
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {openbts.locations.ILocationStation=} [properties] Properties to set
       * @returns {openbts.locations.LocationStation} LocationStation instance
       */
      LocationStation.create = function create(properties) {
        return new LocationStation(properties);
      };

      /**
       * Encodes the specified LocationStation message. Does not implicitly {@link openbts.locations.LocationStation.verify|verify} messages.
       * @function encode
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {openbts.locations.ILocationStation} message LocationStation message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationStation.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.station_id != null && Object.hasOwnProperty.call(message, "station_id"))
          writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.station_id);
        if (message.notes != null && Object.hasOwnProperty.call(message, "notes")) writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.notes);
        if (message.extra_address != null && Object.hasOwnProperty.call(message, "extra_address"))
          writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.extra_address);
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.createdAt);
        if (message.is_confirmed != null && Object.hasOwnProperty.call(message, "is_confirmed"))
          writer.uint32(/* id 7, wireType 0 =*/ 56).bool(message.is_confirmed);
        if (message.status != null && Object.hasOwnProperty.call(message, "status")) writer.uint32(/* id 8, wireType 0 =*/ 64).int32(message.status);
        if (message.operator != null && Object.hasOwnProperty.call(message, "operator"))
          $root.openbts.Operator.encode(message.operator, writer.uint32(/* id 9, wireType 2 =*/ 74).fork()).ldelim();
        if (message.cells != null && message.cells.length)
          for (let i = 0; i < message.cells.length; ++i)
            $root.openbts.stations.CellWithoutDetails.encode(message.cells[i], writer.uint32(/* id 10, wireType 2 =*/ 82).fork()).ldelim();
        if (message.extra_identificators != null && Object.hasOwnProperty.call(message, "extra_identificators"))
          $root.openbts.stations.ExtraIdentificators.encode(message.extra_identificators, writer.uint32(/* id 11, wireType 2 =*/ 90).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified LocationStation message, length delimited. Does not implicitly {@link openbts.locations.LocationStation.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {openbts.locations.ILocationStation} message LocationStation message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationStation.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a LocationStation message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.locations.LocationStation} LocationStation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationStation.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.locations.LocationStation();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.station_id = reader.string();
              break;
            }
            case 3: {
              message.notes = reader.string();
              break;
            }
            case 4: {
              message.extra_address = reader.string();
              break;
            }
            case 5: {
              message.updatedAt = reader.string();
              break;
            }
            case 6: {
              message.createdAt = reader.string();
              break;
            }
            case 7: {
              message.is_confirmed = reader.bool();
              break;
            }
            case 8: {
              message.status = reader.int32();
              break;
            }
            case 9: {
              message.operator = $root.openbts.Operator.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 10: {
              if (!(message.cells && message.cells.length)) message.cells = [];
              message.cells.push($root.openbts.stations.CellWithoutDetails.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 11: {
              message.extra_identificators = $root.openbts.stations.ExtraIdentificators.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a LocationStation message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.locations.LocationStation} LocationStation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationStation.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a LocationStation message.
       * @function verify
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      LocationStation.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.station_id != null && message.hasOwnProperty("station_id"))
          if (!$util.isString(message.station_id)) return "station_id: string expected";
        if (message.notes != null && message.hasOwnProperty("notes")) if (!$util.isString(message.notes)) return "notes: string expected";
        if (message.extra_address != null && message.hasOwnProperty("extra_address"))
          if (!$util.isString(message.extra_address)) return "extra_address: string expected";
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed"))
          if (typeof message.is_confirmed !== "boolean") return "is_confirmed: boolean expected";
        if (message.status != null && message.hasOwnProperty("status"))
          switch (message.status) {
            default:
              return "status: enum value expected";
            case 0:
            case 1:
            case 2:
              break;
          }
        if (message.operator != null && message.hasOwnProperty("operator")) {
          let error = $root.openbts.Operator.verify(message.operator, long + 1);
          if (error) return "operator." + error;
        }
        if (message.cells != null && message.hasOwnProperty("cells")) {
          if (!Array.isArray(message.cells)) return "cells: array expected";
          for (let i = 0; i < message.cells.length; ++i) {
            let error = $root.openbts.stations.CellWithoutDetails.verify(message.cells[i], long + 1);
            if (error) return "cells." + error;
          }
        }
        if (message.extra_identificators != null && message.hasOwnProperty("extra_identificators")) {
          let error = $root.openbts.stations.ExtraIdentificators.verify(message.extra_identificators, long + 1);
          if (error) return "extra_identificators." + error;
        }
        return null;
      };

      /**
       * Creates a LocationStation message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.locations.LocationStation} LocationStation
       */
      LocationStation.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.locations.LocationStation) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.locations.LocationStation();
        if (object.id != null) message.id = object.id | 0;
        if (object.station_id != null) message.station_id = String(object.station_id);
        if (object.notes != null) message.notes = String(object.notes);
        if (object.extra_address != null) message.extra_address = String(object.extra_address);
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        if (object.is_confirmed != null) message.is_confirmed = Boolean(object.is_confirmed);
        switch (object.status) {
          default:
            if (typeof object.status === "number") {
              message.status = object.status;
              break;
            }
            break;
          case "published":
          case 0:
            message.status = 0;
            break;
          case "inactive":
          case 1:
            message.status = 1;
            break;
          case "pending":
          case 2:
            message.status = 2;
            break;
        }
        if (object.operator != null) {
          if (typeof object.operator !== "object") throw TypeError(".openbts.locations.LocationStation.operator: object expected");
          message.operator = $root.openbts.Operator.fromObject(object.operator, long + 1);
        }
        if (object.cells) {
          if (!Array.isArray(object.cells)) throw TypeError(".openbts.locations.LocationStation.cells: array expected");
          message.cells = [];
          for (let i = 0; i < object.cells.length; ++i) {
            if (typeof object.cells[i] !== "object") throw TypeError(".openbts.locations.LocationStation.cells: object expected");
            message.cells[i] = $root.openbts.stations.CellWithoutDetails.fromObject(object.cells[i], long + 1);
          }
        }
        if (object.extra_identificators != null) {
          if (typeof object.extra_identificators !== "object")
            throw TypeError(".openbts.locations.LocationStation.extra_identificators: object expected");
          message.extra_identificators = $root.openbts.stations.ExtraIdentificators.fromObject(object.extra_identificators, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a LocationStation message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {openbts.locations.LocationStation} message LocationStation
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      LocationStation.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.cells = [];
        if (options.defaults) {
          object.id = 0;
          object.station_id = "";
          object.notes = "";
          object.extra_address = "";
          object.updatedAt = "";
          object.createdAt = "";
          object.is_confirmed = false;
          object.status = options.enums === String ? "published" : 0;
          object.operator = null;
          object.extra_identificators = null;
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.station_id != null && message.hasOwnProperty("station_id")) object.station_id = message.station_id;
        if (message.notes != null && message.hasOwnProperty("notes")) object.notes = message.notes;
        if (message.extra_address != null && message.hasOwnProperty("extra_address")) object.extra_address = message.extra_address;
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed")) object.is_confirmed = message.is_confirmed;
        if (message.status != null && message.hasOwnProperty("status"))
          object.status =
            options.enums === String
              ? $root.openbts.StationStatus[message.status] === undefined
                ? message.status
                : $root.openbts.StationStatus[message.status]
              : message.status;
        if (message.operator != null && message.hasOwnProperty("operator"))
          object.operator = $root.openbts.Operator.toObject(message.operator, options);
        if (message.cells && message.cells.length) {
          object.cells = [];
          for (let j = 0; j < message.cells.length; ++j)
            object.cells[j] = $root.openbts.stations.CellWithoutDetails.toObject(message.cells[j], options);
        }
        if (message.extra_identificators != null && message.hasOwnProperty("extra_identificators"))
          object.extra_identificators = $root.openbts.stations.ExtraIdentificators.toObject(message.extra_identificators, options);
        return object;
      };

      /**
       * Converts this LocationStation to JSON.
       * @function toJSON
       * @memberof openbts.locations.LocationStation
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      LocationStation.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for LocationStation
       * @function getTypeUrl
       * @memberof openbts.locations.LocationStation
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      LocationStation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.locations.LocationStation";
      };

      return LocationStation;
    })();

    locations.Location = (function () {
      /**
       * Properties of a Location.
       * @memberof openbts.locations
       * @interface ILocation
       * @property {number|null} [id] Location id
       * @property {string|null} [city] Location city
       * @property {string|null} [address] Location address
       * @property {number|null} [latitude] Location latitude
       * @property {number|null} [longitude] Location longitude
       * @property {string|null} [updatedAt] Location updatedAt
       * @property {string|null} [createdAt] Location createdAt
       * @property {openbts.IRegion|null} [region] Location region
       * @property {Array.<openbts.locations.ILocationStation>|null} [stations] Location stations
       */

      /**
       * Constructs a new Location.
       * @memberof openbts.locations
       * @classdesc Represents a Location.
       * @implements ILocation
       * @constructor
       * @param {openbts.locations.ILocation=} [properties] Properties to set
       */
      function Location(properties) {
        this.stations = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Location id.
       * @member {number} id
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.id = 0;

      /**
       * Location city.
       * @member {string} city
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.city = "";

      /**
       * Location address.
       * @member {string} address
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.address = "";

      /**
       * Location latitude.
       * @member {number} latitude
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.latitude = 0;

      /**
       * Location longitude.
       * @member {number} longitude
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.longitude = 0;

      /**
       * Location updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.updatedAt = "";

      /**
       * Location createdAt.
       * @member {string} createdAt
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.createdAt = "";

      /**
       * Location region.
       * @member {openbts.IRegion|null|undefined} region
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.region = null;

      /**
       * Location stations.
       * @member {Array.<openbts.locations.ILocationStation>} stations
       * @memberof openbts.locations.Location
       * @instance
       */
      Location.prototype.stations = $util.emptyArray;

      /**
       * Creates a new Location instance using the specified properties.
       * @function create
       * @memberof openbts.locations.Location
       * @static
       * @param {openbts.locations.ILocation=} [properties] Properties to set
       * @returns {openbts.locations.Location} Location instance
       */
      Location.create = function create(properties) {
        return new Location(properties);
      };

      /**
       * Encodes the specified Location message. Does not implicitly {@link openbts.locations.Location.verify|verify} messages.
       * @function encode
       * @memberof openbts.locations.Location
       * @static
       * @param {openbts.locations.ILocation} message Location message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Location.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.city != null && Object.hasOwnProperty.call(message, "city")) writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.city);
        if (message.address != null && Object.hasOwnProperty.call(message, "address"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.address);
        if (message.latitude != null && Object.hasOwnProperty.call(message, "latitude"))
          writer.uint32(/* id 4, wireType 1 =*/ 33).double(message.latitude);
        if (message.longitude != null && Object.hasOwnProperty.call(message, "longitude"))
          writer.uint32(/* id 5, wireType 1 =*/ 41).double(message.longitude);
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.createdAt);
        if (message.region != null && Object.hasOwnProperty.call(message, "region"))
          $root.openbts.Region.encode(message.region, writer.uint32(/* id 8, wireType 2 =*/ 66).fork()).ldelim();
        if (message.stations != null && message.stations.length)
          for (let i = 0; i < message.stations.length; ++i)
            $root.openbts.locations.LocationStation.encode(message.stations[i], writer.uint32(/* id 9, wireType 2 =*/ 74).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified Location message, length delimited. Does not implicitly {@link openbts.locations.Location.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.locations.Location
       * @static
       * @param {openbts.locations.ILocation} message Location message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Location.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Location message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.locations.Location
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.locations.Location} Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Location.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.locations.Location();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.city = reader.string();
              break;
            }
            case 3: {
              message.address = reader.string();
              break;
            }
            case 4: {
              message.latitude = reader.double();
              break;
            }
            case 5: {
              message.longitude = reader.double();
              break;
            }
            case 6: {
              message.updatedAt = reader.string();
              break;
            }
            case 7: {
              message.createdAt = reader.string();
              break;
            }
            case 8: {
              message.region = $root.openbts.Region.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 9: {
              if (!(message.stations && message.stations.length)) message.stations = [];
              message.stations.push($root.openbts.locations.LocationStation.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Location message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.locations.Location
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.locations.Location} Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Location.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Location message.
       * @function verify
       * @memberof openbts.locations.Location
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Location.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.city != null && message.hasOwnProperty("city")) if (!$util.isString(message.city)) return "city: string expected";
        if (message.address != null && message.hasOwnProperty("address")) if (!$util.isString(message.address)) return "address: string expected";
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          if (typeof message.latitude !== "number") return "latitude: number expected";
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          if (typeof message.longitude !== "number") return "longitude: number expected";
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        if (message.region != null && message.hasOwnProperty("region")) {
          let error = $root.openbts.Region.verify(message.region, long + 1);
          if (error) return "region." + error;
        }
        if (message.stations != null && message.hasOwnProperty("stations")) {
          if (!Array.isArray(message.stations)) return "stations: array expected";
          for (let i = 0; i < message.stations.length; ++i) {
            let error = $root.openbts.locations.LocationStation.verify(message.stations[i], long + 1);
            if (error) return "stations." + error;
          }
        }
        return null;
      };

      /**
       * Creates a Location message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.locations.Location
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.locations.Location} Location
       */
      Location.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.locations.Location) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.locations.Location();
        if (object.id != null) message.id = object.id | 0;
        if (object.city != null) message.city = String(object.city);
        if (object.address != null) message.address = String(object.address);
        if (object.latitude != null) message.latitude = Number(object.latitude);
        if (object.longitude != null) message.longitude = Number(object.longitude);
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        if (object.region != null) {
          if (typeof object.region !== "object") throw TypeError(".openbts.locations.Location.region: object expected");
          message.region = $root.openbts.Region.fromObject(object.region, long + 1);
        }
        if (object.stations) {
          if (!Array.isArray(object.stations)) throw TypeError(".openbts.locations.Location.stations: array expected");
          message.stations = [];
          for (let i = 0; i < object.stations.length; ++i) {
            if (typeof object.stations[i] !== "object") throw TypeError(".openbts.locations.Location.stations: object expected");
            message.stations[i] = $root.openbts.locations.LocationStation.fromObject(object.stations[i], long + 1);
          }
        }
        return message;
      };

      /**
       * Creates a plain object from a Location message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.locations.Location
       * @static
       * @param {openbts.locations.Location} message Location
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Location.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.stations = [];
        if (options.defaults) {
          object.id = 0;
          object.city = "";
          object.address = "";
          object.latitude = 0;
          object.longitude = 0;
          object.updatedAt = "";
          object.createdAt = "";
          object.region = null;
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.city != null && message.hasOwnProperty("city")) object.city = message.city;
        if (message.address != null && message.hasOwnProperty("address")) object.address = message.address;
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        if (message.region != null && message.hasOwnProperty("region")) object.region = $root.openbts.Region.toObject(message.region, options);
        if (message.stations && message.stations.length) {
          object.stations = [];
          for (let j = 0; j < message.stations.length; ++j)
            object.stations[j] = $root.openbts.locations.LocationStation.toObject(message.stations[j], options);
        }
        return object;
      };

      /**
       * Converts this Location to JSON.
       * @function toJSON
       * @memberof openbts.locations.Location
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Location.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Location
       * @function getTypeUrl
       * @memberof openbts.locations.Location
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Location.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.locations.Location";
      };

      return Location;
    })();

    locations.LocationsResponse = (function () {
      /**
       * Properties of a LocationsResponse.
       * @memberof openbts.locations
       * @interface ILocationsResponse
       * @property {Array.<openbts.locations.ILocation>|null} [data] LocationsResponse data
       * @property {number|null} [totalCount] LocationsResponse totalCount
       */

      /**
       * Constructs a new LocationsResponse.
       * @memberof openbts.locations
       * @classdesc Represents a LocationsResponse.
       * @implements ILocationsResponse
       * @constructor
       * @param {openbts.locations.ILocationsResponse=} [properties] Properties to set
       */
      function LocationsResponse(properties) {
        this.data = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * LocationsResponse data.
       * @member {Array.<openbts.locations.ILocation>} data
       * @memberof openbts.locations.LocationsResponse
       * @instance
       */
      LocationsResponse.prototype.data = $util.emptyArray;

      /**
       * LocationsResponse totalCount.
       * @member {number} totalCount
       * @memberof openbts.locations.LocationsResponse
       * @instance
       */
      LocationsResponse.prototype.totalCount = 0;

      /**
       * Creates a new LocationsResponse instance using the specified properties.
       * @function create
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {openbts.locations.ILocationsResponse=} [properties] Properties to set
       * @returns {openbts.locations.LocationsResponse} LocationsResponse instance
       */
      LocationsResponse.create = function create(properties) {
        return new LocationsResponse(properties);
      };

      /**
       * Encodes the specified LocationsResponse message. Does not implicitly {@link openbts.locations.LocationsResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {openbts.locations.ILocationsResponse} message LocationsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationsResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && message.data.length)
          for (let i = 0; i < message.data.length; ++i)
            $root.openbts.locations.Location.encode(message.data[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        if (message.totalCount != null && Object.hasOwnProperty.call(message, "totalCount"))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.totalCount);
        return writer;
      };

      /**
       * Encodes the specified LocationsResponse message, length delimited. Does not implicitly {@link openbts.locations.LocationsResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {openbts.locations.ILocationsResponse} message LocationsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationsResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.locations.LocationsResponse} LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationsResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.locations.LocationsResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (!(message.data && message.data.length)) message.data = [];
              message.data.push($root.openbts.locations.Location.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 2: {
              message.totalCount = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.locations.LocationsResponse} LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationsResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a LocationsResponse message.
       * @function verify
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      LocationsResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          if (!Array.isArray(message.data)) return "data: array expected";
          for (let i = 0; i < message.data.length; ++i) {
            let error = $root.openbts.locations.Location.verify(message.data[i], long + 1);
            if (error) return "data." + error;
          }
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount"))
          if (!$util.isInteger(message.totalCount)) return "totalCount: integer expected";
        return null;
      };

      /**
       * Creates a LocationsResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.locations.LocationsResponse} LocationsResponse
       */
      LocationsResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.locations.LocationsResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.locations.LocationsResponse();
        if (object.data) {
          if (!Array.isArray(object.data)) throw TypeError(".openbts.locations.LocationsResponse.data: array expected");
          message.data = [];
          for (let i = 0; i < object.data.length; ++i) {
            if (typeof object.data[i] !== "object") throw TypeError(".openbts.locations.LocationsResponse.data: object expected");
            message.data[i] = $root.openbts.locations.Location.fromObject(object.data[i], long + 1);
          }
        }
        if (object.totalCount != null) message.totalCount = object.totalCount | 0;
        return message;
      };

      /**
       * Creates a plain object from a LocationsResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {openbts.locations.LocationsResponse} message LocationsResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      LocationsResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.data = [];
        if (options.defaults) object.totalCount = 0;
        if (message.data && message.data.length) {
          object.data = [];
          for (let j = 0; j < message.data.length; ++j) object.data[j] = $root.openbts.locations.Location.toObject(message.data[j], options);
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount")) object.totalCount = message.totalCount;
        return object;
      };

      /**
       * Converts this LocationsResponse to JSON.
       * @function toJSON
       * @memberof openbts.locations.LocationsResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      LocationsResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for LocationsResponse
       * @function getTypeUrl
       * @memberof openbts.locations.LocationsResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      LocationsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.locations.LocationsResponse";
      };

      return LocationsResponse;
    })();

    locations.LocationResponse = (function () {
      /**
       * Properties of a LocationResponse.
       * @memberof openbts.locations
       * @interface ILocationResponse
       * @property {openbts.locations.ILocation|null} [data] LocationResponse data
       */

      /**
       * Constructs a new LocationResponse.
       * @memberof openbts.locations
       * @classdesc Represents a LocationResponse.
       * @implements ILocationResponse
       * @constructor
       * @param {openbts.locations.ILocationResponse=} [properties] Properties to set
       */
      function LocationResponse(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * LocationResponse data.
       * @member {openbts.locations.ILocation|null|undefined} data
       * @memberof openbts.locations.LocationResponse
       * @instance
       */
      LocationResponse.prototype.data = null;

      /**
       * Creates a new LocationResponse instance using the specified properties.
       * @function create
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {openbts.locations.ILocationResponse=} [properties] Properties to set
       * @returns {openbts.locations.LocationResponse} LocationResponse instance
       */
      LocationResponse.create = function create(properties) {
        return new LocationResponse(properties);
      };

      /**
       * Encodes the specified LocationResponse message. Does not implicitly {@link openbts.locations.LocationResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {openbts.locations.ILocationResponse} message LocationResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && Object.hasOwnProperty.call(message, "data"))
          $root.openbts.locations.Location.encode(message.data, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified LocationResponse message, length delimited. Does not implicitly {@link openbts.locations.LocationResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {openbts.locations.ILocationResponse} message LocationResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a LocationResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.locations.LocationResponse} LocationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.locations.LocationResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.data = $root.openbts.locations.Location.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a LocationResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.locations.LocationResponse} LocationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a LocationResponse message.
       * @function verify
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      LocationResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          let error = $root.openbts.locations.Location.verify(message.data, long + 1);
          if (error) return "data." + error;
        }
        return null;
      };

      /**
       * Creates a LocationResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.locations.LocationResponse} LocationResponse
       */
      LocationResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.locations.LocationResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.locations.LocationResponse();
        if (object.data != null) {
          if (typeof object.data !== "object") throw TypeError(".openbts.locations.LocationResponse.data: object expected");
          message.data = $root.openbts.locations.Location.fromObject(object.data, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a LocationResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {openbts.locations.LocationResponse} message LocationResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      LocationResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) object.data = null;
        if (message.data != null && message.hasOwnProperty("data")) object.data = $root.openbts.locations.Location.toObject(message.data, options);
        return object;
      };

      /**
       * Converts this LocationResponse to JSON.
       * @function toJSON
       * @memberof openbts.locations.LocationResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      LocationResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for LocationResponse
       * @function getTypeUrl
       * @memberof openbts.locations.LocationResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      LocationResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.locations.LocationResponse";
      };

      return LocationResponse;
    })();

    return locations;
  })();

  openbts.stations = (function () {
    /**
     * Namespace stations.
     * @memberof openbts
     * @namespace
     */
    const stations = {};

    stations.StationCell = (function () {
      /**
       * Properties of a StationCell.
       * @memberof openbts.stations
       * @interface IStationCell
       * @property {number|null} [id] StationCell id
       * @property {openbts.Rat|null} [rat] StationCell rat
       * @property {string|null} [notes] StationCell notes
       * @property {openbts.IBand|null} [band] StationCell band
       * @property {boolean|null} [is_confirmed] StationCell is_confirmed
       * @property {google.protobuf.IStruct|null} [details] StationCell details
       * @property {string|null} [updatedAt] StationCell updatedAt
       * @property {string|null} [createdAt] StationCell createdAt
       */

      /**
       * Constructs a new StationCell.
       * @memberof openbts.stations
       * @classdesc Represents a StationCell.
       * @implements IStationCell
       * @constructor
       * @param {openbts.stations.IStationCell=} [properties] Properties to set
       */
      function StationCell(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * StationCell id.
       * @member {number} id
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.id = 0;

      /**
       * StationCell rat.
       * @member {openbts.Rat} rat
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.rat = 0;

      /**
       * StationCell notes.
       * @member {string} notes
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.notes = "";

      /**
       * StationCell band.
       * @member {openbts.IBand|null|undefined} band
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.band = null;

      /**
       * StationCell is_confirmed.
       * @member {boolean} is_confirmed
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.is_confirmed = false;

      /**
       * StationCell details.
       * @member {google.protobuf.IStruct|null|undefined} details
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.details = null;

      /**
       * StationCell updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.updatedAt = "";

      /**
       * StationCell createdAt.
       * @member {string} createdAt
       * @memberof openbts.stations.StationCell
       * @instance
       */
      StationCell.prototype.createdAt = "";

      /**
       * Creates a new StationCell instance using the specified properties.
       * @function create
       * @memberof openbts.stations.StationCell
       * @static
       * @param {openbts.stations.IStationCell=} [properties] Properties to set
       * @returns {openbts.stations.StationCell} StationCell instance
       */
      StationCell.create = function create(properties) {
        return new StationCell(properties);
      };

      /**
       * Encodes the specified StationCell message. Does not implicitly {@link openbts.stations.StationCell.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.StationCell
       * @static
       * @param {openbts.stations.IStationCell} message StationCell message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      StationCell.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.rat != null && Object.hasOwnProperty.call(message, "rat")) writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.rat);
        if (message.notes != null && Object.hasOwnProperty.call(message, "notes")) writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.notes);
        if (message.band != null && Object.hasOwnProperty.call(message, "band"))
          $root.openbts.Band.encode(message.band, writer.uint32(/* id 4, wireType 2 =*/ 34).fork()).ldelim();
        if (message.is_confirmed != null && Object.hasOwnProperty.call(message, "is_confirmed"))
          writer.uint32(/* id 5, wireType 0 =*/ 40).bool(message.is_confirmed);
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.createdAt);
        if (message.details != null && Object.hasOwnProperty.call(message, "details"))
          $root.google.protobuf.Struct.encode(message.details, writer.uint32(/* id 8, wireType 2 =*/ 66).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified StationCell message, length delimited. Does not implicitly {@link openbts.stations.StationCell.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.StationCell
       * @static
       * @param {openbts.stations.IStationCell} message StationCell message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      StationCell.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a StationCell message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.StationCell
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.StationCell} StationCell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      StationCell.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.StationCell();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.rat = reader.int32();
              break;
            }
            case 3: {
              message.notes = reader.string();
              break;
            }
            case 4: {
              message.band = $root.openbts.Band.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 5: {
              message.is_confirmed = reader.bool();
              break;
            }
            case 8: {
              message.details = $root.google.protobuf.Struct.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 6: {
              message.updatedAt = reader.string();
              break;
            }
            case 7: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a StationCell message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.StationCell
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.StationCell} StationCell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      StationCell.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a StationCell message.
       * @function verify
       * @memberof openbts.stations.StationCell
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      StationCell.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.rat != null && message.hasOwnProperty("rat"))
          switch (message.rat) {
            default:
              return "rat: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
          }
        if (message.notes != null && message.hasOwnProperty("notes")) if (!$util.isString(message.notes)) return "notes: string expected";
        if (message.band != null && message.hasOwnProperty("band")) {
          let error = $root.openbts.Band.verify(message.band, long + 1);
          if (error) return "band." + error;
        }
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed"))
          if (typeof message.is_confirmed !== "boolean") return "is_confirmed: boolean expected";
        if (message.details != null && message.hasOwnProperty("details")) {
          let error = $root.google.protobuf.Struct.verify(message.details, long + 1);
          if (error) return "details." + error;
        }
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates a StationCell message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.StationCell
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.StationCell} StationCell
       */
      StationCell.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.StationCell) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.StationCell();
        if (object.id != null) message.id = object.id | 0;
        switch (object.rat) {
          default:
            if (typeof object.rat === "number") {
              message.rat = object.rat;
              break;
            }
            break;
          case "GSM":
          case 0:
            message.rat = 0;
            break;
          case "CDMA":
          case 1:
            message.rat = 1;
            break;
          case "UMTS":
          case 2:
            message.rat = 2;
            break;
          case "LTE":
          case 3:
            message.rat = 3;
            break;
          case "NR":
          case 4:
            message.rat = 4;
            break;
          case "IOT":
          case 5:
            message.rat = 5;
            break;
        }
        if (object.notes != null) message.notes = String(object.notes);
        if (object.band != null) {
          if (typeof object.band !== "object") throw TypeError(".openbts.stations.StationCell.band: object expected");
          message.band = $root.openbts.Band.fromObject(object.band, long + 1);
        }
        if (object.is_confirmed != null) message.is_confirmed = Boolean(object.is_confirmed);
        if (object.details != null) {
          if (typeof object.details !== "object") throw TypeError(".openbts.stations.StationCell.details: object expected");
          message.details = $root.google.protobuf.Struct.fromObject(object.details, long + 1);
        }
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from a StationCell message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.StationCell
       * @static
       * @param {openbts.stations.StationCell} message StationCell
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      StationCell.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.rat = options.enums === String ? "GSM" : 0;
          object.notes = "";
          object.band = null;
          object.is_confirmed = false;
          object.updatedAt = "";
          object.createdAt = "";
          object.details = null;
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.rat != null && message.hasOwnProperty("rat"))
          object.rat =
            options.enums === String ? ($root.openbts.Rat[message.rat] === undefined ? message.rat : $root.openbts.Rat[message.rat]) : message.rat;
        if (message.notes != null && message.hasOwnProperty("notes")) object.notes = message.notes;
        if (message.band != null && message.hasOwnProperty("band")) object.band = $root.openbts.Band.toObject(message.band, options);
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed")) object.is_confirmed = message.is_confirmed;
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        if (message.details != null && message.hasOwnProperty("details"))
          object.details = $root.google.protobuf.Struct.toObject(message.details, options);
        return object;
      };

      /**
       * Converts this StationCell to JSON.
       * @function toJSON
       * @memberof openbts.stations.StationCell
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      StationCell.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for StationCell
       * @function getTypeUrl
       * @memberof openbts.stations.StationCell
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      StationCell.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.StationCell";
      };

      return StationCell;
    })();

    /**
     * NRType enum.
     * @name openbts.stations.NRType
     * @enum {number}
     * @property {number} unknown=0 unknown value
     * @property {number} nsa=1 nsa value
     * @property {number} sa=2 sa value
     */
    stations.NRType = (function () {
      const valuesById = {},
        values = Object.create(valuesById);
      values[(valuesById[0] = "unknown")] = 0;
      values[(valuesById[1] = "nsa")] = 1;
      values[(valuesById[2] = "sa")] = 2;
      return values;
    })();

    stations.Cell = (function () {
      /**
       * Properties of a Cell.
       * @memberof openbts.stations
       * @interface ICell
       * @property {number|null} [id] Cell id
       * @property {number|null} [station_id] Cell station_id
       * @property {openbts.Rat|null} [rat] Cell rat
       * @property {string|null} [notes] Cell notes
       * @property {openbts.IBand|null} [band] Cell band
       * @property {boolean|null} [is_confirmed] Cell is_confirmed
       * @property {google.protobuf.IStruct|null} [details] Cell details
       * @property {string|null} [updatedAt] Cell updatedAt
       * @property {string|null} [createdAt] Cell createdAt
       */

      /**
       * Constructs a new Cell.
       * @memberof openbts.stations
       * @classdesc Represents a Cell.
       * @implements ICell
       * @constructor
       * @param {openbts.stations.ICell=} [properties] Properties to set
       */
      function Cell(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Cell id.
       * @member {number} id
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.id = 0;

      /**
       * Cell station_id.
       * @member {number} station_id
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.station_id = 0;

      /**
       * Cell rat.
       * @member {openbts.Rat} rat
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.rat = 0;

      /**
       * Cell notes.
       * @member {string} notes
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.notes = "";

      /**
       * Cell band.
       * @member {openbts.IBand|null|undefined} band
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.band = null;

      /**
       * Cell is_confirmed.
       * @member {boolean} is_confirmed
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.is_confirmed = false;

      /**
       * Cell details.
       * @member {google.protobuf.IStruct|null|undefined} details
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.details = null;

      /**
       * Cell updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.updatedAt = "";

      /**
       * Cell createdAt.
       * @member {string} createdAt
       * @memberof openbts.stations.Cell
       * @instance
       */
      Cell.prototype.createdAt = "";

      /**
       * Creates a new Cell instance using the specified properties.
       * @function create
       * @memberof openbts.stations.Cell
       * @static
       * @param {openbts.stations.ICell=} [properties] Properties to set
       * @returns {openbts.stations.Cell} Cell instance
       */
      Cell.create = function create(properties) {
        return new Cell(properties);
      };

      /**
       * Encodes the specified Cell message. Does not implicitly {@link openbts.stations.Cell.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.Cell
       * @static
       * @param {openbts.stations.ICell} message Cell message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Cell.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.station_id != null && Object.hasOwnProperty.call(message, "station_id"))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.station_id);
        if (message.rat != null && Object.hasOwnProperty.call(message, "rat")) writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.rat);
        if (message.notes != null && Object.hasOwnProperty.call(message, "notes")) writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.notes);
        if (message.band != null && Object.hasOwnProperty.call(message, "band"))
          $root.openbts.Band.encode(message.band, writer.uint32(/* id 5, wireType 2 =*/ 42).fork()).ldelim();
        if (message.is_confirmed != null && Object.hasOwnProperty.call(message, "is_confirmed"))
          writer.uint32(/* id 6, wireType 0 =*/ 48).bool(message.is_confirmed);
        if (message.details != null && Object.hasOwnProperty.call(message, "details"))
          $root.google.protobuf.Struct.encode(message.details, writer.uint32(/* id 7, wireType 2 =*/ 58).fork()).ldelim();
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.createdAt);
        return writer;
      };

      /**
       * Encodes the specified Cell message, length delimited. Does not implicitly {@link openbts.stations.Cell.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.Cell
       * @static
       * @param {openbts.stations.ICell} message Cell message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Cell.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Cell message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.Cell
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.Cell} Cell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Cell.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.Cell();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.station_id = reader.int32();
              break;
            }
            case 3: {
              message.rat = reader.int32();
              break;
            }
            case 4: {
              message.notes = reader.string();
              break;
            }
            case 5: {
              message.band = $root.openbts.Band.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 6: {
              message.is_confirmed = reader.bool();
              break;
            }
            case 7: {
              message.details = $root.google.protobuf.Struct.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 8: {
              message.updatedAt = reader.string();
              break;
            }
            case 9: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Cell message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.Cell
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.Cell} Cell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Cell.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Cell message.
       * @function verify
       * @memberof openbts.stations.Cell
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Cell.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.station_id != null && message.hasOwnProperty("station_id"))
          if (!$util.isInteger(message.station_id)) return "station_id: integer expected";
        if (message.rat != null && message.hasOwnProperty("rat"))
          switch (message.rat) {
            default:
              return "rat: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
          }
        if (message.notes != null && message.hasOwnProperty("notes")) if (!$util.isString(message.notes)) return "notes: string expected";
        if (message.band != null && message.hasOwnProperty("band")) {
          let error = $root.openbts.Band.verify(message.band, long + 1);
          if (error) return "band." + error;
        }
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed"))
          if (typeof message.is_confirmed !== "boolean") return "is_confirmed: boolean expected";
        if (message.details != null && message.hasOwnProperty("details")) {
          let error = $root.google.protobuf.Struct.verify(message.details, long + 1);
          if (error) return "details." + error;
        }
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates a Cell message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.Cell
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.Cell} Cell
       */
      Cell.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.Cell) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.Cell();
        if (object.id != null) message.id = object.id | 0;
        if (object.station_id != null) message.station_id = object.station_id | 0;
        switch (object.rat) {
          default:
            if (typeof object.rat === "number") {
              message.rat = object.rat;
              break;
            }
            break;
          case "GSM":
          case 0:
            message.rat = 0;
            break;
          case "CDMA":
          case 1:
            message.rat = 1;
            break;
          case "UMTS":
          case 2:
            message.rat = 2;
            break;
          case "LTE":
          case 3:
            message.rat = 3;
            break;
          case "NR":
          case 4:
            message.rat = 4;
            break;
          case "IOT":
          case 5:
            message.rat = 5;
            break;
        }
        if (object.notes != null) message.notes = String(object.notes);
        if (object.band != null) {
          if (typeof object.band !== "object") throw TypeError(".openbts.stations.Cell.band: object expected");
          message.band = $root.openbts.Band.fromObject(object.band, long + 1);
        }
        if (object.is_confirmed != null) message.is_confirmed = Boolean(object.is_confirmed);
        if (object.details != null) {
          if (typeof object.details !== "object") throw TypeError(".openbts.stations.Cell.details: object expected");
          message.details = $root.google.protobuf.Struct.fromObject(object.details, long + 1);
        }
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from a Cell message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.Cell
       * @static
       * @param {openbts.stations.Cell} message Cell
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Cell.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.station_id = 0;
          object.rat = options.enums === String ? "GSM" : 0;
          object.notes = "";
          object.band = null;
          object.is_confirmed = false;
          object.details = null;
          object.updatedAt = "";
          object.createdAt = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.station_id != null && message.hasOwnProperty("station_id")) object.station_id = message.station_id;
        if (message.rat != null && message.hasOwnProperty("rat"))
          object.rat =
            options.enums === String ? ($root.openbts.Rat[message.rat] === undefined ? message.rat : $root.openbts.Rat[message.rat]) : message.rat;
        if (message.notes != null && message.hasOwnProperty("notes")) object.notes = message.notes;
        if (message.band != null && message.hasOwnProperty("band")) object.band = $root.openbts.Band.toObject(message.band, options);
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed")) object.is_confirmed = message.is_confirmed;
        if (message.details != null && message.hasOwnProperty("details"))
          object.details = $root.google.protobuf.Struct.toObject(message.details, options);
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        return object;
      };

      /**
       * Converts this Cell to JSON.
       * @function toJSON
       * @memberof openbts.stations.Cell
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Cell.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Cell
       * @function getTypeUrl
       * @memberof openbts.stations.Cell
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Cell.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.Cell";
      };

      return Cell;
    })();

    stations.CellWithoutDetails = (function () {
      /**
       * Properties of a CellWithoutDetails.
       * @memberof openbts.stations
       * @interface ICellWithoutDetails
       * @property {number|null} [id] CellWithoutDetails id
       * @property {number|null} [station_id] CellWithoutDetails station_id
       * @property {openbts.Rat|null} [rat] CellWithoutDetails rat
       * @property {string|null} [notes] CellWithoutDetails notes
       * @property {openbts.IBand|null} [band] CellWithoutDetails band
       * @property {boolean|null} [is_confirmed] CellWithoutDetails is_confirmed
       * @property {string|null} [updatedAt] CellWithoutDetails updatedAt
       * @property {string|null} [createdAt] CellWithoutDetails createdAt
       */

      /**
       * Constructs a new CellWithoutDetails.
       * @memberof openbts.stations
       * @classdesc Represents a CellWithoutDetails.
       * @implements ICellWithoutDetails
       * @constructor
       * @param {openbts.stations.ICellWithoutDetails=} [properties] Properties to set
       */
      function CellWithoutDetails(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * CellWithoutDetails id.
       * @member {number} id
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.id = 0;

      /**
       * CellWithoutDetails station_id.
       * @member {number} station_id
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.station_id = 0;

      /**
       * CellWithoutDetails rat.
       * @member {openbts.Rat} rat
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.rat = 0;

      /**
       * CellWithoutDetails notes.
       * @member {string} notes
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.notes = "";

      /**
       * CellWithoutDetails band.
       * @member {openbts.IBand|null|undefined} band
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.band = null;

      /**
       * CellWithoutDetails is_confirmed.
       * @member {boolean} is_confirmed
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.is_confirmed = false;

      /**
       * CellWithoutDetails updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.updatedAt = "";

      /**
       * CellWithoutDetails createdAt.
       * @member {string} createdAt
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       */
      CellWithoutDetails.prototype.createdAt = "";

      /**
       * Creates a new CellWithoutDetails instance using the specified properties.
       * @function create
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {openbts.stations.ICellWithoutDetails=} [properties] Properties to set
       * @returns {openbts.stations.CellWithoutDetails} CellWithoutDetails instance
       */
      CellWithoutDetails.create = function create(properties) {
        return new CellWithoutDetails(properties);
      };

      /**
       * Encodes the specified CellWithoutDetails message. Does not implicitly {@link openbts.stations.CellWithoutDetails.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {openbts.stations.ICellWithoutDetails} message CellWithoutDetails message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      CellWithoutDetails.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.station_id != null && Object.hasOwnProperty.call(message, "station_id"))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.station_id);
        if (message.rat != null && Object.hasOwnProperty.call(message, "rat")) writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.rat);
        if (message.notes != null && Object.hasOwnProperty.call(message, "notes")) writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.notes);
        if (message.band != null && Object.hasOwnProperty.call(message, "band"))
          $root.openbts.Band.encode(message.band, writer.uint32(/* id 5, wireType 2 =*/ 42).fork()).ldelim();
        if (message.is_confirmed != null && Object.hasOwnProperty.call(message, "is_confirmed"))
          writer.uint32(/* id 6, wireType 0 =*/ 48).bool(message.is_confirmed);
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.createdAt);
        return writer;
      };

      /**
       * Encodes the specified CellWithoutDetails message, length delimited. Does not implicitly {@link openbts.stations.CellWithoutDetails.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {openbts.stations.ICellWithoutDetails} message CellWithoutDetails message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      CellWithoutDetails.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a CellWithoutDetails message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.CellWithoutDetails} CellWithoutDetails
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      CellWithoutDetails.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.CellWithoutDetails();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.station_id = reader.int32();
              break;
            }
            case 3: {
              message.rat = reader.int32();
              break;
            }
            case 4: {
              message.notes = reader.string();
              break;
            }
            case 5: {
              message.band = $root.openbts.Band.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 6: {
              message.is_confirmed = reader.bool();
              break;
            }
            case 8: {
              message.updatedAt = reader.string();
              break;
            }
            case 9: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a CellWithoutDetails message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.CellWithoutDetails} CellWithoutDetails
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      CellWithoutDetails.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a CellWithoutDetails message.
       * @function verify
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      CellWithoutDetails.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.station_id != null && message.hasOwnProperty("station_id"))
          if (!$util.isInteger(message.station_id)) return "station_id: integer expected";
        if (message.rat != null && message.hasOwnProperty("rat"))
          switch (message.rat) {
            default:
              return "rat: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
          }
        if (message.notes != null && message.hasOwnProperty("notes")) if (!$util.isString(message.notes)) return "notes: string expected";
        if (message.band != null && message.hasOwnProperty("band")) {
          let error = $root.openbts.Band.verify(message.band, long + 1);
          if (error) return "band." + error;
        }
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed"))
          if (typeof message.is_confirmed !== "boolean") return "is_confirmed: boolean expected";
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates a CellWithoutDetails message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.CellWithoutDetails} CellWithoutDetails
       */
      CellWithoutDetails.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.CellWithoutDetails) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.CellWithoutDetails();
        if (object.id != null) message.id = object.id | 0;
        if (object.station_id != null) message.station_id = object.station_id | 0;
        switch (object.rat) {
          default:
            if (typeof object.rat === "number") {
              message.rat = object.rat;
              break;
            }
            break;
          case "GSM":
          case 0:
            message.rat = 0;
            break;
          case "CDMA":
          case 1:
            message.rat = 1;
            break;
          case "UMTS":
          case 2:
            message.rat = 2;
            break;
          case "LTE":
          case 3:
            message.rat = 3;
            break;
          case "NR":
          case 4:
            message.rat = 4;
            break;
          case "IOT":
          case 5:
            message.rat = 5;
            break;
        }
        if (object.notes != null) message.notes = String(object.notes);
        if (object.band != null) {
          if (typeof object.band !== "object") throw TypeError(".openbts.stations.CellWithoutDetails.band: object expected");
          message.band = $root.openbts.Band.fromObject(object.band, long + 1);
        }
        if (object.is_confirmed != null) message.is_confirmed = Boolean(object.is_confirmed);
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from a CellWithoutDetails message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {openbts.stations.CellWithoutDetails} message CellWithoutDetails
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      CellWithoutDetails.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.station_id = 0;
          object.rat = options.enums === String ? "GSM" : 0;
          object.notes = "";
          object.band = null;
          object.is_confirmed = false;
          object.updatedAt = "";
          object.createdAt = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.station_id != null && message.hasOwnProperty("station_id")) object.station_id = message.station_id;
        if (message.rat != null && message.hasOwnProperty("rat"))
          object.rat =
            options.enums === String ? ($root.openbts.Rat[message.rat] === undefined ? message.rat : $root.openbts.Rat[message.rat]) : message.rat;
        if (message.notes != null && message.hasOwnProperty("notes")) object.notes = message.notes;
        if (message.band != null && message.hasOwnProperty("band")) object.band = $root.openbts.Band.toObject(message.band, options);
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed")) object.is_confirmed = message.is_confirmed;
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        return object;
      };

      /**
       * Converts this CellWithoutDetails to JSON.
       * @function toJSON
       * @memberof openbts.stations.CellWithoutDetails
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      CellWithoutDetails.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for CellWithoutDetails
       * @function getTypeUrl
       * @memberof openbts.stations.CellWithoutDetails
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      CellWithoutDetails.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.CellWithoutDetails";
      };

      return CellWithoutDetails;
    })();

    stations.ExtraIdentificators = (function () {
      /**
       * Properties of an ExtraIdentificators.
       * @memberof openbts.stations
       * @interface IExtraIdentificators
       * @property {number|null} [id] ExtraIdentificators id
       * @property {number|null} [networks_id] ExtraIdentificators networks_id
       * @property {string|null} [networks_name] ExtraIdentificators networks_name
       * @property {string|null} [mno_name] ExtraIdentificators mno_name
       * @property {string|null} [updatedAt] ExtraIdentificators updatedAt
       * @property {string|null} [createdAt] ExtraIdentificators createdAt
       */

      /**
       * Constructs a new ExtraIdentificators.
       * @memberof openbts.stations
       * @classdesc Represents an ExtraIdentificators.
       * @implements IExtraIdentificators
       * @constructor
       * @param {openbts.stations.IExtraIdentificators=} [properties] Properties to set
       */
      function ExtraIdentificators(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * ExtraIdentificators id.
       * @member {number} id
       * @memberof openbts.stations.ExtraIdentificators
       * @instance
       */
      ExtraIdentificators.prototype.id = 0;

      /**
       * ExtraIdentificators networks_id.
       * @member {number} networks_id
       * @memberof openbts.stations.ExtraIdentificators
       * @instance
       */
      ExtraIdentificators.prototype.networks_id = 0;

      /**
       * ExtraIdentificators networks_name.
       * @member {string} networks_name
       * @memberof openbts.stations.ExtraIdentificators
       * @instance
       */
      ExtraIdentificators.prototype.networks_name = "";

      /**
       * ExtraIdentificators mno_name.
       * @member {string} mno_name
       * @memberof openbts.stations.ExtraIdentificators
       * @instance
       */
      ExtraIdentificators.prototype.mno_name = "";

      /**
       * ExtraIdentificators updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.stations.ExtraIdentificators
       * @instance
       */
      ExtraIdentificators.prototype.updatedAt = "";

      /**
       * ExtraIdentificators createdAt.
       * @member {string} createdAt
       * @memberof openbts.stations.ExtraIdentificators
       * @instance
       */
      ExtraIdentificators.prototype.createdAt = "";

      /**
       * Creates a new ExtraIdentificators instance using the specified properties.
       * @function create
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {openbts.stations.IExtraIdentificators=} [properties] Properties to set
       * @returns {openbts.stations.ExtraIdentificators} ExtraIdentificators instance
       */
      ExtraIdentificators.create = function create(properties) {
        return new ExtraIdentificators(properties);
      };

      /**
       * Encodes the specified ExtraIdentificators message. Does not implicitly {@link openbts.stations.ExtraIdentificators.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {openbts.stations.IExtraIdentificators} message ExtraIdentificators message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      ExtraIdentificators.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.networks_id != null && Object.hasOwnProperty.call(message, "networks_id"))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.networks_id);
        if (message.networks_name != null && Object.hasOwnProperty.call(message, "networks_name"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.networks_name);
        if (message.mno_name != null && Object.hasOwnProperty.call(message, "mno_name"))
          writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.mno_name);
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.createdAt);
        return writer;
      };

      /**
       * Encodes the specified ExtraIdentificators message, length delimited. Does not implicitly {@link openbts.stations.ExtraIdentificators.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {openbts.stations.IExtraIdentificators} message ExtraIdentificators message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      ExtraIdentificators.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes an ExtraIdentificators message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.ExtraIdentificators} ExtraIdentificators
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      ExtraIdentificators.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.ExtraIdentificators();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.networks_id = reader.int32();
              break;
            }
            case 3: {
              message.networks_name = reader.string();
              break;
            }
            case 4: {
              message.mno_name = reader.string();
              break;
            }
            case 5: {
              message.updatedAt = reader.string();
              break;
            }
            case 6: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes an ExtraIdentificators message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.ExtraIdentificators} ExtraIdentificators
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      ExtraIdentificators.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies an ExtraIdentificators message.
       * @function verify
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      ExtraIdentificators.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.networks_id != null && message.hasOwnProperty("networks_id"))
          if (!$util.isInteger(message.networks_id)) return "networks_id: integer expected";
        if (message.networks_name != null && message.hasOwnProperty("networks_name"))
          if (!$util.isString(message.networks_name)) return "networks_name: string expected";
        if (message.mno_name != null && message.hasOwnProperty("mno_name")) if (!$util.isString(message.mno_name)) return "mno_name: string expected";
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates an ExtraIdentificators message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.ExtraIdentificators} ExtraIdentificators
       */
      ExtraIdentificators.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.ExtraIdentificators) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.ExtraIdentificators();
        if (object.id != null) message.id = object.id | 0;
        if (object.networks_id != null) message.networks_id = object.networks_id | 0;
        if (object.networks_name != null) message.networks_name = String(object.networks_name);
        if (object.mno_name != null) message.mno_name = String(object.mno_name);
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from an ExtraIdentificators message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {openbts.stations.ExtraIdentificators} message ExtraIdentificators
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      ExtraIdentificators.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.networks_id = 0;
          object.networks_name = "";
          object.mno_name = "";
          object.updatedAt = "";
          object.createdAt = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.networks_id != null && message.hasOwnProperty("networks_id")) object.networks_id = message.networks_id;
        if (message.networks_name != null && message.hasOwnProperty("networks_name")) object.networks_name = message.networks_name;
        if (message.mno_name != null && message.hasOwnProperty("mno_name")) object.mno_name = message.mno_name;
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        return object;
      };

      /**
       * Converts this ExtraIdentificators to JSON.
       * @function toJSON
       * @memberof openbts.stations.ExtraIdentificators
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      ExtraIdentificators.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for ExtraIdentificators
       * @function getTypeUrl
       * @memberof openbts.stations.ExtraIdentificators
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      ExtraIdentificators.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.ExtraIdentificators";
      };

      return ExtraIdentificators;
    })();

    stations.Station = (function () {
      /**
       * Properties of a Station.
       * @memberof openbts.stations
       * @interface IStation
       * @property {number|null} [id] Station id
       * @property {string|null} [station_id] Station station_id
       * @property {string|null} [notes] Station notes
       * @property {string|null} [extra_address] Station extra_address
       * @property {Array.<openbts.stations.IStationCell>|null} [cells] Station cells
       * @property {openbts.stations.IExtraIdentificators|null} [extra_identificators] Station extra_identificators
       * @property {openbts.locations.ILocation|null} [location] Station location
       * @property {openbts.IOperator|null} [operator] Station operator
       * @property {boolean|null} [is_confirmed] Station is_confirmed
       * @property {string|null} [updatedAt] Station updatedAt
       * @property {string|null} [createdAt] Station createdAt
       */

      /**
       * Constructs a new Station.
       * @memberof openbts.stations
       * @classdesc Represents a Station.
       * @implements IStation
       * @constructor
       * @param {openbts.stations.IStation=} [properties] Properties to set
       */
      function Station(properties) {
        this.cells = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Station id.
       * @member {number} id
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.id = 0;

      /**
       * Station station_id.
       * @member {string} station_id
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.station_id = "";

      /**
       * Station notes.
       * @member {string} notes
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.notes = "";

      /**
       * Station extra_address.
       * @member {string} extra_address
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.extra_address = "";

      /**
       * Station cells.
       * @member {Array.<openbts.stations.IStationCell>} cells
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.cells = $util.emptyArray;

      /**
       * Station extra_identificators.
       * @member {openbts.stations.IExtraIdentificators|null|undefined} extra_identificators
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.extra_identificators = null;

      /**
       * Station location.
       * @member {openbts.locations.ILocation|null|undefined} location
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.location = null;

      /**
       * Station operator.
       * @member {openbts.IOperator|null|undefined} operator
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.operator = null;

      /**
       * Station is_confirmed.
       * @member {boolean} is_confirmed
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.is_confirmed = false;

      /**
       * Station updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.updatedAt = "";

      /**
       * Station createdAt.
       * @member {string} createdAt
       * @memberof openbts.stations.Station
       * @instance
       */
      Station.prototype.createdAt = "";

      /**
       * Creates a new Station instance using the specified properties.
       * @function create
       * @memberof openbts.stations.Station
       * @static
       * @param {openbts.stations.IStation=} [properties] Properties to set
       * @returns {openbts.stations.Station} Station instance
       */
      Station.create = function create(properties) {
        return new Station(properties);
      };

      /**
       * Encodes the specified Station message. Does not implicitly {@link openbts.stations.Station.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.Station
       * @static
       * @param {openbts.stations.IStation} message Station message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Station.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.station_id != null && Object.hasOwnProperty.call(message, "station_id"))
          writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.station_id);
        if (message.notes != null && Object.hasOwnProperty.call(message, "notes")) writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.notes);
        if (message.extra_address != null && Object.hasOwnProperty.call(message, "extra_address"))
          writer.uint32(/* id 4, wireType 2 =*/ 34).string(message.extra_address);
        if (message.cells != null && message.cells.length)
          for (let i = 0; i < message.cells.length; ++i)
            $root.openbts.stations.StationCell.encode(message.cells[i], writer.uint32(/* id 5, wireType 2 =*/ 42).fork()).ldelim();
        if (message.extra_identificators != null && Object.hasOwnProperty.call(message, "extra_identificators"))
          $root.openbts.stations.ExtraIdentificators.encode(message.extra_identificators, writer.uint32(/* id 6, wireType 2 =*/ 50).fork()).ldelim();
        if (message.location != null && Object.hasOwnProperty.call(message, "location"))
          $root.openbts.locations.Location.encode(message.location, writer.uint32(/* id 7, wireType 2 =*/ 58).fork()).ldelim();
        if (message.operator != null && Object.hasOwnProperty.call(message, "operator"))
          $root.openbts.Operator.encode(message.operator, writer.uint32(/* id 8, wireType 2 =*/ 66).fork()).ldelim();
        if (message.is_confirmed != null && Object.hasOwnProperty.call(message, "is_confirmed"))
          writer.uint32(/* id 9, wireType 0 =*/ 72).bool(message.is_confirmed);
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 10, wireType 2 =*/ 82).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.createdAt);
        return writer;
      };

      /**
       * Encodes the specified Station message, length delimited. Does not implicitly {@link openbts.stations.Station.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.Station
       * @static
       * @param {openbts.stations.IStation} message Station message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Station.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Station message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.Station
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.Station} Station
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Station.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.Station();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.station_id = reader.string();
              break;
            }
            case 3: {
              message.notes = reader.string();
              break;
            }
            case 4: {
              message.extra_address = reader.string();
              break;
            }
            case 5: {
              if (!(message.cells && message.cells.length)) message.cells = [];
              message.cells.push($root.openbts.stations.StationCell.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 6: {
              message.extra_identificators = $root.openbts.stations.ExtraIdentificators.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 7: {
              message.location = $root.openbts.locations.Location.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 8: {
              message.operator = $root.openbts.Operator.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 9: {
              message.is_confirmed = reader.bool();
              break;
            }
            case 10: {
              message.updatedAt = reader.string();
              break;
            }
            case 11: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Station message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.Station
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.Station} Station
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Station.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Station message.
       * @function verify
       * @memberof openbts.stations.Station
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Station.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.station_id != null && message.hasOwnProperty("station_id"))
          if (!$util.isString(message.station_id)) return "station_id: string expected";
        if (message.notes != null && message.hasOwnProperty("notes")) if (!$util.isString(message.notes)) return "notes: string expected";
        if (message.extra_address != null && message.hasOwnProperty("extra_address"))
          if (!$util.isString(message.extra_address)) return "extra_address: string expected";
        if (message.cells != null && message.hasOwnProperty("cells")) {
          if (!Array.isArray(message.cells)) return "cells: array expected";
          for (let i = 0; i < message.cells.length; ++i) {
            let error = $root.openbts.stations.StationCell.verify(message.cells[i], long + 1);
            if (error) return "cells." + error;
          }
        }
        if (message.extra_identificators != null && message.hasOwnProperty("extra_identificators")) {
          let error = $root.openbts.stations.ExtraIdentificators.verify(message.extra_identificators, long + 1);
          if (error) return "extra_identificators." + error;
        }
        if (message.location != null && message.hasOwnProperty("location")) {
          let error = $root.openbts.locations.Location.verify(message.location, long + 1);
          if (error) return "location." + error;
        }
        if (message.operator != null && message.hasOwnProperty("operator")) {
          let error = $root.openbts.Operator.verify(message.operator, long + 1);
          if (error) return "operator." + error;
        }
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed"))
          if (typeof message.is_confirmed !== "boolean") return "is_confirmed: boolean expected";
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates a Station message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.Station
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.Station} Station
       */
      Station.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.Station) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.Station();
        if (object.id != null) message.id = object.id | 0;
        if (object.station_id != null) message.station_id = String(object.station_id);
        if (object.notes != null) message.notes = String(object.notes);
        if (object.extra_address != null) message.extra_address = String(object.extra_address);
        if (object.cells) {
          if (!Array.isArray(object.cells)) throw TypeError(".openbts.stations.Station.cells: array expected");
          message.cells = [];
          for (let i = 0; i < object.cells.length; ++i) {
            if (typeof object.cells[i] !== "object") throw TypeError(".openbts.stations.Station.cells: object expected");
            message.cells[i] = $root.openbts.stations.StationCell.fromObject(object.cells[i], long + 1);
          }
        }
        if (object.extra_identificators != null) {
          if (typeof object.extra_identificators !== "object") throw TypeError(".openbts.stations.Station.extra_identificators: object expected");
          message.extra_identificators = $root.openbts.stations.ExtraIdentificators.fromObject(object.extra_identificators, long + 1);
        }
        if (object.location != null) {
          if (typeof object.location !== "object") throw TypeError(".openbts.stations.Station.location: object expected");
          message.location = $root.openbts.locations.Location.fromObject(object.location, long + 1);
        }
        if (object.operator != null) {
          if (typeof object.operator !== "object") throw TypeError(".openbts.stations.Station.operator: object expected");
          message.operator = $root.openbts.Operator.fromObject(object.operator, long + 1);
        }
        if (object.is_confirmed != null) message.is_confirmed = Boolean(object.is_confirmed);
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from a Station message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.Station
       * @static
       * @param {openbts.stations.Station} message Station
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Station.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.cells = [];
        if (options.defaults) {
          object.id = 0;
          object.station_id = "";
          object.notes = "";
          object.extra_address = "";
          object.extra_identificators = null;
          object.location = null;
          object.operator = null;
          object.is_confirmed = false;
          object.updatedAt = "";
          object.createdAt = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.station_id != null && message.hasOwnProperty("station_id")) object.station_id = message.station_id;
        if (message.notes != null && message.hasOwnProperty("notes")) object.notes = message.notes;
        if (message.extra_address != null && message.hasOwnProperty("extra_address")) object.extra_address = message.extra_address;
        if (message.cells && message.cells.length) {
          object.cells = [];
          for (let j = 0; j < message.cells.length; ++j) object.cells[j] = $root.openbts.stations.StationCell.toObject(message.cells[j], options);
        }
        if (message.extra_identificators != null && message.hasOwnProperty("extra_identificators"))
          object.extra_identificators = $root.openbts.stations.ExtraIdentificators.toObject(message.extra_identificators, options);
        if (message.location != null && message.hasOwnProperty("location"))
          object.location = $root.openbts.locations.Location.toObject(message.location, options);
        if (message.operator != null && message.hasOwnProperty("operator"))
          object.operator = $root.openbts.Operator.toObject(message.operator, options);
        if (message.is_confirmed != null && message.hasOwnProperty("is_confirmed")) object.is_confirmed = message.is_confirmed;
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        return object;
      };

      /**
       * Converts this Station to JSON.
       * @function toJSON
       * @memberof openbts.stations.Station
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Station.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Station
       * @function getTypeUrl
       * @memberof openbts.stations.Station
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Station.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.Station";
      };

      return Station;
    })();

    stations.StationsResponse = (function () {
      /**
       * Properties of a StationsResponse.
       * @memberof openbts.stations
       * @interface IStationsResponse
       * @property {Array.<openbts.stations.IStation>|null} [data] StationsResponse data
       * @property {number|null} [totalCount] StationsResponse totalCount
       */

      /**
       * Constructs a new StationsResponse.
       * @memberof openbts.stations
       * @classdesc Represents a StationsResponse.
       * @implements IStationsResponse
       * @constructor
       * @param {openbts.stations.IStationsResponse=} [properties] Properties to set
       */
      function StationsResponse(properties) {
        this.data = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * StationsResponse data.
       * @member {Array.<openbts.stations.IStation>} data
       * @memberof openbts.stations.StationsResponse
       * @instance
       */
      StationsResponse.prototype.data = $util.emptyArray;

      /**
       * StationsResponse totalCount.
       * @member {number} totalCount
       * @memberof openbts.stations.StationsResponse
       * @instance
       */
      StationsResponse.prototype.totalCount = 0;

      /**
       * Creates a new StationsResponse instance using the specified properties.
       * @function create
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {openbts.stations.IStationsResponse=} [properties] Properties to set
       * @returns {openbts.stations.StationsResponse} StationsResponse instance
       */
      StationsResponse.create = function create(properties) {
        return new StationsResponse(properties);
      };

      /**
       * Encodes the specified StationsResponse message. Does not implicitly {@link openbts.stations.StationsResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {openbts.stations.IStationsResponse} message StationsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      StationsResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && message.data.length)
          for (let i = 0; i < message.data.length; ++i)
            $root.openbts.stations.Station.encode(message.data[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        if (message.totalCount != null && Object.hasOwnProperty.call(message, "totalCount"))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.totalCount);
        return writer;
      };

      /**
       * Encodes the specified StationsResponse message, length delimited. Does not implicitly {@link openbts.stations.StationsResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {openbts.stations.IStationsResponse} message StationsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      StationsResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a StationsResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.StationsResponse} StationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      StationsResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.StationsResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (!(message.data && message.data.length)) message.data = [];
              message.data.push($root.openbts.stations.Station.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 2: {
              message.totalCount = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a StationsResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.StationsResponse} StationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      StationsResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a StationsResponse message.
       * @function verify
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      StationsResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          if (!Array.isArray(message.data)) return "data: array expected";
          for (let i = 0; i < message.data.length; ++i) {
            let error = $root.openbts.stations.Station.verify(message.data[i], long + 1);
            if (error) return "data." + error;
          }
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount"))
          if (!$util.isInteger(message.totalCount)) return "totalCount: integer expected";
        return null;
      };

      /**
       * Creates a StationsResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.StationsResponse} StationsResponse
       */
      StationsResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.StationsResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.StationsResponse();
        if (object.data) {
          if (!Array.isArray(object.data)) throw TypeError(".openbts.stations.StationsResponse.data: array expected");
          message.data = [];
          for (let i = 0; i < object.data.length; ++i) {
            if (typeof object.data[i] !== "object") throw TypeError(".openbts.stations.StationsResponse.data: object expected");
            message.data[i] = $root.openbts.stations.Station.fromObject(object.data[i], long + 1);
          }
        }
        if (object.totalCount != null) message.totalCount = object.totalCount | 0;
        return message;
      };

      /**
       * Creates a plain object from a StationsResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {openbts.stations.StationsResponse} message StationsResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      StationsResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.data = [];
        if (options.defaults) object.totalCount = 0;
        if (message.data && message.data.length) {
          object.data = [];
          for (let j = 0; j < message.data.length; ++j) object.data[j] = $root.openbts.stations.Station.toObject(message.data[j], options);
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount")) object.totalCount = message.totalCount;
        return object;
      };

      /**
       * Converts this StationsResponse to JSON.
       * @function toJSON
       * @memberof openbts.stations.StationsResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      StationsResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for StationsResponse
       * @function getTypeUrl
       * @memberof openbts.stations.StationsResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      StationsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.StationsResponse";
      };

      return StationsResponse;
    })();

    stations.StationResponse = (function () {
      /**
       * Properties of a StationResponse.
       * @memberof openbts.stations
       * @interface IStationResponse
       * @property {openbts.stations.IStation|null} [data] StationResponse data
       */

      /**
       * Constructs a new StationResponse.
       * @memberof openbts.stations
       * @classdesc Represents a StationResponse.
       * @implements IStationResponse
       * @constructor
       * @param {openbts.stations.IStationResponse=} [properties] Properties to set
       */
      function StationResponse(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * StationResponse data.
       * @member {openbts.stations.IStation|null|undefined} data
       * @memberof openbts.stations.StationResponse
       * @instance
       */
      StationResponse.prototype.data = null;

      /**
       * Creates a new StationResponse instance using the specified properties.
       * @function create
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {openbts.stations.IStationResponse=} [properties] Properties to set
       * @returns {openbts.stations.StationResponse} StationResponse instance
       */
      StationResponse.create = function create(properties) {
        return new StationResponse(properties);
      };

      /**
       * Encodes the specified StationResponse message. Does not implicitly {@link openbts.stations.StationResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {openbts.stations.IStationResponse} message StationResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      StationResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && Object.hasOwnProperty.call(message, "data"))
          $root.openbts.stations.Station.encode(message.data, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified StationResponse message, length delimited. Does not implicitly {@link openbts.stations.StationResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {openbts.stations.IStationResponse} message StationResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      StationResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a StationResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.StationResponse} StationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      StationResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.StationResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.data = $root.openbts.stations.Station.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a StationResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.StationResponse} StationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      StationResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a StationResponse message.
       * @function verify
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      StationResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          let error = $root.openbts.stations.Station.verify(message.data, long + 1);
          if (error) return "data." + error;
        }
        return null;
      };

      /**
       * Creates a StationResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.StationResponse} StationResponse
       */
      StationResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.StationResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.StationResponse();
        if (object.data != null) {
          if (typeof object.data !== "object") throw TypeError(".openbts.stations.StationResponse.data: object expected");
          message.data = $root.openbts.stations.Station.fromObject(object.data, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a StationResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {openbts.stations.StationResponse} message StationResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      StationResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) object.data = null;
        if (message.data != null && message.hasOwnProperty("data")) object.data = $root.openbts.stations.Station.toObject(message.data, options);
        return object;
      };

      /**
       * Converts this StationResponse to JSON.
       * @function toJSON
       * @memberof openbts.stations.StationResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      StationResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for StationResponse
       * @function getTypeUrl
       * @memberof openbts.stations.StationResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      StationResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.StationResponse";
      };

      return StationResponse;
    })();

    stations.CellsResponse = (function () {
      /**
       * Properties of a CellsResponse.
       * @memberof openbts.stations
       * @interface ICellsResponse
       * @property {Array.<openbts.stations.ICell>|null} [data] CellsResponse data
       */

      /**
       * Constructs a new CellsResponse.
       * @memberof openbts.stations
       * @classdesc Represents a CellsResponse.
       * @implements ICellsResponse
       * @constructor
       * @param {openbts.stations.ICellsResponse=} [properties] Properties to set
       */
      function CellsResponse(properties) {
        this.data = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * CellsResponse data.
       * @member {Array.<openbts.stations.ICell>} data
       * @memberof openbts.stations.CellsResponse
       * @instance
       */
      CellsResponse.prototype.data = $util.emptyArray;

      /**
       * Creates a new CellsResponse instance using the specified properties.
       * @function create
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {openbts.stations.ICellsResponse=} [properties] Properties to set
       * @returns {openbts.stations.CellsResponse} CellsResponse instance
       */
      CellsResponse.create = function create(properties) {
        return new CellsResponse(properties);
      };

      /**
       * Encodes the specified CellsResponse message. Does not implicitly {@link openbts.stations.CellsResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {openbts.stations.ICellsResponse} message CellsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      CellsResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && message.data.length)
          for (let i = 0; i < message.data.length; ++i)
            $root.openbts.stations.Cell.encode(message.data[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified CellsResponse message, length delimited. Does not implicitly {@link openbts.stations.CellsResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {openbts.stations.ICellsResponse} message CellsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      CellsResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a CellsResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.CellsResponse} CellsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      CellsResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.CellsResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (!(message.data && message.data.length)) message.data = [];
              message.data.push($root.openbts.stations.Cell.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a CellsResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.CellsResponse} CellsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      CellsResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a CellsResponse message.
       * @function verify
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      CellsResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          if (!Array.isArray(message.data)) return "data: array expected";
          for (let i = 0; i < message.data.length; ++i) {
            let error = $root.openbts.stations.Cell.verify(message.data[i], long + 1);
            if (error) return "data." + error;
          }
        }
        return null;
      };

      /**
       * Creates a CellsResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.CellsResponse} CellsResponse
       */
      CellsResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.CellsResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.CellsResponse();
        if (object.data) {
          if (!Array.isArray(object.data)) throw TypeError(".openbts.stations.CellsResponse.data: array expected");
          message.data = [];
          for (let i = 0; i < object.data.length; ++i) {
            if (typeof object.data[i] !== "object") throw TypeError(".openbts.stations.CellsResponse.data: object expected");
            message.data[i] = $root.openbts.stations.Cell.fromObject(object.data[i], long + 1);
          }
        }
        return message;
      };

      /**
       * Creates a plain object from a CellsResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {openbts.stations.CellsResponse} message CellsResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      CellsResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.data = [];
        if (message.data && message.data.length) {
          object.data = [];
          for (let j = 0; j < message.data.length; ++j) object.data[j] = $root.openbts.stations.Cell.toObject(message.data[j], options);
        }
        return object;
      };

      /**
       * Converts this CellsResponse to JSON.
       * @function toJSON
       * @memberof openbts.stations.CellsResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      CellsResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for CellsResponse
       * @function getTypeUrl
       * @memberof openbts.stations.CellsResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      CellsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.CellsResponse";
      };

      return CellsResponse;
    })();

    stations.CellResponse = (function () {
      /**
       * Properties of a CellResponse.
       * @memberof openbts.stations
       * @interface ICellResponse
       * @property {openbts.stations.ICell|null} [data] CellResponse data
       */

      /**
       * Constructs a new CellResponse.
       * @memberof openbts.stations
       * @classdesc Represents a CellResponse.
       * @implements ICellResponse
       * @constructor
       * @param {openbts.stations.ICellResponse=} [properties] Properties to set
       */
      function CellResponse(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * CellResponse data.
       * @member {openbts.stations.ICell|null|undefined} data
       * @memberof openbts.stations.CellResponse
       * @instance
       */
      CellResponse.prototype.data = null;

      /**
       * Creates a new CellResponse instance using the specified properties.
       * @function create
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {openbts.stations.ICellResponse=} [properties] Properties to set
       * @returns {openbts.stations.CellResponse} CellResponse instance
       */
      CellResponse.create = function create(properties) {
        return new CellResponse(properties);
      };

      /**
       * Encodes the specified CellResponse message. Does not implicitly {@link openbts.stations.CellResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {openbts.stations.ICellResponse} message CellResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      CellResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && Object.hasOwnProperty.call(message, "data"))
          $root.openbts.stations.Cell.encode(message.data, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified CellResponse message, length delimited. Does not implicitly {@link openbts.stations.CellResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {openbts.stations.ICellResponse} message CellResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      CellResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a CellResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.stations.CellResponse} CellResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      CellResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.stations.CellResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.data = $root.openbts.stations.Cell.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a CellResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.stations.CellResponse} CellResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      CellResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a CellResponse message.
       * @function verify
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      CellResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          let error = $root.openbts.stations.Cell.verify(message.data, long + 1);
          if (error) return "data." + error;
        }
        return null;
      };

      /**
       * Creates a CellResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.stations.CellResponse} CellResponse
       */
      CellResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.stations.CellResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.stations.CellResponse();
        if (object.data != null) {
          if (typeof object.data !== "object") throw TypeError(".openbts.stations.CellResponse.data: object expected");
          message.data = $root.openbts.stations.Cell.fromObject(object.data, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a CellResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {openbts.stations.CellResponse} message CellResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      CellResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) object.data = null;
        if (message.data != null && message.hasOwnProperty("data")) object.data = $root.openbts.stations.Cell.toObject(message.data, options);
        return object;
      };

      /**
       * Converts this CellResponse to JSON.
       * @function toJSON
       * @memberof openbts.stations.CellResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      CellResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for CellResponse
       * @function getTypeUrl
       * @memberof openbts.stations.CellResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      CellResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.stations.CellResponse";
      };

      return CellResponse;
    })();

    return stations;
  })();

  openbts.uke = (function () {
    /**
     * Namespace uke.
     * @memberof openbts
     * @namespace
     */
    const uke = {};

    uke.UKEOperator = (function () {
      /**
       * Properties of a UKEOperator.
       * @memberof openbts.uke
       * @interface IUKEOperator
       * @property {number|null} [id] UKEOperator id
       * @property {string|null} [name] UKEOperator name
       * @property {string|null} [full_name] UKEOperator full_name
       */

      /**
       * Constructs a new UKEOperator.
       * @memberof openbts.uke
       * @classdesc Represents a UKEOperator.
       * @implements IUKEOperator
       * @constructor
       * @param {openbts.uke.IUKEOperator=} [properties] Properties to set
       */
      function UKEOperator(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * UKEOperator id.
       * @member {number} id
       * @memberof openbts.uke.UKEOperator
       * @instance
       */
      UKEOperator.prototype.id = 0;

      /**
       * UKEOperator name.
       * @member {string} name
       * @memberof openbts.uke.UKEOperator
       * @instance
       */
      UKEOperator.prototype.name = "";

      /**
       * UKEOperator full_name.
       * @member {string} full_name
       * @memberof openbts.uke.UKEOperator
       * @instance
       */
      UKEOperator.prototype.full_name = "";

      /**
       * Creates a new UKEOperator instance using the specified properties.
       * @function create
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {openbts.uke.IUKEOperator=} [properties] Properties to set
       * @returns {openbts.uke.UKEOperator} UKEOperator instance
       */
      UKEOperator.create = function create(properties) {
        return new UKEOperator(properties);
      };

      /**
       * Encodes the specified UKEOperator message. Does not implicitly {@link openbts.uke.UKEOperator.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {openbts.uke.IUKEOperator} message UKEOperator message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      UKEOperator.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name")) writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.name);
        if (message.full_name != null && Object.hasOwnProperty.call(message, "full_name"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.full_name);
        return writer;
      };

      /**
       * Encodes the specified UKEOperator message, length delimited. Does not implicitly {@link openbts.uke.UKEOperator.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {openbts.uke.IUKEOperator} message UKEOperator message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      UKEOperator.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a UKEOperator message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.UKEOperator} UKEOperator
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      UKEOperator.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.UKEOperator();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.name = reader.string();
              break;
            }
            case 3: {
              message.full_name = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a UKEOperator message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.UKEOperator} UKEOperator
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      UKEOperator.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a UKEOperator message.
       * @function verify
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      UKEOperator.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.name != null && message.hasOwnProperty("name")) if (!$util.isString(message.name)) return "name: string expected";
        if (message.full_name != null && message.hasOwnProperty("full_name"))
          if (!$util.isString(message.full_name)) return "full_name: string expected";
        return null;
      };

      /**
       * Creates a UKEOperator message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.UKEOperator} UKEOperator
       */
      UKEOperator.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.UKEOperator) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.UKEOperator();
        if (object.id != null) message.id = object.id | 0;
        if (object.name != null) message.name = String(object.name);
        if (object.full_name != null) message.full_name = String(object.full_name);
        return message;
      };

      /**
       * Creates a plain object from a UKEOperator message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {openbts.uke.UKEOperator} message UKEOperator
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      UKEOperator.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.name = "";
          object.full_name = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
        if (message.full_name != null && message.hasOwnProperty("full_name")) object.full_name = message.full_name;
        return object;
      };

      /**
       * Converts this UKEOperator to JSON.
       * @function toJSON
       * @memberof openbts.uke.UKEOperator
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      UKEOperator.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for UKEOperator
       * @function getTypeUrl
       * @memberof openbts.uke.UKEOperator
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      UKEOperator.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.UKEOperator";
      };

      return UKEOperator;
    })();

    /**
     * DecisionType enum.
     * @name openbts.uke.DecisionType
     * @enum {number}
     * @property {number} P=0 P value
     * @property {number} zmP=1 zmP value
     */
    uke.DecisionType = (function () {
      const valuesById = {},
        values = Object.create(valuesById);
      values[(valuesById[0] = "P")] = 0;
      values[(valuesById[1] = "zmP")] = 1;
      return values;
    })();

    /**
     * PermitSource enum.
     * @name openbts.uke.PermitSource
     * @enum {number}
     * @property {number} permits=0 permits value
     * @property {number} device_registry=1 device_registry value
     */
    uke.PermitSource = (function () {
      const valuesById = {},
        values = Object.create(valuesById);
      values[(valuesById[0] = "permits")] = 0;
      values[(valuesById[1] = "device_registry")] = 1;
      return values;
    })();

    /**
     * AntennaType enum.
     * @name openbts.uke.AntennaType
     * @enum {number}
     * @property {number} indoor=0 indoor value
     * @property {number} outdoor=1 outdoor value
     */
    uke.AntennaType = (function () {
      const valuesById = {},
        values = Object.create(valuesById);
      values[(valuesById[0] = "indoor")] = 0;
      values[(valuesById[1] = "outdoor")] = 1;
      return values;
    })();

    uke.Sector = (function () {
      /**
       * Properties of a Sector.
       * @memberof openbts.uke
       * @interface ISector
       * @property {number|null} [id] Sector id
       * @property {number|null} [azimuth] Sector azimuth
       * @property {number|null} [elevation] Sector elevation
       * @property {number|null} [antenna_height] Sector antenna_height
       * @property {openbts.uke.AntennaType|null} [antenna_type] Sector antenna_type
       */

      /**
       * Constructs a new Sector.
       * @memberof openbts.uke
       * @classdesc Represents a Sector.
       * @implements ISector
       * @constructor
       * @param {openbts.uke.ISector=} [properties] Properties to set
       */
      function Sector(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Sector id.
       * @member {number} id
       * @memberof openbts.uke.Sector
       * @instance
       */
      Sector.prototype.id = 0;

      /**
       * Sector azimuth.
       * @member {number} azimuth
       * @memberof openbts.uke.Sector
       * @instance
       */
      Sector.prototype.azimuth = 0;

      /**
       * Sector elevation.
       * @member {number} elevation
       * @memberof openbts.uke.Sector
       * @instance
       */
      Sector.prototype.elevation = 0;

      /**
       * Sector antenna_height.
       * @member {number} antenna_height
       * @memberof openbts.uke.Sector
       * @instance
       */
      Sector.prototype.antenna_height = 0;

      /**
       * Sector antenna_type.
       * @member {openbts.uke.AntennaType} antenna_type
       * @memberof openbts.uke.Sector
       * @instance
       */
      Sector.prototype.antenna_type = 0;

      /**
       * Creates a new Sector instance using the specified properties.
       * @function create
       * @memberof openbts.uke.Sector
       * @static
       * @param {openbts.uke.ISector=} [properties] Properties to set
       * @returns {openbts.uke.Sector} Sector instance
       */
      Sector.create = function create(properties) {
        return new Sector(properties);
      };

      /**
       * Encodes the specified Sector message. Does not implicitly {@link openbts.uke.Sector.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.Sector
       * @static
       * @param {openbts.uke.ISector} message Sector message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Sector.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.azimuth != null && Object.hasOwnProperty.call(message, "azimuth"))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.azimuth);
        if (message.elevation != null && Object.hasOwnProperty.call(message, "elevation"))
          writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.elevation);
        if (message.antenna_height != null && Object.hasOwnProperty.call(message, "antenna_height"))
          writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.antenna_height);
        if (message.antenna_type != null && Object.hasOwnProperty.call(message, "antenna_type"))
          writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.antenna_type);
        return writer;
      };

      /**
       * Encodes the specified Sector message, length delimited. Does not implicitly {@link openbts.uke.Sector.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.Sector
       * @static
       * @param {openbts.uke.ISector} message Sector message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Sector.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Sector message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.Sector
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.Sector} Sector
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Sector.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.Sector();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.azimuth = reader.int32();
              break;
            }
            case 3: {
              message.elevation = reader.int32();
              break;
            }
            case 4: {
              message.antenna_height = reader.int32();
              break;
            }
            case 5: {
              message.antenna_type = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Sector message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.Sector
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.Sector} Sector
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Sector.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Sector message.
       * @function verify
       * @memberof openbts.uke.Sector
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Sector.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.azimuth != null && message.hasOwnProperty("azimuth")) if (!$util.isInteger(message.azimuth)) return "azimuth: integer expected";
        if (message.elevation != null && message.hasOwnProperty("elevation"))
          if (!$util.isInteger(message.elevation)) return "elevation: integer expected";
        if (message.antenna_height != null && message.hasOwnProperty("antenna_height"))
          if (!$util.isInteger(message.antenna_height)) return "antenna_height: integer expected";
        if (message.antenna_type != null && message.hasOwnProperty("antenna_type"))
          switch (message.antenna_type) {
            default:
              return "antenna_type: enum value expected";
            case 0:
            case 1:
              break;
          }
        return null;
      };

      /**
       * Creates a Sector message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.Sector
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.Sector} Sector
       */
      Sector.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.Sector) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.Sector();
        if (object.id != null) message.id = object.id | 0;
        if (object.azimuth != null) message.azimuth = object.azimuth | 0;
        if (object.elevation != null) message.elevation = object.elevation | 0;
        if (object.antenna_height != null) message.antenna_height = object.antenna_height | 0;
        switch (object.antenna_type) {
          default:
            if (typeof object.antenna_type === "number") {
              message.antenna_type = object.antenna_type;
              break;
            }
            break;
          case "indoor":
          case 0:
            message.antenna_type = 0;
            break;
          case "outdoor":
          case 1:
            message.antenna_type = 1;
            break;
        }
        return message;
      };

      /**
       * Creates a plain object from a Sector message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.Sector
       * @static
       * @param {openbts.uke.Sector} message Sector
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Sector.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.azimuth = 0;
          object.elevation = 0;
          object.antenna_height = 0;
          object.antenna_type = options.enums === String ? "indoor" : 0;
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.azimuth != null && message.hasOwnProperty("azimuth")) object.azimuth = message.azimuth;
        if (message.elevation != null && message.hasOwnProperty("elevation")) object.elevation = message.elevation;
        if (message.antenna_height != null && message.hasOwnProperty("antenna_height")) object.antenna_height = message.antenna_height;
        if (message.antenna_type != null && message.hasOwnProperty("antenna_type"))
          object.antenna_type =
            options.enums === String
              ? $root.openbts.uke.AntennaType[message.antenna_type] === undefined
                ? message.antenna_type
                : $root.openbts.uke.AntennaType[message.antenna_type]
              : message.antenna_type;
        return object;
      };

      /**
       * Converts this Sector to JSON.
       * @function toJSON
       * @memberof openbts.uke.Sector
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Sector.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Sector
       * @function getTypeUrl
       * @memberof openbts.uke.Sector
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Sector.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.Sector";
      };

      return Sector;
    })();

    uke.Permit = (function () {
      /**
       * Properties of a Permit.
       * @memberof openbts.uke
       * @interface IPermit
       * @property {number|null} [id] Permit id
       * @property {string|null} [station_id] Permit station_id
       * @property {string|null} [decision_number] Permit decision_number
       * @property {openbts.uke.DecisionType|null} [decision_type] Permit decision_type
       * @property {string|null} [expiry_date] Permit expiry_date
       * @property {openbts.uke.PermitSource|null} [source] Permit source
       * @property {openbts.locations.ILocation|null} [location] Permit location
       * @property {openbts.IOperator|null} [operator] Permit operator
       * @property {openbts.IBand|null} [band] Permit band
       * @property {Array.<openbts.uke.ISector>|null} [sectors] Permit sectors
       * @property {string|null} [updatedAt] Permit updatedAt
       * @property {string|null} [createdAt] Permit createdAt
       */

      /**
       * Constructs a new Permit.
       * @memberof openbts.uke
       * @classdesc Represents a Permit.
       * @implements IPermit
       * @constructor
       * @param {openbts.uke.IPermit=} [properties] Properties to set
       */
      function Permit(properties) {
        this.sectors = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Permit id.
       * @member {number} id
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.id = 0;

      /**
       * Permit station_id.
       * @member {string} station_id
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.station_id = "";

      /**
       * Permit decision_number.
       * @member {string} decision_number
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.decision_number = "";

      /**
       * Permit decision_type.
       * @member {openbts.uke.DecisionType} decision_type
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.decision_type = 0;

      /**
       * Permit expiry_date.
       * @member {string} expiry_date
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.expiry_date = "";

      /**
       * Permit source.
       * @member {openbts.uke.PermitSource} source
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.source = 0;

      /**
       * Permit location.
       * @member {openbts.locations.ILocation|null|undefined} location
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.location = null;

      /**
       * Permit operator.
       * @member {openbts.IOperator|null|undefined} operator
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.operator = null;

      /**
       * Permit band.
       * @member {openbts.IBand|null|undefined} band
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.band = null;

      /**
       * Permit sectors.
       * @member {Array.<openbts.uke.ISector>} sectors
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.sectors = $util.emptyArray;

      /**
       * Permit updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.updatedAt = "";

      /**
       * Permit createdAt.
       * @member {string} createdAt
       * @memberof openbts.uke.Permit
       * @instance
       */
      Permit.prototype.createdAt = "";

      /**
       * Creates a new Permit instance using the specified properties.
       * @function create
       * @memberof openbts.uke.Permit
       * @static
       * @param {openbts.uke.IPermit=} [properties] Properties to set
       * @returns {openbts.uke.Permit} Permit instance
       */
      Permit.create = function create(properties) {
        return new Permit(properties);
      };

      /**
       * Encodes the specified Permit message. Does not implicitly {@link openbts.uke.Permit.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.Permit
       * @static
       * @param {openbts.uke.IPermit} message Permit message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Permit.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.station_id != null && Object.hasOwnProperty.call(message, "station_id"))
          writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.station_id);
        if (message.decision_number != null && Object.hasOwnProperty.call(message, "decision_number"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.decision_number);
        if (message.decision_type != null && Object.hasOwnProperty.call(message, "decision_type"))
          writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.decision_type);
        if (message.expiry_date != null && Object.hasOwnProperty.call(message, "expiry_date"))
          writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.expiry_date);
        if (message.source != null && Object.hasOwnProperty.call(message, "source")) writer.uint32(/* id 6, wireType 0 =*/ 48).int32(message.source);
        if (message.location != null && Object.hasOwnProperty.call(message, "location"))
          $root.openbts.locations.Location.encode(message.location, writer.uint32(/* id 7, wireType 2 =*/ 58).fork()).ldelim();
        if (message.operator != null && Object.hasOwnProperty.call(message, "operator"))
          $root.openbts.Operator.encode(message.operator, writer.uint32(/* id 8, wireType 2 =*/ 66).fork()).ldelim();
        if (message.band != null && Object.hasOwnProperty.call(message, "band"))
          $root.openbts.Band.encode(message.band, writer.uint32(/* id 9, wireType 2 =*/ 74).fork()).ldelim();
        if (message.sectors != null && message.sectors.length)
          for (let i = 0; i < message.sectors.length; ++i)
            $root.openbts.uke.Sector.encode(message.sectors[i], writer.uint32(/* id 10, wireType 2 =*/ 82).fork()).ldelim();
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 11, wireType 2 =*/ 90).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 12, wireType 2 =*/ 98).string(message.createdAt);
        return writer;
      };

      /**
       * Encodes the specified Permit message, length delimited. Does not implicitly {@link openbts.uke.Permit.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.Permit
       * @static
       * @param {openbts.uke.IPermit} message Permit message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Permit.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Permit message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.Permit
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.Permit} Permit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Permit.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.Permit();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.station_id = reader.string();
              break;
            }
            case 3: {
              message.decision_number = reader.string();
              break;
            }
            case 4: {
              message.decision_type = reader.int32();
              break;
            }
            case 5: {
              message.expiry_date = reader.string();
              break;
            }
            case 6: {
              message.source = reader.int32();
              break;
            }
            case 7: {
              message.location = $root.openbts.locations.Location.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 8: {
              message.operator = $root.openbts.Operator.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 9: {
              message.band = $root.openbts.Band.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 10: {
              if (!(message.sectors && message.sectors.length)) message.sectors = [];
              message.sectors.push($root.openbts.uke.Sector.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 11: {
              message.updatedAt = reader.string();
              break;
            }
            case 12: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Permit message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.Permit
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.Permit} Permit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Permit.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Permit message.
       * @function verify
       * @memberof openbts.uke.Permit
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Permit.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.station_id != null && message.hasOwnProperty("station_id"))
          if (!$util.isString(message.station_id)) return "station_id: string expected";
        if (message.decision_number != null && message.hasOwnProperty("decision_number"))
          if (!$util.isString(message.decision_number)) return "decision_number: string expected";
        if (message.decision_type != null && message.hasOwnProperty("decision_type"))
          switch (message.decision_type) {
            default:
              return "decision_type: enum value expected";
            case 0:
            case 1:
              break;
          }
        if (message.expiry_date != null && message.hasOwnProperty("expiry_date"))
          if (!$util.isString(message.expiry_date)) return "expiry_date: string expected";
        if (message.source != null && message.hasOwnProperty("source"))
          switch (message.source) {
            default:
              return "source: enum value expected";
            case 0:
            case 1:
              break;
          }
        if (message.location != null && message.hasOwnProperty("location")) {
          let error = $root.openbts.locations.Location.verify(message.location, long + 1);
          if (error) return "location." + error;
        }
        if (message.operator != null && message.hasOwnProperty("operator")) {
          let error = $root.openbts.Operator.verify(message.operator, long + 1);
          if (error) return "operator." + error;
        }
        if (message.band != null && message.hasOwnProperty("band")) {
          let error = $root.openbts.Band.verify(message.band, long + 1);
          if (error) return "band." + error;
        }
        if (message.sectors != null && message.hasOwnProperty("sectors")) {
          if (!Array.isArray(message.sectors)) return "sectors: array expected";
          for (let i = 0; i < message.sectors.length; ++i) {
            let error = $root.openbts.uke.Sector.verify(message.sectors[i], long + 1);
            if (error) return "sectors." + error;
          }
        }
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates a Permit message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.Permit
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.Permit} Permit
       */
      Permit.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.Permit) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.Permit();
        if (object.id != null) message.id = object.id | 0;
        if (object.station_id != null) message.station_id = String(object.station_id);
        if (object.decision_number != null) message.decision_number = String(object.decision_number);
        switch (object.decision_type) {
          default:
            if (typeof object.decision_type === "number") {
              message.decision_type = object.decision_type;
              break;
            }
            break;
          case "P":
          case 0:
            message.decision_type = 0;
            break;
          case "zmP":
          case 1:
            message.decision_type = 1;
            break;
        }
        if (object.expiry_date != null) message.expiry_date = String(object.expiry_date);
        switch (object.source) {
          default:
            if (typeof object.source === "number") {
              message.source = object.source;
              break;
            }
            break;
          case "permits":
          case 0:
            message.source = 0;
            break;
          case "device_registry":
          case 1:
            message.source = 1;
            break;
        }
        if (object.location != null) {
          if (typeof object.location !== "object") throw TypeError(".openbts.uke.Permit.location: object expected");
          message.location = $root.openbts.locations.Location.fromObject(object.location, long + 1);
        }
        if (object.operator != null) {
          if (typeof object.operator !== "object") throw TypeError(".openbts.uke.Permit.operator: object expected");
          message.operator = $root.openbts.Operator.fromObject(object.operator, long + 1);
        }
        if (object.band != null) {
          if (typeof object.band !== "object") throw TypeError(".openbts.uke.Permit.band: object expected");
          message.band = $root.openbts.Band.fromObject(object.band, long + 1);
        }
        if (object.sectors) {
          if (!Array.isArray(object.sectors)) throw TypeError(".openbts.uke.Permit.sectors: array expected");
          message.sectors = [];
          for (let i = 0; i < object.sectors.length; ++i) {
            if (typeof object.sectors[i] !== "object") throw TypeError(".openbts.uke.Permit.sectors: object expected");
            message.sectors[i] = $root.openbts.uke.Sector.fromObject(object.sectors[i], long + 1);
          }
        }
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from a Permit message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.Permit
       * @static
       * @param {openbts.uke.Permit} message Permit
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Permit.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.sectors = [];
        if (options.defaults) {
          object.id = 0;
          object.station_id = "";
          object.decision_number = "";
          object.decision_type = options.enums === String ? "P" : 0;
          object.expiry_date = "";
          object.source = options.enums === String ? "permits" : 0;
          object.location = null;
          object.operator = null;
          object.band = null;
          object.updatedAt = "";
          object.createdAt = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.station_id != null && message.hasOwnProperty("station_id")) object.station_id = message.station_id;
        if (message.decision_number != null && message.hasOwnProperty("decision_number")) object.decision_number = message.decision_number;
        if (message.decision_type != null && message.hasOwnProperty("decision_type"))
          object.decision_type =
            options.enums === String
              ? $root.openbts.uke.DecisionType[message.decision_type] === undefined
                ? message.decision_type
                : $root.openbts.uke.DecisionType[message.decision_type]
              : message.decision_type;
        if (message.expiry_date != null && message.hasOwnProperty("expiry_date")) object.expiry_date = message.expiry_date;
        if (message.source != null && message.hasOwnProperty("source"))
          object.source =
            options.enums === String
              ? $root.openbts.uke.PermitSource[message.source] === undefined
                ? message.source
                : $root.openbts.uke.PermitSource[message.source]
              : message.source;
        if (message.location != null && message.hasOwnProperty("location"))
          object.location = $root.openbts.locations.Location.toObject(message.location, options);
        if (message.operator != null && message.hasOwnProperty("operator"))
          object.operator = $root.openbts.Operator.toObject(message.operator, options);
        if (message.band != null && message.hasOwnProperty("band")) object.band = $root.openbts.Band.toObject(message.band, options);
        if (message.sectors && message.sectors.length) {
          object.sectors = [];
          for (let j = 0; j < message.sectors.length; ++j) object.sectors[j] = $root.openbts.uke.Sector.toObject(message.sectors[j], options);
        }
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        return object;
      };

      /**
       * Converts this Permit to JSON.
       * @function toJSON
       * @memberof openbts.uke.Permit
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Permit.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Permit
       * @function getTypeUrl
       * @memberof openbts.uke.Permit
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Permit.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.Permit";
      };

      return Permit;
    })();

    uke.UKELocation = (function () {
      /**
       * Properties of a UKELocation.
       * @memberof openbts.uke
       * @interface IUKELocation
       * @property {number|null} [id] UKELocation id
       * @property {string|null} [city] UKELocation city
       * @property {string|null} [address] UKELocation address
       * @property {number|null} [latitude] UKELocation latitude
       * @property {number|null} [longitude] UKELocation longitude
       * @property {openbts.IRegion|null} [region] UKELocation region
       * @property {Array.<openbts.uke.IPermit>|null} [permits] UKELocation permits
       * @property {string|null} [updatedAt] UKELocation updatedAt
       * @property {string|null} [createdAt] UKELocation createdAt
       */

      /**
       * Constructs a new UKELocation.
       * @memberof openbts.uke
       * @classdesc Represents a UKELocation.
       * @implements IUKELocation
       * @constructor
       * @param {openbts.uke.IUKELocation=} [properties] Properties to set
       */
      function UKELocation(properties) {
        this.permits = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * UKELocation id.
       * @member {number} id
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.id = 0;

      /**
       * UKELocation city.
       * @member {string} city
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.city = "";

      /**
       * UKELocation address.
       * @member {string} address
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.address = "";

      /**
       * UKELocation latitude.
       * @member {number} latitude
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.latitude = 0;

      /**
       * UKELocation longitude.
       * @member {number} longitude
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.longitude = 0;

      /**
       * UKELocation region.
       * @member {openbts.IRegion|null|undefined} region
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.region = null;

      /**
       * UKELocation permits.
       * @member {Array.<openbts.uke.IPermit>} permits
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.permits = $util.emptyArray;

      /**
       * UKELocation updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.updatedAt = "";

      /**
       * UKELocation createdAt.
       * @member {string} createdAt
       * @memberof openbts.uke.UKELocation
       * @instance
       */
      UKELocation.prototype.createdAt = "";

      /**
       * Creates a new UKELocation instance using the specified properties.
       * @function create
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {openbts.uke.IUKELocation=} [properties] Properties to set
       * @returns {openbts.uke.UKELocation} UKELocation instance
       */
      UKELocation.create = function create(properties) {
        return new UKELocation(properties);
      };

      /**
       * Encodes the specified UKELocation message. Does not implicitly {@link openbts.uke.UKELocation.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {openbts.uke.IUKELocation} message UKELocation message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      UKELocation.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.city != null && Object.hasOwnProperty.call(message, "city")) writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.city);
        if (message.address != null && Object.hasOwnProperty.call(message, "address"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.address);
        if (message.latitude != null && Object.hasOwnProperty.call(message, "latitude"))
          writer.uint32(/* id 4, wireType 1 =*/ 33).double(message.latitude);
        if (message.longitude != null && Object.hasOwnProperty.call(message, "longitude"))
          writer.uint32(/* id 5, wireType 1 =*/ 41).double(message.longitude);
        if (message.region != null && Object.hasOwnProperty.call(message, "region"))
          $root.openbts.Region.encode(message.region, writer.uint32(/* id 6, wireType 2 =*/ 50).fork()).ldelim();
        if (message.permits != null && message.permits.length)
          for (let i = 0; i < message.permits.length; ++i)
            $root.openbts.uke.Permit.encode(message.permits[i], writer.uint32(/* id 7, wireType 2 =*/ 58).fork()).ldelim();
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 9, wireType 2 =*/ 74).string(message.createdAt);
        return writer;
      };

      /**
       * Encodes the specified UKELocation message, length delimited. Does not implicitly {@link openbts.uke.UKELocation.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {openbts.uke.IUKELocation} message UKELocation message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      UKELocation.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a UKELocation message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.UKELocation} UKELocation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      UKELocation.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.UKELocation();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.city = reader.string();
              break;
            }
            case 3: {
              message.address = reader.string();
              break;
            }
            case 4: {
              message.latitude = reader.double();
              break;
            }
            case 5: {
              message.longitude = reader.double();
              break;
            }
            case 6: {
              message.region = $root.openbts.Region.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 7: {
              if (!(message.permits && message.permits.length)) message.permits = [];
              message.permits.push($root.openbts.uke.Permit.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 8: {
              message.updatedAt = reader.string();
              break;
            }
            case 9: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a UKELocation message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.UKELocation} UKELocation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      UKELocation.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a UKELocation message.
       * @function verify
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      UKELocation.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.city != null && message.hasOwnProperty("city")) if (!$util.isString(message.city)) return "city: string expected";
        if (message.address != null && message.hasOwnProperty("address")) if (!$util.isString(message.address)) return "address: string expected";
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          if (typeof message.latitude !== "number") return "latitude: number expected";
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          if (typeof message.longitude !== "number") return "longitude: number expected";
        if (message.region != null && message.hasOwnProperty("region")) {
          let error = $root.openbts.Region.verify(message.region, long + 1);
          if (error) return "region." + error;
        }
        if (message.permits != null && message.hasOwnProperty("permits")) {
          if (!Array.isArray(message.permits)) return "permits: array expected";
          for (let i = 0; i < message.permits.length; ++i) {
            let error = $root.openbts.uke.Permit.verify(message.permits[i], long + 1);
            if (error) return "permits." + error;
          }
        }
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates a UKELocation message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.UKELocation} UKELocation
       */
      UKELocation.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.UKELocation) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.UKELocation();
        if (object.id != null) message.id = object.id | 0;
        if (object.city != null) message.city = String(object.city);
        if (object.address != null) message.address = String(object.address);
        if (object.latitude != null) message.latitude = Number(object.latitude);
        if (object.longitude != null) message.longitude = Number(object.longitude);
        if (object.region != null) {
          if (typeof object.region !== "object") throw TypeError(".openbts.uke.UKELocation.region: object expected");
          message.region = $root.openbts.Region.fromObject(object.region, long + 1);
        }
        if (object.permits) {
          if (!Array.isArray(object.permits)) throw TypeError(".openbts.uke.UKELocation.permits: array expected");
          message.permits = [];
          for (let i = 0; i < object.permits.length; ++i) {
            if (typeof object.permits[i] !== "object") throw TypeError(".openbts.uke.UKELocation.permits: object expected");
            message.permits[i] = $root.openbts.uke.Permit.fromObject(object.permits[i], long + 1);
          }
        }
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from a UKELocation message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {openbts.uke.UKELocation} message UKELocation
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      UKELocation.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.permits = [];
        if (options.defaults) {
          object.id = 0;
          object.city = "";
          object.address = "";
          object.latitude = 0;
          object.longitude = 0;
          object.region = null;
          object.updatedAt = "";
          object.createdAt = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.city != null && message.hasOwnProperty("city")) object.city = message.city;
        if (message.address != null && message.hasOwnProperty("address")) object.address = message.address;
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
        if (message.region != null && message.hasOwnProperty("region")) object.region = $root.openbts.Region.toObject(message.region, options);
        if (message.permits && message.permits.length) {
          object.permits = [];
          for (let j = 0; j < message.permits.length; ++j) object.permits[j] = $root.openbts.uke.Permit.toObject(message.permits[j], options);
        }
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        return object;
      };

      /**
       * Converts this UKELocation to JSON.
       * @function toJSON
       * @memberof openbts.uke.UKELocation
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      UKELocation.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for UKELocation
       * @function getTypeUrl
       * @memberof openbts.uke.UKELocation
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      UKELocation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.UKELocation";
      };

      return UKELocation;
    })();

    uke.RadiolineManufacturer = (function () {
      /**
       * Properties of a RadiolineManufacturer.
       * @memberof openbts.uke
       * @interface IRadiolineManufacturer
       * @property {number|null} [id] RadiolineManufacturer id
       * @property {string|null} [name] RadiolineManufacturer name
       */

      /**
       * Constructs a new RadiolineManufacturer.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolineManufacturer.
       * @implements IRadiolineManufacturer
       * @constructor
       * @param {openbts.uke.IRadiolineManufacturer=} [properties] Properties to set
       */
      function RadiolineManufacturer(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolineManufacturer id.
       * @member {number} id
       * @memberof openbts.uke.RadiolineManufacturer
       * @instance
       */
      RadiolineManufacturer.prototype.id = 0;

      /**
       * RadiolineManufacturer name.
       * @member {string} name
       * @memberof openbts.uke.RadiolineManufacturer
       * @instance
       */
      RadiolineManufacturer.prototype.name = "";

      /**
       * Creates a new RadiolineManufacturer instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {openbts.uke.IRadiolineManufacturer=} [properties] Properties to set
       * @returns {openbts.uke.RadiolineManufacturer} RadiolineManufacturer instance
       */
      RadiolineManufacturer.create = function create(properties) {
        return new RadiolineManufacturer(properties);
      };

      /**
       * Encodes the specified RadiolineManufacturer message. Does not implicitly {@link openbts.uke.RadiolineManufacturer.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {openbts.uke.IRadiolineManufacturer} message RadiolineManufacturer message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineManufacturer.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name")) writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.name);
        return writer;
      };

      /**
       * Encodes the specified RadiolineManufacturer message, length delimited. Does not implicitly {@link openbts.uke.RadiolineManufacturer.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {openbts.uke.IRadiolineManufacturer} message RadiolineManufacturer message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineManufacturer.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolineManufacturer message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolineManufacturer} RadiolineManufacturer
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineManufacturer.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolineManufacturer();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.name = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolineManufacturer message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolineManufacturer} RadiolineManufacturer
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineManufacturer.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolineManufacturer message.
       * @function verify
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolineManufacturer.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.name != null && message.hasOwnProperty("name")) if (!$util.isString(message.name)) return "name: string expected";
        return null;
      };

      /**
       * Creates a RadiolineManufacturer message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolineManufacturer} RadiolineManufacturer
       */
      RadiolineManufacturer.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolineManufacturer) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolineManufacturer();
        if (object.id != null) message.id = object.id | 0;
        if (object.name != null) message.name = String(object.name);
        return message;
      };

      /**
       * Creates a plain object from a RadiolineManufacturer message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {openbts.uke.RadiolineManufacturer} message RadiolineManufacturer
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolineManufacturer.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.name = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
        return object;
      };

      /**
       * Converts this RadiolineManufacturer to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolineManufacturer
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolineManufacturer.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolineManufacturer
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolineManufacturer
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolineManufacturer.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolineManufacturer";
      };

      return RadiolineManufacturer;
    })();

    uke.EquipmentType = (function () {
      /**
       * Properties of an EquipmentType.
       * @memberof openbts.uke
       * @interface IEquipmentType
       * @property {number|null} [id] EquipmentType id
       * @property {string|null} [name] EquipmentType name
       * @property {openbts.uke.IRadiolineManufacturer|null} [manufacturer] EquipmentType manufacturer
       */

      /**
       * Constructs a new EquipmentType.
       * @memberof openbts.uke
       * @classdesc Represents an EquipmentType.
       * @implements IEquipmentType
       * @constructor
       * @param {openbts.uke.IEquipmentType=} [properties] Properties to set
       */
      function EquipmentType(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * EquipmentType id.
       * @member {number} id
       * @memberof openbts.uke.EquipmentType
       * @instance
       */
      EquipmentType.prototype.id = 0;

      /**
       * EquipmentType name.
       * @member {string} name
       * @memberof openbts.uke.EquipmentType
       * @instance
       */
      EquipmentType.prototype.name = "";

      /**
       * EquipmentType manufacturer.
       * @member {openbts.uke.IRadiolineManufacturer|null|undefined} manufacturer
       * @memberof openbts.uke.EquipmentType
       * @instance
       */
      EquipmentType.prototype.manufacturer = null;

      /**
       * Creates a new EquipmentType instance using the specified properties.
       * @function create
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {openbts.uke.IEquipmentType=} [properties] Properties to set
       * @returns {openbts.uke.EquipmentType} EquipmentType instance
       */
      EquipmentType.create = function create(properties) {
        return new EquipmentType(properties);
      };

      /**
       * Encodes the specified EquipmentType message. Does not implicitly {@link openbts.uke.EquipmentType.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {openbts.uke.IEquipmentType} message EquipmentType message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      EquipmentType.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name")) writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.name);
        if (message.manufacturer != null && Object.hasOwnProperty.call(message, "manufacturer"))
          $root.openbts.uke.RadiolineManufacturer.encode(message.manufacturer, writer.uint32(/* id 3, wireType 2 =*/ 26).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified EquipmentType message, length delimited. Does not implicitly {@link openbts.uke.EquipmentType.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {openbts.uke.IEquipmentType} message EquipmentType message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      EquipmentType.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes an EquipmentType message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.EquipmentType} EquipmentType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      EquipmentType.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.EquipmentType();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.name = reader.string();
              break;
            }
            case 3: {
              message.manufacturer = $root.openbts.uke.RadiolineManufacturer.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes an EquipmentType message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.EquipmentType} EquipmentType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      EquipmentType.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies an EquipmentType message.
       * @function verify
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      EquipmentType.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.name != null && message.hasOwnProperty("name")) if (!$util.isString(message.name)) return "name: string expected";
        if (message.manufacturer != null && message.hasOwnProperty("manufacturer")) {
          let error = $root.openbts.uke.RadiolineManufacturer.verify(message.manufacturer, long + 1);
          if (error) return "manufacturer." + error;
        }
        return null;
      };

      /**
       * Creates an EquipmentType message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.EquipmentType} EquipmentType
       */
      EquipmentType.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.EquipmentType) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.EquipmentType();
        if (object.id != null) message.id = object.id | 0;
        if (object.name != null) message.name = String(object.name);
        if (object.manufacturer != null) {
          if (typeof object.manufacturer !== "object") throw TypeError(".openbts.uke.EquipmentType.manufacturer: object expected");
          message.manufacturer = $root.openbts.uke.RadiolineManufacturer.fromObject(object.manufacturer, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from an EquipmentType message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {openbts.uke.EquipmentType} message EquipmentType
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      EquipmentType.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.name = "";
          object.manufacturer = null;
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.name != null && message.hasOwnProperty("name")) object.name = message.name;
        if (message.manufacturer != null && message.hasOwnProperty("manufacturer"))
          object.manufacturer = $root.openbts.uke.RadiolineManufacturer.toObject(message.manufacturer, options);
        return object;
      };

      /**
       * Converts this EquipmentType to JSON.
       * @function toJSON
       * @memberof openbts.uke.EquipmentType
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      EquipmentType.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for EquipmentType
       * @function getTypeUrl
       * @memberof openbts.uke.EquipmentType
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      EquipmentType.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.EquipmentType";
      };

      return EquipmentType;
    })();

    uke.RadiolineAtenna = (function () {
      /**
       * Properties of a RadiolineAtenna.
       * @memberof openbts.uke
       * @interface IRadiolineAtenna
       * @property {openbts.uke.IEquipmentType|null} [type] RadiolineAtenna type
       * @property {number|null} [gain] RadiolineAtenna gain
       * @property {number|null} [height] RadiolineAtenna height
       */

      /**
       * Constructs a new RadiolineAtenna.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolineAtenna.
       * @implements IRadiolineAtenna
       * @constructor
       * @param {openbts.uke.IRadiolineAtenna=} [properties] Properties to set
       */
      function RadiolineAtenna(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolineAtenna type.
       * @member {openbts.uke.IEquipmentType|null|undefined} type
       * @memberof openbts.uke.RadiolineAtenna
       * @instance
       */
      RadiolineAtenna.prototype.type = null;

      /**
       * RadiolineAtenna gain.
       * @member {number} gain
       * @memberof openbts.uke.RadiolineAtenna
       * @instance
       */
      RadiolineAtenna.prototype.gain = 0;

      /**
       * RadiolineAtenna height.
       * @member {number} height
       * @memberof openbts.uke.RadiolineAtenna
       * @instance
       */
      RadiolineAtenna.prototype.height = 0;

      /**
       * Creates a new RadiolineAtenna instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {openbts.uke.IRadiolineAtenna=} [properties] Properties to set
       * @returns {openbts.uke.RadiolineAtenna} RadiolineAtenna instance
       */
      RadiolineAtenna.create = function create(properties) {
        return new RadiolineAtenna(properties);
      };

      /**
       * Encodes the specified RadiolineAtenna message. Does not implicitly {@link openbts.uke.RadiolineAtenna.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {openbts.uke.IRadiolineAtenna} message RadiolineAtenna message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineAtenna.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
          $root.openbts.uke.EquipmentType.encode(message.type, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        if (message.gain != null && Object.hasOwnProperty.call(message, "gain")) writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.gain);
        if (message.height != null && Object.hasOwnProperty.call(message, "height")) writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.height);
        return writer;
      };

      /**
       * Encodes the specified RadiolineAtenna message, length delimited. Does not implicitly {@link openbts.uke.RadiolineAtenna.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {openbts.uke.IRadiolineAtenna} message RadiolineAtenna message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineAtenna.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolineAtenna message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolineAtenna} RadiolineAtenna
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineAtenna.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolineAtenna();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.type = $root.openbts.uke.EquipmentType.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 2: {
              message.gain = reader.int32();
              break;
            }
            case 3: {
              message.height = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolineAtenna message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolineAtenna} RadiolineAtenna
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineAtenna.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolineAtenna message.
       * @function verify
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolineAtenna.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.type != null && message.hasOwnProperty("type")) {
          let error = $root.openbts.uke.EquipmentType.verify(message.type, long + 1);
          if (error) return "type." + error;
        }
        if (message.gain != null && message.hasOwnProperty("gain")) if (!$util.isInteger(message.gain)) return "gain: integer expected";
        if (message.height != null && message.hasOwnProperty("height")) if (!$util.isInteger(message.height)) return "height: integer expected";
        return null;
      };

      /**
       * Creates a RadiolineAtenna message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolineAtenna} RadiolineAtenna
       */
      RadiolineAtenna.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolineAtenna) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolineAtenna();
        if (object.type != null) {
          if (typeof object.type !== "object") throw TypeError(".openbts.uke.RadiolineAtenna.type: object expected");
          message.type = $root.openbts.uke.EquipmentType.fromObject(object.type, long + 1);
        }
        if (object.gain != null) message.gain = object.gain | 0;
        if (object.height != null) message.height = object.height | 0;
        return message;
      };

      /**
       * Creates a plain object from a RadiolineAtenna message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {openbts.uke.RadiolineAtenna} message RadiolineAtenna
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolineAtenna.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.type = null;
          object.gain = 0;
          object.height = 0;
        }
        if (message.type != null && message.hasOwnProperty("type")) object.type = $root.openbts.uke.EquipmentType.toObject(message.type, options);
        if (message.gain != null && message.hasOwnProperty("gain")) object.gain = message.gain;
        if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
        return object;
      };

      /**
       * Converts this RadiolineAtenna to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolineAtenna
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolineAtenna.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolineAtenna
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolineAtenna
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolineAtenna.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolineAtenna";
      };

      return RadiolineAtenna;
    })();

    uke.RadiolineTxTransmitter = (function () {
      /**
       * Properties of a RadiolineTxTransmitter.
       * @memberof openbts.uke
       * @interface IRadiolineTxTransmitter
       * @property {openbts.uke.IEquipmentType|null} [type] RadiolineTxTransmitter type
       */

      /**
       * Constructs a new RadiolineTxTransmitter.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolineTxTransmitter.
       * @implements IRadiolineTxTransmitter
       * @constructor
       * @param {openbts.uke.IRadiolineTxTransmitter=} [properties] Properties to set
       */
      function RadiolineTxTransmitter(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolineTxTransmitter type.
       * @member {openbts.uke.IEquipmentType|null|undefined} type
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @instance
       */
      RadiolineTxTransmitter.prototype.type = null;

      /**
       * Creates a new RadiolineTxTransmitter instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {openbts.uke.IRadiolineTxTransmitter=} [properties] Properties to set
       * @returns {openbts.uke.RadiolineTxTransmitter} RadiolineTxTransmitter instance
       */
      RadiolineTxTransmitter.create = function create(properties) {
        return new RadiolineTxTransmitter(properties);
      };

      /**
       * Encodes the specified RadiolineTxTransmitter message. Does not implicitly {@link openbts.uke.RadiolineTxTransmitter.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {openbts.uke.IRadiolineTxTransmitter} message RadiolineTxTransmitter message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineTxTransmitter.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
          $root.openbts.uke.EquipmentType.encode(message.type, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified RadiolineTxTransmitter message, length delimited. Does not implicitly {@link openbts.uke.RadiolineTxTransmitter.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {openbts.uke.IRadiolineTxTransmitter} message RadiolineTxTransmitter message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineTxTransmitter.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolineTxTransmitter message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolineTxTransmitter} RadiolineTxTransmitter
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineTxTransmitter.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolineTxTransmitter();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.type = $root.openbts.uke.EquipmentType.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolineTxTransmitter message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolineTxTransmitter} RadiolineTxTransmitter
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineTxTransmitter.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolineTxTransmitter message.
       * @function verify
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolineTxTransmitter.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.type != null && message.hasOwnProperty("type")) {
          let error = $root.openbts.uke.EquipmentType.verify(message.type, long + 1);
          if (error) return "type." + error;
        }
        return null;
      };

      /**
       * Creates a RadiolineTxTransmitter message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolineTxTransmitter} RadiolineTxTransmitter
       */
      RadiolineTxTransmitter.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolineTxTransmitter) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolineTxTransmitter();
        if (object.type != null) {
          if (typeof object.type !== "object") throw TypeError(".openbts.uke.RadiolineTxTransmitter.type: object expected");
          message.type = $root.openbts.uke.EquipmentType.fromObject(object.type, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a RadiolineTxTransmitter message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {openbts.uke.RadiolineTxTransmitter} message RadiolineTxTransmitter
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolineTxTransmitter.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) object.type = null;
        if (message.type != null && message.hasOwnProperty("type")) object.type = $root.openbts.uke.EquipmentType.toObject(message.type, options);
        return object;
      };

      /**
       * Converts this RadiolineTxTransmitter to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolineTxTransmitter.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolineTxTransmitter
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolineTxTransmitter
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolineTxTransmitter.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolineTxTransmitter";
      };

      return RadiolineTxTransmitter;
    })();

    uke.RadiolineTx = (function () {
      /**
       * Properties of a RadiolineTx.
       * @memberof openbts.uke
       * @interface IRadiolineTx
       * @property {number|null} [longitude] RadiolineTx longitude
       * @property {number|null} [latitude] RadiolineTx latitude
       * @property {number|null} [height] RadiolineTx height
       * @property {number|null} [eirp] RadiolineTx eirp
       * @property {number|null} [antenna_attenuation] RadiolineTx antenna_attenuation
       * @property {openbts.uke.IRadiolineTxTransmitter|null} [transmitter] RadiolineTx transmitter
       * @property {openbts.uke.IRadiolineAtenna|null} [antenna] RadiolineTx antenna
       */

      /**
       * Constructs a new RadiolineTx.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolineTx.
       * @implements IRadiolineTx
       * @constructor
       * @param {openbts.uke.IRadiolineTx=} [properties] Properties to set
       */
      function RadiolineTx(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolineTx longitude.
       * @member {number} longitude
       * @memberof openbts.uke.RadiolineTx
       * @instance
       */
      RadiolineTx.prototype.longitude = 0;

      /**
       * RadiolineTx latitude.
       * @member {number} latitude
       * @memberof openbts.uke.RadiolineTx
       * @instance
       */
      RadiolineTx.prototype.latitude = 0;

      /**
       * RadiolineTx height.
       * @member {number} height
       * @memberof openbts.uke.RadiolineTx
       * @instance
       */
      RadiolineTx.prototype.height = 0;

      /**
       * RadiolineTx eirp.
       * @member {number} eirp
       * @memberof openbts.uke.RadiolineTx
       * @instance
       */
      RadiolineTx.prototype.eirp = 0;

      /**
       * RadiolineTx antenna_attenuation.
       * @member {number} antenna_attenuation
       * @memberof openbts.uke.RadiolineTx
       * @instance
       */
      RadiolineTx.prototype.antenna_attenuation = 0;

      /**
       * RadiolineTx transmitter.
       * @member {openbts.uke.IRadiolineTxTransmitter|null|undefined} transmitter
       * @memberof openbts.uke.RadiolineTx
       * @instance
       */
      RadiolineTx.prototype.transmitter = null;

      /**
       * RadiolineTx antenna.
       * @member {openbts.uke.IRadiolineAtenna|null|undefined} antenna
       * @memberof openbts.uke.RadiolineTx
       * @instance
       */
      RadiolineTx.prototype.antenna = null;

      /**
       * Creates a new RadiolineTx instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {openbts.uke.IRadiolineTx=} [properties] Properties to set
       * @returns {openbts.uke.RadiolineTx} RadiolineTx instance
       */
      RadiolineTx.create = function create(properties) {
        return new RadiolineTx(properties);
      };

      /**
       * Encodes the specified RadiolineTx message. Does not implicitly {@link openbts.uke.RadiolineTx.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {openbts.uke.IRadiolineTx} message RadiolineTx message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineTx.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.longitude != null && Object.hasOwnProperty.call(message, "longitude"))
          writer.uint32(/* id 1, wireType 1 =*/ 9).double(message.longitude);
        if (message.latitude != null && Object.hasOwnProperty.call(message, "latitude"))
          writer.uint32(/* id 2, wireType 1 =*/ 17).double(message.latitude);
        if (message.height != null && Object.hasOwnProperty.call(message, "height")) writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.height);
        if (message.eirp != null && Object.hasOwnProperty.call(message, "eirp")) writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.eirp);
        if (message.antenna_attenuation != null && Object.hasOwnProperty.call(message, "antenna_attenuation"))
          writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.antenna_attenuation);
        if (message.transmitter != null && Object.hasOwnProperty.call(message, "transmitter"))
          $root.openbts.uke.RadiolineTxTransmitter.encode(message.transmitter, writer.uint32(/* id 6, wireType 2 =*/ 50).fork()).ldelim();
        if (message.antenna != null && Object.hasOwnProperty.call(message, "antenna"))
          $root.openbts.uke.RadiolineAtenna.encode(message.antenna, writer.uint32(/* id 7, wireType 2 =*/ 58).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified RadiolineTx message, length delimited. Does not implicitly {@link openbts.uke.RadiolineTx.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {openbts.uke.IRadiolineTx} message RadiolineTx message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineTx.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolineTx message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolineTx} RadiolineTx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineTx.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolineTx();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.longitude = reader.double();
              break;
            }
            case 2: {
              message.latitude = reader.double();
              break;
            }
            case 3: {
              message.height = reader.int32();
              break;
            }
            case 4: {
              message.eirp = reader.int32();
              break;
            }
            case 5: {
              message.antenna_attenuation = reader.int32();
              break;
            }
            case 6: {
              message.transmitter = $root.openbts.uke.RadiolineTxTransmitter.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 7: {
              message.antenna = $root.openbts.uke.RadiolineAtenna.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolineTx message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolineTx} RadiolineTx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineTx.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolineTx message.
       * @function verify
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolineTx.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          if (typeof message.longitude !== "number") return "longitude: number expected";
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          if (typeof message.latitude !== "number") return "latitude: number expected";
        if (message.height != null && message.hasOwnProperty("height")) if (!$util.isInteger(message.height)) return "height: integer expected";
        if (message.eirp != null && message.hasOwnProperty("eirp")) if (!$util.isInteger(message.eirp)) return "eirp: integer expected";
        if (message.antenna_attenuation != null && message.hasOwnProperty("antenna_attenuation"))
          if (!$util.isInteger(message.antenna_attenuation)) return "antenna_attenuation: integer expected";
        if (message.transmitter != null && message.hasOwnProperty("transmitter")) {
          let error = $root.openbts.uke.RadiolineTxTransmitter.verify(message.transmitter, long + 1);
          if (error) return "transmitter." + error;
        }
        if (message.antenna != null && message.hasOwnProperty("antenna")) {
          let error = $root.openbts.uke.RadiolineAtenna.verify(message.antenna, long + 1);
          if (error) return "antenna." + error;
        }
        return null;
      };

      /**
       * Creates a RadiolineTx message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolineTx} RadiolineTx
       */
      RadiolineTx.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolineTx) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolineTx();
        if (object.longitude != null) message.longitude = Number(object.longitude);
        if (object.latitude != null) message.latitude = Number(object.latitude);
        if (object.height != null) message.height = object.height | 0;
        if (object.eirp != null) message.eirp = object.eirp | 0;
        if (object.antenna_attenuation != null) message.antenna_attenuation = object.antenna_attenuation | 0;
        if (object.transmitter != null) {
          if (typeof object.transmitter !== "object") throw TypeError(".openbts.uke.RadiolineTx.transmitter: object expected");
          message.transmitter = $root.openbts.uke.RadiolineTxTransmitter.fromObject(object.transmitter, long + 1);
        }
        if (object.antenna != null) {
          if (typeof object.antenna !== "object") throw TypeError(".openbts.uke.RadiolineTx.antenna: object expected");
          message.antenna = $root.openbts.uke.RadiolineAtenna.fromObject(object.antenna, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a RadiolineTx message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {openbts.uke.RadiolineTx} message RadiolineTx
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolineTx.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.longitude = 0;
          object.latitude = 0;
          object.height = 0;
          object.eirp = 0;
          object.antenna_attenuation = 0;
          object.transmitter = null;
          object.antenna = null;
        }
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
        if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
        if (message.eirp != null && message.hasOwnProperty("eirp")) object.eirp = message.eirp;
        if (message.antenna_attenuation != null && message.hasOwnProperty("antenna_attenuation"))
          object.antenna_attenuation = message.antenna_attenuation;
        if (message.transmitter != null && message.hasOwnProperty("transmitter"))
          object.transmitter = $root.openbts.uke.RadiolineTxTransmitter.toObject(message.transmitter, options);
        if (message.antenna != null && message.hasOwnProperty("antenna"))
          object.antenna = $root.openbts.uke.RadiolineAtenna.toObject(message.antenna, options);
        return object;
      };

      /**
       * Converts this RadiolineTx to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolineTx
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolineTx.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolineTx
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolineTx
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolineTx.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolineTx";
      };

      return RadiolineTx;
    })();

    uke.RadiolineRx = (function () {
      /**
       * Properties of a RadiolineRx.
       * @memberof openbts.uke
       * @interface IRadiolineRx
       * @property {number|null} [longitude] RadiolineRx longitude
       * @property {number|null} [latitude] RadiolineRx latitude
       * @property {number|null} [height] RadiolineRx height
       * @property {openbts.uke.IEquipmentType|null} [type] RadiolineRx type
       * @property {number|null} [gain] RadiolineRx gain
       * @property {number|null} [height_antenna] RadiolineRx height_antenna
       * @property {number|null} [noise_figure] RadiolineRx noise_figure
       * @property {number|null} [atpc_attenuation] RadiolineRx atpc_attenuation
       */

      /**
       * Constructs a new RadiolineRx.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolineRx.
       * @implements IRadiolineRx
       * @constructor
       * @param {openbts.uke.IRadiolineRx=} [properties] Properties to set
       */
      function RadiolineRx(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolineRx longitude.
       * @member {number} longitude
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.longitude = 0;

      /**
       * RadiolineRx latitude.
       * @member {number} latitude
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.latitude = 0;

      /**
       * RadiolineRx height.
       * @member {number} height
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.height = 0;

      /**
       * RadiolineRx type.
       * @member {openbts.uke.IEquipmentType|null|undefined} type
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.type = null;

      /**
       * RadiolineRx gain.
       * @member {number} gain
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.gain = 0;

      /**
       * RadiolineRx height_antenna.
       * @member {number} height_antenna
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.height_antenna = 0;

      /**
       * RadiolineRx noise_figure.
       * @member {number} noise_figure
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.noise_figure = 0;

      /**
       * RadiolineRx atpc_attenuation.
       * @member {number} atpc_attenuation
       * @memberof openbts.uke.RadiolineRx
       * @instance
       */
      RadiolineRx.prototype.atpc_attenuation = 0;

      /**
       * Creates a new RadiolineRx instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {openbts.uke.IRadiolineRx=} [properties] Properties to set
       * @returns {openbts.uke.RadiolineRx} RadiolineRx instance
       */
      RadiolineRx.create = function create(properties) {
        return new RadiolineRx(properties);
      };

      /**
       * Encodes the specified RadiolineRx message. Does not implicitly {@link openbts.uke.RadiolineRx.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {openbts.uke.IRadiolineRx} message RadiolineRx message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineRx.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.longitude != null && Object.hasOwnProperty.call(message, "longitude"))
          writer.uint32(/* id 1, wireType 1 =*/ 9).double(message.longitude);
        if (message.latitude != null && Object.hasOwnProperty.call(message, "latitude"))
          writer.uint32(/* id 2, wireType 1 =*/ 17).double(message.latitude);
        if (message.height != null && Object.hasOwnProperty.call(message, "height")) writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.height);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
          $root.openbts.uke.EquipmentType.encode(message.type, writer.uint32(/* id 4, wireType 2 =*/ 34).fork()).ldelim();
        if (message.gain != null && Object.hasOwnProperty.call(message, "gain")) writer.uint32(/* id 5, wireType 0 =*/ 40).int32(message.gain);
        if (message.height_antenna != null && Object.hasOwnProperty.call(message, "height_antenna"))
          writer.uint32(/* id 6, wireType 0 =*/ 48).int32(message.height_antenna);
        if (message.noise_figure != null && Object.hasOwnProperty.call(message, "noise_figure"))
          writer.uint32(/* id 7, wireType 0 =*/ 56).int32(message.noise_figure);
        if (message.atpc_attenuation != null && Object.hasOwnProperty.call(message, "atpc_attenuation"))
          writer.uint32(/* id 8, wireType 0 =*/ 64).int32(message.atpc_attenuation);
        return writer;
      };

      /**
       * Encodes the specified RadiolineRx message, length delimited. Does not implicitly {@link openbts.uke.RadiolineRx.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {openbts.uke.IRadiolineRx} message RadiolineRx message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineRx.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolineRx message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolineRx} RadiolineRx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineRx.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolineRx();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.longitude = reader.double();
              break;
            }
            case 2: {
              message.latitude = reader.double();
              break;
            }
            case 3: {
              message.height = reader.int32();
              break;
            }
            case 4: {
              message.type = $root.openbts.uke.EquipmentType.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 5: {
              message.gain = reader.int32();
              break;
            }
            case 6: {
              message.height_antenna = reader.int32();
              break;
            }
            case 7: {
              message.noise_figure = reader.int32();
              break;
            }
            case 8: {
              message.atpc_attenuation = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolineRx message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolineRx} RadiolineRx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineRx.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolineRx message.
       * @function verify
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolineRx.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          if (typeof message.longitude !== "number") return "longitude: number expected";
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          if (typeof message.latitude !== "number") return "latitude: number expected";
        if (message.height != null && message.hasOwnProperty("height")) if (!$util.isInteger(message.height)) return "height: integer expected";
        if (message.type != null && message.hasOwnProperty("type")) {
          let error = $root.openbts.uke.EquipmentType.verify(message.type, long + 1);
          if (error) return "type." + error;
        }
        if (message.gain != null && message.hasOwnProperty("gain")) if (!$util.isInteger(message.gain)) return "gain: integer expected";
        if (message.height_antenna != null && message.hasOwnProperty("height_antenna"))
          if (!$util.isInteger(message.height_antenna)) return "height_antenna: integer expected";
        if (message.noise_figure != null && message.hasOwnProperty("noise_figure"))
          if (!$util.isInteger(message.noise_figure)) return "noise_figure: integer expected";
        if (message.atpc_attenuation != null && message.hasOwnProperty("atpc_attenuation"))
          if (!$util.isInteger(message.atpc_attenuation)) return "atpc_attenuation: integer expected";
        return null;
      };

      /**
       * Creates a RadiolineRx message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolineRx} RadiolineRx
       */
      RadiolineRx.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolineRx) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolineRx();
        if (object.longitude != null) message.longitude = Number(object.longitude);
        if (object.latitude != null) message.latitude = Number(object.latitude);
        if (object.height != null) message.height = object.height | 0;
        if (object.type != null) {
          if (typeof object.type !== "object") throw TypeError(".openbts.uke.RadiolineRx.type: object expected");
          message.type = $root.openbts.uke.EquipmentType.fromObject(object.type, long + 1);
        }
        if (object.gain != null) message.gain = object.gain | 0;
        if (object.height_antenna != null) message.height_antenna = object.height_antenna | 0;
        if (object.noise_figure != null) message.noise_figure = object.noise_figure | 0;
        if (object.atpc_attenuation != null) message.atpc_attenuation = object.atpc_attenuation | 0;
        return message;
      };

      /**
       * Creates a plain object from a RadiolineRx message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {openbts.uke.RadiolineRx} message RadiolineRx
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolineRx.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.longitude = 0;
          object.latitude = 0;
          object.height = 0;
          object.type = null;
          object.gain = 0;
          object.height_antenna = 0;
          object.noise_figure = 0;
          object.atpc_attenuation = 0;
        }
        if (message.longitude != null && message.hasOwnProperty("longitude"))
          object.longitude = options.json && !isFinite(message.longitude) ? String(message.longitude) : message.longitude;
        if (message.latitude != null && message.hasOwnProperty("latitude"))
          object.latitude = options.json && !isFinite(message.latitude) ? String(message.latitude) : message.latitude;
        if (message.height != null && message.hasOwnProperty("height")) object.height = message.height;
        if (message.type != null && message.hasOwnProperty("type")) object.type = $root.openbts.uke.EquipmentType.toObject(message.type, options);
        if (message.gain != null && message.hasOwnProperty("gain")) object.gain = message.gain;
        if (message.height_antenna != null && message.hasOwnProperty("height_antenna")) object.height_antenna = message.height_antenna;
        if (message.noise_figure != null && message.hasOwnProperty("noise_figure")) object.noise_figure = message.noise_figure;
        if (message.atpc_attenuation != null && message.hasOwnProperty("atpc_attenuation")) object.atpc_attenuation = message.atpc_attenuation;
        return object;
      };

      /**
       * Converts this RadiolineRx to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolineRx
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolineRx.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolineRx
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolineRx
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolineRx.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolineRx";
      };

      return RadiolineRx;
    })();

    uke.RadiolineLink = (function () {
      /**
       * Properties of a RadiolineLink.
       * @memberof openbts.uke
       * @interface IRadiolineLink
       * @property {number|null} [freq] RadiolineLink freq
       * @property {number|null} [ch_num] RadiolineLink ch_num
       * @property {string|null} [plan_synbol] RadiolineLink plan_synbol
       * @property {number|null} [ch_width] RadiolineLink ch_width
       * @property {string|null} [polarization] RadiolineLink polarization
       * @property {string|null} [modulation_type] RadiolineLink modulation_type
       * @property {string|null} [bandwidth] RadiolineLink bandwidth
       */

      /**
       * Constructs a new RadiolineLink.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolineLink.
       * @implements IRadiolineLink
       * @constructor
       * @param {openbts.uke.IRadiolineLink=} [properties] Properties to set
       */
      function RadiolineLink(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolineLink freq.
       * @member {number} freq
       * @memberof openbts.uke.RadiolineLink
       * @instance
       */
      RadiolineLink.prototype.freq = 0;

      /**
       * RadiolineLink ch_num.
       * @member {number} ch_num
       * @memberof openbts.uke.RadiolineLink
       * @instance
       */
      RadiolineLink.prototype.ch_num = 0;

      /**
       * RadiolineLink plan_synbol.
       * @member {string} plan_synbol
       * @memberof openbts.uke.RadiolineLink
       * @instance
       */
      RadiolineLink.prototype.plan_synbol = "";

      /**
       * RadiolineLink ch_width.
       * @member {number} ch_width
       * @memberof openbts.uke.RadiolineLink
       * @instance
       */
      RadiolineLink.prototype.ch_width = 0;

      /**
       * RadiolineLink polarization.
       * @member {string} polarization
       * @memberof openbts.uke.RadiolineLink
       * @instance
       */
      RadiolineLink.prototype.polarization = "";

      /**
       * RadiolineLink modulation_type.
       * @member {string} modulation_type
       * @memberof openbts.uke.RadiolineLink
       * @instance
       */
      RadiolineLink.prototype.modulation_type = "";

      /**
       * RadiolineLink bandwidth.
       * @member {string} bandwidth
       * @memberof openbts.uke.RadiolineLink
       * @instance
       */
      RadiolineLink.prototype.bandwidth = "";

      /**
       * Creates a new RadiolineLink instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {openbts.uke.IRadiolineLink=} [properties] Properties to set
       * @returns {openbts.uke.RadiolineLink} RadiolineLink instance
       */
      RadiolineLink.create = function create(properties) {
        return new RadiolineLink(properties);
      };

      /**
       * Encodes the specified RadiolineLink message. Does not implicitly {@link openbts.uke.RadiolineLink.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {openbts.uke.IRadiolineLink} message RadiolineLink message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineLink.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.freq != null && Object.hasOwnProperty.call(message, "freq")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.freq);
        if (message.ch_num != null && Object.hasOwnProperty.call(message, "ch_num")) writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.ch_num);
        if (message.plan_synbol != null && Object.hasOwnProperty.call(message, "plan_synbol"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.plan_synbol);
        if (message.ch_width != null && Object.hasOwnProperty.call(message, "ch_width"))
          writer.uint32(/* id 4, wireType 0 =*/ 32).int32(message.ch_width);
        if (message.polarization != null && Object.hasOwnProperty.call(message, "polarization"))
          writer.uint32(/* id 5, wireType 2 =*/ 42).string(message.polarization);
        if (message.modulation_type != null && Object.hasOwnProperty.call(message, "modulation_type"))
          writer.uint32(/* id 6, wireType 2 =*/ 50).string(message.modulation_type);
        if (message.bandwidth != null && Object.hasOwnProperty.call(message, "bandwidth"))
          writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.bandwidth);
        return writer;
      };

      /**
       * Encodes the specified RadiolineLink message, length delimited. Does not implicitly {@link openbts.uke.RadiolineLink.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {openbts.uke.IRadiolineLink} message RadiolineLink message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineLink.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolineLink message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolineLink} RadiolineLink
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineLink.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolineLink();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.freq = reader.int32();
              break;
            }
            case 2: {
              message.ch_num = reader.int32();
              break;
            }
            case 3: {
              message.plan_synbol = reader.string();
              break;
            }
            case 4: {
              message.ch_width = reader.int32();
              break;
            }
            case 5: {
              message.polarization = reader.string();
              break;
            }
            case 6: {
              message.modulation_type = reader.string();
              break;
            }
            case 7: {
              message.bandwidth = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolineLink message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolineLink} RadiolineLink
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineLink.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolineLink message.
       * @function verify
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolineLink.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.freq != null && message.hasOwnProperty("freq")) if (!$util.isInteger(message.freq)) return "freq: integer expected";
        if (message.ch_num != null && message.hasOwnProperty("ch_num")) if (!$util.isInteger(message.ch_num)) return "ch_num: integer expected";
        if (message.plan_synbol != null && message.hasOwnProperty("plan_synbol"))
          if (!$util.isString(message.plan_synbol)) return "plan_synbol: string expected";
        if (message.ch_width != null && message.hasOwnProperty("ch_width"))
          if (!$util.isInteger(message.ch_width)) return "ch_width: integer expected";
        if (message.polarization != null && message.hasOwnProperty("polarization"))
          if (!$util.isString(message.polarization)) return "polarization: string expected";
        if (message.modulation_type != null && message.hasOwnProperty("modulation_type"))
          if (!$util.isString(message.modulation_type)) return "modulation_type: string expected";
        if (message.bandwidth != null && message.hasOwnProperty("bandwidth"))
          if (!$util.isString(message.bandwidth)) return "bandwidth: string expected";
        return null;
      };

      /**
       * Creates a RadiolineLink message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolineLink} RadiolineLink
       */
      RadiolineLink.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolineLink) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolineLink();
        if (object.freq != null) message.freq = object.freq | 0;
        if (object.ch_num != null) message.ch_num = object.ch_num | 0;
        if (object.plan_synbol != null) message.plan_synbol = String(object.plan_synbol);
        if (object.ch_width != null) message.ch_width = object.ch_width | 0;
        if (object.polarization != null) message.polarization = String(object.polarization);
        if (object.modulation_type != null) message.modulation_type = String(object.modulation_type);
        if (object.bandwidth != null) message.bandwidth = String(object.bandwidth);
        return message;
      };

      /**
       * Creates a plain object from a RadiolineLink message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {openbts.uke.RadiolineLink} message RadiolineLink
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolineLink.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.freq = 0;
          object.ch_num = 0;
          object.plan_synbol = "";
          object.ch_width = 0;
          object.polarization = "";
          object.modulation_type = "";
          object.bandwidth = "";
        }
        if (message.freq != null && message.hasOwnProperty("freq")) object.freq = message.freq;
        if (message.ch_num != null && message.hasOwnProperty("ch_num")) object.ch_num = message.ch_num;
        if (message.plan_synbol != null && message.hasOwnProperty("plan_synbol")) object.plan_synbol = message.plan_synbol;
        if (message.ch_width != null && message.hasOwnProperty("ch_width")) object.ch_width = message.ch_width;
        if (message.polarization != null && message.hasOwnProperty("polarization")) object.polarization = message.polarization;
        if (message.modulation_type != null && message.hasOwnProperty("modulation_type")) object.modulation_type = message.modulation_type;
        if (message.bandwidth != null && message.hasOwnProperty("bandwidth")) object.bandwidth = message.bandwidth;
        return object;
      };

      /**
       * Converts this RadiolineLink to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolineLink
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolineLink.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolineLink
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolineLink
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolineLink.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolineLink";
      };

      return RadiolineLink;
    })();

    uke.RadiolinePermit = (function () {
      /**
       * Properties of a RadiolinePermit.
       * @memberof openbts.uke
       * @interface IRadiolinePermit
       * @property {string|null} [number] RadiolinePermit number
       * @property {string|null} [decision_type] RadiolinePermit decision_type
       * @property {string|null} [expiry_date] RadiolinePermit expiry_date
       */

      /**
       * Constructs a new RadiolinePermit.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolinePermit.
       * @implements IRadiolinePermit
       * @constructor
       * @param {openbts.uke.IRadiolinePermit=} [properties] Properties to set
       */
      function RadiolinePermit(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolinePermit number.
       * @member {string} number
       * @memberof openbts.uke.RadiolinePermit
       * @instance
       */
      RadiolinePermit.prototype.number = "";

      /**
       * RadiolinePermit decision_type.
       * @member {string} decision_type
       * @memberof openbts.uke.RadiolinePermit
       * @instance
       */
      RadiolinePermit.prototype.decision_type = "";

      /**
       * RadiolinePermit expiry_date.
       * @member {string} expiry_date
       * @memberof openbts.uke.RadiolinePermit
       * @instance
       */
      RadiolinePermit.prototype.expiry_date = "";

      /**
       * Creates a new RadiolinePermit instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {openbts.uke.IRadiolinePermit=} [properties] Properties to set
       * @returns {openbts.uke.RadiolinePermit} RadiolinePermit instance
       */
      RadiolinePermit.create = function create(properties) {
        return new RadiolinePermit(properties);
      };

      /**
       * Encodes the specified RadiolinePermit message. Does not implicitly {@link openbts.uke.RadiolinePermit.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {openbts.uke.IRadiolinePermit} message RadiolinePermit message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolinePermit.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.number != null && Object.hasOwnProperty.call(message, "number")) writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.number);
        if (message.decision_type != null && Object.hasOwnProperty.call(message, "decision_type"))
          writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.decision_type);
        if (message.expiry_date != null && Object.hasOwnProperty.call(message, "expiry_date"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.expiry_date);
        return writer;
      };

      /**
       * Encodes the specified RadiolinePermit message, length delimited. Does not implicitly {@link openbts.uke.RadiolinePermit.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {openbts.uke.IRadiolinePermit} message RadiolinePermit message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolinePermit.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolinePermit message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolinePermit} RadiolinePermit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolinePermit.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolinePermit();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.number = reader.string();
              break;
            }
            case 2: {
              message.decision_type = reader.string();
              break;
            }
            case 3: {
              message.expiry_date = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolinePermit message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolinePermit} RadiolinePermit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolinePermit.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolinePermit message.
       * @function verify
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolinePermit.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.number != null && message.hasOwnProperty("number")) if (!$util.isString(message.number)) return "number: string expected";
        if (message.decision_type != null && message.hasOwnProperty("decision_type"))
          if (!$util.isString(message.decision_type)) return "decision_type: string expected";
        if (message.expiry_date != null && message.hasOwnProperty("expiry_date"))
          if (!$util.isString(message.expiry_date)) return "expiry_date: string expected";
        return null;
      };

      /**
       * Creates a RadiolinePermit message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolinePermit} RadiolinePermit
       */
      RadiolinePermit.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolinePermit) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolinePermit();
        if (object.number != null) message.number = String(object.number);
        if (object.decision_type != null) message.decision_type = String(object.decision_type);
        if (object.expiry_date != null) message.expiry_date = String(object.expiry_date);
        return message;
      };

      /**
       * Creates a plain object from a RadiolinePermit message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {openbts.uke.RadiolinePermit} message RadiolinePermit
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolinePermit.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.number = "";
          object.decision_type = "";
          object.expiry_date = "";
        }
        if (message.number != null && message.hasOwnProperty("number")) object.number = message.number;
        if (message.decision_type != null && message.hasOwnProperty("decision_type")) object.decision_type = message.decision_type;
        if (message.expiry_date != null && message.hasOwnProperty("expiry_date")) object.expiry_date = message.expiry_date;
        return object;
      };

      /**
       * Converts this RadiolinePermit to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolinePermit
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolinePermit.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolinePermit
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolinePermit
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolinePermit.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolinePermit";
      };

      return RadiolinePermit;
    })();

    uke.Radioline = (function () {
      /**
       * Properties of a Radioline.
       * @memberof openbts.uke
       * @interface IRadioline
       * @property {number|null} [id] Radioline id
       * @property {openbts.uke.IRadiolineTx|null} [tx] Radioline tx
       * @property {openbts.uke.IRadiolineRx|null} [rx] Radioline rx
       * @property {openbts.uke.IRadiolineLink|null} [link] Radioline link
       * @property {openbts.uke.IUKEOperator|null} [operator] Radioline operator
       * @property {openbts.uke.IRadiolinePermit|null} [permit] Radioline permit
       * @property {string|null} [updatedAt] Radioline updatedAt
       * @property {string|null} [createdAt] Radioline createdAt
       */

      /**
       * Constructs a new Radioline.
       * @memberof openbts.uke
       * @classdesc Represents a Radioline.
       * @implements IRadioline
       * @constructor
       * @param {openbts.uke.IRadioline=} [properties] Properties to set
       */
      function Radioline(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Radioline id.
       * @member {number} id
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.id = 0;

      /**
       * Radioline tx.
       * @member {openbts.uke.IRadiolineTx|null|undefined} tx
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.tx = null;

      /**
       * Radioline rx.
       * @member {openbts.uke.IRadiolineRx|null|undefined} rx
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.rx = null;

      /**
       * Radioline link.
       * @member {openbts.uke.IRadiolineLink|null|undefined} link
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.link = null;

      /**
       * Radioline operator.
       * @member {openbts.uke.IUKEOperator|null|undefined} operator
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.operator = null;

      /**
       * Radioline permit.
       * @member {openbts.uke.IRadiolinePermit|null|undefined} permit
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.permit = null;

      /**
       * Radioline updatedAt.
       * @member {string} updatedAt
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.updatedAt = "";

      /**
       * Radioline createdAt.
       * @member {string} createdAt
       * @memberof openbts.uke.Radioline
       * @instance
       */
      Radioline.prototype.createdAt = "";

      /**
       * Creates a new Radioline instance using the specified properties.
       * @function create
       * @memberof openbts.uke.Radioline
       * @static
       * @param {openbts.uke.IRadioline=} [properties] Properties to set
       * @returns {openbts.uke.Radioline} Radioline instance
       */
      Radioline.create = function create(properties) {
        return new Radioline(properties);
      };

      /**
       * Encodes the specified Radioline message. Does not implicitly {@link openbts.uke.Radioline.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.Radioline
       * @static
       * @param {openbts.uke.IRadioline} message Radioline message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Radioline.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id")) writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.id);
        if (message.tx != null && Object.hasOwnProperty.call(message, "tx"))
          $root.openbts.uke.RadiolineTx.encode(message.tx, writer.uint32(/* id 2, wireType 2 =*/ 18).fork()).ldelim();
        if (message.rx != null && Object.hasOwnProperty.call(message, "rx"))
          $root.openbts.uke.RadiolineRx.encode(message.rx, writer.uint32(/* id 3, wireType 2 =*/ 26).fork()).ldelim();
        if (message.link != null && Object.hasOwnProperty.call(message, "link"))
          $root.openbts.uke.RadiolineLink.encode(message.link, writer.uint32(/* id 4, wireType 2 =*/ 34).fork()).ldelim();
        if (message.operator != null && Object.hasOwnProperty.call(message, "operator"))
          $root.openbts.uke.UKEOperator.encode(message.operator, writer.uint32(/* id 5, wireType 2 =*/ 42).fork()).ldelim();
        if (message.permit != null && Object.hasOwnProperty.call(message, "permit"))
          $root.openbts.uke.RadiolinePermit.encode(message.permit, writer.uint32(/* id 6, wireType 2 =*/ 50).fork()).ldelim();
        if (message.updatedAt != null && Object.hasOwnProperty.call(message, "updatedAt"))
          writer.uint32(/* id 7, wireType 2 =*/ 58).string(message.updatedAt);
        if (message.createdAt != null && Object.hasOwnProperty.call(message, "createdAt"))
          writer.uint32(/* id 8, wireType 2 =*/ 66).string(message.createdAt);
        return writer;
      };

      /**
       * Encodes the specified Radioline message, length delimited. Does not implicitly {@link openbts.uke.Radioline.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.Radioline
       * @static
       * @param {openbts.uke.IRadioline} message Radioline message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Radioline.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Radioline message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.Radioline
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.Radioline} Radioline
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Radioline.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.Radioline();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.id = reader.int32();
              break;
            }
            case 2: {
              message.tx = $root.openbts.uke.RadiolineTx.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 3: {
              message.rx = $root.openbts.uke.RadiolineRx.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 4: {
              message.link = $root.openbts.uke.RadiolineLink.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 5: {
              message.operator = $root.openbts.uke.UKEOperator.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 6: {
              message.permit = $root.openbts.uke.RadiolinePermit.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 7: {
              message.updatedAt = reader.string();
              break;
            }
            case 8: {
              message.createdAt = reader.string();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Radioline message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.Radioline
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.Radioline} Radioline
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Radioline.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Radioline message.
       * @function verify
       * @memberof openbts.uke.Radioline
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Radioline.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.id != null && message.hasOwnProperty("id")) if (!$util.isInteger(message.id)) return "id: integer expected";
        if (message.tx != null && message.hasOwnProperty("tx")) {
          let error = $root.openbts.uke.RadiolineTx.verify(message.tx, long + 1);
          if (error) return "tx." + error;
        }
        if (message.rx != null && message.hasOwnProperty("rx")) {
          let error = $root.openbts.uke.RadiolineRx.verify(message.rx, long + 1);
          if (error) return "rx." + error;
        }
        if (message.link != null && message.hasOwnProperty("link")) {
          let error = $root.openbts.uke.RadiolineLink.verify(message.link, long + 1);
          if (error) return "link." + error;
        }
        if (message.operator != null && message.hasOwnProperty("operator")) {
          let error = $root.openbts.uke.UKEOperator.verify(message.operator, long + 1);
          if (error) return "operator." + error;
        }
        if (message.permit != null && message.hasOwnProperty("permit")) {
          let error = $root.openbts.uke.RadiolinePermit.verify(message.permit, long + 1);
          if (error) return "permit." + error;
        }
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt"))
          if (!$util.isString(message.updatedAt)) return "updatedAt: string expected";
        if (message.createdAt != null && message.hasOwnProperty("createdAt"))
          if (!$util.isString(message.createdAt)) return "createdAt: string expected";
        return null;
      };

      /**
       * Creates a Radioline message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.Radioline
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.Radioline} Radioline
       */
      Radioline.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.Radioline) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.Radioline();
        if (object.id != null) message.id = object.id | 0;
        if (object.tx != null) {
          if (typeof object.tx !== "object") throw TypeError(".openbts.uke.Radioline.tx: object expected");
          message.tx = $root.openbts.uke.RadiolineTx.fromObject(object.tx, long + 1);
        }
        if (object.rx != null) {
          if (typeof object.rx !== "object") throw TypeError(".openbts.uke.Radioline.rx: object expected");
          message.rx = $root.openbts.uke.RadiolineRx.fromObject(object.rx, long + 1);
        }
        if (object.link != null) {
          if (typeof object.link !== "object") throw TypeError(".openbts.uke.Radioline.link: object expected");
          message.link = $root.openbts.uke.RadiolineLink.fromObject(object.link, long + 1);
        }
        if (object.operator != null) {
          if (typeof object.operator !== "object") throw TypeError(".openbts.uke.Radioline.operator: object expected");
          message.operator = $root.openbts.uke.UKEOperator.fromObject(object.operator, long + 1);
        }
        if (object.permit != null) {
          if (typeof object.permit !== "object") throw TypeError(".openbts.uke.Radioline.permit: object expected");
          message.permit = $root.openbts.uke.RadiolinePermit.fromObject(object.permit, long + 1);
        }
        if (object.updatedAt != null) message.updatedAt = String(object.updatedAt);
        if (object.createdAt != null) message.createdAt = String(object.createdAt);
        return message;
      };

      /**
       * Creates a plain object from a Radioline message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.Radioline
       * @static
       * @param {openbts.uke.Radioline} message Radioline
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Radioline.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          object.id = 0;
          object.tx = null;
          object.rx = null;
          object.link = null;
          object.operator = null;
          object.permit = null;
          object.updatedAt = "";
          object.createdAt = "";
        }
        if (message.id != null && message.hasOwnProperty("id")) object.id = message.id;
        if (message.tx != null && message.hasOwnProperty("tx")) object.tx = $root.openbts.uke.RadiolineTx.toObject(message.tx, options);
        if (message.rx != null && message.hasOwnProperty("rx")) object.rx = $root.openbts.uke.RadiolineRx.toObject(message.rx, options);
        if (message.link != null && message.hasOwnProperty("link")) object.link = $root.openbts.uke.RadiolineLink.toObject(message.link, options);
        if (message.operator != null && message.hasOwnProperty("operator"))
          object.operator = $root.openbts.uke.UKEOperator.toObject(message.operator, options);
        if (message.permit != null && message.hasOwnProperty("permit"))
          object.permit = $root.openbts.uke.RadiolinePermit.toObject(message.permit, options);
        if (message.updatedAt != null && message.hasOwnProperty("updatedAt")) object.updatedAt = message.updatedAt;
        if (message.createdAt != null && message.hasOwnProperty("createdAt")) object.createdAt = message.createdAt;
        return object;
      };

      /**
       * Converts this Radioline to JSON.
       * @function toJSON
       * @memberof openbts.uke.Radioline
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Radioline.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Radioline
       * @function getTypeUrl
       * @memberof openbts.uke.Radioline
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Radioline.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.Radioline";
      };

      return Radioline;
    })();

    uke.PermitsResponse = (function () {
      /**
       * Properties of a PermitsResponse.
       * @memberof openbts.uke
       * @interface IPermitsResponse
       * @property {Array.<openbts.uke.IPermit>|null} [data] PermitsResponse data
       */

      /**
       * Constructs a new PermitsResponse.
       * @memberof openbts.uke
       * @classdesc Represents a PermitsResponse.
       * @implements IPermitsResponse
       * @constructor
       * @param {openbts.uke.IPermitsResponse=} [properties] Properties to set
       */
      function PermitsResponse(properties) {
        this.data = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * PermitsResponse data.
       * @member {Array.<openbts.uke.IPermit>} data
       * @memberof openbts.uke.PermitsResponse
       * @instance
       */
      PermitsResponse.prototype.data = $util.emptyArray;

      /**
       * Creates a new PermitsResponse instance using the specified properties.
       * @function create
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {openbts.uke.IPermitsResponse=} [properties] Properties to set
       * @returns {openbts.uke.PermitsResponse} PermitsResponse instance
       */
      PermitsResponse.create = function create(properties) {
        return new PermitsResponse(properties);
      };

      /**
       * Encodes the specified PermitsResponse message. Does not implicitly {@link openbts.uke.PermitsResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {openbts.uke.IPermitsResponse} message PermitsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      PermitsResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && message.data.length)
          for (let i = 0; i < message.data.length; ++i)
            $root.openbts.uke.Permit.encode(message.data[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified PermitsResponse message, length delimited. Does not implicitly {@link openbts.uke.PermitsResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {openbts.uke.IPermitsResponse} message PermitsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      PermitsResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a PermitsResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.PermitsResponse} PermitsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      PermitsResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.PermitsResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (!(message.data && message.data.length)) message.data = [];
              message.data.push($root.openbts.uke.Permit.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a PermitsResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.PermitsResponse} PermitsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      PermitsResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a PermitsResponse message.
       * @function verify
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      PermitsResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          if (!Array.isArray(message.data)) return "data: array expected";
          for (let i = 0; i < message.data.length; ++i) {
            let error = $root.openbts.uke.Permit.verify(message.data[i], long + 1);
            if (error) return "data." + error;
          }
        }
        return null;
      };

      /**
       * Creates a PermitsResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.PermitsResponse} PermitsResponse
       */
      PermitsResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.PermitsResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.PermitsResponse();
        if (object.data) {
          if (!Array.isArray(object.data)) throw TypeError(".openbts.uke.PermitsResponse.data: array expected");
          message.data = [];
          for (let i = 0; i < object.data.length; ++i) {
            if (typeof object.data[i] !== "object") throw TypeError(".openbts.uke.PermitsResponse.data: object expected");
            message.data[i] = $root.openbts.uke.Permit.fromObject(object.data[i], long + 1);
          }
        }
        return message;
      };

      /**
       * Creates a plain object from a PermitsResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {openbts.uke.PermitsResponse} message PermitsResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      PermitsResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.data = [];
        if (message.data && message.data.length) {
          object.data = [];
          for (let j = 0; j < message.data.length; ++j) object.data[j] = $root.openbts.uke.Permit.toObject(message.data[j], options);
        }
        return object;
      };

      /**
       * Converts this PermitsResponse to JSON.
       * @function toJSON
       * @memberof openbts.uke.PermitsResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      PermitsResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for PermitsResponse
       * @function getTypeUrl
       * @memberof openbts.uke.PermitsResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      PermitsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.PermitsResponse";
      };

      return PermitsResponse;
    })();

    uke.PermitResponse = (function () {
      /**
       * Properties of a PermitResponse.
       * @memberof openbts.uke
       * @interface IPermitResponse
       * @property {openbts.uke.IPermit|null} [data] PermitResponse data
       */

      /**
       * Constructs a new PermitResponse.
       * @memberof openbts.uke
       * @classdesc Represents a PermitResponse.
       * @implements IPermitResponse
       * @constructor
       * @param {openbts.uke.IPermitResponse=} [properties] Properties to set
       */
      function PermitResponse(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * PermitResponse data.
       * @member {openbts.uke.IPermit|null|undefined} data
       * @memberof openbts.uke.PermitResponse
       * @instance
       */
      PermitResponse.prototype.data = null;

      /**
       * Creates a new PermitResponse instance using the specified properties.
       * @function create
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {openbts.uke.IPermitResponse=} [properties] Properties to set
       * @returns {openbts.uke.PermitResponse} PermitResponse instance
       */
      PermitResponse.create = function create(properties) {
        return new PermitResponse(properties);
      };

      /**
       * Encodes the specified PermitResponse message. Does not implicitly {@link openbts.uke.PermitResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {openbts.uke.IPermitResponse} message PermitResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      PermitResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && Object.hasOwnProperty.call(message, "data"))
          $root.openbts.uke.Permit.encode(message.data, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified PermitResponse message, length delimited. Does not implicitly {@link openbts.uke.PermitResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {openbts.uke.IPermitResponse} message PermitResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      PermitResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a PermitResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.PermitResponse} PermitResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      PermitResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.PermitResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.data = $root.openbts.uke.Permit.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a PermitResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.PermitResponse} PermitResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      PermitResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a PermitResponse message.
       * @function verify
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      PermitResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          let error = $root.openbts.uke.Permit.verify(message.data, long + 1);
          if (error) return "data." + error;
        }
        return null;
      };

      /**
       * Creates a PermitResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.PermitResponse} PermitResponse
       */
      PermitResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.PermitResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.PermitResponse();
        if (object.data != null) {
          if (typeof object.data !== "object") throw TypeError(".openbts.uke.PermitResponse.data: object expected");
          message.data = $root.openbts.uke.Permit.fromObject(object.data, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a PermitResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {openbts.uke.PermitResponse} message PermitResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      PermitResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) object.data = null;
        if (message.data != null && message.hasOwnProperty("data")) object.data = $root.openbts.uke.Permit.toObject(message.data, options);
        return object;
      };

      /**
       * Converts this PermitResponse to JSON.
       * @function toJSON
       * @memberof openbts.uke.PermitResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      PermitResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for PermitResponse
       * @function getTypeUrl
       * @memberof openbts.uke.PermitResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      PermitResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.PermitResponse";
      };

      return PermitResponse;
    })();

    uke.LocationsResponse = (function () {
      /**
       * Properties of a LocationsResponse.
       * @memberof openbts.uke
       * @interface ILocationsResponse
       * @property {Array.<openbts.uke.IUKELocation>|null} [data] LocationsResponse data
       * @property {number|null} [totalCount] LocationsResponse totalCount
       */

      /**
       * Constructs a new LocationsResponse.
       * @memberof openbts.uke
       * @classdesc Represents a LocationsResponse.
       * @implements ILocationsResponse
       * @constructor
       * @param {openbts.uke.ILocationsResponse=} [properties] Properties to set
       */
      function LocationsResponse(properties) {
        this.data = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * LocationsResponse data.
       * @member {Array.<openbts.uke.IUKELocation>} data
       * @memberof openbts.uke.LocationsResponse
       * @instance
       */
      LocationsResponse.prototype.data = $util.emptyArray;

      /**
       * LocationsResponse totalCount.
       * @member {number} totalCount
       * @memberof openbts.uke.LocationsResponse
       * @instance
       */
      LocationsResponse.prototype.totalCount = 0;

      /**
       * Creates a new LocationsResponse instance using the specified properties.
       * @function create
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {openbts.uke.ILocationsResponse=} [properties] Properties to set
       * @returns {openbts.uke.LocationsResponse} LocationsResponse instance
       */
      LocationsResponse.create = function create(properties) {
        return new LocationsResponse(properties);
      };

      /**
       * Encodes the specified LocationsResponse message. Does not implicitly {@link openbts.uke.LocationsResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {openbts.uke.ILocationsResponse} message LocationsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationsResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && message.data.length)
          for (let i = 0; i < message.data.length; ++i)
            $root.openbts.uke.UKELocation.encode(message.data[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        if (message.totalCount != null && Object.hasOwnProperty.call(message, "totalCount"))
          writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.totalCount);
        return writer;
      };

      /**
       * Encodes the specified LocationsResponse message, length delimited. Does not implicitly {@link openbts.uke.LocationsResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {openbts.uke.ILocationsResponse} message LocationsResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      LocationsResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.LocationsResponse} LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationsResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.LocationsResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (!(message.data && message.data.length)) message.data = [];
              message.data.push($root.openbts.uke.UKELocation.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 2: {
              message.totalCount = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.LocationsResponse} LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      LocationsResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a LocationsResponse message.
       * @function verify
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      LocationsResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          if (!Array.isArray(message.data)) return "data: array expected";
          for (let i = 0; i < message.data.length; ++i) {
            let error = $root.openbts.uke.UKELocation.verify(message.data[i], long + 1);
            if (error) return "data." + error;
          }
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount"))
          if (!$util.isInteger(message.totalCount)) return "totalCount: integer expected";
        return null;
      };

      /**
       * Creates a LocationsResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.LocationsResponse} LocationsResponse
       */
      LocationsResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.LocationsResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.LocationsResponse();
        if (object.data) {
          if (!Array.isArray(object.data)) throw TypeError(".openbts.uke.LocationsResponse.data: array expected");
          message.data = [];
          for (let i = 0; i < object.data.length; ++i) {
            if (typeof object.data[i] !== "object") throw TypeError(".openbts.uke.LocationsResponse.data: object expected");
            message.data[i] = $root.openbts.uke.UKELocation.fromObject(object.data[i], long + 1);
          }
        }
        if (object.totalCount != null) message.totalCount = object.totalCount | 0;
        return message;
      };

      /**
       * Creates a plain object from a LocationsResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {openbts.uke.LocationsResponse} message LocationsResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      LocationsResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.data = [];
        if (options.defaults) object.totalCount = 0;
        if (message.data && message.data.length) {
          object.data = [];
          for (let j = 0; j < message.data.length; ++j) object.data[j] = $root.openbts.uke.UKELocation.toObject(message.data[j], options);
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount")) object.totalCount = message.totalCount;
        return object;
      };

      /**
       * Converts this LocationsResponse to JSON.
       * @function toJSON
       * @memberof openbts.uke.LocationsResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      LocationsResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for LocationsResponse
       * @function getTypeUrl
       * @memberof openbts.uke.LocationsResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      LocationsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.LocationsResponse";
      };

      return LocationsResponse;
    })();

    uke.RadiolinesResponse = (function () {
      /**
       * Properties of a RadiolinesResponse.
       * @memberof openbts.uke
       * @interface IRadiolinesResponse
       * @property {Array.<openbts.uke.IRadioline>|null} [data] RadiolinesResponse data
       * @property {number|null} [totalCount] RadiolinesResponse totalCount
       */

      /**
       * Constructs a new RadiolinesResponse.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolinesResponse.
       * @implements IRadiolinesResponse
       * @constructor
       * @param {openbts.uke.IRadiolinesResponse=} [properties] Properties to set
       */
      function RadiolinesResponse(properties) {
        this.data = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolinesResponse data.
       * @member {Array.<openbts.uke.IRadioline>} data
       * @memberof openbts.uke.RadiolinesResponse
       * @instance
       */
      RadiolinesResponse.prototype.data = $util.emptyArray;

      /**
       * RadiolinesResponse totalCount.
       * @member {number} totalCount
       * @memberof openbts.uke.RadiolinesResponse
       * @instance
       */
      RadiolinesResponse.prototype.totalCount = 0;

      /**
       * Creates a new RadiolinesResponse instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {openbts.uke.IRadiolinesResponse=} [properties] Properties to set
       * @returns {openbts.uke.RadiolinesResponse} RadiolinesResponse instance
       */
      RadiolinesResponse.create = function create(properties) {
        return new RadiolinesResponse(properties);
      };

      /**
       * Encodes the specified RadiolinesResponse message. Does not implicitly {@link openbts.uke.RadiolinesResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {openbts.uke.IRadiolinesResponse} message RadiolinesResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolinesResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && message.data.length)
          for (let i = 0; i < message.data.length; ++i)
            $root.openbts.uke.Radioline.encode(message.data[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        if (message.totalCount != null && Object.hasOwnProperty.call(message, "totalCount"))
          writer.uint32(/* id 3, wireType 0 =*/ 24).int32(message.totalCount);
        return writer;
      };

      /**
       * Encodes the specified RadiolinesResponse message, length delimited. Does not implicitly {@link openbts.uke.RadiolinesResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {openbts.uke.IRadiolinesResponse} message RadiolinesResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolinesResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolinesResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolinesResponse} RadiolinesResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolinesResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolinesResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (!(message.data && message.data.length)) message.data = [];
              message.data.push($root.openbts.uke.Radioline.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            case 3: {
              message.totalCount = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolinesResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolinesResponse} RadiolinesResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolinesResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolinesResponse message.
       * @function verify
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolinesResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          if (!Array.isArray(message.data)) return "data: array expected";
          for (let i = 0; i < message.data.length; ++i) {
            let error = $root.openbts.uke.Radioline.verify(message.data[i], long + 1);
            if (error) return "data." + error;
          }
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount"))
          if (!$util.isInteger(message.totalCount)) return "totalCount: integer expected";
        return null;
      };

      /**
       * Creates a RadiolinesResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolinesResponse} RadiolinesResponse
       */
      RadiolinesResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolinesResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolinesResponse();
        if (object.data) {
          if (!Array.isArray(object.data)) throw TypeError(".openbts.uke.RadiolinesResponse.data: array expected");
          message.data = [];
          for (let i = 0; i < object.data.length; ++i) {
            if (typeof object.data[i] !== "object") throw TypeError(".openbts.uke.RadiolinesResponse.data: object expected");
            message.data[i] = $root.openbts.uke.Radioline.fromObject(object.data[i], long + 1);
          }
        }
        if (object.totalCount != null) message.totalCount = object.totalCount | 0;
        return message;
      };

      /**
       * Creates a plain object from a RadiolinesResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {openbts.uke.RadiolinesResponse} message RadiolinesResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolinesResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.data = [];
        if (options.defaults) object.totalCount = 0;
        if (message.data && message.data.length) {
          object.data = [];
          for (let j = 0; j < message.data.length; ++j) object.data[j] = $root.openbts.uke.Radioline.toObject(message.data[j], options);
        }
        if (message.totalCount != null && message.hasOwnProperty("totalCount")) object.totalCount = message.totalCount;
        return object;
      };

      /**
       * Converts this RadiolinesResponse to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolinesResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolinesResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolinesResponse
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolinesResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolinesResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolinesResponse";
      };

      return RadiolinesResponse;
    })();

    uke.RadiolineResponse = (function () {
      /**
       * Properties of a RadiolineResponse.
       * @memberof openbts.uke
       * @interface IRadiolineResponse
       * @property {openbts.uke.IRadioline|null} [data] RadiolineResponse data
       */

      /**
       * Constructs a new RadiolineResponse.
       * @memberof openbts.uke
       * @classdesc Represents a RadiolineResponse.
       * @implements IRadiolineResponse
       * @constructor
       * @param {openbts.uke.IRadiolineResponse=} [properties] Properties to set
       */
      function RadiolineResponse(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * RadiolineResponse data.
       * @member {openbts.uke.IRadioline|null|undefined} data
       * @memberof openbts.uke.RadiolineResponse
       * @instance
       */
      RadiolineResponse.prototype.data = null;

      /**
       * Creates a new RadiolineResponse instance using the specified properties.
       * @function create
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {openbts.uke.IRadiolineResponse=} [properties] Properties to set
       * @returns {openbts.uke.RadiolineResponse} RadiolineResponse instance
       */
      RadiolineResponse.create = function create(properties) {
        return new RadiolineResponse(properties);
      };

      /**
       * Encodes the specified RadiolineResponse message. Does not implicitly {@link openbts.uke.RadiolineResponse.verify|verify} messages.
       * @function encode
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {openbts.uke.IRadiolineResponse} message RadiolineResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineResponse.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.data != null && Object.hasOwnProperty.call(message, "data"))
          $root.openbts.uke.Radioline.encode(message.data, writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified RadiolineResponse message, length delimited. Does not implicitly {@link openbts.uke.RadiolineResponse.verify|verify} messages.
       * @function encodeDelimited
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {openbts.uke.IRadiolineResponse} message RadiolineResponse message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      RadiolineResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a RadiolineResponse message from the specified reader or buffer.
       * @function decode
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {openbts.uke.RadiolineResponse} RadiolineResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.openbts.uke.RadiolineResponse();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.data = $root.openbts.uke.Radioline.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a RadiolineResponse message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {openbts.uke.RadiolineResponse} RadiolineResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      RadiolineResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a RadiolineResponse message.
       * @function verify
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      RadiolineResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.data != null && message.hasOwnProperty("data")) {
          let error = $root.openbts.uke.Radioline.verify(message.data, long + 1);
          if (error) return "data." + error;
        }
        return null;
      };

      /**
       * Creates a RadiolineResponse message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {openbts.uke.RadiolineResponse} RadiolineResponse
       */
      RadiolineResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.openbts.uke.RadiolineResponse) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.openbts.uke.RadiolineResponse();
        if (object.data != null) {
          if (typeof object.data !== "object") throw TypeError(".openbts.uke.RadiolineResponse.data: object expected");
          message.data = $root.openbts.uke.Radioline.fromObject(object.data, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a RadiolineResponse message. Also converts values to other types if specified.
       * @function toObject
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {openbts.uke.RadiolineResponse} message RadiolineResponse
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      RadiolineResponse.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) object.data = null;
        if (message.data != null && message.hasOwnProperty("data")) object.data = $root.openbts.uke.Radioline.toObject(message.data, options);
        return object;
      };

      /**
       * Converts this RadiolineResponse to JSON.
       * @function toJSON
       * @memberof openbts.uke.RadiolineResponse
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      RadiolineResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for RadiolineResponse
       * @function getTypeUrl
       * @memberof openbts.uke.RadiolineResponse
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      RadiolineResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/openbts.uke.RadiolineResponse";
      };

      return RadiolineResponse;
    })();

    return uke;
  })();

  return openbts;
})());

export const google = ($root.google = (() => {
  /**
   * Namespace google.
   * @exports google
   * @namespace
   */
  const google = {};

  google.protobuf = (function () {
    /**
     * Namespace protobuf.
     * @memberof google
     * @namespace
     */
    const protobuf = {};

    protobuf.Timestamp = (function () {
      /**
       * Properties of a Timestamp.
       * @memberof google.protobuf
       * @interface ITimestamp
       * @property {number|Long|null} [seconds] Timestamp seconds
       * @property {number|null} [nanos] Timestamp nanos
       */

      /**
       * Constructs a new Timestamp.
       * @memberof google.protobuf
       * @classdesc Represents a Timestamp.
       * @implements ITimestamp
       * @constructor
       * @param {google.protobuf.ITimestamp=} [properties] Properties to set
       */
      function Timestamp(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Timestamp seconds.
       * @member {number|Long} seconds
       * @memberof google.protobuf.Timestamp
       * @instance
       */
      Timestamp.prototype.seconds = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

      /**
       * Timestamp nanos.
       * @member {number} nanos
       * @memberof google.protobuf.Timestamp
       * @instance
       */
      Timestamp.prototype.nanos = 0;

      /**
       * Creates a new Timestamp instance using the specified properties.
       * @function create
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {google.protobuf.ITimestamp=} [properties] Properties to set
       * @returns {google.protobuf.Timestamp} Timestamp instance
       */
      Timestamp.create = function create(properties) {
        return new Timestamp(properties);
      };

      /**
       * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
       * @function encode
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {google.protobuf.ITimestamp} message Timestamp message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Timestamp.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.seconds != null && Object.hasOwnProperty.call(message, "seconds"))
          writer.uint32(/* id 1, wireType 0 =*/ 8).int64(message.seconds);
        if (message.nanos != null && Object.hasOwnProperty.call(message, "nanos")) writer.uint32(/* id 2, wireType 0 =*/ 16).int32(message.nanos);
        return writer;
      };

      /**
       * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
       * @function encodeDelimited
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {google.protobuf.ITimestamp} message Timestamp message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Timestamp.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Timestamp message from the specified reader or buffer.
       * @function decode
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {google.protobuf.Timestamp} Timestamp
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Timestamp.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.google.protobuf.Timestamp();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.seconds = reader.int64();
              break;
            }
            case 2: {
              message.nanos = reader.int32();
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Timestamp message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {google.protobuf.Timestamp} Timestamp
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Timestamp.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Timestamp message.
       * @function verify
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Timestamp.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.seconds != null && message.hasOwnProperty("seconds"))
          if (
            !$util.isInteger(message.seconds) &&
            !(message.seconds && $util.isInteger(message.seconds.low) && $util.isInteger(message.seconds.high))
          )
            return "seconds: integer|Long expected";
        if (message.nanos != null && message.hasOwnProperty("nanos")) if (!$util.isInteger(message.nanos)) return "nanos: integer expected";
        return null;
      };

      /**
       * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {google.protobuf.Timestamp} Timestamp
       */
      Timestamp.fromObject = function fromObject(object, long) {
        if (object instanceof $root.google.protobuf.Timestamp) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.google.protobuf.Timestamp();
        if (object.seconds != null)
          if ($util.Long) (message.seconds = $util.Long.fromValue(object.seconds)).unsigned = false;
          else if (typeof object.seconds === "string") message.seconds = parseInt(object.seconds, 10);
          else if (typeof object.seconds === "number") message.seconds = object.seconds;
          else if (typeof object.seconds === "object")
            message.seconds = new $util.LongBits(object.seconds.low >>> 0, object.seconds.high >>> 0).toNumber();
        if (object.nanos != null) message.nanos = object.nanos | 0;
        return message;
      };

      /**
       * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
       * @function toObject
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {google.protobuf.Timestamp} message Timestamp
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Timestamp.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.defaults) {
          if ($util.Long) {
            let long = new $util.Long(0, 0, false);
            object.seconds = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
          } else object.seconds = options.longs === String ? "0" : 0;
          object.nanos = 0;
        }
        if (message.seconds != null && message.hasOwnProperty("seconds"))
          if (typeof message.seconds === "number") object.seconds = options.longs === String ? String(message.seconds) : message.seconds;
          else
            object.seconds =
              options.longs === String
                ? $util.Long.prototype.toString.call(message.seconds)
                : options.longs === Number
                  ? new $util.LongBits(message.seconds.low >>> 0, message.seconds.high >>> 0).toNumber()
                  : message.seconds;
        if (message.nanos != null && message.hasOwnProperty("nanos")) object.nanos = message.nanos;
        return object;
      };

      /**
       * Converts this Timestamp to JSON.
       * @function toJSON
       * @memberof google.protobuf.Timestamp
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Timestamp.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Timestamp
       * @function getTypeUrl
       * @memberof google.protobuf.Timestamp
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Timestamp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/google.protobuf.Timestamp";
      };

      return Timestamp;
    })();

    protobuf.Struct = (function () {
      /**
       * Properties of a Struct.
       * @memberof google.protobuf
       * @interface IStruct
       * @property {Object.<string,google.protobuf.IValue>|null} [fields] Struct fields
       */

      /**
       * Constructs a new Struct.
       * @memberof google.protobuf
       * @classdesc Represents a Struct.
       * @implements IStruct
       * @constructor
       * @param {google.protobuf.IStruct=} [properties] Properties to set
       */
      function Struct(properties) {
        this.fields = {};
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Struct fields.
       * @member {Object.<string,google.protobuf.IValue>} fields
       * @memberof google.protobuf.Struct
       * @instance
       */
      Struct.prototype.fields = $util.emptyObject;

      /**
       * Creates a new Struct instance using the specified properties.
       * @function create
       * @memberof google.protobuf.Struct
       * @static
       * @param {google.protobuf.IStruct=} [properties] Properties to set
       * @returns {google.protobuf.Struct} Struct instance
       */
      Struct.create = function create(properties) {
        return new Struct(properties);
      };

      /**
       * Encodes the specified Struct message. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
       * @function encode
       * @memberof google.protobuf.Struct
       * @static
       * @param {google.protobuf.IStruct} message Struct message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Struct.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.fields != null && Object.hasOwnProperty.call(message, "fields"))
          for (let keys = Object.keys(message.fields), i = 0; i < keys.length; ++i) {
            writer.uint32(/* id 1, wireType 2 =*/ 10).fork().uint32(/* id 1, wireType 2 =*/ 10).string(keys[i]);
            $root.google.protobuf.Value.encode(message.fields[keys[i]], writer.uint32(/* id 2, wireType 2 =*/ 18).fork()).ldelim().ldelim();
          }
        return writer;
      };

      /**
       * Encodes the specified Struct message, length delimited. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
       * @function encodeDelimited
       * @memberof google.protobuf.Struct
       * @static
       * @param {google.protobuf.IStruct} message Struct message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Struct.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Struct message from the specified reader or buffer.
       * @function decode
       * @memberof google.protobuf.Struct
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {google.protobuf.Struct} Struct
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Struct.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.google.protobuf.Struct(),
          key,
          value;
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (message.fields === $util.emptyObject) message.fields = {};
              let end2 = reader.uint32() + reader.pos;
              key = "";
              value = null;
              while (reader.pos < end2) {
                let tag2 = reader.uint32();
                switch (tag2 >>> 3) {
                  case 1:
                    key = reader.string();
                    break;
                  case 2:
                    value = $root.google.protobuf.Value.decode(reader, reader.uint32(), undefined, long + 1);
                    break;
                  default:
                    reader.skipType(tag2 & 7, long);
                    break;
                }
              }
              if (key === "__proto__") $util.makeProp(message.fields, key);
              message.fields[key] = value;
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Struct message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof google.protobuf.Struct
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {google.protobuf.Struct} Struct
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Struct.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Struct message.
       * @function verify
       * @memberof google.protobuf.Struct
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Struct.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.fields != null && message.hasOwnProperty("fields")) {
          if (!$util.isObject(message.fields)) return "fields: object expected";
          let key = Object.keys(message.fields);
          for (let i = 0; i < key.length; ++i) {
            let error = $root.google.protobuf.Value.verify(message.fields[key[i]], long + 1);
            if (error) return "fields." + error;
          }
        }
        return null;
      };

      /**
       * Creates a Struct message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof google.protobuf.Struct
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {google.protobuf.Struct} Struct
       */
      Struct.fromObject = function fromObject(object, long) {
        if (object instanceof $root.google.protobuf.Struct) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.google.protobuf.Struct();
        if (object.fields) {
          if (typeof object.fields !== "object") throw TypeError(".google.protobuf.Struct.fields: object expected");
          message.fields = {};
          for (let keys = Object.keys(object.fields), i = 0; i < keys.length; ++i) {
            if (keys[i] === "__proto__") $util.makeProp(message.fields, keys[i]);
            if (typeof object.fields[keys[i]] !== "object") throw TypeError(".google.protobuf.Struct.fields: object expected");
            message.fields[keys[i]] = $root.google.protobuf.Value.fromObject(object.fields[keys[i]], long + 1);
          }
        }
        return message;
      };

      /**
       * Creates a plain object from a Struct message. Also converts values to other types if specified.
       * @function toObject
       * @memberof google.protobuf.Struct
       * @static
       * @param {google.protobuf.Struct} message Struct
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Struct.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.objects || options.defaults) object.fields = {};
        let keys2;
        if (message.fields && (keys2 = Object.keys(message.fields)).length) {
          object.fields = {};
          for (let j = 0; j < keys2.length; ++j) {
            if (keys2[j] === "__proto__") $util.makeProp(object.fields, keys2[j]);
            object.fields[keys2[j]] = $root.google.protobuf.Value.toObject(message.fields[keys2[j]], options);
          }
        }
        return object;
      };

      /**
       * Converts this Struct to JSON.
       * @function toJSON
       * @memberof google.protobuf.Struct
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Struct.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Struct
       * @function getTypeUrl
       * @memberof google.protobuf.Struct
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Struct.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/google.protobuf.Struct";
      };

      return Struct;
    })();

    protobuf.Value = (function () {
      /**
       * Properties of a Value.
       * @memberof google.protobuf
       * @interface IValue
       * @property {google.protobuf.NullValue|null} [nullValue] Value nullValue
       * @property {number|null} [numberValue] Value numberValue
       * @property {string|null} [stringValue] Value stringValue
       * @property {boolean|null} [boolValue] Value boolValue
       * @property {google.protobuf.IStruct|null} [structValue] Value structValue
       * @property {google.protobuf.IListValue|null} [listValue] Value listValue
       */

      /**
       * Constructs a new Value.
       * @memberof google.protobuf
       * @classdesc Represents a Value.
       * @implements IValue
       * @constructor
       * @param {google.protobuf.IValue=} [properties] Properties to set
       */
      function Value(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * Value nullValue.
       * @member {google.protobuf.NullValue|null|undefined} nullValue
       * @memberof google.protobuf.Value
       * @instance
       */
      Value.prototype.nullValue = null;

      /**
       * Value numberValue.
       * @member {number|null|undefined} numberValue
       * @memberof google.protobuf.Value
       * @instance
       */
      Value.prototype.numberValue = null;

      /**
       * Value stringValue.
       * @member {string|null|undefined} stringValue
       * @memberof google.protobuf.Value
       * @instance
       */
      Value.prototype.stringValue = null;

      /**
       * Value boolValue.
       * @member {boolean|null|undefined} boolValue
       * @memberof google.protobuf.Value
       * @instance
       */
      Value.prototype.boolValue = null;

      /**
       * Value structValue.
       * @member {google.protobuf.IStruct|null|undefined} structValue
       * @memberof google.protobuf.Value
       * @instance
       */
      Value.prototype.structValue = null;

      /**
       * Value listValue.
       * @member {google.protobuf.IListValue|null|undefined} listValue
       * @memberof google.protobuf.Value
       * @instance
       */
      Value.prototype.listValue = null;

      // OneOf field names bound to virtual getters and setters
      let $oneOfFields;

      /**
       * Value kind.
       * @member {"nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue"|undefined} kind
       * @memberof google.protobuf.Value
       * @instance
       */
      Object.defineProperty(Value.prototype, "kind", {
        get: $util.oneOfGetter(($oneOfFields = ["nullValue", "numberValue", "stringValue", "boolValue", "structValue", "listValue"])),
        set: $util.oneOfSetter($oneOfFields),
      });

      /**
       * Creates a new Value instance using the specified properties.
       * @function create
       * @memberof google.protobuf.Value
       * @static
       * @param {google.protobuf.IValue=} [properties] Properties to set
       * @returns {google.protobuf.Value} Value instance
       */
      Value.create = function create(properties) {
        return new Value(properties);
      };

      /**
       * Encodes the specified Value message. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
       * @function encode
       * @memberof google.protobuf.Value
       * @static
       * @param {google.protobuf.IValue} message Value message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Value.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.nullValue != null && Object.hasOwnProperty.call(message, "nullValue"))
          writer.uint32(/* id 1, wireType 0 =*/ 8).int32(message.nullValue);
        if (message.numberValue != null && Object.hasOwnProperty.call(message, "numberValue"))
          writer.uint32(/* id 2, wireType 1 =*/ 17).double(message.numberValue);
        if (message.stringValue != null && Object.hasOwnProperty.call(message, "stringValue"))
          writer.uint32(/* id 3, wireType 2 =*/ 26).string(message.stringValue);
        if (message.boolValue != null && Object.hasOwnProperty.call(message, "boolValue"))
          writer.uint32(/* id 4, wireType 0 =*/ 32).bool(message.boolValue);
        if (message.structValue != null && Object.hasOwnProperty.call(message, "structValue"))
          $root.google.protobuf.Struct.encode(message.structValue, writer.uint32(/* id 5, wireType 2 =*/ 42).fork()).ldelim();
        if (message.listValue != null && Object.hasOwnProperty.call(message, "listValue"))
          $root.google.protobuf.ListValue.encode(message.listValue, writer.uint32(/* id 6, wireType 2 =*/ 50).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified Value message, length delimited. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
       * @function encodeDelimited
       * @memberof google.protobuf.Value
       * @static
       * @param {google.protobuf.IValue} message Value message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Value.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a Value message from the specified reader or buffer.
       * @function decode
       * @memberof google.protobuf.Value
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {google.protobuf.Value} Value
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Value.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.google.protobuf.Value();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              message.nullValue = reader.int32();
              break;
            }
            case 2: {
              message.numberValue = reader.double();
              break;
            }
            case 3: {
              message.stringValue = reader.string();
              break;
            }
            case 4: {
              message.boolValue = reader.bool();
              break;
            }
            case 5: {
              message.structValue = $root.google.protobuf.Struct.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            case 6: {
              message.listValue = $root.google.protobuf.ListValue.decode(reader, reader.uint32(), undefined, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a Value message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof google.protobuf.Value
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {google.protobuf.Value} Value
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Value.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a Value message.
       * @function verify
       * @memberof google.protobuf.Value
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Value.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        let properties = {};
        if (message.nullValue != null && message.hasOwnProperty("nullValue")) {
          properties.kind = 1;
          switch (message.nullValue) {
            default:
              return "nullValue: enum value expected";
            case 0:
              break;
          }
        }
        if (message.numberValue != null && message.hasOwnProperty("numberValue")) {
          if (properties.kind === 1) return "kind: multiple values";
          properties.kind = 1;
          if (typeof message.numberValue !== "number") return "numberValue: number expected";
        }
        if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
          if (properties.kind === 1) return "kind: multiple values";
          properties.kind = 1;
          if (!$util.isString(message.stringValue)) return "stringValue: string expected";
        }
        if (message.boolValue != null && message.hasOwnProperty("boolValue")) {
          if (properties.kind === 1) return "kind: multiple values";
          properties.kind = 1;
          if (typeof message.boolValue !== "boolean") return "boolValue: boolean expected";
        }
        if (message.structValue != null && message.hasOwnProperty("structValue")) {
          if (properties.kind === 1) return "kind: multiple values";
          properties.kind = 1;
          {
            let error = $root.google.protobuf.Struct.verify(message.structValue, long + 1);
            if (error) return "structValue." + error;
          }
        }
        if (message.listValue != null && message.hasOwnProperty("listValue")) {
          if (properties.kind === 1) return "kind: multiple values";
          properties.kind = 1;
          {
            let error = $root.google.protobuf.ListValue.verify(message.listValue, long + 1);
            if (error) return "listValue." + error;
          }
        }
        return null;
      };

      /**
       * Creates a Value message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof google.protobuf.Value
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {google.protobuf.Value} Value
       */
      Value.fromObject = function fromObject(object, long) {
        if (object instanceof $root.google.protobuf.Value) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.google.protobuf.Value();
        switch (object.nullValue) {
          default:
            if (typeof object.nullValue === "number") {
              message.nullValue = object.nullValue;
              break;
            }
            break;
          case "NULL_VALUE":
          case 0:
            message.nullValue = 0;
            break;
        }
        if (object.numberValue != null) message.numberValue = Number(object.numberValue);
        if (object.stringValue != null) message.stringValue = String(object.stringValue);
        if (object.boolValue != null) message.boolValue = Boolean(object.boolValue);
        if (object.structValue != null) {
          if (typeof object.structValue !== "object") throw TypeError(".google.protobuf.Value.structValue: object expected");
          message.structValue = $root.google.protobuf.Struct.fromObject(object.structValue, long + 1);
        }
        if (object.listValue != null) {
          if (typeof object.listValue !== "object") throw TypeError(".google.protobuf.Value.listValue: object expected");
          message.listValue = $root.google.protobuf.ListValue.fromObject(object.listValue, long + 1);
        }
        return message;
      };

      /**
       * Creates a plain object from a Value message. Also converts values to other types if specified.
       * @function toObject
       * @memberof google.protobuf.Value
       * @static
       * @param {google.protobuf.Value} message Value
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Value.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (message.nullValue != null && message.hasOwnProperty("nullValue")) {
          object.nullValue =
            options.enums === String
              ? $root.google.protobuf.NullValue[message.nullValue] === undefined
                ? message.nullValue
                : $root.google.protobuf.NullValue[message.nullValue]
              : message.nullValue;
          if (options.oneofs) object.kind = "nullValue";
        }
        if (message.numberValue != null && message.hasOwnProperty("numberValue")) {
          object.numberValue = options.json && !isFinite(message.numberValue) ? String(message.numberValue) : message.numberValue;
          if (options.oneofs) object.kind = "numberValue";
        }
        if (message.stringValue != null && message.hasOwnProperty("stringValue")) {
          object.stringValue = message.stringValue;
          if (options.oneofs) object.kind = "stringValue";
        }
        if (message.boolValue != null && message.hasOwnProperty("boolValue")) {
          object.boolValue = message.boolValue;
          if (options.oneofs) object.kind = "boolValue";
        }
        if (message.structValue != null && message.hasOwnProperty("structValue")) {
          object.structValue = $root.google.protobuf.Struct.toObject(message.structValue, options);
          if (options.oneofs) object.kind = "structValue";
        }
        if (message.listValue != null && message.hasOwnProperty("listValue")) {
          object.listValue = $root.google.protobuf.ListValue.toObject(message.listValue, options);
          if (options.oneofs) object.kind = "listValue";
        }
        return object;
      };

      /**
       * Converts this Value to JSON.
       * @function toJSON
       * @memberof google.protobuf.Value
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Value.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for Value
       * @function getTypeUrl
       * @memberof google.protobuf.Value
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Value.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/google.protobuf.Value";
      };

      return Value;
    })();

    /**
     * NullValue enum.
     * @name google.protobuf.NullValue
     * @enum {number}
     * @property {number} NULL_VALUE=0 NULL_VALUE value
     */
    protobuf.NullValue = (function () {
      const valuesById = {},
        values = Object.create(valuesById);
      values[(valuesById[0] = "NULL_VALUE")] = 0;
      return values;
    })();

    protobuf.ListValue = (function () {
      /**
       * Properties of a ListValue.
       * @memberof google.protobuf
       * @interface IListValue
       * @property {Array.<google.protobuf.IValue>|null} [values] ListValue values
       */

      /**
       * Constructs a new ListValue.
       * @memberof google.protobuf
       * @classdesc Represents a ListValue.
       * @implements IListValue
       * @constructor
       * @param {google.protobuf.IListValue=} [properties] Properties to set
       */
      function ListValue(properties) {
        this.values = [];
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__") this[keys[i]] = properties[keys[i]];
      }

      /**
       * ListValue values.
       * @member {Array.<google.protobuf.IValue>} values
       * @memberof google.protobuf.ListValue
       * @instance
       */
      ListValue.prototype.values = $util.emptyArray;

      /**
       * Creates a new ListValue instance using the specified properties.
       * @function create
       * @memberof google.protobuf.ListValue
       * @static
       * @param {google.protobuf.IListValue=} [properties] Properties to set
       * @returns {google.protobuf.ListValue} ListValue instance
       */
      ListValue.create = function create(properties) {
        return new ListValue(properties);
      };

      /**
       * Encodes the specified ListValue message. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
       * @function encode
       * @memberof google.protobuf.ListValue
       * @static
       * @param {google.protobuf.IListValue} message ListValue message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      ListValue.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create();
        if (message.values != null && message.values.length)
          for (let i = 0; i < message.values.length; ++i)
            $root.google.protobuf.Value.encode(message.values[i], writer.uint32(/* id 1, wireType 2 =*/ 10).fork()).ldelim();
        return writer;
      };

      /**
       * Encodes the specified ListValue message, length delimited. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
       * @function encodeDelimited
       * @memberof google.protobuf.ListValue
       * @static
       * @param {google.protobuf.IListValue} message ListValue message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      ListValue.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
      };

      /**
       * Decodes a ListValue message from the specified reader or buffer.
       * @function decode
       * @memberof google.protobuf.ListValue
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {google.protobuf.ListValue} ListValue
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      ListValue.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader);
        if (long === undefined) long = 0;
        if (long > $Reader.recursionLimit) throw Error("maximum nesting depth exceeded");
        let end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.google.protobuf.ListValue();
        while (reader.pos < end) {
          let tag = reader.uint32();
          if (tag === error) break;
          switch (tag >>> 3) {
            case 1: {
              if (!(message.values && message.values.length)) message.values = [];
              message.values.push($root.google.protobuf.Value.decode(reader, reader.uint32(), undefined, long + 1));
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };

      /**
       * Decodes a ListValue message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof google.protobuf.ListValue
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {google.protobuf.ListValue} ListValue
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      ListValue.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };

      /**
       * Verifies a ListValue message.
       * @function verify
       * @memberof google.protobuf.ListValue
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      ListValue.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null) return "object expected";
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) return "maximum nesting depth exceeded";
        if (message.values != null && message.hasOwnProperty("values")) {
          if (!Array.isArray(message.values)) return "values: array expected";
          for (let i = 0; i < message.values.length; ++i) {
            let error = $root.google.protobuf.Value.verify(message.values[i], long + 1);
            if (error) return "values." + error;
          }
        }
        return null;
      };

      /**
       * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof google.protobuf.ListValue
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {google.protobuf.ListValue} ListValue
       */
      ListValue.fromObject = function fromObject(object, long) {
        if (object instanceof $root.google.protobuf.ListValue) return object;
        if (long === undefined) long = 0;
        if (long > $util.recursionLimit) throw Error("maximum nesting depth exceeded");
        let message = new $root.google.protobuf.ListValue();
        if (object.values) {
          if (!Array.isArray(object.values)) throw TypeError(".google.protobuf.ListValue.values: array expected");
          message.values = [];
          for (let i = 0; i < object.values.length; ++i) {
            if (typeof object.values[i] !== "object") throw TypeError(".google.protobuf.ListValue.values: object expected");
            message.values[i] = $root.google.protobuf.Value.fromObject(object.values[i], long + 1);
          }
        }
        return message;
      };

      /**
       * Creates a plain object from a ListValue message. Also converts values to other types if specified.
       * @function toObject
       * @memberof google.protobuf.ListValue
       * @static
       * @param {google.protobuf.ListValue} message ListValue
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      ListValue.toObject = function toObject(message, options) {
        if (!options) options = {};
        let object = {};
        if (options.arrays || options.defaults) object.values = [];
        if (message.values && message.values.length) {
          object.values = [];
          for (let j = 0; j < message.values.length; ++j) object.values[j] = $root.google.protobuf.Value.toObject(message.values[j], options);
        }
        return object;
      };

      /**
       * Converts this ListValue to JSON.
       * @function toJSON
       * @memberof google.protobuf.ListValue
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      ListValue.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };

      /**
       * Gets the default type url for ListValue
       * @function getTypeUrl
       * @memberof google.protobuf.ListValue
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      ListValue.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/google.protobuf.ListValue";
      };

      return ListValue;
    })();

    return protobuf;
  })();

  return google;
})());

export { $root as default };
