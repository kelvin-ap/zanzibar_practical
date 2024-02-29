require("dotenv").config({ path: "../.env" });
const { InfluxDB, Point } = require("@influxdata/influxdb-client");
const express = require("express");
const bodyParser = require("body-parser");
const weatherstationRouter = require("./routes/weatherstation");
const sensorRouter = require("./routes/sensor");
const app = express();

const PORT = 5000; // Set the port here
const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});

app.use(express.static("public"));

const writeApi = influxDB.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET
);
const writeApiSis = influxDB.getWriteApi(process.env.INFLUXDB_ORG, "sis");

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
app.use("/api/weatherstation", weatherstationRouter);
app.use("/api/sensor", sensorRouter);
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/script.js", function (req, res) {
  res.setHeader("Content-Type", "text/javascript");
  res.sendFile(__dirname + "/script.js");
});

app.get("/node_modules/bulma/css/bulma.min.css", (req, res) => {
  res.type("text/css");
  res.sendFile(__dirname + "/node_modules/bulma/css/bulma.min.css");
});

app.post("/submit-form", function (req, res) {
  //console.log(req.body.securityKey);
  //if (req.body.securityKey != process.env.DEVICE_SECURITY_KEY) {
  //  res.status(401).send("Invalid security key");
  //} else {
  const data = req.body;
  console.log(data);
  const payload = req.body;

  const point = new Point("device_registration");
  if (payload.hasOwnProperty("sensorId")) {
    point
      .tag("sensorId", payload.sensorId)
      .stringField("boardId", payload.boardId)
      .stringField("SensorName", payload.sensorName);
  } else if (payload.hasOwnProperty("boardName")) {
    point
      .tag("boardId", payload.boardId)
      .stringField("boardName", payload.boardName)
      .floatField("latitude", payload.boardLat)
      .floatField("longitude", payload.boardLong);
  } else if (payload.hasOwnProperty("stationId")) {
    point
      .tag("stationId", payload.stationId)
      .stringField("stationName", payload.stationName)
      .floatField("latitude", payload.stationLat)
      .floatField("longitude", payload.stationLong);
  }
  writeApiSis.writePoint(point);

  writeApiSis.flush().then(() => {
    console.log("Data has been written to InfluxDB");
    res.send("Form submitted successfully");
  });
});

app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});
