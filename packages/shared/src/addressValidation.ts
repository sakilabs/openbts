const POLISH_LETTERS = "A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż";
const POLISH_OWN_WORD_PATTERN = new RegExp(`(^|[^${POLISH_LETTERS}])własn(?:ego|emu|ymi|ych|ym|ej|ą|a|e|y)(?=$|[^${POLISH_LETTERS}])`, "iu");

export function hasGenericAddressMarker(value: string | null | undefined): boolean {
  return typeof value === "string" && POLISH_OWN_WORD_PATTERN.test(value);
}
