const cds = require("@sap/cds");
module.exports = cds.service.impl(async function () {
  const bp = await cds.connect.to("API_BUSINESS_PARTNER");
  this.on("*", "*", async (req) => {
    return bp.run(req.query);
  });
});
