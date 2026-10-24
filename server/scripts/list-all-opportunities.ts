import { mockOpportunities } from '../src/data/mockData';

console.log(JSON.stringify(mockOpportunities.map(o => ({
  id: o.id,
  title: o.title,
  org: o.organization,
  appUrl: o.application_url,
  offUrl: o.official_opportunity_url,
  deadline: o.deadline,
  status: o.application_status,
  verif: o.verificationStatus,
  isExpired: o.isExpired
})), null, 2));
