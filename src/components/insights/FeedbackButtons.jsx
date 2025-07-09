import React from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { t } from "@/components/utils/i18n";

const FeedbackButtons = ({ onFeedback, size = "sm" }) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size={size}
        onClick={() => onFeedback(true)}
        className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
        title={t('insights.feedback.helpful')}
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size={size}
        onClick={() => onFeedback(false)}
        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
        title={t('insights.feedback.notHelpful')}
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default FeedbackButtons;