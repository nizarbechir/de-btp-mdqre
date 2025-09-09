using { mdq.re.rule as audit } from '../db/rule-schema';

service RuleService @(path: '/rule') {
    entity Rules as projection on audit.Rules;
    entity Conditions as projection on audit.Conditions;
    entity Actions as projection on audit.Actions;
    entity Services as projection on audit.Services;
    entity Entities as projection on audit.Entities;
}

annotate RuleService.Rules with {
    results @readonly;
};