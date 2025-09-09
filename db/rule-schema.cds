namespace mdq.re.rule;

using {
    cuid,
    managed,
    sap.common.CodeList
} from '@sap/cds/common';


entity Rules : cuid, managed {
    name                       : String(255);
    description                : String(255);
    entity                     : Association to Entities;
    andBinaryOperator : Boolean default true;
    priority                   : Priorities              @assert.range: true;
    Conditions                 : Composition of many Conditions
                                     on Conditions.rule = $self;
    Actions                    : Composition of many Actions
                                     on Actions.rule = $self;
    violation                  : Association to many Violations
                                     on violation.rule = $self
}

entity Conditions : cuid, managed {
    operator  : Operators                 @assert.range: true;
    value     : String(255);
    rule      : Association to Rules;
    attribute : Association to Attributes;
}

entity Actions : cuid, managed {
    operator  : Operators                 @assert.range: true;
    value     : String(255);
    rule      : Association to Rules;
    attribute : Association to Attributes;
}

entity Services {
    key name     : String(255) @mandatory;
        entities : Composition of many Entities
                       on entities.service = $self;
}

entity Violations {
    key rule   : Association to Rules   @assert.target;
    key record : Association to Records @assert.target;
}

entity Entities {
    key name       : String(255)             @mandatory;
    key service    : Association to Services @assert.target;
        rules      : Association to many Rules
                         on rules.entity = $self;
        attributes : Association to many Attributes
                         on attributes.entity = $self;
        records    : Association to many Records
                         on records.entity = $self
}

entity Attributes {
    key name       : String(255)             @mandatory;
    key entity     : Association to Entities @assert.target;
        type       : data_types              @assert.range: true;
        elements   : Composition of many Elements
                         on elements.attribute = $self;
        actions    : Association to many Actions
                         on actions.attribute = $self;
        conditions : Association to many Conditions
                         on conditions.attribute = $self;
}

entity Elements {
        value     : String;
    key attribute : Association to Attributes @assert.target;
    key record    : Association to Records    @assert.target;
}

entity Records : cuid {
    elements  : Composition of many Elements
                    on elements.record = $self;
    entity    : Association to Entities @assert.target;
    violation : Association to many Violations
                    on violation.record = $self;
}

type Operators  : String(20) enum {
    EQ = '=';
    GT = '>';
    LT = '<';
    GE = '>=';
    LE = '<=';
    NE = '!=';
    CONTAINS = 'CONTAINS';
    STARTS = 'STARTS WITH';
    ENDS = 'ENDS WITH';
}

type Priorities : String(20) enum {
    High;
    Medium;
    Low;
}

type data_types : String(20) enum {
    String = 'String';
    Integer = 'Integer';
    Decimal = 'Decimal';
    Boolean = 'Boolean';
    UUID = 'UUID';
    Date = 'Date';
    Time = 'Time';
    DateTime = 'DateTime';
    Timestamp = 'Timestamp';
    Binary = 'Binary';
    LargeString = 'LargeString';
    Association = 'Association';
    Composition = 'Composition';
    Enumeration = 'Enumeration';
    Localized = 'Localized';
}
