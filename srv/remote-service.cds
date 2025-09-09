using {API_BUSINESS_PARTNER as bp} from './external/API_BUSINESS_PARTNER';

service BusinessPartnerService {

    @readonly
    entity A_BusinessPartner as
        projection on bp.A_BusinessPartner  {
                BusinessPartner,
                BusinessPartnerFullName,
                NameCountry
        };

    @readonly
    entity A_AddressEmailAddress as
        projection on bp.A_AddressEmailAddress {
            key AddressID,
            key Person,
            key OrdinalNumber,
                IsDefaultEmailAddress,
                EmailAddress,
                SearchEmailAddress,
                AddressCommunicationRemarkText
        };

    @readonly
    entity A_AddressFaxNumber    as
        projection on bp.A_AddressFaxNumber {
            key AddressID,
            key Person,
            key OrdinalNumber,
                IsDefaultFaxNumber,
                FaxCountry,
                FaxNumber,
                FaxNumberExtension,
                InternationalFaxNumber,
                AddressCommunicationRemarkText
        };

    @readonly
    entity A_AddressHomePageURL  as
        projection on bp.A_AddressHomePageURL {
            key AddressID,
            key Person,
            key OrdinalNumber,
            key ValidityStartDate,
            key IsDefaultURLAddress,
                SearchURLAddress,
                AddressCommunicationRemarkText,
                URLFieldLength,
                WebsiteURL
        };
}
