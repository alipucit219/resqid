export const isProvidedVariablePositiveInteger = (variable: unknown) => {
  return Number.isInteger(Number(variable)) && (variable as number) > 0;
};
