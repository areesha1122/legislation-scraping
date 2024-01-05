import express from 'express';
import chalk from 'chalk';
import cors from 'cors';
import * as routes from './routes/index.js';
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb', extended: true }));
app.use(
  express.urlencoded({ limit: '50mb', parameterLimit: 1000000, extended: true })
);
app.use(express.static('../uploads/media'));
app.use('/', routes.router);

app.get('/', (req, res) => {
  console.log('Lahebo legislations server is Up!');
  res.send('Lahebo legislations server is Up!');
});

app.listen(process.env.PORT || 5008, () => {
  console.log(
    chalk.blue(
      ` 🚀 Lahebo legislations server listening on port: ${process.env.PORT}!`
    )
  );
});

export default app;
