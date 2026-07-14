import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Materials } from "./pages/Materials";
import { MaterialDetails } from "./pages/MaterialDetails";
import { Trends } from "./pages/Trends";
import { News } from "./pages/News";
import { Analysis } from "./pages/Analysis";

// Placeholders for other pages
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full">
    <h1 className="text-2xl font-bold text-muted-foreground">{title} - Coming Soon</h1>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="materials/:id" element={<MaterialDetails />} />
          <Route path="trends" element={<Trends />} />
          <Route path="news" element={<News />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="capacity" element={<Placeholder title="Capacity" />} />
          <Route path="compare" element={<Placeholder title="Comparison" />} />
          <Route path="analytics" element={<Placeholder title="Analytics" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
