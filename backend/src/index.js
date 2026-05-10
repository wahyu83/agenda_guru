require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const guruRoutes = require('./routes/guru');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guru', guruRoutes);

app.get('/', (req, res) => {
  res.send('Agenda guru SMKN 1 Arahan API is running');

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
