const express = require('express');
const cors = require('cors');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const draftRoutes = require('./modules/drafts/draft.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'API is running.' });
});

app.use('/api/v1/drafts', draftRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;