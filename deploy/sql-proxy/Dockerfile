FROM node:22-alpine
WORKDIR /app
RUN npm init -y && npm install express pg
COPY index.js .
EXPOSE 3080
CMD ["node", "index.js"]
