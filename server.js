
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const moment = require("moment");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = express();


// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGODB; ; // Replace with your connection string
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Mongoose Schema and Model
// const activitySchema = new mongoose.Schema({
//   date: { type: String, required: true, unique: true },
//   activities: { type: Object, required: true },
// });
// Updated Schema
const activitySchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true }, // New time field
  activities: { type: Object, required: true },
});

const Activity = mongoose.model("Activity", activitySchema);

// Route to Add or Update Activities
app.put("/api/activities", async (req, res) => {
  const { date, time, activities } = req.body;

  try {
    // Format the date to match the database format
    const formattedDate = moment(date, "DD-MM-YYYY").format("DD-MM-YYYY");

    // Find the record by date
    let record = await Activity.findOne({ date: formattedDate });

    if (record) {
      console.log("Existing record found:", record);

      // Merge the existing activities with the new ones
      for (const [activity, timeSpent] of Object.entries(activities)) {
        record.activities[activity] =
          (record.activities[activity] || 0) + timeSpent;
      }

      console.log("Updated activities:", record.activities);

      // Update the record with new activities and time
      const result = await Activity.updateOne(
        { date: formattedDate },
        { $set: { activities: record.activities, time: time } }
      );

      // Log the result of the update
      if (result.modifiedCount > 0) {
        console.log("Activities updated successfully");
      } else {
        console.log("No changes were made");
      }
    } else {
      console.log("No existing record, creating a new one for date:", date);

      // Create a new record if none exists for the date
      record = new Activity({ date: formattedDate, time, activities });
      await record.save();
      console.log("Saved new record:", record);
    }

    res.status(200).json(record);
  } catch (error) {
    console.error("Error updating activities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to get all activities (optional, for fetching)
app.get("/api/activities", async (req, res) => {
  try {
    const activities = await Activity.find();
    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
