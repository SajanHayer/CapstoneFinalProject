import React from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { AppRouter } from "./router/AppRouter";
import { ChatWidget } from "./components/ChatWidget";

const App: React.FC = () => {
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
