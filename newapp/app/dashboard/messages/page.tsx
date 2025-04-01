// pages/chat.tsx
import React from 'react';
import Head from 'next/head';
import ChatInterface from './chatInterface';

export default function ChatPage() {
  return (
    <>
      <Head>
        <title>聊天 | Interactive Chat</title>
        <meta name="description" content="Interactive character chat interface" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ChatInterface />
    </>
  );
}