import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StudentPortal from './components/StudentPortal';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StudentPortal />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

