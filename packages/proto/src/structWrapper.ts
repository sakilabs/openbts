type AnyObj = Record<string, unknown>;
type WrapperThis = {
  fromObject: (object: unknown) => unknown;
  toObject: (message: unknown, options?: unknown) => unknown;
};
type Wrapper = {
  fromObject?: (this: WrapperThis, object: unknown) => unknown;
  toObject?: (this: WrapperThis, message: unknown, options?: unknown) => unknown;
};
type WrappersHost = { wrappers: Record<string, Wrapper> };
type StructShape = { fields?: AnyObj };
type ListValueShape = { values?: unknown[] };

function valueFromJs(value: unknown): AnyObj {
  if (value === null || value === undefined) return { nullValue: 0 };
  if (typeof value === "boolean") return { boolValue: value };
  if (typeof value === "number") return { numberValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (Array.isArray(value)) return { listValue: { values: value.map(valueFromJs) } };
  if (typeof value === "object") return { structValue: structFromJs(value as AnyObj) };
  return { nullValue: 0 };
}

function structFromJs(obj: AnyObj): { fields: AnyObj } {
  const fields: AnyObj = {};
  for (const k of Object.keys(obj)) fields[k] = valueFromJs(obj[k]);
  return { fields };
}

function hasOwn(v: AnyObj, k: string): boolean {
  return Object.prototype.hasOwnProperty.call(v, k);
}

function isObjectRecord(value: unknown): value is AnyObj {
  return value !== null && typeof value === "object";
}

function valueToJs(v: AnyObj | null | undefined): unknown {
  if (!v) return null;
  if (hasOwn(v, "numberValue") || hasOwn(v, "number_value")) return v.numberValue ?? v.number_value;
  if (hasOwn(v, "stringValue") || hasOwn(v, "string_value")) return v.stringValue ?? v.string_value;
  if (hasOwn(v, "boolValue") || hasOwn(v, "bool_value")) return v.boolValue ?? v.bool_value;
  if (hasOwn(v, "listValue") || hasOwn(v, "list_value")) {
    const lv = (v.listValue ?? v.list_value) as ListValueShape | undefined;
    return (lv?.values ?? []).map((x) => valueToJs(x as AnyObj));
  }
  if (hasOwn(v, "structValue") || hasOwn(v, "struct_value")) {
    return structToJs((v.structValue ?? v.struct_value) as StructShape);
  }
  if (hasOwn(v, "nullValue") || hasOwn(v, "null_value")) return null;
  return null;
}

function structToJs(s: StructShape | null | undefined): AnyObj {
  const fields = s?.fields;
  if (!fields) return {};
  const out: AnyObj = {};
  for (const k of Object.keys(fields)) out[k] = valueToJs(fields[k] as AnyObj);
  return out;
}

const VALUE_KIND_KEYS = [
  "nullValue",
  "boolValue",
  "numberValue",
  "stringValue",
  "listValue",
  "structValue",
  "null_value",
  "bool_value",
  "number_value",
  "string_value",
  "list_value",
  "struct_value",
];

function isStructObject(value: unknown): value is StructShape {
  return isObjectRecord(value) && "fields" in value && typeof value.fields === "object";
}

function isValueObject(value: unknown): value is AnyObj {
  return isObjectRecord(value) && !Array.isArray(value) && VALUE_KIND_KEYS.some((key) => key in value);
}

export function registerStructWrappers(host: WrappersHost): void {
  const w = host.wrappers;

  w[".google.protobuf.Struct"] = {
    fromObject(object) {
      if (isStructObject(object)) return this.fromObject(object);
      return this.fromObject(structFromJs((object ?? {}) as AnyObj));
    },
    toObject(message) {
      return structToJs(message as StructShape);
    },
  };

  w[".google.protobuf.Value"] = {
    fromObject(object) {
      if (isValueObject(object)) return this.fromObject(object);
      return this.fromObject(valueFromJs(object));
    },
    toObject(message) {
      return valueToJs(message as AnyObj);
    },
  };

  w[".google.protobuf.ListValue"] = {
    fromObject(object) {
      if (Array.isArray(object)) return this.fromObject({ values: object.map(valueFromJs) });
      return this.fromObject(object);
    },
    toObject(message) {
      const m = message as ListValueShape | null | undefined;
      return (m?.values ?? []).map((x) => valueToJs(x as AnyObj));
    },
  };
}
