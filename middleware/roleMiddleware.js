module.exports = function allowedRole(role) {
    return function (req, res, next) {
        const user = req.user;

        if (!user || user.role !== role) {
            return res.status(403).json({
                error: "Access denied: insufficient permissions"
            });
        }
        next();
    };
};
