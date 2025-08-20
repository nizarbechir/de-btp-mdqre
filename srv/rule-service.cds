using { mdqre.rule as audit } from '../db/rule-schema';

service RuleService @(path: '/rule') {
    entity Rules as projection on audit.Rule; 
}
annotate RuleService.Rules with @odata.draft.enabled;