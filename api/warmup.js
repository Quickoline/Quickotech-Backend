// Warmup endpoint for keeping the function alive
module.exports = async (req, res) => {
    res.json({
        success: true,
        message: 'Warmup successful',
        timestamp: new Date().toISOString()
    });
}; 