#!/usr/bin/env node
'use strict';
const express = require('express');
const app = express();

app.use(express.static(__dirname + '/../frontend'));

app.listen(3000, () => console.log('Frontend app listening on port 3000!\nhttp://localhost:3000/'));

module.exports = app;
