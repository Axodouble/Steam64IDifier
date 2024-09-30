FROM oven/bun:alpine

COPY . .
RUN bun install

CMD ["bun","./index.js"]