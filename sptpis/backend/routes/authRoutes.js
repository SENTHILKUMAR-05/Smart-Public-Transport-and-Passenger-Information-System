const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tnstc_super_secret_key_2026';

// 1. Standard Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.get(`SELECT * FROM Users WHERE email = ?`, [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                category: user.category
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 1-Click Demo Quick Role Login (super convenient for evaluators!)
router.post('/demo-login', async (req, res) => {
    try {
        const { role } = req.body; // 'passenger', 'driver', 'admin'
        let targetEmail = 'passenger@tnstc.in';
        if (role === 'driver') targetEmail = 'driver@tnstc.in';
        if (role === 'admin') targetEmail = 'admin@tnstc.in';

        const user = await db.get(`SELECT * FROM Users WHERE email = ?`, [targetEmail]);
        if (!user) {
            return res.status(404).json({ error: 'Demo user not found' });
        }
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role,
                category: user.category
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Current User Profile
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token provided' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.get(`SELECT user_id, name, email, phone, role, category FROM Users WHERE user_id = ?`, [decoded.user_id]);
        res.json(user);
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
