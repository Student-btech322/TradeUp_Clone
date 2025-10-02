const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

// helper to send tokens (access in bearer, refresh in httpOnly cookie)
function sendTokens(res, user) {
  const payload = { id: user._id, role: user.role, tokenVersion: user.tokenVersion };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // set refresh token as httpOnly cookie
  res.cookie('jid', refreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    path: '/api/auth/refresh' // cookie only sent to refresh endpoint
  });

  return accessToken; // return so controller can send JSON or set header
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = new User({ name, email, password });
    await user.save();

    const accessToken = sendTokens(res, user);
    res.status(201).json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = sendTokens(res, user);
    res.json({ accessToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// refresh: read cookie, verify refresh token, issue new access token (and optionally new refresh token)
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.jid;
    if (!token) return res.status(401).json({ message: 'No refresh token' });

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // optional: check tokenVersion to support logout everywhere
    if (payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ message: 'Token revoked' });
    }

    const accessToken = signAccessToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });
    // optionally rotate refresh tokens by issuing a new refresh here
    const newRefresh = signRefreshToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });
    res.cookie('jid', newRefresh, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: process.env.COOKIE_SAMESITE || 'lax',
      path: '/api/auth/refresh'
    });

    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  // clear cookie
  res.clearCookie('jid', { path: '/api/auth/refresh' });
  return res.json({ ok: true });
};

// revoke refresh tokens for a user (logout everywhere)
exports.revokeRefreshTokensForUser = async (req, res) => {
  // requires admin or owner
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.tokenVersion += 1;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};