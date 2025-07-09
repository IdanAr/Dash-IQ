import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  DollarSign,
  Calendar,
  Target,
  Lightbulb
} from "lucide-react";

/**
 * Advanced message renderer with proper Markdown-like formatting
 */
export default function MessageRenderer({ content, metadata = {} }) {
  // Parse and format the message content
  const parseMessage = (text) => {
    if (!text || typeof text !== 'string') return [];
    
    // Split by double newlines to get sections
    const sections = text.split(/\n\s*\n/);
    const parsed = [];
    
    sections.forEach((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return;
      
      // Check section type and parse accordingly
      if (trimmed.includes('🔹') || trimmed.match(/^#{1,6}\s/)) {
        // Header section
        parsed.push(parseHeader(trimmed));
      } else if (trimmed.includes('🔸') || trimmed.includes('**')) {
        // Emphasis section
        parsed.push(parseEmphasis(trimmed));
      } else if (trimmed.includes('•') || trimmed.match(/^\s*[\*\-\+]\s/)) {
        // List section
        parsed.push(parseList(trimmed));
      } else if (trimmed.match(/^\d+\.\s/)) {
        // Numbered list section
        parsed.push(parseNumberedList(trimmed));
      } else if (trimmed.includes('📊') || trimmed.includes('💰') || trimmed.includes('📈')) {
        // Data section
        parsed.push(parseDataSection(trimmed));
      } else {
        // Regular paragraph
        parsed.push(parseParagraph(trimmed));
      }
    });
    
    return parsed;
  };
  
  const parseHeader = (text) => {
    // Remove markdown headers and emoji bullets
    let cleaned = text
      .replace(/^#{1,6}\s*/, '')
      .replace(/🔹\s*/, '')
      .trim();
    
    // Determine header level based on content
    const isMainHeader = cleaned.length < 50 && (
      cleaned.includes('סיכום') || 
      cleaned.includes('ניתוח') || 
      cleaned.includes('תוצאות') ||
      cleaned.includes('Summary') ||
      cleaned.includes('Analysis') ||
      cleaned.includes('Results')
    );
    
    return {
      type: 'header',
      level: isMainHeader ? 1 : 2,
      content: cleaned,
      icon: getHeaderIcon(cleaned)
    };
  };
  
  const parseEmphasis = (text) => {
    // Handle emphasis markers
    const lines = text.split('\n').map(line => {
      return line
        .replace(/🔸\s*/, '')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .trim();
    }).filter(line => line);
    
    return {
      type: 'emphasis',
      content: lines
    };
  };
  
  const parseList = (text) => {
    const items = text.split('\n').map(line => {
      return line
        .replace(/^\s*[•\*\-\+]\s*/, '')
        .replace(/🔸\s*/, '')
        .trim();
    }).filter(item => item);
    
    return {
      type: 'list',
      items: items
    };
  };
  
  const parseNumberedList = (text) => {
    const items = text.split('\n').map(line => {
      return line
        .replace(/^\s*\d+\.\s*/, '')
        .trim();
    }).filter(item => item);
    
    return {
      type: 'numbered_list',
      items: items
    };
  };
  
  const parseDataSection = (text) => {
    // Parse data-heavy sections with financial info
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const dataPoints = [];
    
    lines.forEach(line => {
      // Look for currency patterns
      const currencyMatch = line.match(/([\d,]+(?:\.\d{2})?)\s*₪/);
      // Look for percentage patterns
      const percentMatch = line.match(/([\d,]+(?:\.\d{1,2})?)\s*%/);
      // Look for number patterns
      const numberMatch = line.match(/(\d+(?:,\d{3})*)/);
      
      if (currencyMatch || percentMatch || numberMatch) {
        dataPoints.push({
          text: line,
          value: currencyMatch?.[1] || percentMatch?.[1] || numberMatch?.[1],
          type: currencyMatch ? 'currency' : percentMatch ? 'percentage' : 'number'
        });
      } else {
        dataPoints.push({
          text: line,
          type: 'text'
        });
      }
    });
    
    return {
      type: 'data',
      content: dataPoints
    };
  };
  
  const parseParagraph = (text) => {
    // Clean up regular paragraphs
    const cleaned = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .trim();
    
    return {
      type: 'paragraph',
      content: cleaned
    };
  };
  
  const getHeaderIcon = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('סיכום') || lower.includes('summary')) return <TrendingUp className="w-5 h-5" />;
    if (lower.includes('תקציב') || lower.includes('budget')) return <Target className="w-5 h-5" />;
    if (lower.includes('המלצ') || lower.includes('recommend')) return <Lightbulb className="w-5 h-5" />;
    if (lower.includes('הוצא') || lower.includes('expense')) return <DollarSign className="w-5 h-5" />;
    if (lower.includes('הכנס') || lower.includes('income')) return <TrendingUp className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };
  
  const renderSection = (section, index) => {
    switch (section.type) {
      case 'header':
        return (
          <div key={index} className={`flex items-center gap-3 mb-4 ${
            section.level === 1 ? 'text-xl font-bold text-gray-900' : 'text-lg font-semibold text-gray-800'
          }`}>
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-blue-600">
              {section.icon}
            </div>
            <h3>{section.content}</h3>
          </div>
        );
      
      case 'emphasis':
        return (
          <div key={index} className="mb-4">
            {section.content.map((line, lineIndex) => (
              <div key={lineIndex} className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-2 rounded-r-lg">
                <p 
                  className="text-amber-800 font-medium"
                  dangerouslySetInnerHTML={{ __html: line }}
                />
              </div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div key={index} className="mb-4">
            <ul className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      
      case 'numbered_list':
        return (
          <div key={index} className="mb-4">
            <ol className="space-y-2">
              {section.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {itemIndex + 1}
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        );
      
      case 'data':
        return (
          <div key={index} className="mb-4">
            <Card className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex} className={`flex items-center justify-between p-2 rounded-lg ${
                    item.type === 'currency' ? 'bg-green-100' :
                    item.type === 'percentage' ? 'bg-blue-100' :
                    item.type === 'number' ? 'bg-purple-100' : 'bg-white'
                  }`}>
                    <span className="text-gray-700">{item.text.replace(/[\d,]+(?:\.\d{1,2})?[₪%]?/, '').trim()}</span>
                    {item.value && (
                      <Badge variant="secondary" className={`font-bold ${
                        item.type === 'currency' ? 'text-green-700' :
                        item.type === 'percentage' ? 'text-blue-700' :
                        'text-purple-700'
                      }`}>
                        {item.value}{item.type === 'currency' ? '₪' : item.type === 'percentage' ? '%' : ''}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
      
      case 'paragraph':
        return (
          <div key={index} className="mb-4">
            <p 
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        );
      
      default:
        return null;
    }
  };
  
  const parsedContent = parseMessage(content);
  
  return (
    <div className="space-y-4">
      {parsedContent.map((section, index) => renderSection(section, index))}
      
      {/* Render insights and recommendations if available */}
      {metadata.insights && metadata.insights.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Info className="w-5 h-5 text-blue-600" />
              תובנות נוספות
            </div>
            {metadata.insights.map((insight, index) => (
              <Card key={index} className={`p-4 ${
                insight.severity === 'high' ? 'border-red-200 bg-red-50' :
                insight.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    insight.severity === 'high' ? 'bg-red-500' :
                    insight.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}>
                    {insight.severity === 'high' ? 
                      <AlertTriangle className="w-4 h-4 text-white" /> :
                      <CheckCircle className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">{insight.title}</h4>
                    <p className="text-gray-600">{insight.message}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {/* Render recommendations if available */}
      {metadata.recommendations && metadata.recommendations.length > 0 && (
        <>
          <Separator className="my-6" />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              המלצות
            </div>
            {metadata.recommendations.map((rec, index) => (
              <Card key={index} className="p-4 border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-amber-800">{rec.message}</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}