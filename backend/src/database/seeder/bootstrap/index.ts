import { NestFactory } from "@nestjs/core";
import { SeederModule } from "../seeder.module";
import { ISeeder } from "../interface";
import ArgNameAndSeederMapper from "../mapper/index";
import { getKeyValueFromArg } from "../helper/get-key-value-from-arg";
import { lowerCase, trim } from "src/shared/helpers/string";

async function bootstrap() {
  console.log("Seeding started!");

  // get key from args
  const { value } = getKeyValueFromArg(process.argv[2]);

  // trim value and convert to lower case
  const argName = lowerCase(trim(value));

  NestFactory.createApplicationContext(SeederModule)
    .then((appContext) => {
      if (!(argName in ArgNameAndSeederMapper))
        throw new Error("Invalid name provided.");

      let seeder: ISeeder = appContext.get(ArgNameAndSeederMapper[argName]);
      seeder
        .seed()
        .then(() => {
          console.log("Seeding completed!");
        })
        .catch((error) => {
          console.log("Seeding failed!");
          throw error;
        })
        .finally(() => appContext.close());
    })
    .catch((error) => {
      throw error;
    });
}

bootstrap();
