// TODO EDIT UPDATE TAG

require("dotenv").config({ path: "../.env" });
const mqtt = require("mqtt");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const influxDB = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});
const writeApi = influxDB.getWriteApi(
  process.env.INFLUXDB_ORG,
  process.env.INFLUXDB_BUCKET
);

// Connect to MQTT broker
const client = mqtt.connect(`mqtt://${process.env.TTN_HOST}`, {
  username: process.env.TTN_USERNAME,
  password: process.env.TTN_API_TOKEN,
});

// Connect to MQTT
client.on("connect", function () {
  console.log("connected");
});

// Subscribe to a topic
const topic = process.env.TTN_MQTT_TOPIC;
client.subscribe(topic, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log(`Subscribed to topic: ${topic}`);
  }
});

// Handle incoming messages
client.on("message", function (topic, message) {
  console.log("message is " + message);
  console.log("topic is " + topic);
  const payloadmsg = JSON.parse(message);
  if (topic.slice(-2) == "up") {
    //payload.hasOwnProperty("uplink_message.decoded_payload")) {
    let executed = false;
    let point = new Point("sensor_data").tag(
      "id",
      payloadmsg.end_device_ids.device_id
    );
    const payload = payloadmsg.uplink_message.decoded_payload;
    const errorbyte = payloadmsg.uplink_message.decoded_payload.errorbyte;
    if (errorbyte.toString(2).slice(-1) != "1") {
      if (payload.humidity_BME <= 100 && payload.humidity_BME >= 0) {
        point.floatField("humidity_BME", payload.humidity_BME);
      }
      if (payload.pressure_BME <= 1100 && payload.pressure_BME >= 300) {
        point.floatField("pressure_BME", payload.pressure_BME);
      }
      if (payload.temp_BME <= 85 && payload.temp_BME >= -40) {
        point.floatField("temp_BME", payload.temp_BME);
      }
      executed = true;
    }
    if (errorbyte.toString(2).slice(-2, -1) != "1") {
      if (payload.CO2_SCD <= 5000 && payload.CO2_SCD >= 400) {
        point.intField("CO2_SCD", payload.CO2_SCD);
      }
      if (payload.humidity_SCD <= 95 && payload.humidity_SCD >= 0) {
        point.floatField("humidity_SCD", payload.humidity_SCD);
      }
      if (payload.temp_SCD <= 60 && payload.temp_SCD >= -10)
        point.floatField("temp_SCD", payload.temp_SCD);
      executed = true;
    }
    if (errorbyte.toString(2).slice(-3, -2) != "1") {
      if (payload.PM10 <= 999 && payload.PM10 >= 0) {
        point.floatField("PM10", payload.PM10);
      }
      if (payload.PM2_5 <= 999 && payload.PM2_5 >= 0) {
        point.floatField("PM2_5", payload.PM2_5);
      }
      executed = true;
    }
    if (errorbyte.toString(2).slice(-4, -3) != "1") {
      point.booleanField("battery_low", false);
      executed = true;
    } else {
      point.booleanField("battery_low", true);
      executed = true;
    }
    /*if (errorbyte.toString(2).slice(-5, -4) != "1") {
      if (
        payload.uplink_message.decoded_payload.lat <= 90 &&
        payload.uplink_message.decoded_payload.lat >= -90
      ) {
        point.floatField(
          "latitude",
          payload.uplink_message.decoded_payload.lat
        );
      }
      if (
        (payload.uplink_message.decoded_payload.lon <= 180 &&
        payload.uplink_message.decoded_payload.lon >= -180) && (payload.uplink_message.decoded_payload.lon.isNan())
      ) {
        point.floatField(
          "longitude",
          payload.uplink_message.decoded_payload.lon
        );
      }
      executed = t rue;
    }*/
    if (executed) {
      writeApi.writePoint(point);
    }
  }
});

// Handle errors
client.on("error", function (err) {
  console.log(`MQTT error: ${err}`);
});
