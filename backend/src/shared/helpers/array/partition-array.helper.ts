export const partitionArray = (array, partitionSize) => {
  // Validation part
  if (partitionSize <= 0 || array.length < partitionSize) {
    throw new Error('Invalid input to the function')
  }

  // Required variables
  const partitionedArr = []
  let i = 0

  // Main logic
  while (i < array.length) {
    if (array.length - i >= partitionSize) {
      partitionedArr.push(array.slice(i, i + partitionSize + 1));
      i = i + partitionSize;
    } else {
      partitionedArr.push(array[i]);
      i = i + 1;
    }
  }

  return partitionedArr
}