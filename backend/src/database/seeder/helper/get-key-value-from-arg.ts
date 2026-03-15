export function getKeyValueFromArg(arg: string) {
  const [key, value] = arg.split("=");
  return {
    key,
    value,
  };
}
