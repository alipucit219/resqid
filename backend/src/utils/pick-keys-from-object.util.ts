const isObject = (obj) => {
  return (
    typeof obj === "object" && obj !== undefined && obj.constructor === Object
  );
};

const handlePickRootKey = (obj, newObj, key, throwException) => {
  if (obj[key] === undefined) {
    if (throwException) throw new Error(`Invalid key ${key}`);
    return;
  }

  newObj = {
    ...newObj,
    [key]: obj[key],
  };

  return newObj;
};

export const pickKeysFromObj = (
  obj,
  keysToPickArr: string[] = [],
  throwException: boolean = false
) => {
  if (!isObject(obj)) throw new Error("First parameter needs to be an object");
  let newObj = {};

  for (const keyToPick of keysToPickArr) {
    newObj = handlePickRootKey(obj, newObj, keyToPick, throwException);
  }

  return newObj;
};
