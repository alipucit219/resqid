const isObject = (obj) => {
  return (
    typeof obj === "object" && obj !== undefined && obj.constructor === Object
  );
};

const removeNestedKey = (obj, nestedKeysArr, throwException) => {
  let outputString = "";

  nestedKeysArr.forEach((key, keyIndex) => {
    outputString += `['${key}']`;
    if (eval(`obj${outputString}`) === undefined) {
      if (throwException) {
        if (keyIndex === 0) {
          throw new Error(`Property ${key} does not exist on object`);
        } else {
          throw new Error(
            `Property ${key} does not exist on ${nestedKeysArr
              .splice(0, keyIndex)
              .join(".")}`
          );
        }
      }
      return;
    }
  });

  eval(`delete obj${outputString}`);
};

const handleRemoveRootKey = (obj, key, throwException) => {
  if (obj[key] === undefined) {
    if (throwException) throw new Error(`Invalid key ${key}`);
    return;
  }

  delete obj[key];
};

const handleRemoveNestedKey = (obj, nestedKeysArr, throwException) => {
  const isNestedKeyValid = nestedKeysArr.every((key) => key.trim().length > 0);

  if (!isNestedKeyValid) {
    throw new Error(`Invalid key ${nestedKeysArr.join(".")}`);
  }

  removeNestedKey(
    obj,
    nestedKeysArr.map((key) => key.trim()),
    throwException
  );
};

export const removeKeysFromObj = (
  obj,
  keysToDeleteArr: string[] = [],
  throwException: boolean = false
) => {
  if (!isObject(obj)) throw new Error("First parameter needs to be an object");

  for (const keyToDelete of keysToDeleteArr) {
    if (keyToDelete.indexOf(".") > -1) {
      const nestedKeysArr = keyToDelete.split(".");
      handleRemoveNestedKey(obj, nestedKeysArr, throwException);
    } else {
      handleRemoveRootKey(obj, keyToDelete, throwException);
    }
  }

  return obj;
};
