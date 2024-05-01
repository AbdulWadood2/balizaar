const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const http = require("http"); // Import http module

// And also Let’s check if the development direction we are thinking of matches.

// 1. Anyone in Bali can use the app
// 2. Products are displayed differently depending on the region (list products within 10km based on region)
// 3. However, user can search for products in other regions.

// ex) When user first turn on the app in area A,
//  the products user see are products within 10km of area A.If user
//  search for tennis racket in the product name, products are displayed
//  from a close distance(in this case, the product is displayed even if the distance is far).

// swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swaggerConfig.js");
const { SwaggerTheme } = require("swagger-themes");
const theme = new SwaggerTheme();
const options = {
  explorer: true,
  customCss: theme.getBuffer("dark"),
};
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
/* routes */
const adminRouter = require("./Route/admin_routes");
const userRouter = require("./Route/user_routes.js");
const awsRouter = require("./Route/aws_routes.js");
const productRouter = require("./Route/product_routes.js");
const categoryRouter = require("./Route/category_routes.js");
const chatRouter = require("./Route/chat_routes.js");
const contactUsRouter = require("./Route/contactUs_routes.js");
const questionareRouter = require("./Route/questionare_routes.js");
const advertisementRouter = require("./Route/advertisement_routes.js");

const app = express();
const { initializeSocket } = require("./utils/webSocket.js");
const server = http.createServer(app); // Create HTTP server
// Socket.IO connections
initializeSocket(server);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, options));
app.enable("trust proxy");
app.use(
  cors({
    origin: true, // Allow access from any origin
    credentials: true,
  })
);
app.options("*", cors());

app.use(
  express.json({
    limit: "10kb",
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/* routes */
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/aws", awsRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/category", categoryRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/contact", contactUsRouter);
app.use("/api/v1/questionare", questionareRouter);
app.use("/api/v1/advertisement", advertisementRouter);

const AppError = require("./utils/appError");
const globalErrorHandler = require("./Controller/error_controller");
app.all("*", (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

app.use((err, req, res, next) => {
  return next(new AppError(err, 404));
});

const DB = process.env.mongo_uri;
const port = 28000;

const connectDB = async () => {
  try {
    console.log("DB Connecting ...");
    const response = await mongoose.connect(DB);
    if (response) {
      console.log("MongoDB connect successfully");
      server.listen(port, () => {
        // Start the server using server.listen
        console.log(`App run with url: http://localhost:${port}`);
      });
    }
  } catch (error) {
    console.log("error white connect to DB ==>  ", error);
  }
};
connectDB();
