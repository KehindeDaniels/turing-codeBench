Base Code:

```jsx
// main.jsx
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
```

```jsx
//src/App.jsx
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
```

```jsx
// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(LanguageDetector)
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === "production",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      wait: true,
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
  })
  .then(() => {
    console.log("i18next is ready");
  });

export default i18n;
```

```jsx
// src/context/LanguageContext.jsx
import React, { createContext, useState, useEffect } from "react";
import i18n from "i18next";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("lang") || "en"
  );

  useEffect(() => {
    localStorage.setItem("lang", language);
    i18n.changeLanguage(language);
  }, []);

  const switchLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

```jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import blogsData from "../data/blogs.json";
import { useTranslation } from "react-i18next";

function BlogPostDetail() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const [post, setPost] = useState(null);

  useEffect(() => {
    const blog = blogsData.find((blog) => blog.id === parseInt(id));
    setPost(blog);
  }, [id]);

  if (!post) return <p>tblog_not_found"</p>;

  const blogDetails = post.details[i18n.language];

  return (
    <div>
      <h1>{post.title}</h1>
      <p>author: {post.author}</p>
      <p>category: {post.category}</p>
      <p>created_in: {post.createdOn}</p>
      <p>{blogDetails}</p>
    </div>
  );
}

export default BlogPostDetail;
```

```jsx
// src\pages\BlogPostDetail.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import blogsData from "../data/blogs.json";
import { useTranslation } from "react-i18next";

function HomePage() {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    setBlogs(blogsData);
  }, []);

  return (
    <div>
      <section>
        <h1>hero</h1>
        <p>intro</p>
      </section>

      <section>
        <h2>recent_posts</h2>
        {blogs.length === 0 ? (
          <p>no_blogs_available</p>
        ) : (
          <ul>
            {blogs.map((blog) => (
              <li key={blog.id}>
                <h3>{blog.title}</h3>
                <p>author: {blog.author}</p>
                <p>created_in: {blog.createdOn}</p>
                <Link to={`/post/${blog.id}`}>read_more</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default HomePage;
```

```json
//src/data/blogs.json

[
  {
    "id": 1,
    "title": "Understanding React Context API",
    "author": "John Doe",
    "category": "React",
    "details": {
      "en": "In this blog post, we will explore the Context API in React, a powerful tool for managing state in large applications. The Context API allows you to pass data through the component tree without having to manually pass props at every level.",
      "de": "In diesem Blogbeitrag werden wir das Context API in React untersuchen, ein leistungsstarkes Tool zur Verwaltung des Zustands in großen Anwendungen. Das Context API ermöglicht es, Daten durch den Komponentenbaum zu übergeben, ohne Props auf jeder Ebene manuell weitergeben zu müssen.",
      "fr": "Dans cet article de blog, nous explorerons l'API Context de React, un outil puissant pour gérer l'état dans de grandes applications. L'API Context permet de transmettre des données à travers l'arbre des composants sans avoir à passer manuellement des props à chaque niveau."
    },
    "createdOn": "March 2023"
  },
  {
    "id": 2,
    "title": "Introduction to JavaScript Closures",
    "author": "Jane Smith",
    "category": "JavaScript",
    "details": {
      "en": "A closure is a function that retains access to variables from its lexical scope, even when the function is executed outside that scope. This blog post explains closures with examples and use cases.",
      "de": "Ein Closure ist eine Funktion, die Zugriff auf Variablen aus ihrem lexikalischen Bereich behält, selbst wenn die Funktion außerhalb dieses Bereichs ausgeführt wird. Dieser Blogbeitrag erklärt Closures mit Beispielen und Anwendungsfällen.",
      "fr": "Une fermeture est une fonction qui conserve l'accès aux variables de son scope lexical, même lorsque la fonction est exécutée en dehors de ce scope. Cet article de blog explique les fermetures avec des exemples et des cas d'utilisation."
    },
    "createdOn": "February 2023"
  },
  {
    "id": 3,
    "title": "Mastering CSS Grid and Flexbox",
    "author": "Alice Johnson",
    "category": "CSS",
    "details": {
      "en": "CSS Grid and Flexbox are layout systems that allow developers to build responsive web designs easily. In this post, we will compare both systems and demonstrate how to use them effectively in modern web development.",
      "de": "CSS Grid und Flexbox sind Layout-Systeme, mit denen Entwickler responsive Webdesigns einfach erstellen können. In diesem Beitrag werden wir beide Systeme vergleichen und demonstrieren, wie man sie effektiv in der modernen Webentwicklung einsetzt.",
      "fr": "CSS Grid et Flexbox sont des systèmes de mise en page qui permettent aux développeurs de créer facilement des conceptions web réactives. Dans cet article, nous comparerons les deux systèmes et démontrerons comment les utiliser efficacement dans le développement web moderne."
    },
    "createdOn": "January 2023"
  },
  {
    "id": 4,
    "title": "Getting Started with TypeScript",
    "author": "Bob Brown",
    "category": "TypeScript",
    "details": {
      "en": "TypeScript is a superset of JavaScript that adds static types to the language. In this blog post, we will cover the basics of TypeScript, how to set it up, and why it is beneficial for large-scale projects.",
      "de": "TypeScript ist ein Superset von JavaScript, das statische Typen zur Sprache hinzufügt. In diesem Blogbeitrag behandeln wir die Grundlagen von TypeScript, wie man es einrichtet und warum es für groß angelegte Projekte von Vorteil ist.",
      "fr": "TypeScript est un sur-ensemble de JavaScript qui ajoute des types statiques au langage. Dans cet article de blog, nous couvrirons les bases de TypeScript, comment le configurer et pourquoi il est bénéfique pour les projets à grande échelle."
    },
    "createdOn": "December 2022"
  },
  {
    "id": 5,
    "title": "A Beginner’s Guide to Node.js",
    "author": "Charlie Davis",
    "category": "Node.js",
    "details": {
      "en": "Node.js is a popular JavaScript runtime built on Chrome’s V8 engine. In this beginner-friendly guide, we will explore the fundamentals of Node.js, how to get started, and how to build your first server with it.",
      "de": "Node.js ist eine beliebte JavaScript-Laufzeitumgebung, die auf dem V8-Engine von Chrome basiert. In diesem einsteigerfreundlichen Leitfaden werden wir die Grundlagen von Node.js behandeln, wie man beginnt und wie man seinen ersten Server damit erstellt.",
      "fr": "Node.js est un moteur JavaScript populaire basé sur le moteur V8 de Chrome. Dans ce guide pour débutants, nous explorerons les bases de Node.js, comment commencer et comment créer votre premier serveur avec."
    },
    "createdOn": "November 2022"
  }
]
```

```json
// public/locales/en/translation.json
{
  "hero": "Welcome to the Blog",
  "intro": "This is a multilingual blog. Choose a language from the navigation bar.",
  "recent_posts": "Recent Posts",
  "read_more": "Read more",
  "no_blogs": "No blogs available.",
  "created_in": "Created in",
  "by": "By",
  "category": "Category",
  "blog_details": {
    "context_api": "In this blog post, we will explore the Context API in React, a powerful tool for managing state in large applications. The Context API allows you to pass data through the component tree without having to manually pass props at every level."
  }
}
```

```json
// public/locales/de/translation.json
{
  "hero": "Willkommen im Blog",
  "intro": "Dies ist ein mehrsprachiger Blog. Wählen Sie eine Sprache aus der Navigationsleiste.",
  "recent_posts": "Neueste Beiträge",
  "read_more": "Weiterlesen",
  "no_blogs": "Keine Blogs verfügbar.",
  "created_in": "Erstellt im",
  "by": "Von",
  "category": "Kategorie",
  "blog_details": {
    "context_api": "In diesem Blogbeitrag werden wir das Context API in React untersuchen, ein leistungsstarkes Tool zur Verwaltung des Zustands in großen Anwendungen. Das Context API ermöglicht es, Daten durch den Komponentenbaum zu übergeben, ohne Props auf jeder Ebene manuell weitergeben zu müssen."
  }
}
```

```json
// public/locales/fr/translation.json
{
  "hero": "Bienvenue sur le blog",
  "intro": "Ceci est un blog multilingue. Choisissez une langue dans la barre de navigation.",
  "recent_posts": "Articles récents",
  "read_more": "Lire la suite",
  "no_blogs": "Aucun blog disponible.",
  "created_in": "Créé en",
  "by": "Par",
  "category": "Catégorie",
  "blog_details": {
    "context_api": "Dans cet article de blog, nous explorerons l'API Context de React, un outil puissant pour gérer l'état dans de grandes applications. L'API Context permet de transmettre des données à travers l'arbre des composants sans avoir à passer manuellement des props à chaque niveau."
  }
}
```
