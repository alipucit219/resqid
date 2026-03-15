export const removeDuplicatesFromArr = (arr: Array<any>) => {
  return [...new Set(arr)];
};
