import React, { useState } from 'react';
import { Webchat } from '@botpress/webchat';

const ChatWidget: React.FC = () => {
  const [isWebchatOpen, setIsWebchatOpen] = useState(false);

  const toggleWebchat = () => {
    setIsWebchatOpen((prevState) => !prevState);
  };

  return (
    <div style={{ 
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
    }}>
      {/* Custom FAB button */}
      <button
        onClick={toggleWebchat}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#000',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        💬
      </button>
      
      {isWebchatOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '0px',
            width: '400px',
            height: '600px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <Webchat 
            clientId="6ec457a7-3cdb-445e-a4be-b7f8a47bd6fa"
            configuration={{
              color: '#000',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ChatWidget;