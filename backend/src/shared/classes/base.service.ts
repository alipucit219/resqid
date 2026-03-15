import { NotFoundException, BadRequestException } from "@nestjs/common";
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  UpdateResult,
} from "typeorm";
import { PaginationDto } from "../DTOs";
import { CommonApiResponse } from "../types";
import { BaseEntity } from "./base.entity";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from "src/constants";
import { UserWithoutPassword } from "src/app/user/user.types";

type EntityWhereType<T extends BaseEntity> =
  | FindOptionsWhere<T>
  | FindOptionsWhere<T>[];

export abstract class BaseService<Entity extends BaseEntity> {
  private readonly entityName;

  constructor(private readonly repository: Repository<Entity>) {
    this.entityName = this.repository.metadata.name;
  }

  async create(
    body: DeepPartial<Entity>,
    user: UserWithoutPassword = null,
  ): Promise<Entity> {
    try {
      return await this.repository.save({
        ...body,
      });
    } catch (exception) {
      const detail = exception.detail;
      if (typeof detail === "string" && detail.includes("already exists")) {
        throw new BadRequestException(
          exception.detail.replace("Key", "Record with"),
        );
      } else {
        throw exception;
      }
    }
  }

  prepareFinalWhere(
    callback: () => EntityWhereType<Entity>,
    additionalWhere: FindOptionsWhere<Entity>,
  ): EntityWhereType<Entity> {
    let finalWhere = callback();
    if (finalWhere === undefined) return additionalWhere;

    if (Array.isArray(finalWhere)) {
      if (finalWhere.length === 0) return additionalWhere;

      return finalWhere.map((_) => {
        return {
          ..._,
          ...additionalWhere,
        };
      });
    }

    return { ...finalWhere, ...additionalWhere };
  }

  async findOne(
    findOneOptions: FindOneOptions<Entity>,
  ): Promise<Entity | null> {
    return await this.repository.findOne(findOneOptions);
  }

  async findOneOrThrowException(
    findOneOptions: FindOneOptions<Entity>,
    exceptionMessage: string = `${this.entityName} not found`,
  ) {
    const entityInstance = await this.repository.findOne(findOneOptions);
    if (entityInstance === null) {
      throw new NotFoundException(exceptionMessage);
    }
    return entityInstance;
  }

  async findMany(options: FindManyOptions<Entity>) {
    return await this.repository.find(options);
  }

  async findByIdOrThrowException(
    id: number,
    message = `${this.entityName} not found`,
  ): Promise<Entity> {
    const eitherEntityOrNull = await this.find({ id });
    if (!eitherEntityOrNull) throw new NotFoundException(message);
    return eitherEntityOrNull;
  }

  async find(where) {
    return await this.repository.findOne({ where });
  }

  async delete(
    id: number,
    notFoundMessage = `${this.entityName} not found`,
    deleteMessage = `${this.entityName} deleted successfully`,
  ): Promise<CommonApiResponse> {
    await this.findByIdOrThrowException(id, notFoundMessage);
    await this.repository.softDelete(id);
    return {
      message: deleteMessage,
    };
  }

  async update(
    id: number,
    payload: QueryDeepPartialEntity<Entity>,
    userUpdatingRecord: UserWithoutPassword = null,
  ): Promise<UpdateResult> {
    try {
      return await this.repository.update(id, {
        ...payload,
        updatedAt: new Date(),
        ...(userUpdatingRecord != null && {
          updatedBy: userUpdatingRecord.email,
        }),
      });
    } catch (exception) {
      const detail = exception.detail;
      if (typeof detail === "string" && detail.includes("already exists")) {
        throw new BadRequestException(
          exception.detail.replace("Key", "Record with"),
        );
      } else {
        throw exception;
      }
    }
  }

  async save(
    entityInstance: Entity,
    userUpdatingRecord: UserWithoutPassword = null,
  ): Promise<Entity> {
    try {
      return await this.repository.save({
        ...entityInstance,
        ...(userUpdatingRecord !== null && {
          updatedBy: userUpdatingRecord.email,
        }),
      });
    } catch (exception) {
      const detail = exception.detail;
      if (typeof detail === "string" && detail.includes("already exists")) {
        throw new BadRequestException(
          exception.detail.replace("Key", "Record with"),
        );
      } else {
        throw exception;
      }
    }
  }

  async getRowsCountByCriteria(
    options: FindManyOptions<Entity>,
    withDeleted = false,
  ): Promise<number> {
    return await this.repository.count({ ...options, withDeleted });
  }

  getSkipAndTake(query: PaginationDto) {
    const page = query.page || PAGINATION_DEFAULT_PAGE;
    const take = query.limit || PAGINATION_DEFAULT_LIMIT;
    const skip = page * take;

    return {
      skip,
      take,
    };
  }

  async softDeleteById(
    id: number,
    userDeletingRecord: UserWithoutPassword,
    notFoundMessage = `${this.entityName} not found`,
    message = `${this.entityName} deleted successfully`,
  ) {
    const recordToDeleteTemporarily = await this.findByIdOrThrowException(
      id,
      notFoundMessage,
    );
    return await this.softDelete(
      recordToDeleteTemporarily,
      userDeletingRecord,
      message,
    );
  }

  async softDelete(
    recordToDeleteTemporarily: Entity,
    userDeletingRecord: UserWithoutPassword,
    message = `${this.entityName} deleted successfully`,
  ) {
    recordToDeleteTemporarily.deletedAt = new Date();
    recordToDeleteTemporarily.deletedBy = userDeletingRecord?.email || null;
    await this.repository.save(recordToDeleteTemporarily);

    return {
      message,
    };
  }

  async softDeleteByCriteria(
    criteria: FindOneOptions<Entity>,
    userDeletingRecord: UserWithoutPassword,
    notFoundMessage = `${this.entityName} not found`,
    message = `${this.entityName} deleted successfully`,
  ) {
    const recordToDeleteTemporarily = await this.findOneOrThrowException(
      criteria,
      notFoundMessage,
    );

    return await this.softDelete(
      recordToDeleteTemporarily,
      userDeletingRecord,
      message,
    );
  }

  async deleteManyByCriteria(
    options: FindManyOptions<Entity>,
  ): Promise<number> {
    let deletedRecordsCount = 0;
    const records = await this.findMany(options);

    if (records.length > 0) {
      const { affected } = await this.repository.delete(
        records.map((record) => record.id),
      );
      deletedRecordsCount = affected;
    }

    return deletedRecordsCount;
  }
}
