import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import KanbanBoard from './components/KanbanBoard';
import CalendarView from './components/CalendarView';
import EquipmentList from './components/EquipmentList';
import EquipmentDetail from './components/EquipmentDetail';
import RequestForm from './components/RequestForm';

function Layout({ children }) {
    const { logout } = useAuth();
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            <div className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600">GearGuard</span>
                            </div>
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                <Link to="/" className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </Link>
                                <Link to="/calendar" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Calendar
                                </Link>
                                <Link to="/equipment" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Equipment
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/new-request" className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                New Request
                            </Link>
                            <button
                                onClick={logout}
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route path="/" element={<Layout><KanbanBoard /></Layout>} />
                        <Route path="/calendar" element={<Layout><CalendarView /></Layout>} />
                        <Route path="/equipment" element={<Layout><EquipmentList /></Layout>} />
                        <Route path="/equipment/:id" element={<Layout><EquipmentDetail /></Layout>} />
                        <Route path="/new-request" element={<Layout><RequestForm /></Layout>} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
