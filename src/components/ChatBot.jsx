import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Coordinates for drag positioning
  const [position, setPosition] = useState({
    x: window.innerWidth - 340,
    y: window.innerHeight - 460,
  });
  const dragPos = useRef({ x: 0, y: 0, isDragging: false });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Drag handlers
  const onMouseDown = (e) => {
    dragPos.current = {
      x: e.clientX,
      y: e.clientY,
      isDragging: true,
      startX: position.x,
      startY: position.y,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const onMouseMove = (e) => {
    if (!dragPos.current.isDragging) return;
    const dx = e.clientX - dragPos.current.x;
    const dy = e.clientY - dragPos.current.y;
    setPosition({
      x: dragPos.current.startX + dx,
      y: dragPos.current.startY + dy,
    });
  };
  const onMouseUp = () => {
    dragPos.current.isDragging = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("/your-chatbot-api", {
        message: input.trim(),
      });
      const botMessage = {
        sender: "bot",
        text: response.data.answer || "I didn't understand that.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error! Please try again later." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleChat}
        aria-label="Open chat"
        title="Chat with us"
        className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition z-50 border-2 border-white"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      onMouseDown={onMouseDown}
      style={{ top: position.y, left: position.x }}
      className="fixed w-80 h-[460px] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-200 z-50 cursor-grab select-none"
    >
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center cursor-grab select-none">
        <h2 className="font-semibold text-lg">ChatBot</h2>
        <button
          onClick={toggleChat}
          aria-label="Close chat"
          title="Close chat"
          className="text-white hover:text-gray-300 text-xl font-bold"
        >
          &times;
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-5">No messages yet</div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-3 max-w-[70%] p-2 rounded-md ${
                msg.sender === "bot"
                  ? "bg-gray-100 text-gray-900 self-start"
                  : "bg-blue-600 text-white self-end"
              } break-words`}
            >
              {msg.text}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input and send */}
      <div className="border-t border-gray-200 p-4 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={loading}
          autoComplete="off"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Message input"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          aria-label="Send message"
          title="Send"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
