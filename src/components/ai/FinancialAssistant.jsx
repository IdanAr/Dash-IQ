// Legacy component - redirect to enhanced version
import FinancialAssistantEnhanced from './FinancialAssistantEnhanced';

export default function FinancialAssistant(props) {
  return <FinancialAssistantEnhanced {...props} />;
}