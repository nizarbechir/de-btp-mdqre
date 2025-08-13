namespace mdqre.rule;

using { cuid, managed } from '@sap/cds/common';


entity Rule : cuid, managed {
    name        : String(100);
    description : String(255);
    targetEntity: String(100);       // e.g. "A_BusinessPartner"
    fieldName   : String(100);       // e.g. "BusinessPartnerFullName"
    operator    : String(20);        // e.g. "=", ">", "<", "contains"
    value       : String(255);
    results     : LargeString;
}