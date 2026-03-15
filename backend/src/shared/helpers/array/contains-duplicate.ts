export const arrayContainsDuplicate = (array: (number | string)[]): boolean => {
  let flag = false;
  array.forEach((item, index) => {
    if (array.indexOf(item) < index) flag = true;
  })
  return flag;
}