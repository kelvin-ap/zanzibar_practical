require("dotenv").config({ path: "../.env" });
const mqtt = require("mqtt");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");

// InfluxDB Set-up

const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});
const writeApi = influxDB.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET
);

// MQTT options
options = {
  clientId: "mqttjs01",
  username: process.env.MOSQUITTO_USER,
  password: process.env.MOSQUITTO_PASSWD,
  clean: true,
};

const client = mqtt.connect(process.env.MOSQUITTO_URL_WEATHER_STATION, options);

// Connect to MQTT
client.on("connect", function () {
  console.log("connected");
});

client.on("error", function (error) {
  console.log("Can't connect" + error);
});

// Subscribing to the correct toppic
const topic_s = "weatherStation";
client.subscribe(topic_s, { qos: 0 });

// Displaying and processing the message
client.on("message", function (topic, message, packet) {
  console.log("message is " + message);
  console.log("topic is " + topic);
  const payload = JSON.parse(message);
  const point = new Point("weather_station");
  if (payload.hasOwnProperty("temperature_C")) {
    point
      .tag("source", payload.id)
      .floatField("temp", payload.temperature_C)
      .intField("humidity", payload.humidity)
      .floatField("wind_speed", payload.wind_avg_m_s)
      .floatField("wind_gust", payload.wind_max_m_s)
      .intField("wind_direction", payload.wind_dir_deg);
  } else {
    point
      .tag("source", payload.id)
      .floatField("wind_speed", payload.wind_avg_m_s)
      .floatField("wind_gust", payload.wind_max_m_s)
      .intField("wind_direction", payload.wind_dir_deg)
      .floatField("rain", payload.rain_mm);
  }

  writeApi.writePoint(point);
});
