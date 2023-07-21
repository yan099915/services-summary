const fs = require("fs");
const Converter = require("simple-json-to-csv");
const moment = require("moment");
const converter = require("json-2-csv");
require("dotenv").config();

const convertToCsv = async (data) => {
  try {
    const { start, end } = process.env;
    console.log({ start, end }, "ini dia");

    let history = JSON.parse(fs.readFileSync("./history.json"));
    const startDate = moment(start).format("YYYY-MM-DD");
    const endDate = moment(end).add(-23, "hours").format("YYYY-MM-DD");

    const folderName = `${startDate} to ${endDate}`;
    console.log(folderName, "READY");

    const summaryData = JSON.parse(
      fs.readFileSync(`./data/${folderName}/Summary.json`)
    );
    const convertSummary = await converting(summaryData);

    if (convertSummary) {
      fs.writeFileSync(`./data/${folderName}/Summary.csv`, convertSummary);
    } else {
      console.log("ERROR CONVERT SUMMARY");
    }

    let fileList = history.fileList;

    for await (let i of fileList) {
      console.log("\x1b[34m%s\x1b[0m", `Converting ${i} ...`);
      const cdr = JSON.parse(fs.readFileSync(`./data/${folderName}/${i}`));
      const convert = await converting(cdr);
      if (convert) {
        fs.writeFileSync(
          `./data/${folderName}/${i.replace(".json", ".csv")}`,
          convert
        );
        console.log("file saved !");
      } else {
        console.log("ERROR CONVERTING");
      }
    }

    return true;
  } catch (error) {
    console.log(error, "ERROR ");
  }
};

const converting = async (cdr) => {
  return await converter.json2csv(cdr);
};

// const converter = (fileName, folderName) => {
//   console.log("\x1b[34m%s\x1b[0m", `Converting ${fileName} ...`);
//   const cdr = JSON.parse(fs.readFileSync(`./data/${folderName}/${fileName}`));
//   const file = new Converter(cdr);
//   file.convert(`./data/${folderName}/${fileName.replace(".json", "")}.csv`);
//   // save last index of converted json'
//   // history.history = fileName;
//   const saveCdr = fs.writeFileSync(`./history.json`, JSON.stringify(history));
//   console.log("\x1b[32m%s\x1b[0m", `${fileName} converted successfully ...`);
// };

convertToCsv();
