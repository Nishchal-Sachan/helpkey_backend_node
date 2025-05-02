const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const corsMiddleware = require('./middleware/corsMiddleware');

const adminRoutes = require('./routes/adminRoutes'); // Routes for admin authentication and related tasks
const clientRoutes = require('./routes/clientRoutes'); // Routes for client authentication and related tasks
const amenitiesRoute = require('./routes/amenitiesRoutes');
const bookingsRoute = require('./routes/bookingRoutes');
const listingRoutes = require('./routes/listingRoutes');
const path = require('path');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(corsMiddleware);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Routes
app.use('/api/admin', adminRoutes); // Admin authentication and other admin-related routes
app.use('/api/client', clientRoutes); // Client authentication and other client-related routes
app.use('/api/amenities', amenitiesRoute); // Amenities related routes
app.use('/api/bookings', bookingsRoute); // Booking related routes
app.use('/api/listings', listingRoutes); // Listing related routes

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ success: false, error: 'Route not found' });
// });



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
