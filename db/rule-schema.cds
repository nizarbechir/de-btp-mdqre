namespace mdqre.rule;

using { cuid, managed } from '@sap/cds/common';

// the initail schema
/*
entity Rule : cuid, managed {
    name        : String(100);
    description : String(255);
    targetEntity: String(100);       // e.g. "A_BusinessPartner"
    fieldName   : String(100);       // e.g. "BusinessPartnerFullName"
    operator    : String(20);        // e.g. "=", ">", "<", "contains"
    value       : String(255);
    results     : LargeString;
}
*/


// version 2
entity Rule : cuid, managed {
    name        : String(100);
    description : String(255);
    targetEntity: String(100);           // e.g. "A_BusinessPartner"
    conditions  : Composition of many Condition on conditions.rule = $self;
    results     : LargeString;
}

entity Condition : cuid {
    rule        : Association to Rule;
    fieldName   : String(100);           // e.g. "BusinessPartnerFullName"
    operator    : Operator;              // e.g. "=", ">", "<", "contains"
    value       : String(255);
    binaryAnd   : Boolean default true;  // true=AND, false=OR
}

// everytime you modify this change the buildCondition in rule-service.js
type Operator: String(20) enum {
    EQ        = '=';
    GT        = '>';
    LT        = '<';
    CONTAINS  = 'contains';
    STARTS    = 'startswith';
};



