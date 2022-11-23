const fs = require("fs");
let data = require("./history.json");
const resetHistory = async () => {
  // resetting history
  try {
    console.log("\x1b[36m%s\x1b[0m", "Reseting history.json ...");
    data = {
      currentCursor: "earliest",
      nextCursor: "earliest",
      cursorCount: 0,
      fileName: "1-200",
      fileList: ["1-200.json"],
    };
    fs.writeFileSync("./history.json", JSON.stringify(data));
    console.log("\x1b[36m%s\x1b[0m", "Reset complete ...");
  } catch (error) {
    console.log(error);
  }
};

resetHistory();
