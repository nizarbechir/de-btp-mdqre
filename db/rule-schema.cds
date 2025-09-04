namespace mdqre.rule;

using {
    cuid,
    managed,
    sap.common.CodeList
} from '@sap/cds/common';

entity Rule : cuid, managed {
    name         : String(100) @mandatory;
    description  : String(255);
    targetEntity : String(100); // e.g. "A_BusinessPartner"
    priority     : Association to Priority default 'M';
    conditions   : Composition of many Condition
                       on conditions.rule = $self;
    results      : LargeString;
}

entity Condition : cuid {
    rule      : Association to Rule;
    fieldName : String(100) @mandatory; // e.g. "BusinessPartnerFullName"
    operator  : Operator    @mandatory; // e.g. "=", ">", "<", "contains"
    value     : String(255) @mandatory;
    binaryAnd : Boolean default true; // true=AND, false=OR
}

// everytime you modify this change the buildCondition in rule-service.js
type Operator : String(20) enum {
    EQ = '=';
    GT = '>';
    LT = '<';
    CONTAINS = 'contains';
    STARTS = 'startswith';
};

entity Priority : CodeList {
    key code : String enum {
            high = 'H';
            medium = 'M';
            low = 'L';
        };
}
