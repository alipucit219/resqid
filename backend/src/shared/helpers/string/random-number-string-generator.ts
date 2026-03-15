const DEFAULT_LENGTH = 6;

export const randomNumberStringGenerator = (length = DEFAULT_LENGTH) => {
  const characters = "1234567890";
  let resultStr = "";

  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    resultStr += characters.charAt(
      Math.floor(Math.random() * charactersLength)
    );
  }

  return resultStr;
};
