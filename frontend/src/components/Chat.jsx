import React, { useState } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const Chat = () => {
  const [messages, setMessages] = useState([]);

  const handleSend = async (text) => {
    const userMsg = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/copilot/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const botMsg = { role: 'bot', text: data.reply };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg = { role: 'bot', text: 'Error al contactar al servidor.' };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default Chat;
