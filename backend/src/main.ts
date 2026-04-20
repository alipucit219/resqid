import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common"; // import built-in ValidationPipe
import { ConfigService } from "./config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DeploymentEnvironmentTypes } from "./shared/enums/deployment-environment-types.enum";
import { urlencoded, json } from "express";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  app.set("trust proxy");

  // Global prefix for API versioning
  app.setGlobalPrefix(configService.getGlobalAPIPrefix());

  // Configuration for the size of the payload coming from FE
  app.use(json({ limit: "100mb" }));
  app.use(urlencoded({ extended: true, limit: "100mb" }));

  // Enable cors
  app.enableCors();

  // Apply global pipe for incoming data validation
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages:
        configService.getEnvironment() ===
        DeploymentEnvironmentTypes.Production,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set the assets directory
  app.useStaticAssets(join(__dirname, "..", "public"));

  // Template Engine Configuration
  app.setBaseViewsDir(join(__dirname, "..", "public", "views"));
  app.setViewEngine("ejs");

  // Swagger configuration for API documentation
  const options = new DocumentBuilder()
    .setTitle("RESQID")
    .setBasePath("api")
    .setDescription("Official documentation for RESQID API")
    .setVersion("2.0.0")
    .addBearerAuth({ type: "http", bearerFormat: "JWT", scheme: "bearer" })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("docs", app, document);

  // Listen on all interfaces so LAN devices (Expo Go on phone) can reach backend.
  await app.listen(configService.getPort(), "0.0.0.0");

}

bootstrap();
