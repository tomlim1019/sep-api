const express = require('express');
const api = express.Router();
const csv = require('csv-parser');
const fs = require('fs');

async function readCSV(fileName) {
  return new Promise(function (resolve, reject) {
    var results = [];
    fs.createReadStream(fileName)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', reject);
  })
}

api.get('/malaysia', async (req, res, next) => {
  var results = [];
  const fileList = ['2011', '2012', '2013', '2014', '2015', '2016', '2017']
  try {
    for (var year = 2011; year < 2011 + fileList.length; year++) {
      var tempResult = []
      tempResult = await readCSV("./malaysia/" + year + ".csv");
      results.push({ [year]: tempResult });
    }
    res.status(200).json({ results });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = api;