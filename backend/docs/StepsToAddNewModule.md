# Steps To Add New Module

## Task

You need to create a new module `DeveloperFooBar`:

- Has a single model `DeveloperFooBar` to be stored in the database
- Implements basic CRUD functionality for the model exposing `/developer-foo-bars` collection

## Possible Solution

1. You need to create `src/app/developer-foo-bars` folder to contain the code
2. Create `DeveloperFooBar` entity

- Create `developer-foo-bar.entity.ts` file
- Declare `DeveloperFooBar` entity

```typescript
import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("developer_foo_bar") // NB! Notice snake case
export class DeveloperFooBar {
  // NB! Notice named export
  @PrimaryGeneratedColumn()
  id: number;

  /* other columns and relations */
}
```

3. Create `DeveloperFooBarDTO`

- Create `developer-foo-bar.dto.ts` file
- Declare `DeveloperFooBarDTO` class

```typescript
import { IsNotEmpty, IsNumber } from "class-validator";

export class DeveloperFooBarDTO {
  @IsNotEmpty({
    message: "Prop1 is required",
  })
  @IsNumber()
  prop1: number;

  /* rest properties validation */
}
```

4. Create `DeveloperFooBarService`

- Create `developer-foo-bar.service.ts` file
- Implement `DeveloperFooBarService` class

```typescript
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";
import { DeveloperFooBar } from "./developer-foo-bar.entity";

@Injectable() // the service will be injected to our controller
export class DeveloperFooBarService {
  constructor(
    @InjectRepository(DeveloperFooBar)
    private readonly developerFooBarRepository: Repository<DeveloperFooBar>
  ) {}

  /* At least 4 methods implementing CRUD logic*/
  async list() {
    return this.developerFooBarRepository.find();
  }
}
```

5. Create `DeveloperFooBarController`

- Create `developer-foo-bar.controller.ts` file
- Implement `DeveloperFooBarController` class

```typescript
import { Controller, Get } from "@nestjs/common";
import { DeveloperFooBarService } from "./developer-foo-bar.service";

@Controller("developer-foo-bars")
export class DeveloperFooBarController {
  constructor(
    private readonly developerFooBarService: DeveloperFooBarService
  ) {}

  /* At least 4 methods implementing CRUD logic*/
  @Get()
  async list() {
    // NB! Though most controllers currently use try-catch for service calls omit it
    const results = await this.developerFooBarService.list();

    return { results };
  }
}
```

6. Create `DeveloperFooBarModule`

- Create `developer-foo-bar.module.ts` file
- Implement `DeveloperFooBarModule` class

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DeveloperFooBar } from "./developer-foo-bar.entity";
import { DeveloperFooBarService } from "./developer-foo-bar.service";
import { DeveloperFooBarController } from "./developer-foo-bar.controller";

@Module({
  providers: [DeveloperFooBarService],
  controllers: [DeveloperFooBarController],
})
export class DeveloperFooBarModule {}
```

7. Import `DeveloperFooBarModule` in `src/app.module.ts`. Add it to `[imports]` section of the module definition.
