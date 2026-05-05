import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, User, Lock, Mail, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();

    // Hata mesajını 10 saniye sonra otomatik temizle
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError('');
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
        if (error) setError('');
    };

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                await login(username, password);
            } else {
                await register(username, email, password);
                setIsLogin(true);
                setError('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-glass-card">
                <div className="login-header">
                    <div className="login-logo">
                        <MapPin size={40} color="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <h1>HaritaAPP</h1>
                    </div>
                    <p>{isLogin ? 'Hoş geldiniz, lütfen giriş yapın.' : 'Yeni hesap oluşturun.'}</p>
                    {error && (
                        <div className={`header-auth-error ${error.includes('başarılı') ? 'success' : ''}`}>
                            <AlertTriangle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label><User size={16} /> Kullanıcı Adı</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={handleInputChange(setUsername)} 
                            required 
                            placeholder="Kullanıcı adınızı girin"
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label><Mail size={16} /> E-posta</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={handleInputChange(setEmail)} 
                                required 
                                placeholder="E-posta adresinizi girin"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label><Lock size={16} /> Şifre</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={handleInputChange(setPassword)} 
                            required 
                            placeholder="Şifrenizi girin"
                        />
                    </div>



                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? <Loader2 className="spinner" size={20} /> : (
                            <>
                                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'} 
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <button onClick={toggleAuthMode} className="toggle-auth-btn">
                        {isLogin ? "Hesabınız yok mu? Kayıt Olun" : "Zaten hesabınız var mı? Giriş Yapın"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
