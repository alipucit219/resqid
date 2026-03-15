FROM node:16-alpine as builder
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn --network-timeout 100000
COPY . .
RUN yarn run build

FROM node:16-alpine
WORKDIR /frontend
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD [ "yarn", "start" ]
