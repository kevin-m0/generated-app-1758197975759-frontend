import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Label } from './components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Badge } from './components/ui/badge';
import { Trash2, Check, X, Plus, LogOut } from 'lucide-react';
import { Checkbox } from './components/ui/checkbox';
import { Textarea } from './components/ui/textarea';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Set up axios defaults
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);

  // Auth forms state
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [forgotPasswordForm, setForgotPasswordForm] = useState({ email: '' });
  const [resetPasswordForm, setResetPasswordForm] = useState({ token: '', newPassword: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    }
  }, []);

  // Fetch user info and todos
  const fetchUserInfo = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      setIsAuthenticated(true);
      fetchTodos();
    } catch (error) {
      console.error('Error fetching user info:', error);
      logout();
    }
  };

  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${API}/todos`);
      setTodos(response.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  // Auth functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginForm);
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await fetchUserInfo();
      setLoginForm({ email: '', password: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Login failed');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, registerForm);
      alert('Registration successful! Please login.');
      setActiveTab('login');
      setRegisterForm({ name: '', email: '', password: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Registration failed');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, forgotPasswordForm);
      alert('If email exists, reset instructions have been sent. Check the console for demo token.');
      setShowForgotPassword(false);
      setShowResetPassword(true);
      setForgotPasswordForm({ email: '' });
    } catch (error) {
      alert('Error sending reset email');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        token: resetPasswordForm.token,
        new_password: resetPasswordForm.newPassword
      });
      alert('Password reset successfully! Please login with your new password.');
      setShowResetPassword(false);
      setActiveTab('login');
      setResetPasswordForm({ token: '', newPassword: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Reset failed');
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    setTodos([]);
  };

  // Todo functions
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/todos`, newTodo);
      setTodos([...todos, response.data]);
      setNewTodo({ title: '', description: '' });
    } catch (error) {
      alert('Error adding todo');
    }
    setLoading(false);
  };

  const handleToggleComplete = async (todoId, completed) => {
    try {
      const response = await axios.put(`${API}/todos/${todoId}`, { completed: !completed });
      setTodos(todos.map(todo => 
        todo.id === todoId ? response.data : todo
      ));
    } catch (error) {
      alert('Error updating todo');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return;
    
    try {
      await axios.delete(`${API}/todos/${todoId}`);
      setTodos(todos.filter(todo => todo.id !== todoId));
    } catch (error) {
      alert('Error deleting todo');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
            <p className="text-slate-600">Sign in to manage your todos</p>
          </div>

          {showResetPassword ? (
            <Card>
              <CardHeader>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>Enter the reset token and your new password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-token">Reset Token</Label>
                    <Input
                      id="reset-token"
                      type="text"
                      value={resetPasswordForm.token}
                      onChange={(e) => setResetPasswordForm({
                        ...resetPasswordForm,
                        token: e.target.value
                      })}
                      placeholder="Enter reset token from console/email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={resetPasswordForm.newPassword}
                      onChange={(e) => setResetPasswordForm({
                        ...resetPasswordForm,
                        newPassword: e.target.value
                      })}
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setShowResetPassword(false)}
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : showForgotPassword ? (
            <Card>
              <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
                <CardDescription>Enter your email to receive reset instructions</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordForm.email}
                      onChange={(e) => setForgotPasswordForm({
                        ...forgotPasswordForm,
                        email: e.target.value
                      })}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setShowForgotPassword(false)}
                  >
                    Back to Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({
                            ...loginForm,
                            email: e.target.value
                          })}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({
                            ...loginForm,
                            password: e.target.value
                          })}
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="w-full"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot Password?
                      </Button>
                    </form>
                  </TabsContent>
                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Label htmlFor="register-name">Name</Label>
                        <Input
                          id="register-name"
                          type="text"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({
                            ...registerForm,
                            name: e.target.value
                          })}
                          placeholder="Enter your name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({
                            ...registerForm,
                            email: e.target.value
                          })}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({
                            ...registerForm,
                            password: e.target.value
                          })}
                          placeholder="Create a password"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Todo List</h1>
            <p className="text-slate-600">Welcome, {user?.name}!</p>
          </div>
          <Button onClick={logout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Add Todo Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTodo} className="space-y-4">
              <div>
                <Label htmlFor="todo-title">Title</Label>
                <Input
                  id="todo-title"
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({
                    ...newTodo,
                    title: e.target.value
                  })}
                  placeholder="What do you need to do?"
                  required
                />
              </div>
              <div>
                <Label htmlFor="todo-description">Description (Optional)</Label>
                <Textarea
                  id="todo-description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({
                    ...newTodo,
                    description: e.target.value
                  })}
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">
              Your Todos ({todos.length})
            </h2>
            {todos.length > 0 && (
              <div className="flex gap-4 text-sm text-slate-600">
                <span>Complete: {todos.filter(todo => todo.completed).length}</span>
                <span>Pending: {todos.filter(todo => !todo.completed).length}</span>
              </div>
            )}
          </div>

          {todos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-slate-400 mb-4">
                  <Plus className="h-12 w-12 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-medium text-slate-800 mb-2">No todos yet</h3>
                <p className="text-slate-600">Create your first todo to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <Card key={todo.id} className={`transition-all duration-200 ${
                  todo.completed ? 'bg-slate-50 border-slate-200' : 'bg-white'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo.id, todo.completed)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-medium ${
                          todo.completed 
                            ? 'line-through text-slate-500' 
                            : 'text-slate-800'
                        }`}>
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p className={`text-sm mt-1 ${
                            todo.completed 
                              ? 'line-through text-slate-400' 
                              : 'text-slate-600'
                          }`}>
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={todo.completed ? 'secondary' : 'default'}>
                            {todo.completed ? 'Completed' : 'Pending'}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            Created {new Date(todo.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteTodo(todo.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;