FROM oven/bun:alpine

COPY . .
RUN bun install

CMD ["node","./index.js"]