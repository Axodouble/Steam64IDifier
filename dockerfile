FROM node:22-alpine

COPY . .
RUN npm i --omit=dev --no-package-lock
USER node

CMD ["node","./index.js"]