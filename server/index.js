const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

<<<<<<< HEAD
const PORT = process.env.PORT ;
=======
const PORT = process.env.PORT || 5001;
>>>>>>> f340c55 (Improvised the dashboards)

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
