import express from 'express';
import {
  addQLDActsLinks,
  scrapeActiveActs,
} from '../services-by-states/qld/add-acts-links.js';

const router = express.Router();

// router.get('/add-qld-links', await addQLDActsLinks());
// router.get('/scrape-qld-active-acts', await scrapeActiveActs());

export { router };
