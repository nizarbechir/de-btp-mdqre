using {mdq.re.rule as db} from '../db/rule-schema';

service RuleService @(path:'/rules'){
    entity Rules as projection on db.Rules;
    entity Conditions as projection on db.Conditions;
    entity Actions as projection on db.Actions;
    entity Violations as projection on db.Violations;
    
    @readonly
    entity Services as projection on db.Services;
    @readonly
    entity Entities as projection on db.Entities;
    @readonly
    entity Elements as projection on db.Elements;
    @readonly
    entity Attributes as projection on db.Attributes;
    @readonly
    entity Records as projection on db.Records;

    action getViolations(
    ruleID: db.Rules:ID
) returns array of {
    violationID: db.Violations:record;
};
  action getSelects(
    ruleID: db.Rules:ID
) returns array of {
    violationID: db.Violations:record;
};
}