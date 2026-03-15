import { ValueTransformer } from "typeorm";

export const decimalNumberTransformer: ValueTransformer = {
  to: (value?: number | null) => {
    if (value === null || value === undefined) {
      return value;
    }
    return Number(Number(value).toFixed(2));
  },
  from: (value?: string | null) => {
    if (value === null || value === undefined) {
      return value as null | undefined;
    }
    return Number(value);
  },
};
