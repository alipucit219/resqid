MODULE_NAME=$1

if [ -z  "$MODULE_NAME" ]; then
  echo "Specify module name"
  exit -1
fi

MODULE_PATH=$(sed --expression 's/\([A-Z]\)/-\L\1/g' --expression 's/^-//' <<< $MODULE_NAME)

echo "Generating module $MODULE_NAME"
npx nest g module $MODULE_NAME "app" --no-spec

echo "Generating controller"
npx nest g controller $MODULE_NAME "app" --no-spec

echo "Generating service"
npx nest g service $MODULE_NAME "app" --no-spec

echo "Generating DTO"
npx nest g class "${MODULE_NAME}DTO" "app/${MODULE_PATH}" --no-spec
# rename foo-bar-dto.ts to foo-bar.dto.ts
mv ./src/app/${MODULE_PATH}/${MODULE_PATH}-dto.ts ./src/app/${MODULE_PATH}/${MODULE_PATH}.dto.ts

echo "Generating entity"
npm run typeorm -- entity:create -n $MODULE_NAME -d "src/app/${MODULE_PATH}"
# rename FooBar.ts to foo-bar/foo-bar.entity.ts
mv ./src/app/${MODULE_PATH}/$MODULE_NAME.ts ./src/app/${MODULE_PATH}/${MODULE_PATH}.entity.ts