const express = require('express');
const router = express.Router();
const accountRoutes = require('./account.route');

const defaultRoutes = [  {
    path: '/account',
    route: accountRoutes,
  },];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });

module.exports = router;
