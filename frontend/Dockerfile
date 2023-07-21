FROM node:13.12.0-alpine
WORKDIR /app/frontend

ENV PATH /app/frontend/node_modules/.bin:$PATH
COPY . .

CMD ["npm", "start"]

EXPOSE 3000
