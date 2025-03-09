import { Dispatch, SetStateAction } from "react";

interface SupportProps {
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  onSendMessage: () => void;
  onBack: () => void;
}

export default function Support({ message, setMessage, onSendMessage, onBack }: SupportProps) {
  // FAQ questions
  const faqQuestions = [
    "How to activate a Steam key?",
    "My payment was successful but I didn't receive my key",
    "How to use my cashback?",
    "Can I get a refund?"
  ];

  return (
    <>
      <div className="self-end bg-white border rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">Support</p>
      </div>
      
      <div className="bg-telegram-light rounded-lg p-3 max-w-[85%]">
        <p className="font-roboto">How can we help you today?</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 w-full">
        <h3 className="font-bold text-dark mb-2">Frequently Asked Questions:</h3>
        
        <div className="space-y-2 mb-3">
          {faqQuestions.map((question, index) => (
            <button 
              key={index} 
              className="w-full text-left p-2 border rounded hover:bg-gray-100 text-sm"
              onClick={() => setMessage(`Question about: ${question}`)}
            >
              {question}
            </button>
          ))}
        </div>
        
        <h3 className="font-bold text-dark mb-2">Contact Support:</h3>
        <p className="text-sm text-dark-light mb-2">If you can't find an answer, send us a message:</p>
        
        <textarea 
          className="w-full p-2 border rounded mb-2 text-sm" 
          placeholder="Describe your issue..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        ></textarea>
        <button 
          className="w-full bg-telegram text-white py-2 rounded font-medium text-sm"
          onClick={onSendMessage}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="inline-block h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg> 
          Send Message
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-2 w-full my-2">
        <button 
          className="bg-telegram text-white py-2 px-4 rounded text-sm font-medium"
          onClick={onBack}
        >
          🏠 Back to Main Menu
        </button>
      </div>
    </>
  );
}
