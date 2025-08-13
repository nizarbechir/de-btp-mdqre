using { API_BUSINESS_PARTNER as bp } from './external/API_BUSINESS_PARTNER';


service BusinessPartnerService @(path: '/business-partner') {
  entity A_BusinessPartner as projection on bp.A_BusinessPartner {
    BusinessPartner,
    BusinessPartnerFullName,
    NameCountry
  };
}