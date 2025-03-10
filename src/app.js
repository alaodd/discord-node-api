const tracer = require('dd-trace').init({
  env: 'test',
  service: 'mongo-node-server',
  version: '1.0.0',
  runtimeMetrics: true
})
const express = require("express");
const xss = require("xss-clean");
const app = express();
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");
const routes = require("./routes/v1");
const MongoDB = require("./database/mongodb");
require("dotenv").config();

const { client, v2 } = require("@datadog/datadog-api-client");
const ddConfigOpts = {  authMethods: {
  apiKeyAuth: process.env.API_AUTH_KEY,
  appKeyAuth: process.env.APP_KEY
},}
const configuration = client.createConfiguration(ddConfigOpts);
const apiInstance = new v2.LogsApi(configuration);

const formatDatePST = () => {
  // Get current time in UTC
  const now = new Date();

  // Convert to PST (Pacific Standard Time - UTC-8 or UTC-7 in daylight saving)
  const options = { 
    timeZone: "America/Los_Angeles", 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit", 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit",
    fractionalSecondDigits: 3, // Ensure milliseconds
    hour12: false // Keep in 24-hour format
  };

  // Format the date using Intl.DateTimeFormat
  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(now);

  // Extract formatted parts
  const year = parts.find(p => p.type === "year").value;
  const month = parts.find(p => p.type === "month").value;
  const day = parts.find(p => p.type === "day").value;
  const hour = parts.find(p => p.type === "hour").value;
  const minute = parts.find(p => p.type === "minute").value;
  const second = parts.find(p => p.type === "second").value;
  const millisecond = parts.find(p => p.type === "fractionalSecond")?.value || "000";

  // Construct formatted date string
  return `${year}-${month}-${day}T${hour}:${minute}:${second},${millisecond}`;
};

const params = {
  body: [
    {
      ddsource: "node",
      ddtags: "env:staging,version:5.1",
      hostname: "COMP-KC442X40HD",
      service: "mongo_node_server",
    },
  ],
  contentEncoding: "deflate",
};

const makeALog = () => {
  let date = formatDatePST()
  params.body[0]['message'] = `${date} INFO Testing.. ${Math.floor(Math.random() * 100000000)}`;
  apiInstance
    .submitLog(params)
    .then((data) => {
      console.log("API called successfully. Returned data: " + JSON.stringify(data));
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      // Generate a random delay between 1 and 10 seconds
      const delay = Math.floor(Math.random() * 10 + 1) * 1000;
      console.log(`Waiting for ${delay / 1000} seconds before next API call... ${date}`);
      
      setTimeout(() => {
        makeALog(); // Call the function again after the delay
      }, delay);
    });
};

// Start the recursive function
makeALog();


const mongo = new MongoDB(process.env.MONGO_LOCAL, process.env.MONGO_USERS_DB);
// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// enable cors
app.use(cors());
app.options("*", cors());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

mongo
  .connect()
  .then(() => {
    app.use((req, res, next) => {
      req.mongo = mongo;
      next();
    });

    // v1 api routes
    app.use("/v1", routes);

    app.listen(process.env.LOCAL_PORT, () => {
      console.log(
        `Server is running at http://localhost:${process.env.LOCAL_PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
