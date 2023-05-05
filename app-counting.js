const fs = require("fs");
const Converter = require("simple-json-to-csv");
const moment = require("moment");
require("dotenv").config();

const countingSms = () => {
  // Counting Data from b3
  const { start, end, secret } = process.env;
  const startDate = moment(start).format("YYYY-MM-DD");
  const endDate = moment(end).add(-23, "hours").format("YYYY-MM-DD");
  const folderName = `./data/${startDate} to ${endDate}`;

  // get cursor history
  let history = JSON.parse(fs.readFileSync("./history.json"));
  let fileName = history.fileName;

  let cdrData;
  let array;
  if (history.countHistory !== "") {
    array = JSON.parse(
      fs.readFileSync(`./${folderName}/${history.countHistory}`)
    );
  } else {
    array = JSON.parse(fs.readFileSync(`./${folderName}/1-200.json`));
  }

  console.log(cdrData, "DATANYA_");
  let summaryData = [];

  array.forEach((element) => {
    let destination = element.destination;
    let orgName = element.orgName;
    let orgUuid = element.orgUuid;
    let senderName = element.senderName;
    let multipart = element.multipart;
    let CountryCode = "";

    cdrData.push({
      orgName: orgName,
      orgUuid: orgUuid,
      orgTags: JSON.stringify(element.orgTags),
      txnUuid: element.txnUuid,
      cursor: currentCursor,
      countryCode: CountryCode,
      time: element.time,
      type: element.type,
      senderName: senderName,
      destination: element.destination,
      multipart: element.multipart,
      status: element.status,
      costCurrency: element.costCurrency,
      cost: element.cost,
      priceCurrency: element.priceCurrency,
      price: element.price,
      vendor: element.vendor,
    });

    // write summary
    const found = summaryData.find((element, i) => {
      if (element.orgUuid === orgUuid) {
        if (
          element.senderId === senderName &&
          element.countryCode === CountryCode
        ) {
          // data yang sudah ada ditambah dengan jumlah multipart
          summaryData[i].smsCount += multipart;

          return true;
        }
      }
    });

    if (found === undefined) {
      // jika data tidak ada di dalam database maka masukan data baru
      summaryData.push({
        orgName: orgName,
        orgUuid: orgUuid,
        senderId: senderName,
        countryCode: CountryCode,
        smsCount: multipart,
        period: startDate, // tanggal data mulai diambil
      });
    }
  });

  const saveSummary = fs.writeFileSync(
    `${folderName}/Summary.json`,
    JSON.stringify(summaryData)
  );
};

countingSms();
