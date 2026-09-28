import { useState } from 'react';
import SegmentedControl from '../../shared/components/SegmentedControl';
import StoreSettings from './StoreSettings';
import LoyaltyConfig from './LoyaltyConfig';
import TillPinManager from './TillPinManager';
import BillingUsage from './BillingUsage';
import OwnerAccount from './OwnerAccount';

// "Shop profile" is the public store; "Account" is the owner's own login.
const SECTIONS = [
  { value: 'profile', label: 'Shop profile' },
  { value: 'earning', label: 'Earning' },
  { value: 'till-pins', label: 'Till PINs' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account' },
];

const Settings = () => {
  const [section, setSection] = useState('profile');

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-page-title text-text-primary">Settings</h1>

      <SegmentedControl options={SECTIONS} value={section} onChange={setSection} className="mt-4 flex-wrap" />

      <div className="mt-5">
        {section === 'profile' && <StoreSettings />}
        {section === 'earning' && <LoyaltyConfig />}
        {section === 'till-pins' && <TillPinManager />}
        {section === 'billing' && <BillingUsage />}
        {section === 'account' && <OwnerAccount />}
      </div>
    </div>
  );
};

export default Settings;
