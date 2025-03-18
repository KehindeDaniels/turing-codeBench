import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { LanguageContext } from "./context/LanguageContext";
import HomePage from "./pages/HomePage";
import BlogPostDetail from "./pages/BlogPostDetail";

function App() {
  const { switchLanguage } = useContext(LanguageContext);

  return (
    <Router>
      <div>
        <header>
          <nav>
            <button onClick={() => switchLanguage("en")}>English</button>
            <button onClick={() => switchLanguage("de")}>Deutsch</button>
            <button onClick={() => switchLanguage("fr")}>Français</button>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/post/:id" element={<BlogPostDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
