import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Rings from './pages/Rings';
import Analytics from './pages/Analytics';
import ReturnsList from './pages/ReturnsList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/returns" element={<ReturnsList />} />
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="analyzer/:id" element={<Analyzer />} />
          <Route path="rings" element={<Rings />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
