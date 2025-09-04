const cds = require('@sap/cds');

module.exports = async (srv) => 
{        
    // Using CDS API      
    const BusinessPartnerA2X = await cds.connect.to("API_BUSINESS_PARTNER"); 
      srv.on('READ', 'A_BusinessPartner', req => BusinessPartnerA2X.run(req.query)); 
      srv.on('READ', 'A_AddressEmailAddress', req => BusinessPartnerA2X.run(req.query)); 
      srv.on('READ', 'A_AddressFaxNumber', req => BusinessPartnerA2X.run(req.query));
      srv.on('READ', 'A_AddressHomePageURL', req => BusinessPartnerA2X.run(req.query)); 
}