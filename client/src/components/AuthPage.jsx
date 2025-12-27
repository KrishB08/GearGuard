import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Lock, Mail, User, Briefcase, Users, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const { login, signup } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Worker');
    const [teamId, setTeamId] = useState('');

    // Data & UI States
    const [teams, setTeams] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial check if we should show signup
    useEffect(() => {
        if (location.pathname === '/signup') {
            setIsLogin(false);
        }
    }, [location]);

    // Helper to check if role requires a team
    const isTeamRole = role === 'Technician' || role === 'Worker';

    // Fetch teams when needed
    useEffect(() => {
        if (!isLogin && isTeamRole) {
            api.get('/teams')
                .then(res => setTeams(res.data))
                .catch(err => console.error("Failed to fetch teams", err));
        }
    }, [isLogin, role, isTeamRole]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await login(email, password);
            if (res.success) {
                navigate('/');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation: Assume both Workers and Technicians need a Department
        if (isTeamRole && !teamId) {
            setError(`Please select a Department (Team) for the ${role} role.`);
            return;
        }

        setLoading(true);
        try {
            // Pass teamId if appropriate
            const result = await signup(name, email, password, role, isTeamRole ? teamId : undefined);

            if (result.success) {
                alert('Account created successfully! You are now logged in.');
                navigate('/');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError(err.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    {isLogin ?
                        <LogIn className="h-12 w-12 text-indigo-600" /> :
                        <UserPlus className="h-12 w-12 text-indigo-600" />
                    }
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isLogin ? 'Sign in to GearGuard' : 'Create a new account'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <button
                        onClick={toggleMode}
                        className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
                    >
                        {isLogin ? 'create a new account' : 'sign in to existing account'}
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={isLogin ? handleLogin : handleSignup}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative text-sm" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Briefcase className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <select
                                            id="role"
                                            name="role"
                                            required
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                            value={role}
                                            onChange={(e) => {
                                                const newRole = e.target.value;
                                                setRole(newRole);
                                                // Clear team only if role doesn't support teams
                                                if (newRole !== 'Technician' && newRole !== 'Worker') setTeamId('');
                                            }}
                                        >
                                            <option value="Worker">Worker</option>
                                            <option value="Technician">Technician</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Admin">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                {isTeamRole && (
                                    <div>
                                        <label htmlFor="team" className="block text-sm font-medium text-gray-700">Department (Team)</label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Users className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <select
                                                id="team"
                                                name="team"
                                                required
                                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                                value={teamId}
                                                onChange={(e) => setTeamId(e.target.value)}
                                            >
                                                <option value="">Select a Department</option>
                                                {teams.map(team => (
                                                    <option key={team.id || team._id} value={team.id || team._id}>{team.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    required
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                                    ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                            >
                                {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
