import React from "react";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { AppRouter } from "./router/AppRouter";

const App: React.FC = () => {
  return (
    <div className="app-root">
      <Navbar />
      <main className="app-main">
        <AppRouter />
      </main>
      <Footer />
    </div>
  );
};

export default App;
