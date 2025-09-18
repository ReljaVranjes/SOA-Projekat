const headerAuthMiddleware = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  const userRole = req.headers['x-user-role'];
  
  if (!userId || !userEmail || !userRole) {
    return res.status(401).json({ 
      message: 'User authentication headers missing. Request must come through gateway.' 
    });
  }
  
  // Set user data in req.user for consistency with existing code
  req.user = {
    id: userId,
    email: userEmail,
    role: userRole
  };
  
  next();
};

module.exports = headerAuthMiddleware;