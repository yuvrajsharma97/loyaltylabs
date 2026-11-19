import { useSearchParams } from 'react-router-dom';
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
  // Section lives in the URL (?section=billing) so other screens, like the
  // plan-limit banner, can link straight to it.
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('section');
  const section = SECTIONS.some((option) => option.value === requested) ? requested : 'profile';
  const setSection = (value) => setSearchParams({ section: value }, { replace: true });

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
