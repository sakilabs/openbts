import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace openbts. */
export namespace openbts {
  /** StationStatus enum. */
  enum StationStatus {
    published = 0,
    inactive = 1,
    pending = 2,
  }

  /** Properties of an Operator. */
  interface IOperator {
    /** Operator id */
    id?: number | null;

    /** Operator name */
    name?: string | null;

    /** Operator full_name */
    full_name?: string | null;

    /** Operator parent_id */
    parent_id?: number | null;

    /** Operator mnc */
    mnc?: number | null;
  }

  /** Represents an Operator. */
  class Operator implements IOperator {
    /**
     * Constructs a new Operator.
     * @param [properties] Properties to set
     */
    constructor(properties?: openbts.IOperator);

    /** Operator id. */
    public id: number;

    /** Operator name. */
    public name: string;

    /** Operator full_name. */
    public full_name: string;

    /** Operator parent_id. */
    public parent_id: number;

    /** Operator mnc. */
    public mnc: number;

    /**
     * Creates a new Operator instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Operator instance
     */
    public static create(properties?: openbts.IOperator): openbts.Operator;

    /**
     * Encodes the specified Operator message. Does not implicitly {@link openbts.Operator.verify|verify} messages.
     * @param message Operator message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: openbts.IOperator, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Operator message, length delimited. Does not implicitly {@link openbts.Operator.verify|verify} messages.
     * @param message Operator message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: openbts.IOperator, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes an Operator message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Operator
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.Operator;

    /**
     * Decodes an Operator message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Operator
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.Operator;

    /**
     * Verifies an Operator message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates an Operator message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Operator
     */
    public static fromObject(object: { [k: string]: any }): openbts.Operator;

    /**
     * Creates a plain object from an Operator message. Also converts values to other types if specified.
     * @param message Operator
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: openbts.Operator, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Operator to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Operator
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Properties of a Region. */
  interface IRegion {
    /** Region id */
    id?: number | null;

    /** Region name */
    name?: string | null;

    /** Region code */
    code?: string | null;
  }

  /** Represents a Region. */
  class Region implements IRegion {
    /**
     * Constructs a new Region.
     * @param [properties] Properties to set
     */
    constructor(properties?: openbts.IRegion);

    /** Region id. */
    public id: number;

    /** Region name. */
    public name: string;

    /** Region code. */
    public code: string;

    /**
     * Creates a new Region instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Region instance
     */
    public static create(properties?: openbts.IRegion): openbts.Region;

    /**
     * Encodes the specified Region message. Does not implicitly {@link openbts.Region.verify|verify} messages.
     * @param message Region message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: openbts.IRegion, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Region message, length delimited. Does not implicitly {@link openbts.Region.verify|verify} messages.
     * @param message Region message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: openbts.IRegion, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Region message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Region
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.Region;

    /**
     * Decodes a Region message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Region
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.Region;

    /**
     * Verifies a Region message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Region message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Region
     */
    public static fromObject(object: { [k: string]: any }): openbts.Region;

    /**
     * Creates a plain object from a Region message. Also converts values to other types if specified.
     * @param message Region
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: openbts.Region, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Region to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Region
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Rat enum. */
  enum Rat {
    GSM = 0,
    CDMA = 1,
    UMTS = 2,
    LTE = 3,
    NR = 4,
    IOT = 5,
  }

  /** Duplex enum. */
  enum Duplex {
    FDD = 0,
    TDD = 1,
  }

  /** BandVariant enum. */
  enum BandVariant {
    commercial = 0,
    railway = 1,
  }

  /** Properties of a Band. */
  interface IBand {
    /** Band id */
    id?: number | null;

    /** Band value */
    value?: number | null;

    /** Band rat */
    rat?: openbts.Rat | null;

    /** Band name */
    name?: string | null;

    /** Band duplex */
    duplex?: openbts.Duplex | null;

    /** Band variant */
    variant?: openbts.BandVariant | null;
  }

  /** Represents a Band. */
  class Band implements IBand {
    /**
     * Constructs a new Band.
     * @param [properties] Properties to set
     */
    constructor(properties?: openbts.IBand);

    /** Band id. */
    public id: number;

    /** Band value. */
    public value: number;

    /** Band rat. */
    public rat: openbts.Rat;

    /** Band name. */
    public name: string;

    /** Band duplex. */
    public duplex: openbts.Duplex;

    /** Band variant. */
    public variant: openbts.BandVariant;

    /**
     * Creates a new Band instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Band instance
     */
    public static create(properties?: openbts.IBand): openbts.Band;

    /**
     * Encodes the specified Band message. Does not implicitly {@link openbts.Band.verify|verify} messages.
     * @param message Band message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: openbts.IBand, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Band message, length delimited. Does not implicitly {@link openbts.Band.verify|verify} messages.
     * @param message Band message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: openbts.IBand, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Band message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Band
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.Band;

    /**
     * Decodes a Band message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Band
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.Band;

    /**
     * Verifies a Band message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null;

    /**
     * Creates a Band message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Band
     */
    public static fromObject(object: { [k: string]: any }): openbts.Band;

    /**
     * Creates a plain object from a Band message. Also converts values to other types if specified.
     * @param message Band
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: openbts.Band, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Band to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };

    /**
     * Gets the default type url for Band
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string;
  }

  /** Namespace locations. */
  namespace locations {
    /** Properties of a LocationStation. */
    interface ILocationStation {
      /** LocationStation id */
      id?: number | null;

      /** LocationStation station_id */
      station_id?: string | null;

      /** LocationStation notes */
      notes?: string | null;

      /** LocationStation extra_address */
      extra_address?: string | null;

      /** LocationStation updatedAt */
      updatedAt?: string | null;

      /** LocationStation createdAt */
      createdAt?: string | null;

      /** LocationStation is_confirmed */
      is_confirmed?: boolean | null;

      /** LocationStation status */
      status?: openbts.StationStatus | null;

      /** LocationStation operator */
      operator?: openbts.IOperator | null;

      /** LocationStation cells */
      cells?: openbts.stations.ICellWithoutDetails[] | null;

      /** LocationStation extra_identificators */
      extra_identificators?: openbts.stations.IExtraIdentificators | null;
    }

    /** Represents a LocationStation. */
    class LocationStation implements ILocationStation {
      /**
       * Constructs a new LocationStation.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.locations.ILocationStation);

      /** LocationStation id. */
      public id: number;

      /** LocationStation station_id. */
      public station_id: string;

      /** LocationStation notes. */
      public notes: string;

      /** LocationStation extra_address. */
      public extra_address: string;

      /** LocationStation updatedAt. */
      public updatedAt: string;

      /** LocationStation createdAt. */
      public createdAt: string;

      /** LocationStation is_confirmed. */
      public is_confirmed: boolean;

      /** LocationStation status. */
      public status: openbts.StationStatus;

      /** LocationStation operator. */
      public operator?: openbts.IOperator | null;

      /** LocationStation cells. */
      public cells: openbts.stations.ICellWithoutDetails[];

      /** LocationStation extra_identificators. */
      public extra_identificators?: openbts.stations.IExtraIdentificators | null;

      /**
       * Creates a new LocationStation instance using the specified properties.
       * @param [properties] Properties to set
       * @returns LocationStation instance
       */
      public static create(properties?: openbts.locations.ILocationStation): openbts.locations.LocationStation;

      /**
       * Encodes the specified LocationStation message. Does not implicitly {@link openbts.locations.LocationStation.verify|verify} messages.
       * @param message LocationStation message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.locations.ILocationStation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified LocationStation message, length delimited. Does not implicitly {@link openbts.locations.LocationStation.verify|verify} messages.
       * @param message LocationStation message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.locations.ILocationStation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a LocationStation message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns LocationStation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.locations.LocationStation;

      /**
       * Decodes a LocationStation message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns LocationStation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.locations.LocationStation;

      /**
       * Verifies a LocationStation message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a LocationStation message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns LocationStation
       */
      public static fromObject(object: { [k: string]: any }): openbts.locations.LocationStation;

      /**
       * Creates a plain object from a LocationStation message. Also converts values to other types if specified.
       * @param message LocationStation
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.locations.LocationStation, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this LocationStation to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for LocationStation
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Location. */
    interface ILocation {
      /** Location id */
      id?: number | null;

      /** Location city */
      city?: string | null;

      /** Location address */
      address?: string | null;

      /** Location latitude */
      latitude?: number | null;

      /** Location longitude */
      longitude?: number | null;

      /** Location updatedAt */
      updatedAt?: string | null;

      /** Location createdAt */
      createdAt?: string | null;

      /** Location region */
      region?: openbts.IRegion | null;

      /** Location stations */
      stations?: openbts.locations.ILocationStation[] | null;
    }

    /** Represents a Location. */
    class Location implements ILocation {
      /**
       * Constructs a new Location.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.locations.ILocation);

      /** Location id. */
      public id: number;

      /** Location city. */
      public city: string;

      /** Location address. */
      public address: string;

      /** Location latitude. */
      public latitude: number;

      /** Location longitude. */
      public longitude: number;

      /** Location updatedAt. */
      public updatedAt: string;

      /** Location createdAt. */
      public createdAt: string;

      /** Location region. */
      public region?: openbts.IRegion | null;

      /** Location stations. */
      public stations: openbts.locations.ILocationStation[];

      /**
       * Creates a new Location instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Location instance
       */
      public static create(properties?: openbts.locations.ILocation): openbts.locations.Location;

      /**
       * Encodes the specified Location message. Does not implicitly {@link openbts.locations.Location.verify|verify} messages.
       * @param message Location message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.locations.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Location message, length delimited. Does not implicitly {@link openbts.locations.Location.verify|verify} messages.
       * @param message Location message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.locations.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Location message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.locations.Location;

      /**
       * Decodes a Location message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Location
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.locations.Location;

      /**
       * Verifies a Location message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Location message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Location
       */
      public static fromObject(object: { [k: string]: any }): openbts.locations.Location;

      /**
       * Creates a plain object from a Location message. Also converts values to other types if specified.
       * @param message Location
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.locations.Location, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Location to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Location
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a LocationsResponse. */
    interface ILocationsResponse {
      /** LocationsResponse data */
      data?: openbts.locations.ILocation[] | null;

      /** LocationsResponse totalCount */
      totalCount?: number | null;
    }

    /** Represents a LocationsResponse. */
    class LocationsResponse implements ILocationsResponse {
      /**
       * Constructs a new LocationsResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.locations.ILocationsResponse);

      /** LocationsResponse data. */
      public data: openbts.locations.ILocation[];

      /** LocationsResponse totalCount. */
      public totalCount: number;

      /**
       * Creates a new LocationsResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns LocationsResponse instance
       */
      public static create(properties?: openbts.locations.ILocationsResponse): openbts.locations.LocationsResponse;

      /**
       * Encodes the specified LocationsResponse message. Does not implicitly {@link openbts.locations.LocationsResponse.verify|verify} messages.
       * @param message LocationsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.locations.ILocationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified LocationsResponse message, length delimited. Does not implicitly {@link openbts.locations.LocationsResponse.verify|verify} messages.
       * @param message LocationsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.locations.ILocationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.locations.LocationsResponse;

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.locations.LocationsResponse;

      /**
       * Verifies a LocationsResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a LocationsResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns LocationsResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.locations.LocationsResponse;

      /**
       * Creates a plain object from a LocationsResponse message. Also converts values to other types if specified.
       * @param message LocationsResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.locations.LocationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this LocationsResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for LocationsResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a LocationResponse. */
    interface ILocationResponse {
      /** LocationResponse data */
      data?: openbts.locations.ILocation | null;
    }

    /** Represents a LocationResponse. */
    class LocationResponse implements ILocationResponse {
      /**
       * Constructs a new LocationResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.locations.ILocationResponse);

      /** LocationResponse data. */
      public data?: openbts.locations.ILocation | null;

      /**
       * Creates a new LocationResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns LocationResponse instance
       */
      public static create(properties?: openbts.locations.ILocationResponse): openbts.locations.LocationResponse;

      /**
       * Encodes the specified LocationResponse message. Does not implicitly {@link openbts.locations.LocationResponse.verify|verify} messages.
       * @param message LocationResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.locations.ILocationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified LocationResponse message, length delimited. Does not implicitly {@link openbts.locations.LocationResponse.verify|verify} messages.
       * @param message LocationResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.locations.ILocationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a LocationResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns LocationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.locations.LocationResponse;

      /**
       * Decodes a LocationResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns LocationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.locations.LocationResponse;

      /**
       * Verifies a LocationResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a LocationResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns LocationResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.locations.LocationResponse;

      /**
       * Creates a plain object from a LocationResponse message. Also converts values to other types if specified.
       * @param message LocationResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.locations.LocationResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this LocationResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for LocationResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }

  /** Namespace stations. */
  namespace stations {
    /** Properties of a StationCell. */
    interface IStationCell {
      /** StationCell id */
      id?: number | null;

      /** StationCell rat */
      rat?: openbts.Rat | null;

      /** StationCell notes */
      notes?: string | null;

      /** StationCell band */
      band?: openbts.IBand | null;

      /** StationCell is_confirmed */
      is_confirmed?: boolean | null;

      /** StationCell details */
      details?: google.protobuf.IStruct | null;

      /** StationCell updatedAt */
      updatedAt?: string | null;

      /** StationCell createdAt */
      createdAt?: string | null;
    }

    /** Represents a StationCell. */
    class StationCell implements IStationCell {
      /**
       * Constructs a new StationCell.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.IStationCell);

      /** StationCell id. */
      public id: number;

      /** StationCell rat. */
      public rat: openbts.Rat;

      /** StationCell notes. */
      public notes: string;

      /** StationCell band. */
      public band?: openbts.IBand | null;

      /** StationCell is_confirmed. */
      public is_confirmed: boolean;

      /** StationCell details. */
      public details?: google.protobuf.IStruct | null;

      /** StationCell updatedAt. */
      public updatedAt: string;

      /** StationCell createdAt. */
      public createdAt: string;

      /**
       * Creates a new StationCell instance using the specified properties.
       * @param [properties] Properties to set
       * @returns StationCell instance
       */
      public static create(properties?: openbts.stations.IStationCell): openbts.stations.StationCell;

      /**
       * Encodes the specified StationCell message. Does not implicitly {@link openbts.stations.StationCell.verify|verify} messages.
       * @param message StationCell message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.IStationCell, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified StationCell message, length delimited. Does not implicitly {@link openbts.stations.StationCell.verify|verify} messages.
       * @param message StationCell message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.IStationCell, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a StationCell message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns StationCell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.StationCell;

      /**
       * Decodes a StationCell message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns StationCell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.StationCell;

      /**
       * Verifies a StationCell message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a StationCell message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns StationCell
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.StationCell;

      /**
       * Creates a plain object from a StationCell message. Also converts values to other types if specified.
       * @param message StationCell
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.StationCell, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this StationCell to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for StationCell
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** NRType enum. */
    enum NRType {
      unknown = 0,
      nsa = 1,
      sa = 2,
    }

    /** Properties of a Cell. */
    interface ICell {
      /** Cell id */
      id?: number | null;

      /** Cell station_id */
      station_id?: number | null;

      /** Cell rat */
      rat?: openbts.Rat | null;

      /** Cell notes */
      notes?: string | null;

      /** Cell band */
      band?: openbts.IBand | null;

      /** Cell is_confirmed */
      is_confirmed?: boolean | null;

      /** Cell details */
      details?: google.protobuf.IStruct | null;

      /** Cell updatedAt */
      updatedAt?: string | null;

      /** Cell createdAt */
      createdAt?: string | null;
    }

    /** Represents a Cell. */
    class Cell implements ICell {
      /**
       * Constructs a new Cell.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.ICell);

      /** Cell id. */
      public id: number;

      /** Cell station_id. */
      public station_id: number;

      /** Cell rat. */
      public rat: openbts.Rat;

      /** Cell notes. */
      public notes: string;

      /** Cell band. */
      public band?: openbts.IBand | null;

      /** Cell is_confirmed. */
      public is_confirmed: boolean;

      /** Cell details. */
      public details?: google.protobuf.IStruct | null;

      /** Cell updatedAt. */
      public updatedAt: string;

      /** Cell createdAt. */
      public createdAt: string;

      /**
       * Creates a new Cell instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Cell instance
       */
      public static create(properties?: openbts.stations.ICell): openbts.stations.Cell;

      /**
       * Encodes the specified Cell message. Does not implicitly {@link openbts.stations.Cell.verify|verify} messages.
       * @param message Cell message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.ICell, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Cell message, length delimited. Does not implicitly {@link openbts.stations.Cell.verify|verify} messages.
       * @param message Cell message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.ICell, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Cell message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Cell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.Cell;

      /**
       * Decodes a Cell message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Cell
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.Cell;

      /**
       * Verifies a Cell message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Cell message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Cell
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.Cell;

      /**
       * Creates a plain object from a Cell message. Also converts values to other types if specified.
       * @param message Cell
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.Cell, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Cell to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Cell
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a CellWithoutDetails. */
    interface ICellWithoutDetails {
      /** CellWithoutDetails id */
      id?: number | null;

      /** CellWithoutDetails station_id */
      station_id?: number | null;

      /** CellWithoutDetails rat */
      rat?: openbts.Rat | null;

      /** CellWithoutDetails notes */
      notes?: string | null;

      /** CellWithoutDetails band */
      band?: openbts.IBand | null;

      /** CellWithoutDetails is_confirmed */
      is_confirmed?: boolean | null;

      /** CellWithoutDetails updatedAt */
      updatedAt?: string | null;

      /** CellWithoutDetails createdAt */
      createdAt?: string | null;
    }

    /** Represents a CellWithoutDetails. */
    class CellWithoutDetails implements ICellWithoutDetails {
      /**
       * Constructs a new CellWithoutDetails.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.ICellWithoutDetails);

      /** CellWithoutDetails id. */
      public id: number;

      /** CellWithoutDetails station_id. */
      public station_id: number;

      /** CellWithoutDetails rat. */
      public rat: openbts.Rat;

      /** CellWithoutDetails notes. */
      public notes: string;

      /** CellWithoutDetails band. */
      public band?: openbts.IBand | null;

      /** CellWithoutDetails is_confirmed. */
      public is_confirmed: boolean;

      /** CellWithoutDetails updatedAt. */
      public updatedAt: string;

      /** CellWithoutDetails createdAt. */
      public createdAt: string;

      /**
       * Creates a new CellWithoutDetails instance using the specified properties.
       * @param [properties] Properties to set
       * @returns CellWithoutDetails instance
       */
      public static create(properties?: openbts.stations.ICellWithoutDetails): openbts.stations.CellWithoutDetails;

      /**
       * Encodes the specified CellWithoutDetails message. Does not implicitly {@link openbts.stations.CellWithoutDetails.verify|verify} messages.
       * @param message CellWithoutDetails message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.ICellWithoutDetails, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified CellWithoutDetails message, length delimited. Does not implicitly {@link openbts.stations.CellWithoutDetails.verify|verify} messages.
       * @param message CellWithoutDetails message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.ICellWithoutDetails, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a CellWithoutDetails message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns CellWithoutDetails
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.CellWithoutDetails;

      /**
       * Decodes a CellWithoutDetails message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns CellWithoutDetails
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.CellWithoutDetails;

      /**
       * Verifies a CellWithoutDetails message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a CellWithoutDetails message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns CellWithoutDetails
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.CellWithoutDetails;

      /**
       * Creates a plain object from a CellWithoutDetails message. Also converts values to other types if specified.
       * @param message CellWithoutDetails
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.CellWithoutDetails, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this CellWithoutDetails to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for CellWithoutDetails
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an ExtraIdentificators. */
    interface IExtraIdentificators {
      /** ExtraIdentificators id */
      id?: number | null;

      /** ExtraIdentificators networks_id */
      networks_id?: number | null;

      /** ExtraIdentificators networks_name */
      networks_name?: string | null;

      /** ExtraIdentificators mno_name */
      mno_name?: string | null;

      /** ExtraIdentificators updatedAt */
      updatedAt?: string | null;

      /** ExtraIdentificators createdAt */
      createdAt?: string | null;
    }

    /** Represents an ExtraIdentificators. */
    class ExtraIdentificators implements IExtraIdentificators {
      /**
       * Constructs a new ExtraIdentificators.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.IExtraIdentificators);

      /** ExtraIdentificators id. */
      public id: number;

      /** ExtraIdentificators networks_id. */
      public networks_id: number;

      /** ExtraIdentificators networks_name. */
      public networks_name: string;

      /** ExtraIdentificators mno_name. */
      public mno_name: string;

      /** ExtraIdentificators updatedAt. */
      public updatedAt: string;

      /** ExtraIdentificators createdAt. */
      public createdAt: string;

      /**
       * Creates a new ExtraIdentificators instance using the specified properties.
       * @param [properties] Properties to set
       * @returns ExtraIdentificators instance
       */
      public static create(properties?: openbts.stations.IExtraIdentificators): openbts.stations.ExtraIdentificators;

      /**
       * Encodes the specified ExtraIdentificators message. Does not implicitly {@link openbts.stations.ExtraIdentificators.verify|verify} messages.
       * @param message ExtraIdentificators message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.IExtraIdentificators, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified ExtraIdentificators message, length delimited. Does not implicitly {@link openbts.stations.ExtraIdentificators.verify|verify} messages.
       * @param message ExtraIdentificators message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.IExtraIdentificators, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes an ExtraIdentificators message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns ExtraIdentificators
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.ExtraIdentificators;

      /**
       * Decodes an ExtraIdentificators message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns ExtraIdentificators
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.ExtraIdentificators;

      /**
       * Verifies an ExtraIdentificators message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates an ExtraIdentificators message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns ExtraIdentificators
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.ExtraIdentificators;

      /**
       * Creates a plain object from an ExtraIdentificators message. Also converts values to other types if specified.
       * @param message ExtraIdentificators
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.ExtraIdentificators, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this ExtraIdentificators to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for ExtraIdentificators
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Station. */
    interface IStation {
      /** Station id */
      id?: number | null;

      /** Station station_id */
      station_id?: string | null;

      /** Station notes */
      notes?: string | null;

      /** Station extra_address */
      extra_address?: string | null;

      /** Station cells */
      cells?: openbts.stations.IStationCell[] | null;

      /** Station extra_identificators */
      extra_identificators?: openbts.stations.IExtraIdentificators | null;

      /** Station location */
      location?: openbts.locations.ILocation | null;

      /** Station operator */
      operator?: openbts.IOperator | null;

      /** Station is_confirmed */
      is_confirmed?: boolean | null;

      /** Station updatedAt */
      updatedAt?: string | null;

      /** Station createdAt */
      createdAt?: string | null;
    }

    /** Represents a Station. */
    class Station implements IStation {
      /**
       * Constructs a new Station.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.IStation);

      /** Station id. */
      public id: number;

      /** Station station_id. */
      public station_id: string;

      /** Station notes. */
      public notes: string;

      /** Station extra_address. */
      public extra_address: string;

      /** Station cells. */
      public cells: openbts.stations.IStationCell[];

      /** Station extra_identificators. */
      public extra_identificators?: openbts.stations.IExtraIdentificators | null;

      /** Station location. */
      public location?: openbts.locations.ILocation | null;

      /** Station operator. */
      public operator?: openbts.IOperator | null;

      /** Station is_confirmed. */
      public is_confirmed: boolean;

      /** Station updatedAt. */
      public updatedAt: string;

      /** Station createdAt. */
      public createdAt: string;

      /**
       * Creates a new Station instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Station instance
       */
      public static create(properties?: openbts.stations.IStation): openbts.stations.Station;

      /**
       * Encodes the specified Station message. Does not implicitly {@link openbts.stations.Station.verify|verify} messages.
       * @param message Station message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.IStation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Station message, length delimited. Does not implicitly {@link openbts.stations.Station.verify|verify} messages.
       * @param message Station message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.IStation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Station message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Station
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.Station;

      /**
       * Decodes a Station message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Station
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.Station;

      /**
       * Verifies a Station message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Station message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Station
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.Station;

      /**
       * Creates a plain object from a Station message. Also converts values to other types if specified.
       * @param message Station
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.Station, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Station to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Station
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StationsResponse. */
    interface IStationsResponse {
      /** StationsResponse data */
      data?: openbts.stations.IStation[] | null;

      /** StationsResponse totalCount */
      totalCount?: number | null;
    }

    /** Represents a StationsResponse. */
    class StationsResponse implements IStationsResponse {
      /**
       * Constructs a new StationsResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.IStationsResponse);

      /** StationsResponse data. */
      public data: openbts.stations.IStation[];

      /** StationsResponse totalCount. */
      public totalCount: number;

      /**
       * Creates a new StationsResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns StationsResponse instance
       */
      public static create(properties?: openbts.stations.IStationsResponse): openbts.stations.StationsResponse;

      /**
       * Encodes the specified StationsResponse message. Does not implicitly {@link openbts.stations.StationsResponse.verify|verify} messages.
       * @param message StationsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.IStationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified StationsResponse message, length delimited. Does not implicitly {@link openbts.stations.StationsResponse.verify|verify} messages.
       * @param message StationsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.IStationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a StationsResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns StationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.StationsResponse;

      /**
       * Decodes a StationsResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns StationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.StationsResponse;

      /**
       * Verifies a StationsResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a StationsResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns StationsResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.StationsResponse;

      /**
       * Creates a plain object from a StationsResponse message. Also converts values to other types if specified.
       * @param message StationsResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.StationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this StationsResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for StationsResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StationResponse. */
    interface IStationResponse {
      /** StationResponse data */
      data?: openbts.stations.IStation | null;
    }

    /** Represents a StationResponse. */
    class StationResponse implements IStationResponse {
      /**
       * Constructs a new StationResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.IStationResponse);

      /** StationResponse data. */
      public data?: openbts.stations.IStation | null;

      /**
       * Creates a new StationResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns StationResponse instance
       */
      public static create(properties?: openbts.stations.IStationResponse): openbts.stations.StationResponse;

      /**
       * Encodes the specified StationResponse message. Does not implicitly {@link openbts.stations.StationResponse.verify|verify} messages.
       * @param message StationResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.IStationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified StationResponse message, length delimited. Does not implicitly {@link openbts.stations.StationResponse.verify|verify} messages.
       * @param message StationResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.IStationResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a StationResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns StationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.StationResponse;

      /**
       * Decodes a StationResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns StationResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.StationResponse;

      /**
       * Verifies a StationResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a StationResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns StationResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.StationResponse;

      /**
       * Creates a plain object from a StationResponse message. Also converts values to other types if specified.
       * @param message StationResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.StationResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this StationResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for StationResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a CellsResponse. */
    interface ICellsResponse {
      /** CellsResponse data */
      data?: openbts.stations.ICell[] | null;
    }

    /** Represents a CellsResponse. */
    class CellsResponse implements ICellsResponse {
      /**
       * Constructs a new CellsResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.ICellsResponse);

      /** CellsResponse data. */
      public data: openbts.stations.ICell[];

      /**
       * Creates a new CellsResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns CellsResponse instance
       */
      public static create(properties?: openbts.stations.ICellsResponse): openbts.stations.CellsResponse;

      /**
       * Encodes the specified CellsResponse message. Does not implicitly {@link openbts.stations.CellsResponse.verify|verify} messages.
       * @param message CellsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.ICellsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified CellsResponse message, length delimited. Does not implicitly {@link openbts.stations.CellsResponse.verify|verify} messages.
       * @param message CellsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.ICellsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a CellsResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns CellsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.CellsResponse;

      /**
       * Decodes a CellsResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns CellsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.CellsResponse;

      /**
       * Verifies a CellsResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a CellsResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns CellsResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.CellsResponse;

      /**
       * Creates a plain object from a CellsResponse message. Also converts values to other types if specified.
       * @param message CellsResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.CellsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this CellsResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for CellsResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a CellResponse. */
    interface ICellResponse {
      /** CellResponse data */
      data?: openbts.stations.ICell | null;
    }

    /** Represents a CellResponse. */
    class CellResponse implements ICellResponse {
      /**
       * Constructs a new CellResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.stations.ICellResponse);

      /** CellResponse data. */
      public data?: openbts.stations.ICell | null;

      /**
       * Creates a new CellResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns CellResponse instance
       */
      public static create(properties?: openbts.stations.ICellResponse): openbts.stations.CellResponse;

      /**
       * Encodes the specified CellResponse message. Does not implicitly {@link openbts.stations.CellResponse.verify|verify} messages.
       * @param message CellResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.stations.ICellResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified CellResponse message, length delimited. Does not implicitly {@link openbts.stations.CellResponse.verify|verify} messages.
       * @param message CellResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.stations.ICellResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a CellResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns CellResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.stations.CellResponse;

      /**
       * Decodes a CellResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns CellResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.stations.CellResponse;

      /**
       * Verifies a CellResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a CellResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns CellResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.stations.CellResponse;

      /**
       * Creates a plain object from a CellResponse message. Also converts values to other types if specified.
       * @param message CellResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.stations.CellResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this CellResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for CellResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }

  /** Namespace uke. */
  namespace uke {
    /** Properties of a UKEOperator. */
    interface IUKEOperator {
      /** UKEOperator id */
      id?: number | null;

      /** UKEOperator name */
      name?: string | null;

      /** UKEOperator full_name */
      full_name?: string | null;
    }

    /** Represents a UKEOperator. */
    class UKEOperator implements IUKEOperator {
      /**
       * Constructs a new UKEOperator.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IUKEOperator);

      /** UKEOperator id. */
      public id: number;

      /** UKEOperator name. */
      public name: string;

      /** UKEOperator full_name. */
      public full_name: string;

      /**
       * Creates a new UKEOperator instance using the specified properties.
       * @param [properties] Properties to set
       * @returns UKEOperator instance
       */
      public static create(properties?: openbts.uke.IUKEOperator): openbts.uke.UKEOperator;

      /**
       * Encodes the specified UKEOperator message. Does not implicitly {@link openbts.uke.UKEOperator.verify|verify} messages.
       * @param message UKEOperator message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IUKEOperator, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified UKEOperator message, length delimited. Does not implicitly {@link openbts.uke.UKEOperator.verify|verify} messages.
       * @param message UKEOperator message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IUKEOperator, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a UKEOperator message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns UKEOperator
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.UKEOperator;

      /**
       * Decodes a UKEOperator message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns UKEOperator
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.UKEOperator;

      /**
       * Verifies a UKEOperator message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a UKEOperator message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns UKEOperator
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.UKEOperator;

      /**
       * Creates a plain object from a UKEOperator message. Also converts values to other types if specified.
       * @param message UKEOperator
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.UKEOperator, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this UKEOperator to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for UKEOperator
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** DecisionType enum. */
    enum DecisionType {
      P = 0,
      zmP = 1,
    }

    /** PermitSource enum. */
    enum PermitSource {
      permits = 0,
      device_registry = 1,
    }

    /** AntennaType enum. */
    enum AntennaType {
      indoor = 0,
      outdoor = 1,
    }

    /** Properties of a Sector. */
    interface ISector {
      /** Sector id */
      id?: number | null;

      /** Sector azimuth */
      azimuth?: number | null;

      /** Sector elevation */
      elevation?: number | null;

      /** Sector antenna_height */
      antenna_height?: number | null;

      /** Sector antenna_type */
      antenna_type?: openbts.uke.AntennaType | null;
    }

    /** Represents a Sector. */
    class Sector implements ISector {
      /**
       * Constructs a new Sector.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.ISector);

      /** Sector id. */
      public id: number;

      /** Sector azimuth. */
      public azimuth: number;

      /** Sector elevation. */
      public elevation: number;

      /** Sector antenna_height. */
      public antenna_height: number;

      /** Sector antenna_type. */
      public antenna_type: openbts.uke.AntennaType;

      /**
       * Creates a new Sector instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Sector instance
       */
      public static create(properties?: openbts.uke.ISector): openbts.uke.Sector;

      /**
       * Encodes the specified Sector message. Does not implicitly {@link openbts.uke.Sector.verify|verify} messages.
       * @param message Sector message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.ISector, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Sector message, length delimited. Does not implicitly {@link openbts.uke.Sector.verify|verify} messages.
       * @param message Sector message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.ISector, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Sector message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Sector
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.Sector;

      /**
       * Decodes a Sector message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Sector
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.Sector;

      /**
       * Verifies a Sector message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Sector message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Sector
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.Sector;

      /**
       * Creates a plain object from a Sector message. Also converts values to other types if specified.
       * @param message Sector
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.Sector, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Sector to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Sector
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Permit. */
    interface IPermit {
      /** Permit id */
      id?: number | null;

      /** Permit station_id */
      station_id?: string | null;

      /** Permit decision_number */
      decision_number?: string | null;

      /** Permit decision_type */
      decision_type?: openbts.uke.DecisionType | null;

      /** Permit expiry_date */
      expiry_date?: string | null;

      /** Permit source */
      source?: openbts.uke.PermitSource | null;

      /** Permit location */
      location?: openbts.locations.ILocation | null;

      /** Permit operator */
      operator?: openbts.IOperator | null;

      /** Permit band */
      band?: openbts.IBand | null;

      /** Permit sectors */
      sectors?: openbts.uke.ISector[] | null;

      /** Permit updatedAt */
      updatedAt?: string | null;

      /** Permit createdAt */
      createdAt?: string | null;
    }

    /** Represents a Permit. */
    class Permit implements IPermit {
      /**
       * Constructs a new Permit.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IPermit);

      /** Permit id. */
      public id: number;

      /** Permit station_id. */
      public station_id: string;

      /** Permit decision_number. */
      public decision_number: string;

      /** Permit decision_type. */
      public decision_type: openbts.uke.DecisionType;

      /** Permit expiry_date. */
      public expiry_date: string;

      /** Permit source. */
      public source: openbts.uke.PermitSource;

      /** Permit location. */
      public location?: openbts.locations.ILocation | null;

      /** Permit operator. */
      public operator?: openbts.IOperator | null;

      /** Permit band. */
      public band?: openbts.IBand | null;

      /** Permit sectors. */
      public sectors: openbts.uke.ISector[];

      /** Permit updatedAt. */
      public updatedAt: string;

      /** Permit createdAt. */
      public createdAt: string;

      /**
       * Creates a new Permit instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Permit instance
       */
      public static create(properties?: openbts.uke.IPermit): openbts.uke.Permit;

      /**
       * Encodes the specified Permit message. Does not implicitly {@link openbts.uke.Permit.verify|verify} messages.
       * @param message Permit message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IPermit, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Permit message, length delimited. Does not implicitly {@link openbts.uke.Permit.verify|verify} messages.
       * @param message Permit message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IPermit, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Permit message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Permit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.Permit;

      /**
       * Decodes a Permit message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Permit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.Permit;

      /**
       * Verifies a Permit message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Permit message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Permit
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.Permit;

      /**
       * Creates a plain object from a Permit message. Also converts values to other types if specified.
       * @param message Permit
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.Permit, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Permit to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Permit
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a UKELocation. */
    interface IUKELocation {
      /** UKELocation id */
      id?: number | null;

      /** UKELocation city */
      city?: string | null;

      /** UKELocation address */
      address?: string | null;

      /** UKELocation latitude */
      latitude?: number | null;

      /** UKELocation longitude */
      longitude?: number | null;

      /** UKELocation region */
      region?: openbts.IRegion | null;

      /** UKELocation permits */
      permits?: openbts.uke.IPermit[] | null;

      /** UKELocation updatedAt */
      updatedAt?: string | null;

      /** UKELocation createdAt */
      createdAt?: string | null;
    }

    /** Represents a UKELocation. */
    class UKELocation implements IUKELocation {
      /**
       * Constructs a new UKELocation.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IUKELocation);

      /** UKELocation id. */
      public id: number;

      /** UKELocation city. */
      public city: string;

      /** UKELocation address. */
      public address: string;

      /** UKELocation latitude. */
      public latitude: number;

      /** UKELocation longitude. */
      public longitude: number;

      /** UKELocation region. */
      public region?: openbts.IRegion | null;

      /** UKELocation permits. */
      public permits: openbts.uke.IPermit[];

      /** UKELocation updatedAt. */
      public updatedAt: string;

      /** UKELocation createdAt. */
      public createdAt: string;

      /**
       * Creates a new UKELocation instance using the specified properties.
       * @param [properties] Properties to set
       * @returns UKELocation instance
       */
      public static create(properties?: openbts.uke.IUKELocation): openbts.uke.UKELocation;

      /**
       * Encodes the specified UKELocation message. Does not implicitly {@link openbts.uke.UKELocation.verify|verify} messages.
       * @param message UKELocation message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IUKELocation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified UKELocation message, length delimited. Does not implicitly {@link openbts.uke.UKELocation.verify|verify} messages.
       * @param message UKELocation message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IUKELocation, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a UKELocation message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns UKELocation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.UKELocation;

      /**
       * Decodes a UKELocation message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns UKELocation
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.UKELocation;

      /**
       * Verifies a UKELocation message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a UKELocation message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns UKELocation
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.UKELocation;

      /**
       * Creates a plain object from a UKELocation message. Also converts values to other types if specified.
       * @param message UKELocation
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.UKELocation, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this UKELocation to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for UKELocation
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolineManufacturer. */
    interface IRadiolineManufacturer {
      /** RadiolineManufacturer id */
      id?: number | null;

      /** RadiolineManufacturer name */
      name?: string | null;
    }

    /** Represents a RadiolineManufacturer. */
    class RadiolineManufacturer implements IRadiolineManufacturer {
      /**
       * Constructs a new RadiolineManufacturer.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolineManufacturer);

      /** RadiolineManufacturer id. */
      public id: number;

      /** RadiolineManufacturer name. */
      public name: string;

      /**
       * Creates a new RadiolineManufacturer instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolineManufacturer instance
       */
      public static create(properties?: openbts.uke.IRadiolineManufacturer): openbts.uke.RadiolineManufacturer;

      /**
       * Encodes the specified RadiolineManufacturer message. Does not implicitly {@link openbts.uke.RadiolineManufacturer.verify|verify} messages.
       * @param message RadiolineManufacturer message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolineManufacturer, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolineManufacturer message, length delimited. Does not implicitly {@link openbts.uke.RadiolineManufacturer.verify|verify} messages.
       * @param message RadiolineManufacturer message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolineManufacturer, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolineManufacturer message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolineManufacturer
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolineManufacturer;

      /**
       * Decodes a RadiolineManufacturer message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolineManufacturer
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolineManufacturer;

      /**
       * Verifies a RadiolineManufacturer message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolineManufacturer message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolineManufacturer
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolineManufacturer;

      /**
       * Creates a plain object from a RadiolineManufacturer message. Also converts values to other types if specified.
       * @param message RadiolineManufacturer
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolineManufacturer, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolineManufacturer to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolineManufacturer
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EquipmentType. */
    interface IEquipmentType {
      /** EquipmentType id */
      id?: number | null;

      /** EquipmentType name */
      name?: string | null;

      /** EquipmentType manufacturer */
      manufacturer?: openbts.uke.IRadiolineManufacturer | null;
    }

    /** Represents an EquipmentType. */
    class EquipmentType implements IEquipmentType {
      /**
       * Constructs a new EquipmentType.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IEquipmentType);

      /** EquipmentType id. */
      public id: number;

      /** EquipmentType name. */
      public name: string;

      /** EquipmentType manufacturer. */
      public manufacturer?: openbts.uke.IRadiolineManufacturer | null;

      /**
       * Creates a new EquipmentType instance using the specified properties.
       * @param [properties] Properties to set
       * @returns EquipmentType instance
       */
      public static create(properties?: openbts.uke.IEquipmentType): openbts.uke.EquipmentType;

      /**
       * Encodes the specified EquipmentType message. Does not implicitly {@link openbts.uke.EquipmentType.verify|verify} messages.
       * @param message EquipmentType message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IEquipmentType, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified EquipmentType message, length delimited. Does not implicitly {@link openbts.uke.EquipmentType.verify|verify} messages.
       * @param message EquipmentType message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IEquipmentType, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes an EquipmentType message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns EquipmentType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.EquipmentType;

      /**
       * Decodes an EquipmentType message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns EquipmentType
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.EquipmentType;

      /**
       * Verifies an EquipmentType message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates an EquipmentType message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns EquipmentType
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.EquipmentType;

      /**
       * Creates a plain object from an EquipmentType message. Also converts values to other types if specified.
       * @param message EquipmentType
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.EquipmentType, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this EquipmentType to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for EquipmentType
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolineAtenna. */
    interface IRadiolineAtenna {
      /** RadiolineAtenna type */
      type?: openbts.uke.IEquipmentType | null;

      /** RadiolineAtenna gain */
      gain?: number | null;

      /** RadiolineAtenna height */
      height?: number | null;
    }

    /** Represents a RadiolineAtenna. */
    class RadiolineAtenna implements IRadiolineAtenna {
      /**
       * Constructs a new RadiolineAtenna.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolineAtenna);

      /** RadiolineAtenna type. */
      public type?: openbts.uke.IEquipmentType | null;

      /** RadiolineAtenna gain. */
      public gain: number;

      /** RadiolineAtenna height. */
      public height: number;

      /**
       * Creates a new RadiolineAtenna instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolineAtenna instance
       */
      public static create(properties?: openbts.uke.IRadiolineAtenna): openbts.uke.RadiolineAtenna;

      /**
       * Encodes the specified RadiolineAtenna message. Does not implicitly {@link openbts.uke.RadiolineAtenna.verify|verify} messages.
       * @param message RadiolineAtenna message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolineAtenna, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolineAtenna message, length delimited. Does not implicitly {@link openbts.uke.RadiolineAtenna.verify|verify} messages.
       * @param message RadiolineAtenna message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolineAtenna, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolineAtenna message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolineAtenna
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolineAtenna;

      /**
       * Decodes a RadiolineAtenna message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolineAtenna
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolineAtenna;

      /**
       * Verifies a RadiolineAtenna message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolineAtenna message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolineAtenna
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolineAtenna;

      /**
       * Creates a plain object from a RadiolineAtenna message. Also converts values to other types if specified.
       * @param message RadiolineAtenna
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolineAtenna, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolineAtenna to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolineAtenna
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolineTxTransmitter. */
    interface IRadiolineTxTransmitter {
      /** RadiolineTxTransmitter type */
      type?: openbts.uke.IEquipmentType | null;
    }

    /** Represents a RadiolineTxTransmitter. */
    class RadiolineTxTransmitter implements IRadiolineTxTransmitter {
      /**
       * Constructs a new RadiolineTxTransmitter.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolineTxTransmitter);

      /** RadiolineTxTransmitter type. */
      public type?: openbts.uke.IEquipmentType | null;

      /**
       * Creates a new RadiolineTxTransmitter instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolineTxTransmitter instance
       */
      public static create(properties?: openbts.uke.IRadiolineTxTransmitter): openbts.uke.RadiolineTxTransmitter;

      /**
       * Encodes the specified RadiolineTxTransmitter message. Does not implicitly {@link openbts.uke.RadiolineTxTransmitter.verify|verify} messages.
       * @param message RadiolineTxTransmitter message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolineTxTransmitter, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolineTxTransmitter message, length delimited. Does not implicitly {@link openbts.uke.RadiolineTxTransmitter.verify|verify} messages.
       * @param message RadiolineTxTransmitter message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolineTxTransmitter, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolineTxTransmitter message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolineTxTransmitter
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolineTxTransmitter;

      /**
       * Decodes a RadiolineTxTransmitter message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolineTxTransmitter
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolineTxTransmitter;

      /**
       * Verifies a RadiolineTxTransmitter message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolineTxTransmitter message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolineTxTransmitter
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolineTxTransmitter;

      /**
       * Creates a plain object from a RadiolineTxTransmitter message. Also converts values to other types if specified.
       * @param message RadiolineTxTransmitter
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolineTxTransmitter, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolineTxTransmitter to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolineTxTransmitter
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolineTx. */
    interface IRadiolineTx {
      /** RadiolineTx longitude */
      longitude?: number | null;

      /** RadiolineTx latitude */
      latitude?: number | null;

      /** RadiolineTx height */
      height?: number | null;

      /** RadiolineTx eirp */
      eirp?: number | null;

      /** RadiolineTx antenna_attenuation */
      antenna_attenuation?: number | null;

      /** RadiolineTx transmitter */
      transmitter?: openbts.uke.IRadiolineTxTransmitter | null;

      /** RadiolineTx antenna */
      antenna?: openbts.uke.IRadiolineAtenna | null;
    }

    /** Represents a RadiolineTx. */
    class RadiolineTx implements IRadiolineTx {
      /**
       * Constructs a new RadiolineTx.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolineTx);

      /** RadiolineTx longitude. */
      public longitude: number;

      /** RadiolineTx latitude. */
      public latitude: number;

      /** RadiolineTx height. */
      public height: number;

      /** RadiolineTx eirp. */
      public eirp: number;

      /** RadiolineTx antenna_attenuation. */
      public antenna_attenuation: number;

      /** RadiolineTx transmitter. */
      public transmitter?: openbts.uke.IRadiolineTxTransmitter | null;

      /** RadiolineTx antenna. */
      public antenna?: openbts.uke.IRadiolineAtenna | null;

      /**
       * Creates a new RadiolineTx instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolineTx instance
       */
      public static create(properties?: openbts.uke.IRadiolineTx): openbts.uke.RadiolineTx;

      /**
       * Encodes the specified RadiolineTx message. Does not implicitly {@link openbts.uke.RadiolineTx.verify|verify} messages.
       * @param message RadiolineTx message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolineTx, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolineTx message, length delimited. Does not implicitly {@link openbts.uke.RadiolineTx.verify|verify} messages.
       * @param message RadiolineTx message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolineTx, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolineTx message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolineTx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolineTx;

      /**
       * Decodes a RadiolineTx message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolineTx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolineTx;

      /**
       * Verifies a RadiolineTx message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolineTx message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolineTx
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolineTx;

      /**
       * Creates a plain object from a RadiolineTx message. Also converts values to other types if specified.
       * @param message RadiolineTx
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolineTx, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolineTx to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolineTx
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolineRx. */
    interface IRadiolineRx {
      /** RadiolineRx longitude */
      longitude?: number | null;

      /** RadiolineRx latitude */
      latitude?: number | null;

      /** RadiolineRx height */
      height?: number | null;

      /** RadiolineRx type */
      type?: openbts.uke.IEquipmentType | null;

      /** RadiolineRx gain */
      gain?: number | null;

      /** RadiolineRx height_antenna */
      height_antenna?: number | null;

      /** RadiolineRx noise_figure */
      noise_figure?: number | null;

      /** RadiolineRx atpc_attenuation */
      atpc_attenuation?: number | null;
    }

    /** Represents a RadiolineRx. */
    class RadiolineRx implements IRadiolineRx {
      /**
       * Constructs a new RadiolineRx.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolineRx);

      /** RadiolineRx longitude. */
      public longitude: number;

      /** RadiolineRx latitude. */
      public latitude: number;

      /** RadiolineRx height. */
      public height: number;

      /** RadiolineRx type. */
      public type?: openbts.uke.IEquipmentType | null;

      /** RadiolineRx gain. */
      public gain: number;

      /** RadiolineRx height_antenna. */
      public height_antenna: number;

      /** RadiolineRx noise_figure. */
      public noise_figure: number;

      /** RadiolineRx atpc_attenuation. */
      public atpc_attenuation: number;

      /**
       * Creates a new RadiolineRx instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolineRx instance
       */
      public static create(properties?: openbts.uke.IRadiolineRx): openbts.uke.RadiolineRx;

      /**
       * Encodes the specified RadiolineRx message. Does not implicitly {@link openbts.uke.RadiolineRx.verify|verify} messages.
       * @param message RadiolineRx message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolineRx, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolineRx message, length delimited. Does not implicitly {@link openbts.uke.RadiolineRx.verify|verify} messages.
       * @param message RadiolineRx message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolineRx, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolineRx message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolineRx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolineRx;

      /**
       * Decodes a RadiolineRx message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolineRx
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolineRx;

      /**
       * Verifies a RadiolineRx message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolineRx message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolineRx
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolineRx;

      /**
       * Creates a plain object from a RadiolineRx message. Also converts values to other types if specified.
       * @param message RadiolineRx
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolineRx, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolineRx to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolineRx
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolineLink. */
    interface IRadiolineLink {
      /** RadiolineLink freq */
      freq?: number | null;

      /** RadiolineLink ch_num */
      ch_num?: number | null;

      /** RadiolineLink plan_synbol */
      plan_synbol?: string | null;

      /** RadiolineLink ch_width */
      ch_width?: number | null;

      /** RadiolineLink polarization */
      polarization?: string | null;

      /** RadiolineLink modulation_type */
      modulation_type?: string | null;

      /** RadiolineLink bandwidth */
      bandwidth?: string | null;
    }

    /** Represents a RadiolineLink. */
    class RadiolineLink implements IRadiolineLink {
      /**
       * Constructs a new RadiolineLink.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolineLink);

      /** RadiolineLink freq. */
      public freq: number;

      /** RadiolineLink ch_num. */
      public ch_num: number;

      /** RadiolineLink plan_synbol. */
      public plan_synbol: string;

      /** RadiolineLink ch_width. */
      public ch_width: number;

      /** RadiolineLink polarization. */
      public polarization: string;

      /** RadiolineLink modulation_type. */
      public modulation_type: string;

      /** RadiolineLink bandwidth. */
      public bandwidth: string;

      /**
       * Creates a new RadiolineLink instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolineLink instance
       */
      public static create(properties?: openbts.uke.IRadiolineLink): openbts.uke.RadiolineLink;

      /**
       * Encodes the specified RadiolineLink message. Does not implicitly {@link openbts.uke.RadiolineLink.verify|verify} messages.
       * @param message RadiolineLink message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolineLink, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolineLink message, length delimited. Does not implicitly {@link openbts.uke.RadiolineLink.verify|verify} messages.
       * @param message RadiolineLink message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolineLink, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolineLink message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolineLink
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolineLink;

      /**
       * Decodes a RadiolineLink message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolineLink
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolineLink;

      /**
       * Verifies a RadiolineLink message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolineLink message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolineLink
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolineLink;

      /**
       * Creates a plain object from a RadiolineLink message. Also converts values to other types if specified.
       * @param message RadiolineLink
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolineLink, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolineLink to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolineLink
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolinePermit. */
    interface IRadiolinePermit {
      /** RadiolinePermit number */
      number?: string | null;

      /** RadiolinePermit decision_type */
      decision_type?: string | null;

      /** RadiolinePermit expiry_date */
      expiry_date?: string | null;
    }

    /** Represents a RadiolinePermit. */
    class RadiolinePermit implements IRadiolinePermit {
      /**
       * Constructs a new RadiolinePermit.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolinePermit);

      /** RadiolinePermit number. */
      public number: string;

      /** RadiolinePermit decision_type. */
      public decision_type: string;

      /** RadiolinePermit expiry_date. */
      public expiry_date: string;

      /**
       * Creates a new RadiolinePermit instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolinePermit instance
       */
      public static create(properties?: openbts.uke.IRadiolinePermit): openbts.uke.RadiolinePermit;

      /**
       * Encodes the specified RadiolinePermit message. Does not implicitly {@link openbts.uke.RadiolinePermit.verify|verify} messages.
       * @param message RadiolinePermit message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolinePermit, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolinePermit message, length delimited. Does not implicitly {@link openbts.uke.RadiolinePermit.verify|verify} messages.
       * @param message RadiolinePermit message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolinePermit, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolinePermit message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolinePermit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolinePermit;

      /**
       * Decodes a RadiolinePermit message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolinePermit
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolinePermit;

      /**
       * Verifies a RadiolinePermit message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolinePermit message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolinePermit
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolinePermit;

      /**
       * Creates a plain object from a RadiolinePermit message. Also converts values to other types if specified.
       * @param message RadiolinePermit
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolinePermit, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolinePermit to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolinePermit
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Radioline. */
    interface IRadioline {
      /** Radioline id */
      id?: number | null;

      /** Radioline tx */
      tx?: openbts.uke.IRadiolineTx | null;

      /** Radioline rx */
      rx?: openbts.uke.IRadiolineRx | null;

      /** Radioline link */
      link?: openbts.uke.IRadiolineLink | null;

      /** Radioline operator */
      operator?: openbts.uke.IUKEOperator | null;

      /** Radioline permit */
      permit?: openbts.uke.IRadiolinePermit | null;

      /** Radioline updatedAt */
      updatedAt?: string | null;

      /** Radioline createdAt */
      createdAt?: string | null;
    }

    /** Represents a Radioline. */
    class Radioline implements IRadioline {
      /**
       * Constructs a new Radioline.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadioline);

      /** Radioline id. */
      public id: number;

      /** Radioline tx. */
      public tx?: openbts.uke.IRadiolineTx | null;

      /** Radioline rx. */
      public rx?: openbts.uke.IRadiolineRx | null;

      /** Radioline link. */
      public link?: openbts.uke.IRadiolineLink | null;

      /** Radioline operator. */
      public operator?: openbts.uke.IUKEOperator | null;

      /** Radioline permit. */
      public permit?: openbts.uke.IRadiolinePermit | null;

      /** Radioline updatedAt. */
      public updatedAt: string;

      /** Radioline createdAt. */
      public createdAt: string;

      /**
       * Creates a new Radioline instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Radioline instance
       */
      public static create(properties?: openbts.uke.IRadioline): openbts.uke.Radioline;

      /**
       * Encodes the specified Radioline message. Does not implicitly {@link openbts.uke.Radioline.verify|verify} messages.
       * @param message Radioline message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadioline, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Radioline message, length delimited. Does not implicitly {@link openbts.uke.Radioline.verify|verify} messages.
       * @param message Radioline message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadioline, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Radioline message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Radioline
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.Radioline;

      /**
       * Decodes a Radioline message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Radioline
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.Radioline;

      /**
       * Verifies a Radioline message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Radioline message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Radioline
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.Radioline;

      /**
       * Creates a plain object from a Radioline message. Also converts values to other types if specified.
       * @param message Radioline
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.Radioline, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Radioline to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Radioline
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PermitsResponse. */
    interface IPermitsResponse {
      /** PermitsResponse data */
      data?: openbts.uke.IPermit[] | null;
    }

    /** Represents a PermitsResponse. */
    class PermitsResponse implements IPermitsResponse {
      /**
       * Constructs a new PermitsResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IPermitsResponse);

      /** PermitsResponse data. */
      public data: openbts.uke.IPermit[];

      /**
       * Creates a new PermitsResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns PermitsResponse instance
       */
      public static create(properties?: openbts.uke.IPermitsResponse): openbts.uke.PermitsResponse;

      /**
       * Encodes the specified PermitsResponse message. Does not implicitly {@link openbts.uke.PermitsResponse.verify|verify} messages.
       * @param message PermitsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IPermitsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified PermitsResponse message, length delimited. Does not implicitly {@link openbts.uke.PermitsResponse.verify|verify} messages.
       * @param message PermitsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IPermitsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a PermitsResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns PermitsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.PermitsResponse;

      /**
       * Decodes a PermitsResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns PermitsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.PermitsResponse;

      /**
       * Verifies a PermitsResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a PermitsResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns PermitsResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.PermitsResponse;

      /**
       * Creates a plain object from a PermitsResponse message. Also converts values to other types if specified.
       * @param message PermitsResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.PermitsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this PermitsResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for PermitsResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PermitResponse. */
    interface IPermitResponse {
      /** PermitResponse data */
      data?: openbts.uke.IPermit | null;
    }

    /** Represents a PermitResponse. */
    class PermitResponse implements IPermitResponse {
      /**
       * Constructs a new PermitResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IPermitResponse);

      /** PermitResponse data. */
      public data?: openbts.uke.IPermit | null;

      /**
       * Creates a new PermitResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns PermitResponse instance
       */
      public static create(properties?: openbts.uke.IPermitResponse): openbts.uke.PermitResponse;

      /**
       * Encodes the specified PermitResponse message. Does not implicitly {@link openbts.uke.PermitResponse.verify|verify} messages.
       * @param message PermitResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IPermitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified PermitResponse message, length delimited. Does not implicitly {@link openbts.uke.PermitResponse.verify|verify} messages.
       * @param message PermitResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IPermitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a PermitResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns PermitResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.PermitResponse;

      /**
       * Decodes a PermitResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns PermitResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.PermitResponse;

      /**
       * Verifies a PermitResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a PermitResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns PermitResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.PermitResponse;

      /**
       * Creates a plain object from a PermitResponse message. Also converts values to other types if specified.
       * @param message PermitResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.PermitResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this PermitResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for PermitResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a LocationsResponse. */
    interface ILocationsResponse {
      /** LocationsResponse data */
      data?: openbts.uke.IUKELocation[] | null;

      /** LocationsResponse totalCount */
      totalCount?: number | null;
    }

    /** Represents a LocationsResponse. */
    class LocationsResponse implements ILocationsResponse {
      /**
       * Constructs a new LocationsResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.ILocationsResponse);

      /** LocationsResponse data. */
      public data: openbts.uke.IUKELocation[];

      /** LocationsResponse totalCount. */
      public totalCount: number;

      /**
       * Creates a new LocationsResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns LocationsResponse instance
       */
      public static create(properties?: openbts.uke.ILocationsResponse): openbts.uke.LocationsResponse;

      /**
       * Encodes the specified LocationsResponse message. Does not implicitly {@link openbts.uke.LocationsResponse.verify|verify} messages.
       * @param message LocationsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.ILocationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified LocationsResponse message, length delimited. Does not implicitly {@link openbts.uke.LocationsResponse.verify|verify} messages.
       * @param message LocationsResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.ILocationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.LocationsResponse;

      /**
       * Decodes a LocationsResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns LocationsResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.LocationsResponse;

      /**
       * Verifies a LocationsResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a LocationsResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns LocationsResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.LocationsResponse;

      /**
       * Creates a plain object from a LocationsResponse message. Also converts values to other types if specified.
       * @param message LocationsResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.LocationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this LocationsResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for LocationsResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolinesResponse. */
    interface IRadiolinesResponse {
      /** RadiolinesResponse data */
      data?: openbts.uke.IRadioline[] | null;

      /** RadiolinesResponse totalCount */
      totalCount?: number | null;
    }

    /** Represents a RadiolinesResponse. */
    class RadiolinesResponse implements IRadiolinesResponse {
      /**
       * Constructs a new RadiolinesResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolinesResponse);

      /** RadiolinesResponse data. */
      public data: openbts.uke.IRadioline[];

      /** RadiolinesResponse totalCount. */
      public totalCount: number;

      /**
       * Creates a new RadiolinesResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolinesResponse instance
       */
      public static create(properties?: openbts.uke.IRadiolinesResponse): openbts.uke.RadiolinesResponse;

      /**
       * Encodes the specified RadiolinesResponse message. Does not implicitly {@link openbts.uke.RadiolinesResponse.verify|verify} messages.
       * @param message RadiolinesResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolinesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolinesResponse message, length delimited. Does not implicitly {@link openbts.uke.RadiolinesResponse.verify|verify} messages.
       * @param message RadiolinesResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolinesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolinesResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolinesResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolinesResponse;

      /**
       * Decodes a RadiolinesResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolinesResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolinesResponse;

      /**
       * Verifies a RadiolinesResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolinesResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolinesResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolinesResponse;

      /**
       * Creates a plain object from a RadiolinesResponse message. Also converts values to other types if specified.
       * @param message RadiolinesResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolinesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolinesResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolinesResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a RadiolineResponse. */
    interface IRadiolineResponse {
      /** RadiolineResponse data */
      data?: openbts.uke.IRadioline | null;
    }

    /** Represents a RadiolineResponse. */
    class RadiolineResponse implements IRadiolineResponse {
      /**
       * Constructs a new RadiolineResponse.
       * @param [properties] Properties to set
       */
      constructor(properties?: openbts.uke.IRadiolineResponse);

      /** RadiolineResponse data. */
      public data?: openbts.uke.IRadioline | null;

      /**
       * Creates a new RadiolineResponse instance using the specified properties.
       * @param [properties] Properties to set
       * @returns RadiolineResponse instance
       */
      public static create(properties?: openbts.uke.IRadiolineResponse): openbts.uke.RadiolineResponse;

      /**
       * Encodes the specified RadiolineResponse message. Does not implicitly {@link openbts.uke.RadiolineResponse.verify|verify} messages.
       * @param message RadiolineResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: openbts.uke.IRadiolineResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified RadiolineResponse message, length delimited. Does not implicitly {@link openbts.uke.RadiolineResponse.verify|verify} messages.
       * @param message RadiolineResponse message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: openbts.uke.IRadiolineResponse, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a RadiolineResponse message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns RadiolineResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): openbts.uke.RadiolineResponse;

      /**
       * Decodes a RadiolineResponse message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns RadiolineResponse
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): openbts.uke.RadiolineResponse;

      /**
       * Verifies a RadiolineResponse message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a RadiolineResponse message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns RadiolineResponse
       */
      public static fromObject(object: { [k: string]: any }): openbts.uke.RadiolineResponse;

      /**
       * Creates a plain object from a RadiolineResponse message. Also converts values to other types if specified.
       * @param message RadiolineResponse
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: openbts.uke.RadiolineResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this RadiolineResponse to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for RadiolineResponse
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }
}

/** Namespace google. */
export namespace google {
  /** Namespace protobuf. */
  namespace protobuf {
    /** Properties of a Timestamp. */
    interface ITimestamp {
      /** Timestamp seconds */
      seconds?: number | Long | null;

      /** Timestamp nanos */
      nanos?: number | null;
    }

    /** Represents a Timestamp. */
    class Timestamp implements ITimestamp {
      /**
       * Constructs a new Timestamp.
       * @param [properties] Properties to set
       */
      constructor(properties?: google.protobuf.ITimestamp);

      /** Timestamp seconds. */
      public seconds: number | Long;

      /** Timestamp nanos. */
      public nanos: number;

      /**
       * Creates a new Timestamp instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Timestamp instance
       */
      public static create(properties?: google.protobuf.ITimestamp): google.protobuf.Timestamp;

      /**
       * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
       * @param message Timestamp message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
       * @param message Timestamp message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Timestamp message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Timestamp
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): google.protobuf.Timestamp;

      /**
       * Decodes a Timestamp message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Timestamp
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): google.protobuf.Timestamp;

      /**
       * Verifies a Timestamp message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Timestamp
       */
      public static fromObject(object: { [k: string]: any }): google.protobuf.Timestamp;

      /**
       * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
       * @param message Timestamp
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: google.protobuf.Timestamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Timestamp to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Timestamp
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Struct. */
    interface IStruct {
      /** Struct fields */
      fields?: { [k: string]: google.protobuf.IValue } | null;
    }

    /** Represents a Struct. */
    class Struct implements IStruct {
      /**
       * Constructs a new Struct.
       * @param [properties] Properties to set
       */
      constructor(properties?: google.protobuf.IStruct);

      /** Struct fields. */
      public fields: { [k: string]: google.protobuf.IValue };

      /**
       * Creates a new Struct instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Struct instance
       */
      public static create(properties?: google.protobuf.IStruct): google.protobuf.Struct;

      /**
       * Encodes the specified Struct message. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
       * @param message Struct message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Struct message, length delimited. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
       * @param message Struct message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Struct message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Struct
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): google.protobuf.Struct;

      /**
       * Decodes a Struct message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Struct
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): google.protobuf.Struct;

      /**
       * Verifies a Struct message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Struct message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Struct
       */
      public static fromObject(object: { [k: string]: any }): google.protobuf.Struct;

      /**
       * Creates a plain object from a Struct message. Also converts values to other types if specified.
       * @param message Struct
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: google.protobuf.Struct, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Struct to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Struct
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a Value. */
    interface IValue {
      /** Value nullValue */
      nullValue?: google.protobuf.NullValue | null;

      /** Value numberValue */
      numberValue?: number | null;

      /** Value stringValue */
      stringValue?: string | null;

      /** Value boolValue */
      boolValue?: boolean | null;

      /** Value structValue */
      structValue?: google.protobuf.IStruct | null;

      /** Value listValue */
      listValue?: google.protobuf.IListValue | null;
    }

    /** Represents a Value. */
    class Value implements IValue {
      /**
       * Constructs a new Value.
       * @param [properties] Properties to set
       */
      constructor(properties?: google.protobuf.IValue);

      /** Value nullValue. */
      public nullValue?: google.protobuf.NullValue | null;

      /** Value numberValue. */
      public numberValue?: number | null;

      /** Value stringValue. */
      public stringValue?: string | null;

      /** Value boolValue. */
      public boolValue?: boolean | null;

      /** Value structValue. */
      public structValue?: google.protobuf.IStruct | null;

      /** Value listValue. */
      public listValue?: google.protobuf.IListValue | null;

      /** Value kind. */
      public kind?: "nullValue" | "numberValue" | "stringValue" | "boolValue" | "structValue" | "listValue";

      /**
       * Creates a new Value instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Value instance
       */
      public static create(properties?: google.protobuf.IValue): google.protobuf.Value;

      /**
       * Encodes the specified Value message. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
       * @param message Value message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified Value message, length delimited. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
       * @param message Value message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a Value message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Value
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): google.protobuf.Value;

      /**
       * Decodes a Value message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Value
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): google.protobuf.Value;

      /**
       * Verifies a Value message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Value message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Value
       */
      public static fromObject(object: { [k: string]: any }): google.protobuf.Value;

      /**
       * Creates a plain object from a Value message. Also converts values to other types if specified.
       * @param message Value
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: google.protobuf.Value, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this Value to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Value
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** NullValue enum. */
    enum NullValue {
      NULL_VALUE = 0,
    }

    /** Properties of a ListValue. */
    interface IListValue {
      /** ListValue values */
      values?: google.protobuf.IValue[] | null;
    }

    /** Represents a ListValue. */
    class ListValue implements IListValue {
      /**
       * Constructs a new ListValue.
       * @param [properties] Properties to set
       */
      constructor(properties?: google.protobuf.IListValue);

      /** ListValue values. */
      public values: google.protobuf.IValue[];

      /**
       * Creates a new ListValue instance using the specified properties.
       * @param [properties] Properties to set
       * @returns ListValue instance
       */
      public static create(properties?: google.protobuf.IListValue): google.protobuf.ListValue;

      /**
       * Encodes the specified ListValue message. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
       * @param message ListValue message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Encodes the specified ListValue message, length delimited. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
       * @param message ListValue message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

      /**
       * Decodes a ListValue message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns ListValue
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(reader: $protobuf.Reader | Uint8Array, length?: number): google.protobuf.ListValue;

      /**
       * Decodes a ListValue message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns ListValue
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(reader: $protobuf.Reader | Uint8Array): google.protobuf.ListValue;

      /**
       * Verifies a ListValue message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns ListValue
       */
      public static fromObject(object: { [k: string]: any }): google.protobuf.ListValue;

      /**
       * Creates a plain object from a ListValue message. Also converts values to other types if specified.
       * @param message ListValue
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(message: google.protobuf.ListValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

      /**
       * Converts this ListValue to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for ListValue
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }
}
