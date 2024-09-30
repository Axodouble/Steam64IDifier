FROM oven/bun:alpine

COPY . .
RUN bun install
RUN bun install -g git

CMD ["bun","./index.js"]