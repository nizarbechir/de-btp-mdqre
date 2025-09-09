


using {mdq.re.rule as db} from '../db/rule-schema';
service PreprocessingService @(path:'/preproc'){
    entity Services as projection on db.Services;
    entity Entities as projection on db.Entities;
    entity Elements as projection on db.Elements;
    entity Attributes as projection on db.Attributes;
    entity Records as projection on db.Records;

}