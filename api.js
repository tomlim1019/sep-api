const express = require('express');
const api = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
const axios = require('axios');
const { parse, stringify, toJSON, fromJSON } = require('flatted');
const taiwanData = require("./taiwan/data");
const { off } = require('process');

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

api.get('/malaysia/table', async (req, res, next) => {
  var results = [], first = true, test = 0;
  const fileList = ['2011', '2012', '2013', '2014', '2015', '2016', '2017']
  try {
    for (var year of fileList) {
      var tempResult = [], counter = 0;
      tempResult = await readCSV("./malaysia/" + year + ".csv");
      if (first)
        results.push({ "2011 - 2017": tempResult })
      else {
        for (var content of tempResult) {
          if (results[0]["2011 - 2017"][counter]["﻿KUMPULAN UMUR"] === content["﻿KUMPULAN UMUR"]) {
            for (var key of Object.keys(content)) {
              if (key !== "﻿KUMPULAN UMUR") {
                results[0]["2011 - 2017"][counter][key] = +results[0]["2011 - 2017"][counter][key] + +content[key]
              }
            }
          }
          counter++;
        }
      }
      first = false;
    }
    res.status(200).json({ results });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

api.get('/malaysia/table/:year', async (req, res, next) => {
  var results = [];
  const year = req.params.year;
  try {
    var tempResult = []
    tempResult = await readCSV("./malaysia/" + year + ".csv");
    results.push({ [year]: tempResult });
    res.status(200).json({ results });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

api.get('/malaysia/line/:year', async (req, res, next) => {
  const year = req.params.year;
  try {
    var tempResult = []
    tempResult = await readCSV("./malaysia/" + year + ".csv");
    var results = [];
    for (var key of Object.keys(tempResult[tempResult.length - 1])) {
      if (tempResult[tempResult.length - 1][key] !== "Grand Total" && key !== "MALAYSIA")
        results.push(tempResult[tempResult.length - 1][key])
    }
    res.status(200).json({ results });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

api.get('/malaysia/line', async (req, res, next) => {
  const fileList = ['2011', '2012', '2013', '2014', '2015', '2016', '2017']
  var results = [];
  var first = true;
  try {
    for (var year of fileList) {
      var tempResult = [], counter = 0;
      tempResult = await readCSV("./malaysia/" + year + ".csv");
      for (var key of Object.keys(tempResult[tempResult.length - 1])) {
        if (tempResult[tempResult.length - 1][key] !== "Grand Total" && key !== "MALAYSIA") {
          if (first)
            results.push(tempResult[tempResult.length - 1][key])
          else if (counter <= 14) {
            results[counter] = +results[counter] + +tempResult[tempResult.length - 1][key]
          }
          counter++;
        }
      }
      first = false;
    }
    res.status(200).json({ results });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

api.get('/malaysia/age', async (req, res, next) => {
  const fileList = ['2011', '2012', '2013', '2014', '2015', '2016', '2017']
  var results = [];
  var first = true;
  try {
    for (var year of fileList) {
      var tempResult = [], counter = 0;
      tempResult = await readCSV("./malaysia/" + year + ".csv");
      for (var data of tempResult) {
        if (data["﻿KUMPULAN UMUR"] !== "Grand Total") {
          if (first)
            results.push(data["MALAYSIA"])
          else if (counter <= 16) {
            results[counter] = +results[counter] + +data["MALAYSIA"];
          }
          counter++;
        }
      }
      first = false;
    }
    res.status(200).json({ results });
  } catch (e) {
    console.log(e);
    res.sendStatus(200).json({ results });
  }
});


api.get('/malaysia/age/:year', async (req, res, next) => {
  const year = req.params.year;
  try {
    var tempResult = []
    tempResult = await readCSV("./malaysia/" + year + ".csv");
    var results = [];
    for (var data of tempResult) {
      if (data["﻿KUMPULAN UMUR"] !== "Grand Total")
        results.push(data["MALAYSIA"]);
    }

    res.status(200).json({ results });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});


api.get('/taiwan/table/:year', async (req, res) => {
  var object = taiwanData.object;
  var translation = taiwanData.translation;
  var data, results = [];
  const year = req.params.year;
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var age of taiwanData.age) {
    results.push({ ...object, "Age": age })
  }

  for (var tempData of data) {
    if (tempData["發病年份"] === year) {
      for (var tempResult of results) {
        if (tempData["年齡層"] === tempResult["Age"]) {
          tempResult[translation[tempData["縣市"]]]++;
          tempResult["Taiwan"]++;
        }
        else if (tempResult["Age"] === "Grand Total") {
          tempResult[translation[tempData["縣市"]]]++;
          tempResult["Taiwan"]++;
        }
      }
    }
  }

  res.status(200).send({ results: [{ [year]: results }] });
})

api.get('/taiwan/table', async (req, res) => {
  var object = taiwanData.object;
  var translation = taiwanData.translation;
  var data, results = [];
  var year = new Date().getFullYear()
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var age of taiwanData.age) {
    results.push({ ...object, "Age": age })
  }

  for (var tempData of data) {
    for (var tempResult of results) {
      if (tempData["年齡層"] === tempResult["Age"]) {
        tempResult[translation[tempData["縣市"]]]++;
        tempResult["Taiwan"]++;
      }
      else if (tempResult["Age"] === "Grand Total") {
        tempResult[translation[tempData["縣市"]]]++;
        tempResult["Taiwan"]++;
      }
    }
  }

  res.status(200).send({ results: [{ [`2003 - ${year}`]: results }] });
})

api.get('/taiwan/line/:year', async (req, res) => {
  var object = taiwanData.object;
  var translation = taiwanData.translation;
  var data, results = [];
  const year = req.params.year;
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var age of taiwanData.age) {
    results.push({ ...object, "Age": age })
  }

  for (var tempData of data) {
    if (tempData["發病年份"] === year) {
      for (var tempResult of results) {
        if (tempData["年齡層"] === tempResult["Age"]) {
          tempResult[translation[tempData["縣市"]]]++;
          tempResult["Taiwan"]++;
        }
        else if (tempResult["Age"] === "Grand Total") {
          tempResult[translation[tempData["縣市"]]]++;
          tempResult["Taiwan"]++;
        }
      }
    }
  }

  var finalResults = [];

  for (var tempResult of results) {
    if (tempResult["Age"] === "Grand Total") {
      for (var key of Object.keys(tempResult)) {
        if (key !== "Age" && key !== "Taiwan") {
          finalResults.push(tempResult[key])
        }
      }
    }
  }

  res.status(200).send({ results: finalResults });
})

api.get('/taiwan/line', async (req, res) => {
  var object = taiwanData.object;
  var translation = taiwanData.translation;
  var data, results = [];
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var age of taiwanData.age) {
    results.push({ ...object, "Age": age })
  }

  for (var tempData of data) {
    for (var tempResult of results) {
      if (tempData["年齡層"] === tempResult["Age"]) {
        tempResult[translation[tempData["縣市"]]]++;
        tempResult["Taiwan"]++;
      }
      else if (tempResult["Age"] === "Grand Total") {
        tempResult[translation[tempData["縣市"]]]++;
        tempResult["Taiwan"]++;
      }
    }
  }

  var finalResults = [];

  for (var tempResult of results) {
    if (tempResult["Age"] === "Grand Total") {
      for (var key of Object.keys(tempResult)) {
        if (key !== "Age" && key !== "Taiwan") {
          finalResults.push(tempResult[key])
        }
      }
    }
  }

  res.status(200).send({ results: finalResults });
});

api.get('/taiwan/age/:year', async (req, res) => {
  var object = taiwanData.object;
  var translation = taiwanData.translation;
  var data, results = [];
  const year = req.params.year;
  try {
    await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
      response => {
        data = response.data;
      }
    )

    for (var age of taiwanData.age) {
      results.push({ ...object, "Age": age })
    }

    for (var tempData of data) {
      if (tempData["發病年份"] === year) {
        for (var tempResult of results) {
          if (tempData["年齡層"] === tempResult["Age"]) {
            tempResult[translation[tempData["縣市"]]]++;
            tempResult["Taiwan"]++;
          }
          else if (tempResult["Age"] === "Grand Total") {
            tempResult[translation[tempData["縣市"]]]++;
            tempResult["Taiwan"]++;
          }
        }
      }
    }

    var finalResults = [];

    for (var tempResult of results) {
      if (tempResult["Age"] !== "Grand Total") {
        finalResults.push(tempResult["Taiwan"])
      }
    }
  }
  catch (e) {
    console.log(e)
    var finalResults = "Error";
  }

  res.status(200).send({ results: finalResults });
});

api.get('/taiwan/age', async (req, res) => {
  var object = taiwanData.object;
  var translation = taiwanData.translation;
  var data, results = [];
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var age of taiwanData.age) {
    results.push({ ...object, "Age": age })
  }

  for (var tempData of data) {
    for (var tempResult of results) {
      if (tempData["年齡層"] === tempResult["Age"]) {
        tempResult[translation[tempData["縣市"]]]++;
        tempResult["Taiwan"]++;
      }
      else if (tempResult["Age"] === "Grand Total") {
        tempResult[translation[tempData["縣市"]]]++;
        tempResult["Taiwan"]++;
      }
    }
  }

  var finalResults = [];

  for (var tempResult of results) {
    if (tempResult["Age"] !== "Grand Total") {
      finalResults.push(tempResult["Taiwan"])
    }
  }

  res.status(200).send({ results: finalResults });
});

api.get('/taiwan/gender/:year', async (req, res) => {
  var data, results = [0, 0];
  const year = req.params.year;
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var tempData of data) {
    if (tempData["發病年份"] === year) {
      if (tempData["性別"] === "M") {
        results[0]++;
      }
      else if (tempData["性別"] === "F") {
        results[1]++;
      }
    }
  }

  res.status(200).send({ results });
});

api.get('/taiwan/gender', async (req, res) => {
  var data, results = [0, 0];
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var tempData of data) {
    if (tempData["性別"] === "M") {
      results[0]++;
    }
    else if (tempData["性別"] === "F") {
      results[1]++;
    }
  }

  res.status(200).send({ results });
});

api.get('/taiwan/import/:year', async (req, res) => {
  var data, results = [0, 0];
  const year = req.params.year;
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var tempData of data) {
    if (tempData["發病年份"] === year) {
      if (tempData["是否為境外移入"] === "否") {
        results[0]++;
      }
      else if (tempData["是否為境外移入"] === "是") {
        results[1]++;
      }
    }
  }

  res.status(200).send({ results });
});

api.get('/taiwan/import', async (req, res) => {
  var data, results = [0, 0];
  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var tempData of data) {
    if (tempData["是否為境外移入"] === "否") {
      results[0]++;
    }
    else if (tempData["是否為境外移入"] === "是") {
      results[1]++;
    }
  }

  res.status(200).send({ results });
});

api.get('/total', async (req, res) => {
  var data, results = [0, [0, 0], [0, 0]];
  const fileList = ['2011', '2012', '2013', '2014', '2015', '2016', '2017']

  for (var year of fileList) {
    var tempResult = []
    tempResult = await readCSV("./malaysia/" + year + ".csv");
    for (var data of tempResult) {
      if (data["﻿KUMPULAN UMUR"] === "Grand Total") {
        results[0] += +data["MALAYSIA"];
        results[1][0] += +data["MALAYSIA"];
      }
      if (data["﻿KUMPULAN UMUR"] === "Grand Total" && year === "2017") {
        results[2][0] += +data["MALAYSIA"];
      }
    }
  }

  await axios.get('https://od.cdc.gov.tw/eic/Weekly_Age_County_Gender_100.json').then(
    response => {
      data = response.data;
    }
  )

  for (var tempData of data) {
    results[0]++;
    results[1][1]++;

    if (tempData["發病年份"] === "2021") {
      results[2][1]++
    }
  }

  res.status(200).send({ results });
});

module.exports = api;