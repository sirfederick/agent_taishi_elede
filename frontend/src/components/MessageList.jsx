import React from 'react';

const MessageList = ({ messages }) => (
  <ul className="messages">
    {messages.map((m, idx) => (
      <li key={idx} className={m.role}>
        {m.text}
      </li>
    ))}
  </ul>
);

export default MessageList;
