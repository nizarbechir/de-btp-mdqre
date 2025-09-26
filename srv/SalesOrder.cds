using {API_SALES_ORDER_SRV as s4} from './external/API_SALES_ORDER_SRV';

service SalesOrderService {
    @readonly
    entity A_SalesOrder as projection on s4.A_SalesOrder
    {        key SalesOrder, SalesOrderType, SalesOrderTypeInternalCode, SalesOrganization, DistributionChannel, OrganizationDivision, SalesGroup, SalesOffice, SalesDistrict, SoldToParty, CreationDate, CreatedByUser, LastChangeDate, SenderBusinessSystemName, ExternalDocumentID, LastChangeDateTime, ExternalDocLastChangeDateTime, PurchaseOrderByCustomer, PurchaseOrderByShipToParty, CustomerPurchaseOrderType, CustomerPurchaseOrderDate, SalesOrderDate, TotalNetAmount, OverallDeliveryStatus, TotalBlockStatus, OverallOrdReltdBillgStatus, OverallSDDocReferenceStatus, TransactionCurrency, SDDocumentReason, PricingDate, PriceDetnExchangeRate, BillingPlan, RequestedDeliveryDate, ShippingCondition, CompleteDeliveryIsDefined, ShippingType, HeaderBillingBlockReason, DeliveryBlockReason, DeliveryDateTypeRule, IncotermsClassification, IncotermsTransferLocation, IncotermsLocation1, IncotermsLocation2, IncotermsVersion, CustomerPriceGroup, PriceListType, CustomerPaymentTerms, PaymentMethod, FixedValueDate, AssignmentReference, ReferenceSDDocument, ReferenceSDDocumentCategory, AccountingDocExternalReference, CustomerAccountAssignmentGroup, AccountingExchangeRate, CustomerGroup, AdditionalCustomerGroup1, AdditionalCustomerGroup2, AdditionalCustomerGroup3, AdditionalCustomerGroup4, AdditionalCustomerGroup5, SlsDocIsRlvtForProofOfDeliv, CustomerTaxClassification1, CustomerTaxClassification2, CustomerTaxClassification3, CustomerTaxClassification4, CustomerTaxClassification5, CustomerTaxClassification6, CustomerTaxClassification7, CustomerTaxClassification8, CustomerTaxClassification9, TaxDepartureCountry, VATRegistrationCountry, SalesOrderApprovalReason, SalesDocApprovalStatus, OverallSDProcessStatus, TotalCreditCheckStatus, OverallTotalDeliveryStatus, OverallSDDocumentRejectionSts, BillingDocumentDate, ContractAccount, AdditionalValueDays, CustomerPurchaseOrderSuplmnt, ServicesRenderedDate     }    
;
    @readonly
    entity A_SalesOrderBillingPlan as projection on s4.A_SalesOrderBillingPlan
    {        key SalesOrder, key BillingPlan, BillingPlanStartDate, BillingPlanStartDateRule, ReferenceBillingPlan, BillingPlanCategory, BillingPlanType, BillingPlanEndDate, BillingPlanEndDateRule, BillingPlanSearchTerm     }    
;
    @readonly
    entity A_SalesOrderBillingPlanItem as projection on s4.A_SalesOrderBillingPlanItem
    {        key SalesOrder, key BillingPlan, key BillingPlanItem, BillingPlanDateCategory, BillingPlanBillingDate, BillingPlanAmount, TransactionCurrency, BillingPlanAmountPercent, CustomerPaymentTerms, ProposedBillingDocumentType, BillingPlanDateDescriptionCode, BillingBlockReason, BillingPlanServiceStartDate, BillingPlanServiceEndDate, BillingPlanRelatedBillgStatus, BillingPlanType, AdoptingBillingDateID, BillingPlanBillingRule, BillingPlanMilestoneUsage, BillgPlnDteCorrectionRfndType, AccountingExchangeRate, PostponementReason     }    
;
    @readonly
    entity A_SalesOrderHeaderPartner as projection on s4.A_SalesOrderHeaderPartner
    {        key SalesOrder, key PartnerFunction, PartnerFunctionInternalCode, Customer, Supplier, Personnel, ContactPerson, WorkAssignmentExternalID, ReferenceBusinessPartner, AddressID, VATRegistration     }    
;
    @readonly
    entity A_SalesOrderHeaderPrElement as projection on s4.A_SalesOrderHeaderPrElement
    {        key SalesOrder, key PricingProcedureStep, key PricingProcedureCounter, ConditionType, PricingDateTime, PriceConditionDeterminationDte, ConditionCalculationType, ConditionBaseValue, ConditionRateValue, ConditionCurrency, ConditionQuantity, ConditionQuantityUnit, ConditionQuantitySAPUnit, ConditionQuantityISOUnit, ConditionCategory, ConditionIsForStatistics, PricingScaleType, ConditionOrigin, IsGroupCondition, ConditionRecord, ConditionSequentialNumber, TaxCode, WithholdingTaxCode, CndnRoundingOffDiffAmount, ConditionAmount, TransactionCurrency, ConditionControl, ConditionInactiveReason, ConditionClass, PrcgProcedureCounterForHeader, FactorForConditionBasisValue, StructureCondition, PeriodFactorForCndnBasisValue, PricingScaleBasis, ConditionScaleBasisValue, ConditionScaleBasisUnit, ConditionScaleBasisCurrency, CndnIsRelevantForIntcoBilling, ConditionIsManuallyChanged, ConditionIsForConfiguration, VariantCondition     }    
;
    @readonly
    entity A_SalesOrderItem as projection on s4.A_SalesOrderItem
    {        key SalesOrder, key SalesOrderItem, HigherLevelItem, HigherLevelItemUsage, SalesOrderItemCategory, SalesOrderItemText, PurchaseOrderByCustomer, PurchaseOrderByShipToParty, UnderlyingPurchaseOrderItem, ExternalItemID, Material, MaterialByCustomer, PricingDate, PricingReferenceMaterial, BillingPlan, RequestedQuantity, RequestedQuantityUnit, RequestedQuantitySAPUnit, RequestedQuantityISOUnit, OrderQuantityUnit, OrderQuantitySAPUnit, OrderQuantityISOUnit, ConfdDelivQtyInOrderQtyUnit, ItemGrossWeight, ItemNetWeight, ItemWeightUnit, ItemWeightSAPUnit, ItemWeightISOUnit, ItemVolume, ItemVolumeUnit, ItemVolumeSAPUnit, ItemVolumeISOUnit, OriginallyRequestedMaterial, TransactionCurrency, NetAmount, TotalSDDocReferenceStatus, SDDocReferenceStatus, MaterialSubstitutionReason, MaterialGroup, MaterialPricingGroup, AdditionalMaterialGroup1, AdditionalMaterialGroup2, AdditionalMaterialGroup3, AdditionalMaterialGroup4, AdditionalMaterialGroup5, BillingDocumentDate, ContractAccount, AdditionalValueDays, ServicesRenderedDate, Batch, ProductionPlant, OriginalPlant, AltvBsdConfSubstitutionStatus, StorageLocation, DeliveryGroup, ShippingPoint, ShippingType, DeliveryPriority, DeliveryDateQuantityIsFixed, DeliveryDateTypeRule, IncotermsClassification, IncotermsTransferLocation, IncotermsLocation1, IncotermsLocation2, TaxAmount, ProductTaxClassification1, ProductTaxClassification2, ProductTaxClassification3, ProductTaxClassification4, ProductTaxClassification5, ProductTaxClassification6, ProductTaxClassification7, ProductTaxClassification8, ProductTaxClassification9, MatlAccountAssignmentGroup, CostAmount, CustomerPaymentTerms, FixedValueDate, CustomerGroup, SalesDocumentRjcnReason, ItemBillingBlockReason, SlsDocIsRlvtForProofOfDeliv, WBSElement, ProfitCenter, AccountingExchangeRate, ReferenceSDDocument, ReferenceSDDocumentItem, SDProcessStatus, DeliveryStatus, OrderRelatedBillingStatus, Subtotal1Amount, Subtotal2Amount, Subtotal3Amount, Subtotal4Amount, Subtotal5Amount, Subtotal6Amount     }    
;
    @readonly
    entity A_SalesOrderItemBillingPlan as projection on s4.A_SalesOrderItemBillingPlan
    {        key SalesOrder, key SalesOrderItem, key BillingPlan, BillingPlanIsInHeader, BillingPlanStartDate, BillingPlanStartDateRule, ReferenceBillingPlan, BillingPlanCategory, BillingPlanType, BillingPlanEndDate, BillingPlanEndDateRule, BillingPlanSearchTerm     }    
;
    @readonly
    entity A_SalesOrderItemPartner as projection on s4.A_SalesOrderItemPartner
    {        key SalesOrder, key SalesOrderItem, key PartnerFunction, PartnerFunctionInternalCode, Customer, Supplier, Personnel, ContactPerson, WorkAssignmentExternalID, ReferenceBusinessPartner, AddressID, VATRegistration     }    
;
    @readonly
    entity A_SalesOrderItemPartnerAddress as projection on s4.A_SalesOrderItemPartnerAddress
    {        key SalesOrder, key SalesOrderItem, key PartnerFunction, key AddressRepresentationCode, CorrespondenceLanguage, AddresseeFullName, OrganizationName1, OrganizationName2, OrganizationName3, OrganizationName4, CityName, DistrictName, PostalCode, StreetName, StreetPrefixName1, StreetPrefixName2, StreetSuffixName1, StreetSuffixName2, HouseNumber, Country, Region, FormOfAddress, TaxJurisdiction, TransportZone, POBox, POBoxPostalCode, EmailAddress, MobilePhoneCountry, MobileNumber, PhoneNumberCountry, PhoneNumber, PhoneExtensionNumber, FaxNumberCountry, FaxAreaCodeSubscriberNumber, FaxExtensionNumber     }    
;
    @readonly
    entity A_SalesOrderItemPrElement as projection on s4.A_SalesOrderItemPrElement
    {        key SalesOrder, key SalesOrderItem, key PricingProcedureStep, key PricingProcedureCounter, ConditionType, PricingDateTime, PriceConditionDeterminationDte, ConditionCalculationType, ConditionBaseValue, ConditionRateValue, ConditionCurrency, ConditionQuantity, ConditionQuantityUnit, ConditionQuantitySAPUnit, ConditionQuantityISOUnit, ConditionCategory, ConditionIsForStatistics, PricingScaleType, IsRelevantForAccrual, CndnIsRelevantForInvoiceList, ConditionOrigin, IsGroupCondition, ConditionRecord, ConditionSequentialNumber, TaxCode, WithholdingTaxCode, CndnRoundingOffDiffAmount, ConditionAmount, TransactionCurrency, ConditionControl, ConditionInactiveReason, ConditionClass, PrcgProcedureCounterForHeader, FactorForConditionBasisValue, StructureCondition, PeriodFactorForCndnBasisValue, PricingScaleBasis, ConditionScaleBasisValue, ConditionScaleBasisUnit, ConditionScaleBasisCurrency, CndnIsRelevantForIntcoBilling, ConditionIsManuallyChanged, ConditionIsForConfiguration, VariantCondition     }    
;
    @readonly
    entity A_SalesOrderItemRelatedObject as projection on s4.A_SalesOrderItemRelatedObject
    {        key SalesOrder, key SalesOrderItem, key SDDocRelatedObjectSequenceNmbr, SDDocumentRelatedObjectType, SDDocRelatedObjectSystem, SDDocRelatedObjectReference1, SDDocRelatedObjectReference2     }    
;
    @readonly
    entity A_SalesOrderItemText as projection on s4.A_SalesOrderItemText
    {        key SalesOrder, key SalesOrderItem, key Language, key LongTextID, LongText     }    
;
    @readonly
    entity A_SalesOrderItmPrecdgProcFlow as projection on s4.A_SalesOrderItmPrecdgProcFlow
    {        key SalesOrder, key SalesOrderItem, key DocRelationshipUUID, PrecedingDocument, PrecedingDocumentItem, PrecedingDocumentCategory, ProcessFlowLevel, RelatedProcFlowDocStsFieldName, SDProcessStatus, AccountingTransferStatus, PrelimBillingDocumentStatus, CreationDate, CreationTime, LastChangeDate     }    
;
    @readonly
    entity A_SalesOrderItmSubsqntProcFlow as projection on s4.A_SalesOrderItmSubsqntProcFlow
    {        key SalesOrder, key SalesOrderItem, key DocRelationshipUUID, SubsequentDocument, SubsequentDocumentItem, SubsequentDocumentCategory, ProcessFlowLevel, RelatedProcFlowDocStsFieldName, SDProcessStatus, AccountingTransferStatus, PrelimBillingDocumentStatus, SubsqntDocItmPrecdgDocument, SubsqntDocItmPrecdgDocItem, SubsqntDocItmPrecdgDocCategory, CreationDate, CreationTime, LastChangeDate     }    
;
    @readonly
    entity A_SalesOrderPartnerAddress as projection on s4.A_SalesOrderPartnerAddress
    {        key SalesOrder, key PartnerFunction, key AddressRepresentationCode, CorrespondenceLanguage, AddresseeFullName, OrganizationName1, OrganizationName2, OrganizationName3, OrganizationName4, CityName, DistrictName, PostalCode, StreetPrefixName1, StreetPrefixName2, StreetName, StreetSuffixName1, StreetSuffixName2, HouseNumber, Country, Region, FormOfAddress, TaxJurisdiction, TransportZone, POBox, POBoxPostalCode, EmailAddress, MobilePhoneCountry, MobileNumber, PhoneNumberCountry, PhoneNumber, PhoneExtensionNumber, FaxNumberCountry, FaxAreaCodeSubscriberNumber, FaxExtensionNumber     }    
;
    @readonly
    entity A_SalesOrderPrecdgProcFlow as projection on s4.A_SalesOrderPrecdgProcFlow
    {        key SalesOrder, key DocRelationshipUUID, PrecedingDocument, PrecedingDocumentCategory, ProcessFlowLevel, OverallSDProcessStatus, CreationDate, CreationTime, LastChangeDate     }    
;
    @readonly
    entity A_SalesOrderRelatedObject as projection on s4.A_SalesOrderRelatedObject
    {        key SalesOrder, key SDDocRelatedObjectSequenceNmbr, SDDocumentRelatedObjectType, SDDocRelatedObjectSystem, SDDocRelatedObjectReference1, SDDocRelatedObjectReference2     }    
;
    @readonly
    entity A_SalesOrderScheduleLine as projection on s4.A_SalesOrderScheduleLine
    {        key SalesOrder, key SalesOrderItem, key ScheduleLine, RequestedDeliveryDate, ConfirmedDeliveryDate, OrderQuantityUnit, OrderQuantitySAPUnit, OrderQuantityISOUnit, ScheduleLineOrderQuantity, ConfdOrderQtyByMatlAvailCheck, DeliveredQtyInOrderQtyUnit, OpenConfdDelivQtyInOrdQtyUnit, CorrectedQtyInOrderQtyUnit, DelivBlockReasonForSchedLine     }    
;
    @readonly
    entity A_SalesOrderSubsqntProcFlow as projection on s4.A_SalesOrderSubsqntProcFlow
    {        key SalesOrder, key DocRelationshipUUID, SubsequentDocument, SubsequentDocumentCategory, ProcessFlowLevel, OverallSDProcessStatus, CreationDate, CreationTime, LastChangeDate     }    
;
    @readonly
    entity A_SalesOrderText as projection on s4.A_SalesOrderText
    {        key SalesOrder, key Language, key LongTextID, LongText     }    
;
    @readonly
    entity A_SlsOrdPaymentPlanItemDetails as projection on s4.A_SlsOrdPaymentPlanItemDetails
    {        key SalesOrder, key PaymentPlanItem, PaymentPlan, ElectronicPaymentType, ElectronicPayment, EPaytValidityStartDate, EPaytValidityEndDate, ElectronicPaymentHolderName, AuthorizedAmountInAuthznCrcy, AuthorizationCurrency, AuthorizationByDigitalPaytSrvc, AuthorizationByAcquirer, AuthorizationDate, AuthorizationTime, AuthorizationStatusName, EPaytByDigitalPaymentSrvc, ElectronicPaymentCallStatus, EPaytAuthorizationResult, EPaytToBeAuthorizedAmount, EPaytAuthorizationIsExpired, EPaytAmountIsChanged, PreauthorizationIsRequested, PaymentServiceProvider, PaymentByPaymentServicePrvdr, TransactionByPaytSrvcPrvdr, MerchantByClearingHouse, PaymentCardAuthznRelationID, MaximumToBeAuthorizedAmount, PaytPlnForAuthorizationItem, PaytPlnItmForAuthorizationItem     }    
;
    @readonly
    entity A_SlsOrderItemBillingPlanItem as projection on s4.A_SlsOrderItemBillingPlanItem
    {        key SalesOrder, key SalesOrderItem, key BillingPlan, key BillingPlanItem, BillingPlanDateCategory, BillingPlanBillingDate, BillingPlanAmount, TransactionCurrency, BillingPlanAmountPercent, CustomerPaymentTerms, ProposedBillingDocumentType, BillingPlanDateDescriptionCode, BillingBlockReason, BillingPlanServiceStartDate, BillingPlanServiceEndDate, BillingPlanRelatedBillgStatus, BillingPlanType, AdoptingBillingDateID, BillingPlanBillingRule, BillingPlanMilestoneUsage, BillgPlnDteCorrectionRfndType, AccountingExchangeRate, PostponementReason     }    
;
} 