using { mdqre.rule as audit } from '../db/rule-schema';

service RuleService @(path: '/rule') {
    entity Rules as projection on audit.Rule;
    entity Conditions as projection on audit.Condition;
}

annotate RuleService.Rules with {
    results @readonly;
};