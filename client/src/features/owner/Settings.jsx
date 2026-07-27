import StoreSettings from './StoreSettings';
import LoyaltyConfig from './LoyaltyConfig';
import TillPinManager from './TillPinManager';

export default function Settings() {
  return (
    <div className="flex flex-col gap-xl max-w-[720px] mx-auto">
      <h1 className="font-display text-display-md-mobile md:text-display-md">Settings</h1>
      <StoreSettings />
      <LoyaltyConfig />
      <TillPinManager />
    </div>
  );
}
