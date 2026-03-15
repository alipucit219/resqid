import { Injectable } from "@nestjs/common";

@Injectable()
export class DatabaseService {
  async runWithTransaction<T>(callback: () => Promise<T> | T): Promise<T> {
    return await callback();
  }
}

