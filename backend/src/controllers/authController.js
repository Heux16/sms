import passport from '../config/passport.js';

export function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr);
      }
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          class: user.class,
          rollnumber: user.rollnumber
        }
      });
    });
  })(req, res, next);
}

export function logout(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.clearCookie('sms.sid');
      res.json({ message: 'Logged out' });
    });
  });
}

export function me(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      class: req.user.class,
      rollnumber: req.user.rollnumber
    }
  });
}
