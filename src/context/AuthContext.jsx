import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(localStorage.getItem('orion_role') || null);
    const [season, setSeason] = useState(localStorage.getItem('orion_season') || 'S26');
    const [collectionId, setCollectionId] = useState(localStorage.getItem('orion_collection_id') || 'HP124');

    const setCollectionContext = (s, c) => {
        setSeason(s);
        setCollectionId(c);
        localStorage.setItem('orion_season', s);
        localStorage.setItem('orion_collection_id', c);
    };

    const login = (selectedRole) => {
        setRole(selectedRole);
        if (selectedRole === 'OPS') {
            setUser({ name: 'Ops Manager', role: 'OPS', email: 'admin@carrefour.com' });
        } else {
            setUser({ name: 'Mustang Corp', role: 'SUPPLIER', email: 'supplier@mustang.com' });
        }
        localStorage.setItem('orion_role', selectedRole);
    };

    const toggleRole = () => {
        const newRole = role === 'OPS' ? 'SUPPLIER' : 'OPS';
        login(newRole);
    };

    const logout = () => {
        setUser(null);
        setRole(null);
        localStorage.removeItem('orion_role');
    };

    useEffect(() => {
        if (role) {
            if (role === 'OPS') {
                setUser({ name: 'Ops Manager', role: 'OPS', email: 'admin@carrefour.com' });
            } else {
                setUser({ name: 'Mustang Corp', role: 'SUPPLIER', email: 'supplier@mustang.com' });
            }
        }
    }, [role]);

    return (
        <AuthContext.Provider value={{ user, role, setRole: login, login, logout, toggleRole, season, collectionId, setCollectionContext }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
