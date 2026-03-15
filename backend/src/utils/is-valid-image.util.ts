import { BadRequestException } from "@nestjs/common";
import { extname } from "path";
import { joinArrayElementsByCharacter } from "src/shared/helpers/array";

export const isProvidedFileAValidImage = (_, file, callback) => {
  const fileExtension = extname(file.originalname);
  const validImageExtensions = [".png", ".jpg", ".jpeg"];
  const isValidImageFile = validImageExtensions.includes(
    fileExtension.toLowerCase()
  );

  if (!isValidImageFile) {
    return callback(
      new BadRequestException(
        `Only ${joinArrayElementsByCharacter(
          validImageExtensions,
          ",",
          "and"
        )} are allowed files.`
      ),
      false
    );
  }

  callback(null, true);
};
