using { API_BUSINESS_PARTNER as bp } from './external/API_BUSINESS_PARTNER';


service RemoteService @(path: '/remote') {
  entity A_BusinessPartner as projection on bp.A_BusinessPartner {
    BusinessPartner,
    BusinessPartnerFullName,
    NameCountry
  };
}
