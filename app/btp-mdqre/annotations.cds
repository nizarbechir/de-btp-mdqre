using RuleService as service from '../../srv/rule-service';
using from '../../db/rule-schema';

annotate service.Rules with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Name}',
                Value : name,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Description}',
                Value : description,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>TargetEntity}',
                Value : targetEntity,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Priority}',
                Value : priority_code,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : '{i18n>General}',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.CollectionFacet',
            Label : 'Conditions',
            ID : 'Conditions',
            Facets : [
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : '{i18n>Conditon}',
                    ID : 'i18nConditon',
                    Target : '@UI.FieldGroup#i18nConditon',
                },
            ],
        },
        {
            $Type : 'UI.CollectionFacet',
            Label : '{i18n>Violations}',
            ID : 'i18nViolations',
            Facets : [
                {
                    $Type : 'UI.ReferenceFacet',
                    Label : '{i18n>Objects}',
                    ID : 'i18nObjects',
                    Target : '@UI.FieldGroup#i18nObjects',
                },
            ],
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : '{i18n>Name}',
            Value : name,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>Description}',
            Value : description,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>TargetEntity}',
            Value : targetEntity,
        },
        {
            $Type : 'UI.DataField',
            Value : priority.descr,
            Label : '{i18n>Priority}',
        },
    ],
    UI.SelectionFields : [
        priority_code,
    ],
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : name,
        },
        TypeName : '',
        TypeNamePlural : '',
        Description : {
            $Type : 'UI.DataField',
            Value : description,
        },
        TypeImageUrl : 'sap-icon://crm-service-manager',
    },
    
    
    UI.FieldGroup #i18nCondition : {
        $Type : 'UI.FieldGroupType',
        Data : [
        ],
    },
    UI.FieldGroup #i18nCondition1 : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : conditions.fieldName,
                Label : 'fieldName',
            },
            {
                $Type : 'UI.DataField',
                Value : conditions.operator,
                Label : 'operator',
            },
            {
                $Type : 'UI.DataField',
                Value : conditions.value,
                Label : 'value',
            },
            {
                $Type : 'UI.DataField',
                Value : conditions.binaryAnd,
                Label : 'binaryAnd',
            },
        ],
    },
    UI.FieldGroup #i18nObjects : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : results,
                Label : 'results',
            },
        ],
    },
    UI.FieldGroup #i18nConditon : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : conditions.fieldName,
                Label : '{i18n>Field}',
            },
            {
                $Type : 'UI.DataField',
                Value : conditions.operator,
                Label : '{i18n>Operator}',
            },
            {
                $Type : 'UI.DataField',
                Value : conditions.value,
                Label : '{i18n>Value}',
            },
            {
                $Type : 'UI.DataField',
                Value : conditions.binaryAnd,
                Label : '{i18n>BinaryAnd}',
            },
        ],
    },
);

annotate service.Rules with {
    priority @(
        Common.Label : '{i18n>Priority}',
        Common.ValueListWithFixedValues : true,
        Common.Text : priority.descr,
        Common.Text.@UI.TextArrangement : #TextOnly,
    )
};

annotate service.Priority with {
    code @Common.Text : descr
};

annotate service.Condition with @(
    UI.LineItem #i18nCondition : [
    ]
);

