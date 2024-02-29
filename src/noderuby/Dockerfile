FROM node:18

WORKDIR /app
COPY routes/ /app/routes/
COPY *.js /app/
COPY *.html /app/
COPY *.json /app/
RUN npm install

EXPOSE 5000
CMD node app.js