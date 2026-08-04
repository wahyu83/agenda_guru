require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const guruRoutes = require('./routes/guru');
const piketRoutes = require('./routes/piket');
const izinRoutes = require('./routes/izin');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guru', guruRoutes);
app.use('/api/piket', piketRoutes);
app.use('/api/izin', izinRoutes);

app.get('/', (req, res) => {
  res.send('Agenda guru SMKN 1 Arahan API is running');

});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
