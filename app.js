const fs = require("fs");
const Converter = require("simple-json-to-csv");
const moment = require("moment");
const axios = require("axios");
const array = require("./countryCode.js");
require("dotenv").config();

const GetDataList = async (query) => {
  try {
    console.log(query, "query nya");
    // get data from b3
    const url2 = `https://portal.b3networks.com/_o/api/v3/seller/customerSdr/${query.nextCursor}`;
    // get data cdr from b3
    const result = await axios.get(url2, {
      params: {
        secret: query.secret,
        start: query.start,
        end: query.end,
      },
    });

    return result;
  } catch (error) {
    console.log(error);
  }
};

const CountCdrData = async () => {
  // Counting Data from b3
  const { start, end, secret } = process.env;

  let trigger = 1;
  const cc = array.countryCode;
  const startDate = moment(start).format("YYYY-MM-DD");
  const endDate = moment(end).add(-23, "hours").format("YYYY-MM-DD");
  const folderName = `./data/${startDate} to ${endDate}`;
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }

  while (trigger > 0) {
    console.log("\x1b[33m%s\x1b[0m", "Start counting....");

    // get cursor history
    let history = JSON.parse(fs.readFileSync("./history.json"));
    let fileName = history.fileName;
    let cdrData = [];
    let summaryData = [];

    if (history.cursorCount > 0) {
      cdrData = JSON.parse(fs.readFileSync(`${folderName}/${fileName}.json`));
      summaryData = JSON.parse(fs.readFileSync(`${folderName}/Summary.json`));
    }

    const query = {
      nextCursor: history.nextCursor,
      start: start,
      end: end,
      secret: secret,
    };

    // get data from savedFile
    const getCdrData = await GetDataList(query);
    // result cdr data from b3
    let arrayOfData = getCdrData.data;
    let currentCursor = history.currentCursor;
    let nextCursor = history.nextCursor;

    if (currentCursor === "earliest" && nextCursor === "earliest") {
      currentCursor = "initial";
    }

    // jika datanya lebih dari 0
    console.log(
      arrayOfData.data.length > 0 && currentCursor !== nextCursor,
      "WKOKWOKWO"
    );
    console.log(arrayOfData.data.length, "BABABABA");
    if (arrayOfData.data.length > 0 && currentCursor !== nextCursor) {
      console.log(arrayOfData.data.length);

      arrayOfData.data.forEach((element) => {
        let destination = element.destination;
        let orgName = element.orgName;
        let orgUuid = element.orgUuid;
        let senderName = element.senderName;
        let multipart = element.multipart;
        let CountryCode = "";

        // jika destination number memiliki tanda +
        if (destination.indexOf("+") === 0) {
          destination = destination.substring(1);
        }

        // country code filter
        const twoDigitCC = destination.slice(0, 2);
        const threeDigitCC = destination.slice(0, 3);
        const fourDigitCC = destination.slice(0, 4);
        const sixDigitCC = destination.slice(0, 6);

        const twoDigitFilter = cc.filter((a) => a === twoDigitCC);
        const threeDigitFilter = cc.filter((a) => a === threeDigitCC);
        const fourDigitFilter = cc.filter((a) => a === fourDigitCC);
        const sixDigitFilter = cc.filter((a) => a === sixDigitCC);

        if (twoDigitFilter.length === 1) {
          // 2 digit
          CountryCode = twoDigitCC;
        } else if (threeDigitFilter.length === 1) {
          // 3
          CountryCode = threeDigitCC;
        } else if (fourDigitFilter.length === 1) {
          // 4
          CountryCode = fourDigitCC;
        } else if (sixDigitFilter.length === 1) {
          // 6
          CountryCode = sixDigitCC;
        } else {
          // lala
          CountryCode = destination;
        }

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

      const saveCdr = fs.writeFileSync(
        `${folderName}/${fileName}.json`,
        JSON.stringify(cdrData)
      );

      if (history.cursorCount !== 0 && history.cursorCount % 200 === 0) {
        fileName = `${history.cursorCount + 1}-${history.cursorCount + 200}`;
        history.fileList.push(`${fileName}.json`);
        history.fileName = fileName;
        const array = [];
        fs.writeFileSync(
          `${folderName}/${fileName}.json`,
          JSON.stringify(array)
        );
      }
      // update cursor history
      history.cursorCount += 1;
      history.nextCursor = getCdrData.data.nextCursor;
      history.currentCursor = nextCursor;
      fs.writeFileSync("./history.json", JSON.stringify(history));

      console.log("\x1b[32m%s\x1b[0m", "Updating summaries data....");
    } else {
      console.log("\x1b[31m%s\x1b[0m", "All data has been counted..");
      trigger = 0;
      console.log(
        "\x1b[33m%s\x1b[0m",
        'Use "npm run convert" To start converting all json file into csv file....'
      );
    }
  }
};

CountCdrData();
