// Client-side localStorage store for leads and campaign data
import { Lead, Campaign } from './types';

const LEADS_KEY = 'bolna_leads';
const CAMPAIGNS_KEY = 'bolna_campaigns';

export function getLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLead(lead: Lead): void {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === lead.id);
  if (idx >= 0) leads[idx] = lead;
  else leads.unshift(lead);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function deleteLead(id: string): void {
  const leads = getLeads().filter(l => l.id !== id);
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function getCampaigns(): Campaign[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCampaign(campaign: Campaign): void {
  const campaigns = getCampaigns();
  const idx = campaigns.findIndex(c => c.id === campaign.id);
  if (idx >= 0) campaigns[idx] = campaign;
  else campaigns.unshift(campaign);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}
