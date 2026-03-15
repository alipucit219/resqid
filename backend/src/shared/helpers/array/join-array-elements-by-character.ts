const DEFAULT_POSTFIX_SEPARATOR = "";

export const joinArrayElementsByCharacter = (
  arr: Array<string>,
  concatenator: string,
  postFix = DEFAULT_POSTFIX_SEPARATOR
) => {
  if (arr.length === 0 || arr.length === 1) {
    return arr[0] || "";
  }

  return arr
    .slice(0, arr.length - 1)
    .join(concatenator)
    .concat(
      postFix === DEFAULT_POSTFIX_SEPARATOR ? concatenator : ` ${postFix} `
    )
    .concat(arr[arr.length - 1]);
};
