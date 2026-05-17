import { BadRequestException } from "@nestjs/common";
import { extname } from "path";

export const isProvidedFileAValidPdf = (_, file, callback) => {
  const fileExtension = extname(file?.originalname || "");
  const isValidPdfFile = fileExtension.toLowerCase() === ".pdf";

  if (!isValidPdfFile) {
    return callback(
      new BadRequestException("Only .pdf files are allowed."),
      false,
    );
  }

  callback(null, true);
};
