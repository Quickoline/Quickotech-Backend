module.exports = (req, res) => {
    res.json({
        success: true,
        message: 'Health check passed',
        timestamp: new Date().toISOString(),
        status: 'healthy'
    });
}; 