import { boolean } from "joi";
import { Between, ILike, IsNull } from "typeorm";

export const queryFormart = (query, dateColumn: string = "createdAt") => {
  const take = query?.limit;
  const skip = query?.limit * (query?.page - 1);
  let where: any = [];
  try {
    if (query.filter) {
      where = (query.filter && JSON.parse(query.filter))?.map((e) => {
        let x = {};
        if (!e || !Object.keys(e).length) return x;
        Object.keys(e).map((key) => {
          x[key] =
            e[key] === null
              ? IsNull()
              : typeof e[key] === "boolean"
              ? e[key]
              : ILike(`%${e[key]}%`);
        });
        return x;
      });
    }
    if (query.dateFilter) {
      const date = JSON.parse(query.dateFilter);
      if (where.length) {
        where = where.map((item) => {
          return {
            ...item,
            [dateColumn]: Between(
              new Date(date.startingDate).toISOString(),
              new Date(date.endingDate).toISOString()
            ),
          };
        });
      } else {
        where = [
          {
            [dateColumn]: Between(
              new Date(date.startingDate).toISOString(),
              new Date(date.endingDate).toISOString()
            ),
          },
        ];
      }
    }
    if (query.closing) {
      if (where.length) {
        where = where.map((item) => {
          return {
            ...item,
            closing: {
              id: query.closing === "null" ? IsNull() : query.closing,
            },
          };
        });
      } else {
        where = [
          {
            closing: {
              id: query.closing === "null" ? IsNull() : query.closing,
            },
          },
        ];
      }
    }
  } catch (e) {
    where = [];
  }

  return { where, take, skip: skip || 0 };
};
