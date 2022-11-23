const fs = require("fs");
const Converter = require("simple-json-to-csv");
const moment = require("moment");
require("dotenv").config();

const convertToCsv = async (data) => {
  const { start, end } = process.env;
  console.log({ start, end }, "ini dia");

  let history = JSON.parse(fs.readFileSync("./history.json"));
  const startDate = moment(start).format("YYYY-MM-DD");
  const endDate = moment(end).add(-23, "hours").format("YYYY-MM-DD");

  const folderName = `${startDate} to ${endDate}`;

  console.log(folderName, "READY");

  let fileList = history.fileList;

  fileList.forEach(async (fileName) => {
    console.log("\x1b[34m%s\x1b[0m", `Converting ${fileName} ...`);
    const cdr = JSON.parse(fs.readFileSync(`./data/${folderName}/${fileName}`));
    const file = new Converter(cdr);
    await file.convert(`./data/${folderName}/${fileName}.csv`);
    console.log("\x1b[32m%s\x1b[0m", `${fileName} converted successfully ...`);
  });

  return true;
};

convertToCsv();
