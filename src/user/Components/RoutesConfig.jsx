import React from "react";
import { Route, Routes } from "react-router-dom";
import NIN from "../pages/NIN";
import PhoneNIN from "../pages/PhoneNIN";
import Home from "../pages/Home";
import Footer from "../Components/Footer";
import BVNVerificationHistory from "../pages/History/BVNVerificationHistory";
import NINVerificationHistory from "../pages/History/NINVerificationHistory";
import FundingHistory from "../pages/FundingHistory";
import BVNVerify from "../pages/BVNVerify";
import Enrollment from "../pages/Enrollment";
import DataSubscription from "../pages/Data";
import AirtimeSubscription from "../pages/Airtime";
import NINSlip from "../layout/Ninslip";
import NotFound from "../pages/NotFound";
import BasicBVN from "../layout/BasicBVN";
import AdvancedBVN from "../layout/AdvancedBVN";
import IPEClearance from "../pages/IPEClearance";
import SetPin from "../layout/SetPin";
import ResetPin from "../layout/ResetPin";
import IPEClearanceHistory from "../pages/History/IPEHistory";
import CAC from "../pages/CAC";
import BankAgency from "../pages/BankAgency";
import BVNLicence from "../pages/Licence";
import Modification from "../pages/Modification";
import DataHistory from "../pages/History/HistoryData";
import AirtimeHistory from "../pages/History/AirtimeHistory";
import Personalisation from "../pages/Personalisation";
import AllHistory from "../pages/AllHistory";
import DemographicSearch from "../pages/DemographicSearch";
import Validation from "../pages/Validation";
import ApiDocumentation from "../pages/ApiDocumentation";
import CheckIPEStatus from "../pages/CheckIPEStatus";
import RegularSlip from "../layout/RegularSlip"; // Import the RegularSlip component
import StandardSlip from "../layout/StandardSlip"; // Import the StandardSlip component
import PremiumSlip from "../layout/PremiumSlip"; // Import the PremiumSlip component
import NINwithPhone from "../pages/PhoneNIN";
import CACHistory from "../pages/History/CACHistory";
import APIUsage from "../pages/History/API-Usage";
import ValidationHistory from "../pages/History/ValidationHistory";
import PersonalisationHistory from "../pages/History/PersonalisationHistory";
import DemoHistory from "../pages/History/DemoHistory";
import BVNModification from "../pages/BVNModification";
import BVNModificationHistory from "../pages/History/BVNModificationHistory";

function RoutesConfig() {
  return (
    <div className="flex-1 p-8 md:ml-64 min-h-screen flex flex-col ">
      <Routes className="flex-1 notvalid ">
        <Route path="/" element={<Home />} />
        <Route path="/verifications/nin" element={<NIN />} />
        <Route path="/bvnhistory" element={<BVNVerificationHistory />} />
        <Route path="/ninhistory" element={<NINVerificationHistory />} />
        <Route path="/fundinghistory" element={<FundingHistory />} />
        <Route path="/verifications/pvn" element={<PhoneNIN />} />
        <Route path="/enrollment" element={<Enrollment />} />
        <Route path="/verifications/bvn" element={<BVNVerify />} />
        <Route path="/data" element={<DataSubscription />} />
        <Route path="/airtime" element={<AirtimeSubscription />} />
        <Route path="/verifications/ninslip" element={<NINSlip />} />
        <Route path="/verifications/basicbvn" element={<BasicBVN />} />
        <Route path="/verifications/advancedbvn" element={<AdvancedBVN />} />
        <Route path="/setpin" element={<SetPin />} />
        <Route path="/reset-pin" element={<ResetPin />} />
        <Route path="/ipe-clearance" element={<IPEClearance />} />
        <Route path="/ipe-history" element={<IPEClearanceHistory />} />
        <Route path="/cac" element={<CAC />} />
        <Route path="/bank-agency" element={<BankAgency />} />
        <Route path="/bvn-licence" element={<BVNLicence />} />
        <Route path="/modification" element={<Modification />} />
        <Route path="/data-history" element={<DataHistory />} />
        <Route path="/airtime-history" element={<AirtimeHistory />} />
        <Route path="/personalisation" element={<Personalisation />} />
        <Route path="/all-history" element={<AllHistory />} />
        <Route path="/demographic-search" element={<DemographicSearch />} />
        <Route path="/validation" element={<Validation />} />
        <Route path="/api-documentation" element={<ApiDocumentation />} />
        <Route path="/check-ipe-status" element={<CheckIPEStatus />} />
        <Route path="/verifications/regularslip" element={<RegularSlip />} />
        <Route path="/verifications/standardslip" element={<StandardSlip />} />
        <Route path="/verifications/premiumslip" element={<PremiumSlip />} />
        <Route path="/verifications/ninphone" element={<NINwithPhone />} />
        <Route path="/bvn-modification" element={<BVNModification />} />
        <Route path="/cac-history" element={<CACHistory />} />
        <Route path="/api-usage" element={<APIUsage />} />
        <Route path="/validation-history" element={<ValidationHistory />} />
        <Route
          path="/bvn-modification-history"
          element={<BVNModificationHistory />}
        />
        <Route
          path="/personalisation-history"
          element={<PersonalisationHistory />}
        />
        <Route path="/demographic-history" element={<DemoHistory />} />
        {/* Catch-all route for 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default RoutesConfig;
