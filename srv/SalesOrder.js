const cds = require("@sap/cds");
module.exports = cds.service.impl(async function () {
  const db = await cds.connect.to("API_SALES_ORDER_SRV");
  this.on("*", "*", async (req) => {
    return db.run(req.query);
  });
});
