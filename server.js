const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const corsMiddleware = require('./middleware/corsMiddleware');

const adminRoutes = require('./routes/authRoutes'); // was admin.js, now merged
const authUserRoute = require('./routes/authRoutes'); // if still required
const amenitiesRoute = require('./routes/amenitiesRoutes');
const bookingsRoute = require('./routes/bookingRoutes');
const listingRoutes = require('./routes/listingRoutes');
const path = require('path');
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api', authUserRoute);
app.use('/api/amenities', amenitiesRoute);
app.use('/api/bookings', bookingsRoute);
app.use('/api/listings', listingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
