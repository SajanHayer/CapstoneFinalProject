import React from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { AppRouter } from "./router/AppRouter";
import { ChatWidget } from "./components/ChatWidget";
import { socket } from "./lib/socket";
import { useEffect } from "react";

const App: React.FC = () => {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main pt-24">
        <AppRouter />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default App;
